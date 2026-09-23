import { NewsList } from '@/components/news/NewsList';
import { NewsSearch } from '@/components/news/NewsSearch';
import { SourceFilter } from '@/components/news/SourceFilter';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Pagination } from '@/components/ui/Pagination';
import { newsApi } from '@/lib/api/news-api';
import { sourceApi } from '@/lib/api/source-api';

interface NewsPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    sourceId?: string;
  }>;
}

export default async function NewsPage({ searchParams }: NewsPageProps) {
  const params = await searchParams;
  const page = params.page ? Number(params.page) : 1;

  try {
    const [newsResult, sources] = await Promise.all([
      newsApi.getAll({
        page,
        limit: 10,
        search: params.search,
        sourceId: params.sourceId ? Number(params.sourceId) : undefined,
        sortBy: 'publishedAt',
        order: 'desc',
      }),
      sourceApi.getAll(),
    ]);

    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-semibold text-gray-900">News</h1>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <NewsSearch />
          <SourceFilter sources={sources} />
        </div>

        <NewsList news={newsResult.data} />

        <Pagination page={newsResult.meta.page} totalPages={newsResult.meta.totalPages} />
      </div>
    );
  } catch {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-semibold text-gray-900">News</h1>
        <ErrorMessage message="Failed to load news. Is the backend running?" />
      </div>
    );
  }
}