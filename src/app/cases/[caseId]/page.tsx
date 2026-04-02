import { notFound } from 'next/navigation';
import { getCaseById, getAllCases } from '@/lib/data';
import CaseStudyClient from './CaseStudyClient';

export function generateStaticParams() {
  return getAllCases().map(c => ({ caseId: c.id }));
}

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  const caseStudy = getCaseById(caseId);
  if (!caseStudy) notFound();

  return <CaseStudyClient caseStudy={caseStudy} />;
}
