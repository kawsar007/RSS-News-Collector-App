import { Injectable, Logger } from '@nestjs/common';
import Parser from 'rss-parser';
import { RssFetchException } from '../common/exceptions/rss-fetch.exception';
import { NormalizedNewsItem } from './types/normalized-news-item.type';

type CustomFeed = Record<string, unknown>;
type CustomItem = {
  title?: string;
  link?: string;
  content?: string;
  contentSnippet?: string;
  pubDate?: string;
  isoDate?: string;
  guid?: string;
  enclosure?: { url?: string; type?: string };
  'media:content'?: { $?: { url?: string } };
  'media:thumbnail'?: { $?: { url?: string } };
};

@Injectable()
export class RssParserService {
  private readonly logger = new Logger(RssParserService.name);
  private readonly parser: Parser<CustomFeed, CustomItem>;

  constructor() {
    this.parser = new Parser<CustomFeed, CustomItem>({
      timeout: 10000,
      customFields: {
        item: ['media:content', 'media:thumbnail'],
      },
    });
  }

  async fetchAndParse(feedUrl: string): Promise<NormalizedNewsItem[]> {
    this.logger.log(`Fetching feed: ${feedUrl}`);

    let feed;
    try {
      feed = await this.parser.parseURL(feedUrl);
    } catch (error) {
      throw this.classifyError(feedUrl, error);
    }

    if (!feed.items || feed.items.length === 0) {
      this.logger.warn(`No items found in feed: ${feedUrl}`);
      return [];
    }

    const results: NormalizedNewsItem[] = [];
    for (const item of feed.items) {
      try {
        results.push(this.normalizeItem(item));
      } catch (error) {
        // A single malformed item (e.g. no guid AND no link) shouldn't
        // kill the entire feed — skip it and keep going.
        const message =
          error instanceof Error ? error.message : 'Unknown error';
        this.logger.warn(`Skipping unparseable item in ${feedUrl}: ${message}`);
      }
    }

    return results;
  }

  /**
   * Inspects a raw error thrown by rss-parser / node-fetch under the hood
   * and classifies it into network, timeout, or parse — this is the core
   * of this phase's error handling.
   */
  private classifyError(feedUrl: string, error: unknown): RssFetchException {
    const err = error as { code?: string; message?: string; type?: string };
    const message = err?.message ?? String(error);

    // node-fetch / undici abort errors on timeout
    if (
      err?.code === 'ETIMEDOUT' ||
      err?.type === 'aborted' ||
      /timeout/i.test(message)
    ) {
      this.logger.error(`Timeout fetching ${feedUrl}: ${message}`);
      return new RssFetchException(
        'timeout',
        `Feed request timed out: ${feedUrl}`,
        error,
      );
    }

    // DNS / connection-level failures
    if (
      err?.code === 'ENOTFOUND' ||
      err?.code === 'ECONNREFUSED' ||
      err?.code === 'ECONNRESET' ||
      err?.code === 'EAI_AGAIN'
    ) {
      this.logger.error(`Network error fetching ${feedUrl}: ${message}`);
      return new RssFetchException(
        'network',
        `Could not reach feed URL: ${feedUrl}`,
        error,
      );
    }

    // Everything else from rss-parser is typically an XML parsing failure
    // (malformed feed, HTML returned instead of XML, unexpected content-type)
    this.logger.error(`Failed to parse feed ${feedUrl}: ${message}`);
    return new RssFetchException(
      'parse',
      `Feed content could not be parsed: ${feedUrl}`,
      error,
    );
  }

  private normalizeItem(item: CustomItem): NormalizedNewsItem {
    return {
      title: item.title?.trim() ?? 'Untitled',
      link: item.link?.trim() ?? '',
      description: this.extractDescription(item),
      publishedAt: this.extractDate(item),
      guid: this.extractGuid(item),
      imageUrl: this.extractImage(item),
    };
  }

  private extractDescription(item: CustomItem): string | null {
    if (item.contentSnippet) return item.contentSnippet.trim();
    if (item.content) return item.content.trim();
    return null;
  }

  private extractDate(item: CustomItem): Date | null {
    const raw = item.isoDate ?? item.pubDate;
    if (!raw) return null;
    const parsed = new Date(raw);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  private extractGuid(item: CustomItem): string {
    if (item.guid) return item.guid.trim();
    if (item.link) return item.link.trim();
    throw new Error(
      'RSS item has neither guid nor link — cannot generate a stable identifier',
    );
  }

  private extractImage(item: CustomItem): string | null {
    if (item.enclosure?.url) return item.enclosure.url;
    if (item['media:content']?.$?.url) return item['media:content'].$.url;
    if (item['media:thumbnail']?.$?.url) return item['media:thumbnail'].$.url;

    const html = item.content ?? '';
    const match = html.match(/<img[^>]+src="([^">]+)"/i);
    return match ? match[1] : null;
  }
}
