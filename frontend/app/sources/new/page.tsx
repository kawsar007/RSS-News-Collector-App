'use client';

import { SourceForm } from '@/components/sources/SourceForm';
import { sourceApi } from '@/lib/api/source-api';
import { CreateNewsSourceInput } from '@/types/news-source';
import { useRouter } from 'next/navigation';

export default function NewSourcePage() {
  const router = useRouter();

  async function handleCreate(values: CreateNewsSourceInput) {
    await sourceApi.create(values);
    router.push('/sources');
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">Add RSS Source</h1>
      <SourceForm onSubmit={handleCreate} submitLabel="Create Source" />
    </div>
  );
}