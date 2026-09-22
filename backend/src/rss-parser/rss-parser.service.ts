import { Injectable, Logger } from '@nestjs/common';
import Parser from 'rss-parser';
import { NormalizedNewsItem } from './types/normalized-news-item.type';

// Custom fields we want rss-parser to also pick up beyond the defaults,
// since image location varies wildly between publishers.
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
      timeout: 10000, // 10s timeout, prevents hanging forever on a dead feed
      customFields: {
        item: ['media:content', 'media:thumbnail'],
      },
    });
  }

  async fetchAndParse(feedUrl: string): Promise<NormalizedNewsItem[]> {
    this.logger.log(`Fetching feed: ${feedUrl}`);

    const feed = await this.parser.parseURL(feedUrl);

    if (!feed.items || feed.items.length === 0) {
      this.logger.warn(`No items found in feed: ${feedUrl}`);
      return [];
    }

    return feed.items.map((item) => this.normalizeItem(item));
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
    // Fallback chain: guid -> link -> throw
    // We'll always have SOMETHING to key duplicate-detection on.
    if (item.guid) return item.guid.trim();
    if (item.link) return item.link.trim();

    // Extremely rare case: no guid AND no link. Should not normally happen
    // for a valid RSS item, but we don't want to silently produce an
    // empty-string guid (that would collide across all such items).
    throw new Error(
      'RSS item has neither guid nor link — cannot generate a stable identifier',
    );
  }

  private extractImage(item: CustomItem): string | null {
    if (item.enclosure?.url) return item.enclosure.url;
    if (item['media:content']?.$?.url) return item['media:content'].$.url;
    if (item['media:thumbnail']?.$?.url) return item['media:thumbnail'].$.url;

    // Last resort: try to pull the first <img src="..."> out of HTML content
    const html = item.content ?? '';
    const match = html.match(/<img[^>]+src="([^">]+)"/i);
    return match ? match[1] : null;
  }
}
