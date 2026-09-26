export interface NewsSource {
  id: number;
  name: string;
  url: string;
  type: string;
  isActive: boolean;
  lastFetchedAt: string | null;
  failedAt: string | null;
  errorMessage: string | null;
  consecutiveFailures: number;
  createdAt: string;
  updatedAt: string;
  _count?: { news: number };
}

export interface CreateNewsSourceInput {
  name: string;
  url: string;
  type?: string;
  isActive?: boolean;
}

export type UpdateNewsSourceInput = Partial<CreateNewsSourceInput>;

export interface FetchStats {
  fetched: number;
  inserted: number;
  duplicates: number;
  skippedInvalid: number;
  retried: boolean;
}

export type JobState =
  | "waiting"
  | "active"
  | "completed"
  | "failed"
  | "delayed"
  | "unknown";

export interface FetchJobStatus {
  jobId: string;
  status: JobState;
  result?: FetchStats;
  error?: string;
}

export interface EnqueueFetchResponse {
  jobId: string;
  message: string;
}
