import { NextResponse } from 'next/server';
import { getAllCases } from '@/lib/data';

export async function GET() {
  const cases = getAllCases().map(c => ({
    id: c.id,
    title: c.title,
    period: c.period,
    summary: c.summary,
    hypothesisCount: c.hypotheses.length,
    evidenceCount: c.evidence.length,
    nodeCount: c.nodes.length,
  }));
  return NextResponse.json(cases);
}
