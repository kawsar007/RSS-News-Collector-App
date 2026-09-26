import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';

export interface FetchSourceJobData {
  sourceId: number;
}

@Injectable()
export class RssFetchProducer {
  private readonly logger = new Logger(RssFetchProducer.name);

  constructor(
    @InjectQueue('rss-fetch') private readonly queue: Queue<FetchSourceJobData>,
  ) {}

  async enqueueFetch(sourceId: number): Promise<string> {
    const job = await this.queue.add(
      'fetch-source',
      { sourceId },
      {
        // If someone double-clicks Fetch, we don't want two jobs for the
        // same source racing each other. jobId being deterministic per
        // source means BullMQ will reject a duplicate while one is still
        // waiting/active for that same source.
        jobId: `fetch-source-${sourceId}-${Date.now()}`,
        removeOnComplete: { age: 3600 }, // keep completed jobs for 1 hour (for polling), then clean up
        removeOnFail: { age: 86400 }, // keep failed jobs for 24 hours (useful for debugging)
      },
    );

    this.logger.log(`Enqueued fetch job ${job.id} for source ${sourceId}`);
    return job.id as string;
  }
}
