import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';

@Injectable()
export class TestQueueProducer {
  private readonly logger = new Logger(TestQueueProducer.name);

  constructor(@InjectQueue('test-queue') private readonly queue: Queue) {}

  /**
   * Adds a job to Redis and returns IMMEDIATELY — it does not wait for
   * the job to actually run. This is the core behavior shift from
   * everything we've built in Phases 1-12: the caller is no longer
   * blocked on the work being done.
   */
  async addGreetingJob(name: string) {
    const job = await this.queue.add('greet', { name });
    this.logger.log(
      `Enqueued job ${job.id} with data: ${JSON.stringify(job.data)}`,
    );
    return { jobId: job.id };
  }
}
