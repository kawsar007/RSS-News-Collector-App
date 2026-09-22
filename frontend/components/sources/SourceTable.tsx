'use client';

import { StatusBadge } from '@/components/ui/StatusBadge';
import { NewsSource } from '@/types/news-source';
import Link from 'next/link';

interface SourceTableProps {
  sources: NewsSource[];
  onDelete: (source: NewsSource) => void;
  onFetch: (source: NewsSource) => void;
  fetchingId: number | null;
}

export function SourceTable({ sources, onDelete, onFetch, fetchingId }: SourceTableProps) {
  return (
    <div className="overflow-x-auto rounded-md border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-gray-500">Name</th>
            <th className="px-4 py-3 text-left font-medium text-gray-500">RSS URL</th>
            <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
            <th className="px-4 py-3 text-left font-medium text-gray-500">Last Fetched</th>
            <th className="px-4 py-3 text-right font-medium text-gray-500">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {sources.map((source) => (
            <tr key={source.id}>
              <td className="px-4 py-3 font-medium text-gray-900">{source.name}</td>
              <td className="max-w-xs truncate px-4 py-3 text-gray-500">{source.url}</td>
              <td className="px-4 py-3">
                <StatusBadge isActive={source.isActive} />
              </td>
              <td className="px-4 py-3 text-gray-500">
                {source.lastFetchedAt
                  ? new Date(source.lastFetchedAt).toLocaleString()
                  : 'Never'}
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => onFetch(source)}
                    disabled={fetchingId === source.id}
                    className="font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50"
                  >
                    {fetchingId === source.id ? 'Fetching…' : 'Fetch'}
                  </button>
                  <Link
                    href={`/sources/${source.id}/edit`}
                    className="font-medium text-gray-600 hover:text-gray-900"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => onDelete(source)}
                    className="font-medium text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}