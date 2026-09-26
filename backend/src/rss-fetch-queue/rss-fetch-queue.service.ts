import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Queue } from 'bullmq';
import { JobState, JobStatusResponse } from './dto/job-status.dto';

@Injectable()
export class RssFetchQueueService {
  constructor(@InjectQueue('rss-fetch') private readonly queue: Queue) {}

  async getJobStatus(jobId: string): Promise<JobStatusResponse> {
    const job = await this.queue.getJob(jobId);

    if (!job) {
      // Could mean: wrong ID, or the job aged out (removeOnComplete/removeOnFail
      // from the producer). We treat both the same way from the API's perspective.
      throw new NotFoundException(
        `Fetch job ${jobId} not found (it may have expired)`,
      );
    }

    const state = (await job.getState()) as JobState;

    const response: JobStatusResponse = {
      jobId: job.id as string,
      status: state,
    };

    if (state === 'completed') {
      response.result = job.returnvalue;
    }

    if (state === 'failed') {
      // job.failedReason is the .message of whatever error the worker threw —
      // in our case, the exact same message Phase 11's typed exceptions produce
      // (e.g. "Timed out fetching...", "Could not reach...", etc.)
      response.error = job.failedReason;
    }

    return response;
  }
}
