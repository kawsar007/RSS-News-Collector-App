'use client';

import { SourceTable } from '@/components/sources/SourceTable';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { pollJobUntilDone } from '@/lib/api/poll-job';
import { sourceApi } from '@/lib/api/source-api';
import { ApiError } from '@/types/api';
import { FetchStats, NewsSource } from '@/types/news-source';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';

export default function SourcesPage() {
  const [sources, setSources] = useState<NewsSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<NewsSource | null>(null);
  const [fetchingId, setFetchingId] = useState<number | null>(null);
  const [fetchResult, setFetchResult] = useState<{ sourceName: string; stats: FetchStats } | null>(
    null,
  );
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Tracks whether the component is still mounted, so an in-flight poll
  // loop doesn't call setState after the user navigates away.
  const cancelledRef = useRef(false);
  useEffect(() => {
    return () => {
      cancelledRef.current = true;
    };
  }, []);

  const loadSources = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await sourceApi.getAll();
      setSources(data);
    } catch {
      setError('Failed to load sources. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSources();
  }, [loadSources]);

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await sourceApi.remove(deleteTarget.id);
      setSources((prev) => prev.filter((s) => s.id !== deleteTarget.id));
    } catch {
      setError('Failed to delete source.');
    } finally {
      setDeleteTarget(null);
    }
  }

  async function handleFetch(source: NewsSource) {
    setFetchingId(source.id);
    setFetchResult(null);
    setFetchError(null);

    try {
      // Step 1: enqueue — returns almost instantly, unlike Phase 12's
      // direct call which blocked until the whole fetch (+ retry) finished.
      const { jobId } = await sourceApi.triggerFetch(source.id);

      // Step 2: poll — the UI stays responsive (button shows "Fetching…")
      // while this loop checks job status roughly once a second.
      const finalStatus = await pollJobUntilDone(
        sourceApi.getFetchJobStatus,
        jobId,
        () => cancelledRef.current,
      );

      if (cancelledRef.current) return;

      if (finalStatus.status === 'completed' && finalStatus.result) {
        setFetchResult({ sourceName: source.name, stats: finalStatus.result });
      } else {
        setFetchError(`${source.name}: ${finalStatus.error ?? 'Fetch job failed'}`);
      }

      await loadSources(); // refresh lastFetchedAt, health fields, news count
    } catch (err) {
      if (cancelledRef.current) return;
      const message = err instanceof ApiError ? err.message : 'Failed to fetch RSS feed.';
      setFetchError(`${source.name}: ${message}`);
    } finally {
      if (!cancelledRef.current) setFetchingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">RSS Sources</h1>
        <Link
          href="/sources/new"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Add Source
        </Link>
      </div>

      {fetchResult && (
        <div className="mb-4 flex items-center justify-between rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          <span>
            <strong>{fetchResult.sourceName}</strong> — fetched {fetchResult.stats.fetched},
            inserted {fetchResult.stats.inserted} new, skipped {fetchResult.stats.duplicates}{' '}
            duplicates.
          </span>
          <button onClick={() => setFetchResult(null)} className="ml-4 font-medium hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {fetchError && (
        <div className="mb-4 flex items-center justify-between rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          <span>{fetchError}</span>
          <button onClick={() => setFetchError(null)} className="ml-4 font-medium hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {loading && <LoadingSpinner />}
      {!loading && error && <ErrorMessage message={error} onRetry={loadSources} />}

      {!loading && !error && sources.length === 0 && (
        <EmptyState
          title="No sources yet"
          description="Add your first RSS source to start collecting news."
          action={
            <Link
              href="/sources/new"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Add Source
            </Link>
          }
        />
      )}

      {!loading && !error && sources.length > 0 && (
        <SourceTable
          sources={sources}
          onDelete={setDeleteTarget}
          onFetch={handleFetch}
          fetchingId={fetchingId}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title={`Delete "${deleteTarget?.name}"?`}
        description="This will also delete all news collected from this source. This cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        confirmLabel="Delete"
        isDangerous
      />
    </div>
  );
}