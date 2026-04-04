import { getResult } from '@/lib/storage/results';
import { notFound } from 'next/navigation';
import ResultClient from './ResultClient';

export default async function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = getResult(id);
  if (!result) notFound();

  return <ResultClient result={result} />;
}
