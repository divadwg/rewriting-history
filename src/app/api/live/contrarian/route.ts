import { NextResponse } from 'next/server';
import {
  buildEvidencePrompt,
  buildHypothesisPrompt,
  buildSynthesisPrompt,
  buildDiscoveryPrompt,
  ContrarianResult,
  RawEvidence,
  HypothesisGeneration,
  SynthesisResult,
} from '@/lib/engine/live/contrarian-engine';
import { updatePosteriors, evidenceSensitivity, generateVerdict } from '@/lib/engine/bayesian';
import { callLLM, LLMProvider } from '@/lib/engine/live/llm-provider';
import { Hypothesis, EvidenceItem } from '@/lib/types/graph';

function parseJSON<T>(text: string): T | null {
  // Try to extract JSON from the response
  const jsonMatch = text.match(/[\[{][\s\S]*[\]}]/);
  if (!jsonMatch) return null;
  try {
    return JSON.parse(jsonMatch[0]) as T;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  const { belief, category, alreadyDone, provider, apiKey } = body as {
    belief?: string;
    category?: string;
    alreadyDone?: string[];
    provider?: LLMProvider;
    apiKey?: string;
  };

  const resolvedKey = apiKey || process.env.ANTHROPIC_API_KEY;
  const resolvedProvider = provider || 'claude';

  if (!resolvedKey) {
    return NextResponse.json({
      error: 'No API key provided. Set one in the Settings menu.',
    }, { status: 400 });
  }

  const config = { provider: resolvedProvider, apiKey: resolvedKey };

  try {
    // ── STEP 0: TOPIC DISCOVERY (if category but no topic) ──────────────
    let topic = belief?.trim();

    if (!topic && category) {
      const discoveryPrompt = buildDiscoveryPrompt(category, alreadyDone || []);
      const discovered = await callLLM(config, discoveryPrompt, 256);
      if (!discovered) {
        return NextResponse.json({ error: 'Failed to discover a research question' }, { status: 500 });
      }
      topic = discovered.trim().replace(/^["']|["']$/g, '');
    }

    if (!topic || topic.length < 10) {
      return NextResponse.json({ error: 'No topic to analyze' }, { status: 400 });
    }

    // ── STEP 1: GATHER RAW EVIDENCE ─────────────────────────────────────
    // temperature=0 for reproducibility — same query should yield same evidence
    const evidencePrompt = buildEvidencePrompt(topic);
    const evidenceText = await callLLM(config, evidencePrompt, 8192, { temperature: 0 });

    if (!evidenceText) {
      return NextResponse.json({ error: 'Failed to gather evidence' }, { status: 500 });
    }

    const rawEvidence = parseJSON<RawEvidence[]>(evidenceText);
    if (!rawEvidence || rawEvidence.length === 0) {
      return NextResponse.json({ error: 'Could not parse evidence response' }, { status: 500 });
    }

    // ── STEP 2: GENERATE HYPOTHESES FROM EVIDENCE ───────────────────────
    // temperature=0 for reproducibility — same evidence should yield same hypotheses
    const evidenceJson = JSON.stringify(rawEvidence, null, 2);
    const hypothesisPrompt = buildHypothesisPrompt(topic, evidenceJson);
    const hypothesisText = await callLLM(config, hypothesisPrompt, 8192, { temperature: 0 });

    if (!hypothesisText) {
      return NextResponse.json({ error: 'Failed to generate hypotheses' }, { status: 500 });
    }

    const hypGen = parseJSON<HypothesisGeneration>(hypothesisText);
    if (!hypGen || !hypGen.hypotheses || hypGen.hypotheses.length === 0) {
      return NextResponse.json({ error: 'Could not parse hypothesis response' }, { status: 500 });
    }

    // ── STEP 3: BAYESIAN COMPUTATION (no LLM — pure math) ──────────────

    // Normalize priors to sum to 1
    const priorSum = hypGen.hypotheses.reduce((s, h) => s + h.prior, 0);
    const hypotheses: Hypothesis[] = hypGen.hypotheses.map(h => ({
      id: h.id,
      caseStudyId: 'on-demand',
      label: h.label,
      description: h.description,
      prior: h.prior / priorSum,
      posterior: h.prior / priorSum,
      isOfficial: h.isOfficial,
    }));

    // Build evidence items with likelihood ratios from the hypothesis step
    const evidence: EvidenceItem[] = rawEvidence.map(e => {
      const ratios = hypGen.likelihoodRatios?.[e.id] || {};
      // Fill in default ratios for any missing hypothesis
      const likelihoodRatios: Record<string, number> = {};
      for (const h of hypotheses) {
        likelihoodRatios[h.id] = ratios[h.id] ?? 0.5;
      }

      return {
        id: e.id,
        label: e.fact.slice(0, 80),
        description: `${e.fact} [Source: ${e.source}]${e.dataPoint ? ` Data: ${e.dataPoint}` : ''}`,
        date: e.date,
        likelihoodRatios,
        sourceReliability: e.sourceReliability,
        wasClassified: e.wasClassified,
        declassifiedDate: e.declassifiedDate ?? undefined,
      };
    });

    // Run Bayesian inference
    const posteriors = updatePosteriors(hypotheses, evidence);
    const sensitivity = evidenceSensitivity(hypotheses, evidence);
    const verdict = generateVerdict(hypotheses, evidence);

    // ── STABILITY CHECK: perturb likelihood ratios ±10% and see if verdict holds
    const PERTURBATION_TRIALS = 20;
    let verdictMatches = 0;
    for (let t = 0; t < PERTURBATION_TRIALS; t++) {
      const perturbed: EvidenceItem[] = evidence.map(e => {
        const ratios: Record<string, number> = {};
        for (const [hid, val] of Object.entries(e.likelihoodRatios)) {
          // Random perturbation ±10%
          const noise = 1 + (Math.random() * 0.2 - 0.1);
          ratios[hid] = Math.max(0.01, Math.min(0.99, val * noise));
        }
        return { ...e, likelihoodRatios: ratios };
      });
      const pVerdict = generateVerdict(hypotheses, perturbed);
      if (pVerdict.verdict === verdict.verdict) verdictMatches++;
    }
    const stabilityScore = verdictMatches / PERTURBATION_TRIALS;

    // ── STEP 4: SYNTHESIS — what did the math reveal? ───────────────────
    const posteriorsJson = JSON.stringify(posteriors, null, 2);
    const sensitivityJson = JSON.stringify(sensitivity.slice(0, 8), null, 2);
    const hypothesesJson = JSON.stringify(hypGen.hypotheses, null, 2);

    const synthesisPrompt = buildSynthesisPrompt(
      topic, evidenceJson, hypothesesJson, posteriorsJson, sensitivityJson
    );
    const synthesisText = await callLLM(config, synthesisPrompt, 4096);

    let synthesis: SynthesisResult | null = null;
    if (synthesisText) {
      synthesis = parseJSON<SynthesisResult>(synthesisText);
    }

    // ── BUILD RESULT ────────────────────────────────────────────────────
    const result: ContrarianResult = {
      belief: topic,
      standardNarrative: synthesis?.standardNarrative || 'See evidence below',
      contrarianCase: synthesis?.evidenceBasedConclusion || 'See Bayesian analysis below',
      hypotheses,
      evidence,
      causalFactors: hypGen.causalFactors || [],
      causalLinks: hypGen.causalLinks || [],
      keyInsight: synthesis?.keyInsight || 'Review the evidence and posteriors below',
      furtherReading: synthesis?.furtherReading || [],
      confidenceNote: synthesis?.confidenceNote || 'Based on automated Bayesian analysis of primary source evidence',
    };

    return NextResponse.json({
      result,
      bayesian: { posteriors, sensitivity, verdict },
      stability: stabilityScore,
      discoveredBelief: !belief ? topic : undefined,
      synthesis,
      rawEvidence: rawEvidence.map(e => ({ id: e.id, sourceUrl: e.sourceUrl || null, searchQuery: e.searchQuery || null })),
      rawEvidenceCount: rawEvidence.length,
      hypothesisCount: hypotheses.length,
      pipeline: 'evidence-first',
    });
  } catch (error) {
    return NextResponse.json(
      { error: `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
