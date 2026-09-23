import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  RequestTimeoutException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DatabaseOperationException } from '../common/exceptions/database-operation.exception';
import { RssFetchException } from '../common/exceptions/rss-fetch.exception';
import { delay } from '../common/utils/delay';
import { PrismaService } from '../prisma/prisma.service';
import { RssParserService } from '../rss-parser/rss-parser.service';
import { CreateNewsSourceDto } from './dto/create-news-source.dto';
import { UpdateNewsSourceDto } from './dto/update-news-source.dto';

export interface FetchStats {
  fetched: number;
  inserted: number;
  duplicates: number;
  skippedInvalid: number;
  retried: boolean;
}

const MAX_RETRIES = 1; // one retry only — this is deliberately conservative
const RETRY_DELAY_MS = 3000;

@Injectable()
export class NewsSourcesService {
  private readonly logger = new Logger(NewsSourcesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly rssParserService: RssParserService,
  ) {}

  async create(dto: CreateNewsSourceDto) {
    try {
      return await this.prisma.newsSource.create({
        data: {
          name: dto.name,
          url: dto.url,
          type: dto.type ?? 'rss',
          isActive: dto.isActive ?? true,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          `A source with url "${dto.url}" already exists`,
        );
      }
      throw error;
    }
  }

  async findAll() {
    return this.prisma.newsSource.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { news: true } } },
    });
  }

  async findOne(id: number) {
    const source = await this.prisma.newsSource.findUnique({
      where: { id },
      include: { _count: { select: { news: true } } },
    });
    if (!source) {
      throw new NotFoundException(`NewsSource with id ${id} not found`);
    }
    return source;
  }

  async update(id: number, dto: UpdateNewsSourceDto) {
    await this.findOne(id);
    try {
      return await this.prisma.newsSource.update({ where: { id }, data: dto });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          `A source with url "${dto.url}" already exists`,
        );
      }
      throw error;
    }
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.newsSource.delete({ where: { id } });
    return { message: `NewsSource with id ${id} deleted successfully` };
  }

  async fetchNews(id: number): Promise<FetchStats> {
    const source = await this.findOne(id);

    if (!source.isActive) {
      throw new BadRequestException(
        `Cannot fetch news from an inactive source. Activate "${source.name}" first.`,
      );
    }

    const { items, retried } = await this.fetchWithRetry(
      source.url,
      source.name,
    );

    const fetched = items.length;
    const validItems = items.filter(
      (item) => item.title && item.link && item.title !== 'Untitled',
    );
    const skippedInvalid = fetched - validItems.length;

    if (skippedInvalid > 0) {
      this.logger.warn(
        `[${source.name}] skipped ${skippedInvalid} item(s) missing required fields (title/link)`,
      );
    }

    let inserted = 0;

    if (validItems.length > 0) {
      try {
        const result = await this.prisma.news.createMany({
          data: validItems.map((item) => ({
            sourceId: source.id,
            title: item.title,
            description: item.description,
            link: item.link,
            imageUrl: item.imageUrl,
            publishedAt: item.publishedAt,
            guid: item.guid,
          })),
          skipDuplicates: true,
        });
        inserted = result.count;
      } catch (error) {
        this.logger.error(`[${source.name}] database write failed: ${error}`);
        await this.recordFailure(source.id, `Database write failed: ${error}`);
        throw new InternalServerErrorException(
          new DatabaseOperationException(
            `Failed to save news for source "${source.name}"`,
            error,
          ).message,
        );
      }
    }

    const duplicates = validItems.length - inserted;

    // Successful fetch (even a permanently-parse-failed one that already
    // threw above never reaches here) — clear any prior failure state.
    await this.recordSuccess(source.id);

    return { fetched, inserted, duplicates, skippedInvalid, retried };
  }

  /**
   * Wraps the parser call with a single retry for TRANSIENT failures only
   * (timeout, network). A malformed feed (parse error) is not retried —
   * retrying won't fix XML that's broken, it would just waste time and
   * hit the publisher's server twice for no benefit.
   */
  private async fetchWithRetry(url: string, sourceName: string) {
    let lastError: unknown;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const items = await this.rssParserService.fetchAndParse(url);
        return { items, retried: attempt > 0 };
      } catch (error) {
        lastError = error;

        const isTransient =
          error instanceof RssFetchException &&
          (error.type === 'timeout' || error.type === 'network');

        if (!isTransient || attempt === MAX_RETRIES) {
          break; // permanent failure, or out of retries — stop trying
        }

        this.logger.warn(
          `[${sourceName}] transient failure (attempt ${attempt + 1}/${MAX_RETRIES + 1}), retrying in ${RETRY_DELAY_MS}ms…`,
        );
        await delay(RETRY_DELAY_MS);
      }
    }

    // Exhausted retries (or failure was permanent) — record and map the error.
    await this.mapAndRecordFailure(url, sourceName, lastError);
    throw this.mapFetchError(sourceName, lastError); // unreachable in practice; mapFetchError always throws
  }

  private mapFetchError(sourceName: string, error: unknown): never {
    if (error instanceof RssFetchException) {
      switch (error.type) {
        case 'timeout':
          throw new RequestTimeoutException(
            `Timed out fetching "${sourceName}" after retry. The feed server may be slow or unresponsive.`,
          );
        case 'network':
          throw new ServiceUnavailableException(
            `Could not reach "${sourceName}" after retry. Check the URL or try again later.`,
          );
        case 'parse':
          throw new BadRequestException(
            `"${sourceName}" did not return a valid RSS/Atom feed.`,
          );
      }
    }
    this.logger.error(`Unexpected error fetching "${sourceName}": ${error}`);
    throw new InternalServerErrorException(
      `Unexpected error while fetching "${sourceName}".`,
    );
  }

  private async mapAndRecordFailure(
    url: string,
    sourceName: string,
    error: unknown,
  ) {
    const message =
      error instanceof RssFetchException
        ? error.message
        : error instanceof Error
          ? error.message
          : 'Unknown error';

    const source = await this.prisma.newsSource.findUnique({ where: { url } });
    if (source) {
      await this.recordFailure(source.id, message);
    }
  }

  private async recordFailure(sourceId: number, errorMessage: string) {
    await this.prisma.newsSource.update({
      where: { id: sourceId },
      data: {
        failedAt: new Date(),
        errorMessage: errorMessage.slice(0, 500), // matches @db.VarChar(500)
        consecutiveFailures: { increment: 1 },
      },
    });
  }

  private async recordSuccess(sourceId: number) {
    await this.prisma.newsSource.update({
      where: { id: sourceId },
      data: {
        lastFetchedAt: new Date(),
        failedAt: null,
        errorMessage: null,
        consecutiveFailures: 0,
      },
    });
  }
}
