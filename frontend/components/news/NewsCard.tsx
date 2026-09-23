import { News } from '@/types/news';
import Link from 'next/link';

interface NewsCardProps {
  news: News;
}

export function NewsCard({ news }: NewsCardProps) {
  const publishedLabel = news.publishedAt
    ? new Date(news.publishedAt).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
    : 'Unknown date';

  return (
    <div className="flex gap-4 rounded-md border border-gray-200 bg-white p-4">
      {news.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={news.imageUrl}
          alt=""
          className="h-24 w-24 flex-shrink-0 rounded-md object-cover"
        />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="font-medium text-blue-600">{news.source.name}</span>
          <span>·</span>
          <span>{publishedLabel}</span>
        </div>
        <h3 className="mt-1 truncate text-sm font-semibold text-gray-900">
          <Link href={`/news/${news.id}`} className="hover:underline">
            {news.title}
          </Link>
        </h3>
        {news.description && (
          <p className="mt-1 line-clamp-2 text-sm text-gray-600">{news.description}</p>
        )}
        <Link
          href={`/news/${news.id}`}
          className="mt-2 inline-block text-xs font-medium text-blue-600 hover:underline"
        >
          Read more →
        </Link>
      </div>
    </div>
  );
}