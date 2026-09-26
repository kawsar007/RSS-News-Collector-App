import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import {
  FetchStats,
  NewsSourcesService,
} from '../news-sources/news-sources.service';
import { FetchSourceJobData } from './rss-fetch.producer';

/**
 * This worker contains NO new business logic — it simply delegates to
 * NewsSourcesService.fetchNews(), the exact same method Phase 6/11/12
 * built and that curl/tests already exercise directly. Queueing is
 * purely a delivery mechanism change, not a rewrite of the fetch logic.
 */
@Processor('rss-fetch', {
  concurrency: 2, // fetch up to 2 sources in parallel — deliberately modest, revisited in Phase 15
})
export class RssFetchWorker extends WorkerHost {
  private readonly logger = new Logger(RssFetchWorker.name);

  constructor(private readonly newsSourcesService: NewsSourcesService) {
    super();
  }

  async process(job: Job<FetchSourceJobData>): Promise<FetchStats> {
    const { sourceId } = job.data;
    this.logger.log(`Job ${job.id}: fetching source ${sourceId}`);

    // fetchNews() throws NestJS HttpExceptions (400/408/503/500 from
    // Phase 11) on failure. We let that propagate — BullMQ will catch it,
    // mark the job 'failed', and store exception.message as job.failedReason,
    // which our status endpoint reads directly. No special handling needed
    // here; this is the same exception, just observed differently.
    const stats = await this.newsSourcesService.fetchNews(sourceId);

    this.logger.log(
      `Job ${job.id}: done — fetched=${stats.fetched} inserted=${stats.inserted} duplicates=${stats.duplicates}`,
    );

    return stats; // becomes job.returnvalue
  }
}
