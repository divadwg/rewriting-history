import { CaseStudy, EvidenceItem, GraphEdge } from '../types/graph';
import { updatePosteriors, evidenceSensitivity, priorSensitivity } from './bayesian';

/**
 * Narrative Fragility Score — v2
 *
 * Two distinct measurements:
 *
 * 1. STRUCTURAL FRAGILITY (0-1): Does this narrative have the hallmarks of
 *    manipulation? Suppression, classification, benefit conflicts, source
 *    concentration. This is inherent to how the narrative was constructed and
 *    should be HIGH for overturned cases, LOW for confirmed cases, regardless
 *    of when you measure.
 *
 * 2. EVIDENTIAL CERTAINTY (0-1): How resolved is the question? 0 = deeply
 *    uncertain/contested, 1 = decisively resolved. For overturned cases this
 *    should be LOW pre-revelation (uncertain) and HIGH post-revelation (resolved).
 *    For confirmed cases, HIGH throughout.
 *
 * The OVERALL fragility = structural fragility. Evidential certainty is shown
 * separately to make the pre/post comparison meaningful.
 */

export interface FragilityScore {
  overall: number; // 0-1 composite (structural fragility)
  structural: number; // 0-1: manipulation hallmarks
  evidentialCertainty: number; // 0-1: how resolved/certain (NOT fragility — higher = more resolved)
  components: FragilityComponents;
  interpretation: string;
  riskFactors: string[];
}

export interface FragilityComponents {
  // Structural signals — inherent to narrative construction (0-1 each)
  suppressionDensity: number;
  benefitConflict: number;
  sourceConcentration: number;
  contradictionLoad: number;
  classificationRate: number;
  reliabilityVariance: number;
  dissenterSuppression: number;
  evidenceActionDensity: number;
  narrativeChangeRate: number;
  powerChangePressure: number;

  // Evidential certainty signals — change as evidence accumulates
  verdictMargin: number;        // 0 = neck and neck, 1 = one hypothesis dominates
  evidenceWeight: number;       // Total log-odds shift from evidence (normalized)
  sourceAgreement: number;      // Do independent sources agree? 0 = conflicting, 1 = consensus
  priorIndependence: number;    // 1 = verdict same regardless of prior, 0 = prior-dependent
}

/**
 * Compute the narrative fragility score for a case study.
 */
export function narrativeFragilityScore(caseStudy: CaseStudy): FragilityScore {
  const components = computeComponents(caseStudy);
  const structural = computeStructural(components);
  const evidentialCertainty = computeEvidentialCertainty(components);
  const overall = structural; // Overall = structural fragility
  const riskFactors = identifyRiskFactors(components);
  const interpretation = interpretScore(structural, evidentialCertainty);

  return { overall, structural, evidentialCertainty, components, interpretation, riskFactors };
}

function computeComponents(cs: CaseStudy): FragilityComponents {
  const { edges, nodes, evidence, hypotheses, causalFactors, causalLinks } = cs;

  // ── Structural signals ────────────────────────────────────────

  const suppressionEdges = edges.filter(e => e.type === 'suppresses' || e.type === 'fabricates');
  const suppressionDensity = edges.length > 0
    ? Math.min(suppressionEdges.length / edges.length * 5, 1)
    : 0;

  const benefitEdges = edges.filter(e => e.type === 'benefits');
  const claimsEdges = edges.filter(e => e.type === 'claims');
  const claimants = new Set(claimsEdges.map(e => e.source));
  const benefitActors = new Set(benefitEdges.map(e => e.source));
  const conflicted = [...claimants].filter(a => benefitActors.has(a));
  const benefitConflict = claimants.size > 0
    ? conflicted.length / claimants.size
    : 0;

  const evidenceSources = new Set<string>();
  for (const e of evidence) {
    for (const nodeId of e.linkedNodeIds ?? []) {
      const node = nodes.find(n => n.id === nodeId);
      if (node && (node.type === 'actor' || node.type === 'source')) {
        evidenceSources.add(nodeId);
      }
    }
  }
  const sourceConcentration = evidence.length > 0
    ? Math.max(0, 1 - (evidenceSources.size / evidence.length))
    : 0;

  const contradictEdges = edges.filter(e => e.type === 'contradicts');
  const contradictionLoad = nodes.length > 0
    ? Math.min(contradictEdges.length / nodes.length, 1)
    : 0;

  const classifiedCount = evidence.filter(e => e.wasClassified).length;
  const classificationRate = evidence.length > 0 ? classifiedCount / evidence.length : 0;

  const reliabilities = evidence.map(e => e.sourceReliability);
  const meanReliability = reliabilities.reduce((s, r) => s + r, 0) / Math.max(reliabilities.length, 1);
  const variance = reliabilities.reduce((s, r) => s + (r - meanReliability) ** 2, 0) / Math.max(reliabilities.length, 1);
  const reliabilityVariance = Math.min(Math.sqrt(variance) * 3, 1);

  const suppressedTargets = suppressionEdges.map(e => e.target);
  const evidenceNodeIds = new Set(nodes.filter(n => n.type === 'evidence' || n.type === 'source').map(n => n.id));
  const suppressedEvidence = suppressedTargets.filter(t => evidenceNodeIds.has(t));
  const dissenterSuppression = evidenceNodeIds.size > 0
    ? Math.min(suppressedEvidence.length / evidenceNodeIds.size * 3, 1)
    : 0;

  const evidenceActions = causalFactors.filter(cf => cf.type === 'evidence_action');
  const evidenceActionDensity = causalFactors.length > 0
    ? evidenceActions.length / causalFactors.length
    : 0;

  const narrativeChanges = causalFactors.filter(cf => cf.type === 'narrative_change');
  const narrativeChangeRate = causalFactors.length > 0
    ? Math.min(narrativeChanges.length / causalFactors.length * 2, 1)
    : 0;

  const powerChanges = causalFactors.filter(cf => cf.type === 'power_change');
  const powerToEvidence = causalLinks.filter(link => {
    const fromFactor = causalFactors.find(cf => cf.id === link.from);
    const toFactor = causalFactors.find(cf => cf.id === link.to);
    return (fromFactor?.type === 'power_change' && toFactor?.type === 'evidence_action') ||
      (fromFactor?.type === 'power_change' && toFactor?.type === 'narrative_change');
  });
  const powerChangePressure = powerChanges.length > 0
    ? Math.min(powerToEvidence.length / powerChanges.length, 1)
    : 0;

  // ── Evidential certainty signals ──────────────────────────────

  const verdictMargin = computeVerdictMargin(hypotheses, evidence);
  const evidenceWeight = computeEvidenceWeight(hypotheses, evidence);
  const sourceAgreement = computeSourceAgreement(hypotheses, evidence);
  const priorIndependence = computePriorIndependence(hypotheses, evidence);

  return {
    suppressionDensity, benefitConflict, sourceConcentration, contradictionLoad,
    classificationRate, reliabilityVariance, dissenterSuppression,
    evidenceActionDensity, narrativeChangeRate, powerChangePressure,
    verdictMargin, evidenceWeight, sourceAgreement, priorIndependence,
  };
}

/**
 * Structural fragility: weighted composite of manipulation hallmarks.
 */
function computeStructural(c: FragilityComponents): number {
  const weights: Record<string, number> = {
    suppressionDensity: 0.15,
    benefitConflict: 0.10,
    sourceConcentration: 0.08,
    contradictionLoad: 0.05,
    classificationRate: 0.12,
    reliabilityVariance: 0.08,
    dissenterSuppression: 0.14,
    evidenceActionDensity: 0.10,
    narrativeChangeRate: 0.06,
    powerChangePressure: 0.12,
  };

  let sum = 0;
  let weightSum = 0;
  for (const [key, weight] of Object.entries(weights)) {
    sum += (c[key as keyof FragilityComponents] ?? 0) * weight;
    weightSum += weight;
  }

  return Math.round((sum / weightSum) * 100) / 100;
}

/**
 * Evidential certainty: how decisively resolved is the question?
 * 0 = deeply uncertain, 1 = decisive.
 */
function computeEvidentialCertainty(c: FragilityComponents): number {
  const weights: Record<string, number> = {
    verdictMargin: 0.35,
    evidenceWeight: 0.25,
    sourceAgreement: 0.20,
    priorIndependence: 0.20,
  };

  let sum = 0;
  let weightSum = 0;
  for (const [key, weight] of Object.entries(weights)) {
    sum += (c[key as keyof FragilityComponents] ?? 0) * weight;
    weightSum += weight;
  }

  return Math.round((sum / weightSum) * 100) / 100;
}

/**
 * How wide is the gap between official and best alternative?
 * Returns 0-1: 0 = neck-and-neck, 1 = one hypothesis dominates.
 */
function computeVerdictMargin(hypotheses: Hypothesis[], evidence: EvidenceItem[]): number {
  if (hypotheses.length === 0 || evidence.length === 0) return 0;
  const result = updatePosteriors(hypotheses, evidence);
  const posteriors = result.map(h => h.posterior).sort((a, b) => b - a);
  if (posteriors.length < 2) return 1;
  // Gap between top two
  const gap = posteriors[0] - posteriors[1];
  // Scale: a gap of 0.8+ is essentially decisive
  return Math.min(gap / 0.8, 1);
}

/**
 * Total evidence weight: how much did evidence shift from priors?
 * Measures the cumulative log-odds shift across all evidence.
 * Higher = more evidence bearing on the question = more certain.
 */
function computeEvidenceWeight(hypotheses: Hypothesis[], evidence: EvidenceItem[]): number {
  if (hypotheses.length === 0 || evidence.length === 0) return 0;

  const official = hypotheses.find(h => h.isOfficial) ?? hypotheses[0];
  if (!official) return 0;

  // Compute total log-odds shift
  let totalShift = 0;
  for (const e of evidence) {
    const lr = e.likelihoodRatios[official.id] ?? 1;
    const effectiveLr = lr * e.sourceReliability + (1 - e.sourceReliability) * 1;
    if (effectiveLr > 0) {
      totalShift += Math.abs(Math.log(effectiveLr));
    }
  }

  // Normalize: 5 log-odds shift is very strong evidence
  return Math.min(totalShift / 5, 1);
}

/**
 * Do independent sources point the same direction?
 * 0 = sources conflict, 1 = sources agree.
 */
function computeSourceAgreement(hypotheses: Hypothesis[], evidence: EvidenceItem[]): number {
  if (hypotheses.length < 2 || evidence.length < 2) return 0;

  const official = hypotheses.find(h => h.isOfficial) ?? hypotheses[0];
  if (!official) return 0;

  // For each evidence item, does it favor official (LR > 1) or not (LR < 1)?
  let favorsOfficial = 0;
  let favorsAlt = 0;
  for (const e of evidence) {
    const lr = e.likelihoodRatios[official.id] ?? 1;
    if (lr > 1) favorsOfficial++;
    else if (lr < 1) favorsAlt++;
  }

  const total = favorsOfficial + favorsAlt;
  if (total === 0) return 0;

  // Agreement = how lopsided the split is
  const majority = Math.max(favorsOfficial, favorsAlt);
  return (majority / total - 0.5) * 2; // 0 = 50/50 split, 1 = unanimous
}

/**
 * Is the verdict independent of prior assumptions?
 * 1 = verdict holds across all priors, 0 = verdict depends on priors.
 */
function computePriorIndependence(hypotheses: Hypothesis[], evidence: EvidenceItem[]): number {
  const official = hypotheses.find(h => h.isOfficial);
  if (!official) return 0;

  const results = priorSensitivity(hypotheses, evidence, [0.1, 0.2, 0.3, 0.5, 0.7, 0.8, 0.9]);
  if (results.length === 0) return 0;

  const posteriors = results.map(r => r.posterior);

  // Check: does the direction (official wins or loses) stay consistent?
  const winsCount = posteriors.filter(p => p >= 0.5).length;
  const allSameDirection = winsCount === 0 || winsCount === posteriors.length;

  // Also measure spread (small spread = independent of prior)
  const range = Math.max(...posteriors) - Math.min(...posteriors);

  if (allSameDirection && range < 0.3) return 1;
  if (allSameDirection) return 0.7;
  // Verdict flips depending on prior — low independence
  return Math.max(0, 0.3 - range);
}

function identifyRiskFactors(c: FragilityComponents): string[] {
  const factors: string[] = [];

  if (c.suppressionDensity > 0.3) factors.push('High rate of evidence suppression in the record');
  if (c.benefitConflict > 0.5) factors.push('Key claimants directly benefit from their own claims');
  if (c.sourceConcentration > 0.6) factors.push('Evidence sourcing is highly concentrated (few independent sources)');
  if (c.classificationRate > 0.5) factors.push('Majority of evidence was classified at time of events');
  if (c.dissenterSuppression > 0.3) factors.push('Dissenting evidence or sources were actively suppressed');
  if (c.evidenceActionDensity > 0.3) factors.push('Causal chain includes active evidence manipulation');
  if (c.powerChangePressure > 0.5) factors.push('Power changes drove evidence actions (political pressure on record)');
  if (c.contradictionLoad > 0.3) factors.push('High density of contradictions in the knowledge graph');
  if (c.reliabilityVariance > 0.5) factors.push('Wide variance in source reliability — some sources much less trusted');

  return factors;
}

function interpretScore(structural: number, certainty: number): string {
  if (structural >= 0.5 && certainty < 0.5) {
    return 'High structural fragility with low evidential certainty — this narrative has manipulation hallmarks and the evidence is contested. Strong candidate for future revision.';
  }
  if (structural >= 0.5 && certainty >= 0.5) {
    return 'High structural fragility but the evidence has largely resolved the question. Manipulation hallmarks are present but the truth has emerged.';
  }
  if (structural < 0.3 && certainty >= 0.5) {
    return 'Robust narrative with strong evidential support. Low manipulation hallmarks and strong consensus across independent sources.';
  }
  if (structural < 0.3 && certainty < 0.5) {
    return 'Low manipulation hallmarks but the evidence is inconclusive. The narrative may be honest but the question is genuinely uncertain.';
  }
  if (structural >= 0.3) {
    return 'Moderate structural fragility — some manipulation hallmarks present. Further evidence could shift the picture.';
  }
  return 'Low structural fragility. The narrative appears well-supported.';
}

/**
 * Compute effective reliability of evidence as of a given date.
 *
 * Classified evidence that hasn't been declassified yet is effectively
 * inaccessible — an observer at that time couldn't use it. Its effective
 * reliability drops to near zero. This is how we eliminate hindsight bias:
 * the Bayesian engine uses reliability-weighted likelihoods, so inaccessible
 * evidence has almost no impact on the verdict.
 */
function temporalReliability(e: EvidenceItem, asOfDate: string): number {
  if (!e.wasClassified) return e.sourceReliability;

  // Classified — check if declassified by asOfDate
  if (e.declassifiedDate && e.declassifiedDate <= asOfDate) {
    // Declassified by this date — use full reliability
    return e.sourceReliability;
  }

  // Still classified at this date — effectively inaccessible
  // Not zero (rumors leak, insiders know) but very low
  return 0.05;
}

/**
 * Compute fragility at an arbitrary point in time.
 *
 * Filters evidence by date AND applies temporal reliability:
 * classified evidence not yet declassified gets near-zero reliability.
 */
export function fragilityAtDate(caseStudy: CaseStudy, asOfDate: string): FragilityScore | null {
  const evidence = caseStudy.evidence
    .filter(e => e.date <= asOfDate)
    .map(e => ({
      ...e,
      sourceReliability: temporalReliability(e, asOfDate),
    }));
  if (evidence.length === 0) return null;

  const nodes = caseStudy.nodes.filter(n => {
    if (n.type === 'actor' || n.type === 'source') return true;
    return n.date <= asOfDate;
  });
  const nodeIds = new Set(nodes.map(n => n.id));

  const edges = caseStudy.edges.filter(e => {
    if (e.date && e.date > asOfDate) return false;
    return nodeIds.has(e.source) && nodeIds.has(e.target);
  });

  const causalFactors = caseStudy.causalFactors.filter(cf => cf.date <= asOfDate);
  const cfIds = new Set(causalFactors.map(cf => cf.id));
  const causalLinks = caseStudy.causalLinks.filter(
    cl => cfIds.has(cl.from) && cfIds.has(cl.to)
  );

  return narrativeFragilityScore({
    ...caseStudy,
    evidence,
    nodes,
    edges,
    causalFactors,
    causalLinks,
    timeSlices: caseStudy.timeSlices.filter(ts => ts.date <= asOfDate),
  });
}

/**
 * Compute the "peak suppression" date — when the official narrative was
 * strongest and the most evidence was still hidden.
 *
 * This is the earliest declassification date minus 1 day. At this point,
 * ALL classified evidence is still inaccessible to outside observers.
 */
export function peakSuppressionDate(caseStudy: CaseStudy): string | null {
  const declassDates = caseStudy.evidence
    .filter(e => e.wasClassified && e.declassifiedDate)
    .map(e => e.declassifiedDate as string)
    .sort();

  if (declassDates.length === 0) return null;

  // One day before the first leak
  const earliest = declassDates[0];
  const d = new Date(earliest);
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

/**
 * Pre-revelation analysis: what the framework would have shown during
 * active suppression, using only publicly available evidence and
 * temporal reliability (classified = inaccessible).
 *
 * Uses the "peak suppression" date — just before the first evidence leak.
 */
export function preRevelationFragility(caseStudy: CaseStudy): FragilityScore | null {
  // Use peak suppression date for the analysis
  const peakDate = peakSuppressionDate(caseStudy);
  if (!peakDate) {
    // No classified evidence — use revelation date as fallback
    if (!caseStudy.revelationDate) return null;
    return fragilityAtDate(caseStudy, caseStudy.revelationDate);
  }

  return fragilityAtDate(caseStudy, peakDate);
}

/**
 * Get the date used for pre-revelation analysis (for display).
 */
export function getAnalysisDate(caseStudy: CaseStudy): string | null {
  return peakSuppressionDate(caseStudy) ?? caseStudy.revelationDate ?? null;
}

export interface ValidationResult {
  caseId: string;
  title: string;
  status: string;
  postRevelation: FragilityScore;
  preRevelation: FragilityScore | null;
  analysisDate: string | null; // The "peak suppression" date used for pre-analysis
  structuralDelta: number | null;
  certaintyDelta: number | null;
  preRevelationDetected: boolean | null;
}

/**
 * Run the full validation experiment across all case studies.
 */
export function runValidation(cases: CaseStudy[]): ValidationResult[] {
  return cases.map(cs => {
    const post = narrativeFragilityScore(cs);
    const pre = preRevelationFragility(cs);
    const threshold = 0.30;

    return {
      caseId: cs.id,
      title: cs.title,
      status: cs.status ?? (cs.wasOverturned ? 'overturned' : 'unknown'),
      postRevelation: post,
      preRevelation: pre,
      analysisDate: getAnalysisDate(cs),
      structuralDelta: pre ? post.structural - pre.structural : null,
      certaintyDelta: pre ? post.evidentialCertainty - pre.evidentialCertainty : null,
      preRevelationDetected: pre ? pre.structural >= threshold : null,
    };
  });
}

// Re-export for convenience
import type { Hypothesis } from '../types/graph';
