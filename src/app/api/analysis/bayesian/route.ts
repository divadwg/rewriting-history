import { NextResponse } from 'next/server';
import { getCaseById } from '@/lib/data';
import { updatePosteriors, evidenceSensitivity, priorSensitivity, generateVerdict } from '@/lib/engine/bayesian';

export async function POST(request: Request) {
  const body = await request.json();
  const { caseId, activeEvidenceIds } = body;

  const caseStudy = getCaseById(caseId);
  if (!caseStudy) {
    return NextResponse.json({ error: 'Case not found' }, { status: 404 });
  }

  const activeSet = activeEvidenceIds
    ? new Set<string>(activeEvidenceIds)
    : new Set(caseStudy.evidence.map(e => e.id));

  const posteriors = updatePosteriors(caseStudy.hypotheses, caseStudy.evidence, activeSet);
  const sensitivity = evidenceSensitivity(caseStudy.hypotheses, caseStudy.evidence);
  const priorAnalysis = priorSensitivity(caseStudy.hypotheses, caseStudy.evidence);
  const verdict = generateVerdict(caseStudy.hypotheses, caseStudy.evidence);

  return NextResponse.json({
    posteriors,
    sensitivity,
    priorAnalysis,
    verdict,
  });
}
