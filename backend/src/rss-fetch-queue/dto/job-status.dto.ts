import { FetchStats } from '../../news-sources/news-sources.service';

export type JobState =
  'waiting' | 'active' | 'completed' | 'failed' | 'delayed' | 'unknown';

export interface JobStatusResponse {
  jobId: string;
  status: JobState;
  result?: FetchStats;
  error?: string;
}
