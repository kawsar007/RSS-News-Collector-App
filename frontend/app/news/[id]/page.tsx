import { newsApi } from '@/lib/api/news-api';
import { ApiError } from '@/types/api';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface NewsDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default async function NewsDetailsPage({ params }: NewsDetailsPageProps) {
  const { id } = await params;

  let news;
  try {
    news = await newsApi.getOne(Number(id));
  } catch (err) {
    if (err instanceof ApiError && err.statusCode === 404) {
      notFound(); // renders Next.js's built-in 404 page
    }
    throw err; // let Next.js's error boundary handle unexpected failures
  }

  const publishedLabel = news.publishedAt
    ? new Date(news.publishedAt).toLocaleString()
    : 'Unknown date';

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/news" className="text-sm font-medium text-blue-600 hover:underline">
        ← Back to News
      </Link>

      {news.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={news.imageUrl}
          alt=""
          className="mt-4 max-h-96 w-full rounded-md object-cover"
        />
      )}

      <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
        <span className="font-medium text-blue-600">{news.source.name}</span>
        <span>·</span>
        <span>{publishedLabel}</span>
      </div>

      <h1 className="mt-2 text-2xl font-semibold text-gray-900">{news.title}</h1>

      {news.description && (
        <p className="mt-4 whitespace-pre-line text-gray-700">{news.description}</p>
      )}

      <a
        href={news.link}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        Read original article →
      </a>
    </div >
  );
}