import { HttpException, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { delay } from '../common/utils/delay';
import { NewsSourcesService } from '../news-sources/news-sources.service';
import { PrismaService } from '../prisma/prisma.service';

const DELAY_BETWEEN_SOURCES_MS = 1000; // simple, fixed rate limit — 1 req/sec to varying hosts

@Injectable()
export class RssCollectionService {
  private readonly logger = new Logger(RssCollectionService.name);
  private isRunning = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly newsSourcesService: NewsSourcesService,
  ) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleScheduledCollection() {
    if (this.isRunning) {
      this.logger.warn(
        'Previous collection cycle still running — skipping this tick.',
      );
      return;
    }
    this.isRunning = true;
    try {
      await this.collectAll();
    } finally {
      this.isRunning = false;
    }
  }

  async collectAll() {
    const activeSources = await this.prisma.newsSource.findMany({
      where: { isActive: true },
    });

    if (activeSources.length === 0) {
      this.logger.log('No active sources to collect.');
      return;
    }

    this.logger.log(
      `Starting collection cycle for ${activeSources.length} active source(s).`,
    );

    let totalInserted = 0;
    let totalDuplicates = 0;
    let failedCount = 0;

    for (let i = 0; i < activeSources.length; i++) {
      const source = activeSources[i];

      try {
        const stats = await this.newsSourcesService.fetchNews(source.id);
        this.logger.log(
          `[${source.name}] fetched=${stats.fetched} inserted=${stats.inserted} ` +
            `duplicates=${stats.duplicates} skippedInvalid=${stats.skippedInvalid}` +
            (stats.retried ? ' (succeeded after retry)' : ''),
        );
        totalInserted += stats.inserted;
        totalDuplicates += stats.duplicates;
      } catch (error) {
        failedCount++;
        this.logFetchFailure(source.name, error);
      }

      // Rate limiting: pause between sources so we're not hammering many
      // different hosts back-to-back with zero delay. Skipped after the
      // last item — no reason to wait after the final source.
      const isLast = i === activeSources.length - 1;
      if (!isLast) {
        await delay(DELAY_BETWEEN_SOURCES_MS);
      }
    }

    this.logger.log(
      `Collection cycle complete. inserted=${totalInserted} duplicates=${totalDuplicates} ` +
        `failed=${failedCount}/${activeSources.length}`,
    );
  }

  private logFetchFailure(sourceName: string, error: unknown) {
    if (error instanceof HttpException) {
      const status = error.getStatus();
      const message = error.message;
      if (status === 408)
        this.logger.warn(`[${sourceName}] TIMEOUT — ${message}`);
      else if (status === 503)
        this.logger.warn(`[${sourceName}] NETWORK — ${message}`);
      else if (status === 400)
        this.logger.error(`[${sourceName}] INVALID FEED — ${message}`);
      else
        this.logger.error(
          `[${sourceName}] UNEXPECTED (${status}) — ${message}`,
        );
      return;
    }
    this.logger.error(`[${sourceName}] UNKNOWN ERROR — ${error}`);
  }
}
