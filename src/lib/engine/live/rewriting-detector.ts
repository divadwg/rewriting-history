/**
 * Rewriting Detector: Applies structural patterns learned from historical cases
 * to current news claims. Flags when current narratives match the "rewriting
 * signatures" found in Gulf of Tonkin, Iraqi WMDs, etc.
 */

import { ArticleAnalysis, ExtractedClaim } from './claim-extractor';

export interface RewritingSignal {
  pattern: string;
  severity: number; // 0-1
  description: string;
  historicalParallel: string;
  claims_involved: string[];
}

export interface NarrativeAssessment {
  topic: string;
  signals: RewritingSignal[];
  overallRisk: number; // 0-1, composite risk that this narrative is being shaped
  claimCount: number;
  sourceConcentration: number;
  selfServingRatio: number;
  recommendations: string[];
}

/**
 * Detect rewriting signatures in extracted claims.
 * Each detector corresponds to a pattern observed in historical cases.
 */
export function detectRewritingSignals(
  analyses: ArticleAnalysis[],
  topic: string
): NarrativeAssessment {
  const allClaims = analyses.flatMap(a => a.claims);
  const signals: RewritingSignal[] = [];

  signals.push(...detectSourceConcentration(analyses, allClaims));
  signals.push(...detectSelfServingClaims(allClaims));
  signals.push(...detectConfidenceWithoutEvidence(allClaims));
  signals.push(...detectSuppressedDissent(analyses));
  signals.push(...detectNarrativeSpeed(allClaims));
  signals.push(...detectContradictionPatterns(analyses));

  const sourceConcentration = computeSourceConcentration(analyses);
  const selfServingRatio = computeSelfServingRatio(allClaims);
  const overallRisk = computeOverallRisk(signals, sourceConcentration, selfServingRatio);

  const recommendations = generateRecommendations(signals);

  return {
    topic,
    signals: signals.sort((a, b) => b.severity - a.severity),
    overallRisk,
    claimCount: allClaims.length,
    sourceConcentration,
    selfServingRatio,
    recommendations,
  };
}

/**
 * Pattern 1: Source Concentration (Curveball pattern)
 * When major claims trace back to very few independent sources.
 */
function detectSourceConcentration(analyses: ArticleAnalysis[], claims: ExtractedClaim[]): RewritingSignal[] {
  const signals: RewritingSignal[] = [];

  const avgUniqueSources = analyses.reduce((s, a) => s + a.unique_independent_sources, 0) / Math.max(analyses.length, 1);
  const avgTotalSources = analyses.reduce((s, a) => s + a.sources_cited, 0) / Math.max(analyses.length, 1);

  if (avgUniqueSources <= 2 && claims.length > 3) {
    signals.push({
      pattern: 'source_concentration',
      severity: 0.8,
      description: `${claims.length} claims across ${analyses.length} articles trace to only ~${avgUniqueSources.toFixed(1)} independent sources on average. Major claims supported by very few original sources.`,
      historicalParallel: 'Iraqi WMDs: The entire mobile bio-weapons lab claim rested on a single source (Curveball). BND warned he was unreliable, but the warning was buried.',
      claims_involved: claims.slice(0, 5).map(c => c.claim),
    });
  }

  if (avgTotalSources > 0 && avgUniqueSources / avgTotalSources < 0.3) {
    signals.push({
      pattern: 'citation_circularity',
      severity: 0.6,
      description: `Sources are citing each other rather than independent evidence. Only ${((avgUniqueSources / avgTotalSources) * 100).toFixed(0)}% of cited sources are truly independent.`,
      historicalParallel: 'Tobacco denial: Industry-funded studies cited each other to create an illusion of scientific debate, while independent research consistently showed harm.',
      claims_involved: [],
    });
  }

  return signals;
}

/**
 * Pattern 2: Self-Serving Claims (Gulf of Tonkin pattern)
 * When actors make claims that directly justify their own actions or benefit them.
 */
function detectSelfServingClaims(claims: ExtractedClaim[]): RewritingSignal[] {
  const selfServing = claims.filter(c => c.benefits_claimant);
  const ratio = selfServing.length / Math.max(claims.length, 1);

  if (ratio > 0.5 && selfServing.length >= 3) {
    return [{
      pattern: 'self_serving_claims',
      severity: Math.min(ratio, 0.9),
      description: `${selfServing.length}/${claims.length} claims (${(ratio * 100).toFixed(0)}%) directly benefit the people making them. Self-serving claims require stronger independent evidence.`,
      historicalParallel: 'Gulf of Tonkin: LBJ and McNamara claimed unprovoked attacks that justified the war they already wanted. The president privately admitted doubt while publicly pushing escalation.',
      claims_involved: selfServing.slice(0, 5).map(c => `${c.claimant}: "${c.claim}"`),
    }];
  }

  return [];
}

/**
 * Pattern 3: Confident Language Without Evidence (Powell at the UN pattern)
 * Definitive claims with thin or single-source evidence.
 */
function detectConfidenceWithoutEvidence(claims: ExtractedClaim[]): RewritingSignal[] {
  const overconfident = claims.filter(
    c => c.confidence_language === 'definitive' && c.evidence_cited.length <= 1
  );

  if (overconfident.length >= 2) {
    return [{
      pattern: 'confidence_evidence_gap',
      severity: 0.7,
      description: `${overconfident.length} claims are stated as definitive fact but cite 0-1 pieces of evidence. Strong confidence with weak evidence is a classic manipulation pattern.`,
      historicalParallel: 'Iraqi WMDs: Colin Powell presented intelligence as definitive at the UN, but much of it rested on a single unreliable source and was contradicted by DOE experts.',
      claims_involved: overconfident.map(c => c.claim),
    }];
  }

  return [];
}

/**
 * Pattern 4: Suppressed Dissent (DOE dissent pattern)
 * When expert disagreement exists but is absent from mainstream coverage.
 */
function detectSuppressedDissent(analyses: ArticleAnalysis[]): RewritingSignal[] {
  const signals: RewritingSignal[] = [];

  const allMissing = analyses.flatMap(a => a.missing_perspectives);
  // Count how often the same missing perspective appears across articles
  const missingCounts = new Map<string, number>();
  for (const m of allMissing) {
    const key = m.toLowerCase();
    missingCounts.set(key, (missingCounts.get(key) || 0) + 1);
  }

  const systematicallyMissing = Array.from(missingCounts.entries())
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1]);

  if (systematicallyMissing.length > 0) {
    signals.push({
      pattern: 'systematic_exclusion',
      severity: 0.65,
      description: `The same perspectives are missing across multiple articles: ${systematicallyMissing.map(([p, c]) => `"${p}" (missing from ${c} articles)`).join('; ')}`,
      historicalParallel: 'Iraqi WMDs: DOE nuclear experts dissented on the aluminum tubes but their view was buried in a footnote. The State Department INR also dissented but was ignored.',
      claims_involved: [],
    });
  }

  return signals;
}

/**
 * Pattern 5: Narrative Speed (Tonkin Resolution pattern)
 * When consensus forms faster than evidence could possibly justify.
 */
function detectNarrativeSpeed(claims: ExtractedClaim[]): RewritingSignal[] {
  if (claims.length < 3) return [];

  const dates = claims
    .map(c => new Date(c.date).getTime())
    .filter(d => !isNaN(d));

  if (dates.length < 2) return [];

  const span = Math.max(...dates) - Math.min(...dates);
  const daySpan = span / (1000 * 60 * 60 * 24);

  // Many definitive claims in a very short time window
  const definitiveCount = claims.filter(c => c.confidence_language === 'definitive').length;
  if (definitiveCount >= 3 && daySpan <= 7) {
    return [{
      pattern: 'rapid_consensus',
      severity: 0.6,
      description: `${definitiveCount} definitive claims emerged within ${daySpan.toFixed(0)} days. Genuine consensus rarely forms this quickly — manufactured consensus does.`,
      historicalParallel: 'Gulf of Tonkin: The Resolution passed Congress in 3 days with 2 dissenting votes. A pre-drafted resolution had been prepared weeks before the incident.',
      claims_involved: claims.filter(c => c.confidence_language === 'definitive').map(c => c.claim),
    }];
  }

  return [];
}

/**
 * Pattern 6: Contradiction Suppression
 * When contradictions exist in the data but are not prominently featured.
 */
function detectContradictionPatterns(analyses: ArticleAnalysis[]): RewritingSignal[] {
  const totalContradictions = analyses.reduce((s, a) => s + a.contradictions.length, 0);
  const totalClaims = analyses.reduce((s, a) => s + a.claims.length, 0);

  if (totalContradictions > 0 && totalClaims > 5) {
    const contradictionRatio = totalContradictions / totalClaims;
    if (contradictionRatio > 0.15) {
      return [{
        pattern: 'high_contradiction_rate',
        severity: Math.min(contradictionRatio * 2, 0.85),
        description: `${totalContradictions} contradictions found across ${totalClaims} claims (${(contradictionRatio * 100).toFixed(0)}% contradiction rate). The narrative contains significant internal inconsistencies.`,
        historicalParallel: 'Sykes-Picot: Three mutually contradictory commitments (McMahon-Hussein, Sykes-Picot, Balfour) existed simultaneously. The contradictions were managed through ambiguity until they became unsustainable.',
        claims_involved: analyses.flatMap(a => a.contradictions).map(c => `${c.claim_a} vs ${c.claim_b}`),
      }];
    }
  }

  return [];
}

function computeSourceConcentration(analyses: ArticleAnalysis[]): number {
  if (analyses.length === 0) return 0;
  const avg = analyses.reduce((s, a) => s + a.unique_independent_sources, 0) / analyses.length;
  return Math.max(0, 1 - avg / 10); // 0 = diverse, 1 = concentrated
}

function computeSelfServingRatio(claims: ExtractedClaim[]): number {
  if (claims.length === 0) return 0;
  return claims.filter(c => c.benefits_claimant).length / claims.length;
}

function computeOverallRisk(signals: RewritingSignal[], sourceCon: number, selfServing: number): number {
  if (signals.length === 0) return 0;
  const signalAvg = signals.reduce((s, sig) => s + sig.severity, 0) / signals.length;
  // Weighted composite
  return Math.min(
    signalAvg * 0.5 + sourceCon * 0.25 + selfServing * 0.25,
    1
  );
}

function generateRecommendations(signals: RewritingSignal[]): string[] {
  const recs: string[] = [];

  const patterns = new Set(signals.map(s => s.pattern));

  if (patterns.has('source_concentration')) {
    recs.push('Seek out the original/primary source for major claims. How many truly independent sources exist?');
  }
  if (patterns.has('self_serving_claims')) {
    recs.push('Look for assessments from parties who do NOT benefit from the claim being true.');
  }
  if (patterns.has('confidence_evidence_gap')) {
    recs.push('When officials speak with certainty, ask: what specific evidence supports this? Is it public?');
  }
  if (patterns.has('systematic_exclusion')) {
    recs.push('Actively seek out the perspectives missing from mainstream coverage. Who disagrees and why?');
  }
  if (patterns.has('rapid_consensus')) {
    recs.push('Be skeptical of rapid consensus. Genuine understanding takes time. Ask: who benefits from urgency?');
  }
  if (patterns.has('high_contradiction_rate')) {
    recs.push('Map the contradictions explicitly. Which version has more independent evidence? Which benefits whom?');
  }

  if (recs.length === 0) {
    recs.push('No strong rewriting signals detected, but continue monitoring as narratives evolve over time.');
  }

  return recs;
}
