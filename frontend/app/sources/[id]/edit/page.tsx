'use client';

import { SourceForm } from '@/components/sources/SourceForm';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { sourceApi } from '@/lib/api/source-api';
import { CreateNewsSourceInput, NewsSource } from '@/types/news-source';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function EditSourcePage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);

  const [source, setSource] = useState<NewsSource | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    sourceApi
      .getOne(id)
      .then(setSource)
      .catch(() => setError('Failed to load source.'))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleUpdate(values: CreateNewsSourceInput) {
    await sourceApi.update(id, values);
    router.push('/sources');
  }

  if (loading) return <LoadingSpinner />;
  if (error || !source) return <ErrorMessage message={error ?? 'Source not found'} />;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">Edit Source</h1>
      <SourceForm
        initialValues={{ name: source.name, url: source.url, isActive: source.isActive }}
        onSubmit={handleUpdate}
        submitLabel="Save Changes"
      />
    </div>
  );
}