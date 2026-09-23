import { EmptyState } from '@/components/ui/EmptyState';
import { News } from '@/types/news';
import { NewsCard } from './NewsCard';

interface NewsListProps {
  news: News[];
}

export function NewsList({ news }: NewsListProps) {
  if (news.length === 0) {
    return (
      <EmptyState
        title="No news found"
        description="Try adjusting your search or filter, or fetch some sources first."
      />
    );
  }

  return (
    <div className="space-y-3">
      {news.map((item) => (
        <NewsCard key={item.id} news={item} />
      ))}
    </div>
  );
}