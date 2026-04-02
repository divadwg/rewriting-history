import { NextResponse } from 'next/server';
import { callLLM, LLMProvider } from '@/lib/engine/live/llm-provider';
import { updatePosteriors, evidenceSensitivity, generateVerdict } from '@/lib/engine/bayesian';
import { Hypothesis, EvidenceItem } from '@/lib/types/graph';

function parseJSON<T>(text: string): T | null {
  const jsonMatch = text.match(/[\[{][\s\S]*[\]}]/);
  if (!jsonMatch) return null;
  try {
    return JSON.parse(jsonMatch[0]) as T;
  } catch {
    return null;
  }
}

// ─── STEP 1: Extract verifiable claims from the article ─────────────────────

const EXTRACT_CLAIMS_PROMPT = `You are a fact-checker extracting VERIFIABLE CLAIMS from a news article.

RULES:
- Extract only SPECIFIC, FALSIFIABLE claims — things that can be checked against evidence.
- Skip opinions, predictions, and vague statements.
- For each claim, note WHO made it and whether it BENEFITS them.
- Note the CONFIDENCE LANGUAGE used (definitive vs. hedged).

Return a JSON array:
[
  {
    "id": "c1",
    "claim": "The specific verifiable claim (1 sentence)",
    "claimant": "Who made this claim",
    "claimantRole": "Their role/affiliation",
    "benefitsClaimant": true/false,
    "confidenceLanguage": "definitive|likely|hedged|uncertain",
    "evidenceCited": "What evidence the article cites for this claim, or 'none cited'"
  }
]

Extract 5-15 claims. Prioritize claims that are central to the article's narrative.`;

// ─── STEP 2: Gather independent evidence on the claims ──────────────────────

const VERIFY_EVIDENCE_PROMPT = `You are a research assistant gathering INDEPENDENT EVIDENCE to verify or refute a set of claims from a news article.

CRITICAL RULES:
- For each claim, find evidence FROM OUTSIDE THE ARTICLE — official statistics, academic studies, government data, court records, independent reporting, scientific measurements.
- Include evidence that SUPPORTS and CONTRADICTS the claims.
- Be specific: cite actual data points, document names, dates, organizations.
- If a claim cites a source, check if that source actually says what is claimed.
- Include the RELIABILITY of each evidence source.
- DO NOT just agree or disagree with claims. Find EVIDENCE.

Return a JSON object:
{
  "evidence": [
    {
      "id": "e1",
      "fact": "Specific verifiable fact from an independent source",
      "source": "Organization/document/database name",
      "date": "YYYY or YYYY-MM-DD",
      "type": "statistic|government_data|academic_study|court_record|independent_report|scientific|official_record",
      "sourceReliability": 0.0-1.0,
      "relevantToClaims": ["c1", "c2"],
      "supports": true/false/null,
      "dataPoint": "Specific number/measurement if quantitative"
    }
  ],
  "missingData": "What data would be needed but is not publicly available"
}

Provide 8-20 evidence items. Prioritize quantitative and independently verifiable evidence.`;

// ─── STEP 3: Generate hypotheses about the article's reliability ────────────

const HYPOTHESIS_PROMPT = `You are a scientist assessing the reliability of a news article's claims using independent evidence.

Generate hypotheses about the article's OVERALL narrative reliability. Think about:
- Is the article accurately reporting facts?
- Is it selectively presenting evidence?
- Is it making unsupported extrapolations?
- Are there legitimate alternative explanations the article ignores?

Return a JSON object:
{
  "hypotheses": [
    {
      "id": "h1",
      "label": "One-sentence hypothesis about the article's accuracy",
      "description": "2-3 sentences",
      "prior": 0.0-1.0,
      "isOfficial": true/false
    }
  ],
  "likelihoodRatios": {
    "e1": { "h1": 0.0-1.0, "h2": 0.0-1.0 }
  }
}

Generate 3-4 hypotheses. Examples:
- "The article's central claims are well-supported by independent evidence"
- "The article is accurate but omits important context that changes the conclusion"
- "The article's key claims are not supported by available data"
- "The article accurately reports some facts but draws unsupported conclusions"

isOfficial=true for the hypothesis that matches the article's framing.
Priors must sum to 1.0.`;

// ─── STEP 4: Synthesis ──────────────────────────────────────────────────────

const SYNTHESIS_PROMPT = `You are a fact-checking analyst reporting what INDEPENDENT EVIDENCE reveals about a news article's claims. Bayesian inference has been run mathematically.

Given the claims, independent evidence, and Bayesian posteriors, return:
{
  "overallAssessment": "1-2 sentence summary of what the evidence says about this article",
  "claimVerifications": [
    {
      "claimId": "c1",
      "status": "supported|partially_supported|unsupported|contradicted|unverifiable",
      "explanation": "What the independent evidence shows about this specific claim",
      "keyEvidence": ["e1", "e2"]
    }
  ],
  "missingContext": "Important context the article omits that the evidence reveals",
  "strongestEvidence": ["IDs of evidence items with biggest Bayesian impact"],
  "recommendations": ["What a reader should do to verify these claims themselves"]
}`;

export async function POST(request: Request) {
  const body = await request.json();
  const { topic, articles, provider, apiKey } = body as {
    topic: string;
    articles: Array<{ text: string; url: string; date: string }>;
    provider?: LLMProvider;
    apiKey?: string;
  };

  if (!articles || articles.length === 0) {
    return NextResponse.json({ error: 'No articles provided' }, { status: 400 });
  }

  const resolvedKey = apiKey || process.env.ANTHROPIC_API_KEY;
  const resolvedProvider = provider || 'claude';

  if (!resolvedKey) {
    return NextResponse.json({
      error: 'Set an API key in Settings to use Live Analysis.',
    }, { status: 400 });
  }

  const config = { provider: resolvedProvider, apiKey: resolvedKey };

  // Combine articles into one text block
  const articleText = articles
    .map((a, i) => `--- Article ${i + 1} (${a.url || 'no URL'}, ${a.date}) ---\n${a.text}`)
    .join('\n\n')
    .slice(0, 12000);

  try {
    // ── STEP 1: Extract verifiable claims ────────────────────────────────
    const claimsText = await callLLM(config, `${EXTRACT_CLAIMS_PROMPT}\n\nTOPIC: ${topic}\n\nARTICLE TEXT:\n${articleText}\n\nReturn ONLY the JSON array:`, 4096);
    if (!claimsText) {
      return NextResponse.json({ error: 'Failed to extract claims' }, { status: 500 });
    }

    const claims = parseJSON<Array<{
      id: string; claim: string; claimant: string; claimantRole: string;
      benefitsClaimant: boolean; confidenceLanguage: string; evidenceCited: string;
    }>>(claimsText);

    if (!claims || claims.length === 0) {
      return NextResponse.json({ error: 'Could not parse claims from article' }, { status: 500 });
    }

    // ── STEP 2: Gather independent evidence ──────────────────────────────
    const claimsJson = JSON.stringify(claims, null, 2);
    const evidenceText = await callLLM(config, `${VERIFY_EVIDENCE_PROMPT}\n\nTOPIC: ${topic}\n\nCLAIMS TO VERIFY:\n${claimsJson}\n\nReturn ONLY the JSON object:`, 8192);

    if (!evidenceText) {
      return NextResponse.json({ error: 'Failed to gather independent evidence' }, { status: 500 });
    }

    const evidenceResult = parseJSON<{
      evidence: Array<{
        id: string; fact: string; source: string; date: string; type: string;
        sourceReliability: number; relevantToClaims: string[]; supports: boolean | null;
        dataPoint: string | null;
      }>;
      missingData: string;
    }>(evidenceText);

    if (!evidenceResult || !evidenceResult.evidence || evidenceResult.evidence.length === 0) {
      return NextResponse.json({ error: 'Could not parse evidence' }, { status: 500 });
    }

    // ── STEP 3: Generate hypotheses + likelihood ratios ──────────────────
    const evidenceJson = JSON.stringify(evidenceResult.evidence, null, 2);
    const hypothesisText = await callLLM(config, `${HYPOTHESIS_PROMPT}\n\nTOPIC: ${topic}\n\nCLAIMS:\n${claimsJson}\n\nINDEPENDENT EVIDENCE:\n${evidenceJson}\n\nReturn ONLY the JSON object:`, 8192);

    if (!hypothesisText) {
      return NextResponse.json({ error: 'Failed to generate hypotheses' }, { status: 500 });
    }

    const hypResult = parseJSON<{
      hypotheses: Array<{ id: string; label: string; description: string; prior: number; isOfficial: boolean }>;
      likelihoodRatios: Record<string, Record<string, number>>;
    }>(hypothesisText);

    if (!hypResult || !hypResult.hypotheses || hypResult.hypotheses.length === 0) {
      return NextResponse.json({ error: 'Could not parse hypotheses' }, { status: 500 });
    }

    // ── STEP 4: Bayesian computation (pure math) ─────────────────────────
    const priorSum = hypResult.hypotheses.reduce((s, h) => s + h.prior, 0);
    const hypotheses: Hypothesis[] = hypResult.hypotheses.map(h => ({
      id: h.id,
      caseStudyId: 'live',
      label: h.label,
      description: h.description,
      prior: h.prior / priorSum,
      posterior: h.prior / priorSum,
      isOfficial: h.isOfficial,
    }));

    const evidence: EvidenceItem[] = evidenceResult.evidence.map(e => {
      const ratios = hypResult.likelihoodRatios?.[e.id] || {};
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
        wasClassified: false,
        declassifiedDate: undefined,
      };
    });

    const posteriors = updatePosteriors(hypotheses, evidence);
    const sensitivity = evidenceSensitivity(hypotheses, evidence);
    const verdict = generateVerdict(hypotheses, evidence);

    // ── STEP 5: Synthesis ────────────────────────────────────────────────
    const posteriorsJson = JSON.stringify(posteriors, null, 2);
    const sensitivityJson = JSON.stringify(sensitivity.slice(0, 8), null, 2);
    const synthesisText = await callLLM(config, `${SYNTHESIS_PROMPT}\n\nTOPIC: ${topic}\n\nCLAIMS:\n${claimsJson}\n\nINDEPENDENT EVIDENCE:\n${evidenceJson}\n\nBAYESIAN POSTERIORS:\n${posteriorsJson}\n\nEVIDENCE IMPACT:\n${sensitivityJson}\n\nReturn ONLY the JSON object:`, 4096);

    let synthesis = null;
    if (synthesisText) {
      synthesis = parseJSON<{
        overallAssessment: string;
        claimVerifications: Array<{ claimId: string; status: string; explanation: string; keyEvidence: string[] }>;
        missingContext: string;
        strongestEvidence: string[];
        recommendations: string[];
      }>(synthesisText);
    }

    return NextResponse.json({
      claims,
      evidence: evidenceResult.evidence,
      missingData: evidenceResult.missingData,
      hypotheses,
      bayesian: { posteriors, sensitivity, verdict },
      synthesis,
      pipeline: 'evidence-first',
    });
  } catch (error) {
    return NextResponse.json(
      { error: `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
