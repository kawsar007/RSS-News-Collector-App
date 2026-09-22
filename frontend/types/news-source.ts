export interface NewsSource {
  id: number;
  name: string;
  url: string;
  type: string;
  isActive: boolean;
  lastFetchedAt: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    news: number;
  };
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
}
