import { News, NewsQueryParams, PaginatedNews } from "@/types/news";
import { apiClient } from "./api-client";

function buildQueryString(params: NewsQueryParams): string {
  const search = new URLSearchParams();

  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));
  if (params.sourceId) search.set("sourceId", String(params.sourceId));
  if (params.search) search.set("search", params.search);
  if (params.sortBy) search.set("sortBy", params.sortBy);
  if (params.order) search.set("order", params.order);

  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export const newsApi = {
  getAll: (params: NewsQueryParams = {}) =>
    apiClient.get<PaginatedNews>(`/news${buildQueryString(params)}`),

  getOne: (id: number) => apiClient.get<News>(`/news/${id}`),
};
