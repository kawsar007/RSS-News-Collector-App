export interface News {
  id: number;
  sourceId: number;
  title: string;
  description: string | null;
  link: string;
  imageUrl: string | null;
  publishedAt: string | null;
  guid: string;
  createdAt: string;
  updatedAt: string;
  source: {
    id: number;
    name: string;
    url?: string;
  };
}

export interface PaginatedNews {
  data: News[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface NewsQueryParams {
  page?: number;
  limit?: number;
  sourceId?: number;
  search?: string;
  sortBy?: "publishedAt" | "createdAt" | "title";
  order?: "asc" | "desc";
}
