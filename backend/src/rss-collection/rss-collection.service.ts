import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NewsSourcesService } from '../news-sources/news-sources.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RssCollectionService {
  private readonly logger = new Logger(RssCollectionService.name);

  // Prevents overlapping runs if one cycle takes longer than the interval
  // between ticks (e.g. many slow feeds). Without this guard, a second
  // run could start while the first is still fetching, doubling load.
  private isRunning = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly newsSourcesService: NewsSourcesService,
  ) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  // @Cron(CronExpression.EVERY_30_SECONDS)
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

    // Sequential, not Promise.all — deliberate choice, explained in section 7.
    for (const source of activeSources) {
      try {
        const stats = await this.newsSourcesService.fetchNews(source.id);
        this.logger.log(
          `[${source.name}] fetched=${stats.fetched} inserted=${stats.inserted} duplicates=${stats.duplicates}`,
        );
        totalInserted += stats.inserted;
        totalDuplicates += stats.duplicates;
      } catch (error) {
        failedCount++;
        const message =
          error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`[${source.name}] fetch failed: ${message}`);
        // Intentionally no `throw` here — one bad feed must not stop the
        // rest of the cycle. Phase 11/12 will persist this failure info
        // (failedAt, errorMessage) instead of just logging it.
      }
    }

    this.logger.log(
      `Collection cycle complete. inserted=${totalInserted} duplicates=${totalDuplicates} failed=${failedCount}/${activeSources.length}`,
    );
  }
}
