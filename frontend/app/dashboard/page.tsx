import { StatCard } from '@/components/dashboard/StatCard';
import { NewsList } from '@/components/news/NewsList';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { newsApi } from '@/lib/api/news-api';
import { sourceApi } from '@/lib/api/source-api';
import Link from 'next/link';

export default async function DashboardPage() {
  try {
    const [sources, recentNewsResult] = await Promise.all([
      sourceApi.getAll(),
      newsApi.getAll({ limit: 5, sortBy: 'publishedAt', order: 'desc' }),
    ]);

    const totalSources = sources.length;
    const activeSources = sources.filter((s) => s.isActive).length;
    const totalNews = recentNewsResult.meta.total;

    // Find the most recent lastFetchedAt across all sources, ignoring nulls
    // (sources that have never been fetched).
    const lastFetchedTimestamps = sources
      .map((s) => s.lastFetchedAt)
      .filter((t): t is string => t !== null)
      .map((t) => new Date(t).getTime());

    const lastFetchedAt =
      lastFetchedTimestamps.length > 0 ? new Date(Math.max(...lastFetchedTimestamps)) : null;

    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-semibold text-gray-900">Dashboard</h1>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Sources" value={totalSources} />
          <StatCard label="Active Sources" value={activeSources} />
          <StatCard label="Total News" value={totalNews} />
          <StatCard
            label="Last Fetched"
            value={lastFetchedAt ? lastFetchedAt.toLocaleTimeString() : 'Never'}
            hint={lastFetchedAt ? lastFetchedAt.toLocaleDateString() : undefined}
          />
        </div>

        <div className="mt-8 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Recent News</h2>
          <Link href="/news" className="text-sm font-medium text-blue-600 hover:underline">
            View all →
          </Link>
        </div>

        <div className="mt-4">
          {recentNewsResult.data.length === 0 ? (
            <EmptyState
              title="No news collected yet"
              description="Add a source and fetch it to see news here."
              action={
                <Link
                  href="/sources"
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Go to Sources
                </Link>
              }
            />
          ) : (
            <NewsList news={recentNewsResult.data} />
          )}
        </div>
      </div>
    );
  } catch {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-semibold text-gray-900">Dashboard</h1>
        <ErrorMessage message="Failed to load dashboard data. Is the backend running?" />
      </div>
    );
  }
}