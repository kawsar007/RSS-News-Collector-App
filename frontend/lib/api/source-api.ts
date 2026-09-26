import {
  CreateNewsSourceInput,
  EnqueueFetchResponse,
  FetchJobStatus,
  NewsSource,
  UpdateNewsSourceInput,
} from "@/types/news-source";
import { apiClient } from "./api-client";

export const sourceApi = {
  getAll: () => apiClient.get<NewsSource[]>("/news-sources"),
  getOne: (id: number) => apiClient.get<NewsSource>(`/news-sources/${id}`),
  create: (data: CreateNewsSourceInput) =>
    apiClient.post<NewsSource>("/news-sources", data),
  update: (id: number, data: UpdateNewsSourceInput) =>
    apiClient.patch<NewsSource>(`/news-sources/${id}`, data),
  remove: (id: number) =>
    apiClient.delete<{ message: string }>(`/news-sources/${id}`),

  // Renamed from `fetch` (Phase 6/12) to `triggerFetch` — it no longer
  // returns stats directly, only a jobId. Distinguishing the name makes
  // this behavior change visible at every call site.
  triggerFetch: (id: number) =>
    apiClient.post<EnqueueFetchResponse>(`/news-sources/${id}/fetch`, {}),

  getFetchJobStatus: (jobId: string) =>
    apiClient.get<FetchJobStatus>(`/news-sources/fetch-jobs/${jobId}`),
};
