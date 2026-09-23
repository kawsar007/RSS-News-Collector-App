'use client';

import { NewsSource } from '@/types/news-source';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

interface SourceFilterProps {
  sources: NewsSource[];
}

export function SourceFilter({ sources }: SourceFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentSourceId = searchParams.get('sourceId') ?? '';

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString());

    if (e.target.value) {
      params.set('sourceId', e.target.value);
    } else {
      params.delete('sourceId');
    }
    params.delete('page');

    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <select
      value={currentSourceId}
      onChange={handleChange}
      className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
    >
      <option value="">All sources</option>
      {sources.map((source) => (
        <option key={source.id} value={source.id}>
          {source.name}
        </option>
      ))}
    </select>
  );
}