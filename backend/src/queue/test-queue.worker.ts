import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

/**
 * A Worker "listens" to a queue and runs `process()` for every job that
 * arrives. This class, once registered, will pick up jobs added by
 * TestQueueProducer — even though neither class references the other
 * directly. Redis is the only thing connecting them.
 */
@Processor('test-queue')
export class TestQueueWorker extends WorkerHost {
  private readonly logger = new Logger(TestQueueWorker.name);

  async process(job: Job): Promise<any> {
    this.logger.log(
      `Processing job ${job.id} (${job.name}) with data: ${JSON.stringify(job.data)}`,
    );

    // Simulate work that takes a moment — this is where Phase 14's real
    // RSS fetch logic will eventually go.
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const result = `Hello, ${job.data.name}! (processed at ${new Date().toISOString()})`;
    this.logger.log(`Job ${job.id} complete: ${result}`);

    return result; // becomes the job's `returnvalue`, retrievable later
  }
}
