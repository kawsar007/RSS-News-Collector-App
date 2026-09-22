export interface NormalizedNewsItem {
  title: string;
  link: string;
  description: string | null;
  publishedAt: Date | null;
  guid: string;
  imageUrl: string | null;
}
