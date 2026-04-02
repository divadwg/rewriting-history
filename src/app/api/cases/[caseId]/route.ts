import { NextResponse } from 'next/server';
import { getCaseById } from '@/lib/data';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ caseId: string }> }
) {
  const { caseId } = await params;
  const caseStudy = getCaseById(caseId);
  if (!caseStudy) {
    return NextResponse.json({ error: 'Case not found' }, { status: 404 });
  }
  return NextResponse.json(caseStudy);
}
