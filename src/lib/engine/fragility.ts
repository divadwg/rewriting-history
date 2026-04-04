import { CaseStudy, EvidenceItem, GraphEdge } from '../types/graph';
import { updatePosteriors, evidenceSensitivity, priorSensitivity } from './bayesian';

/**
 * Narrative Fragility Score
 *
 * A composite 0-1 score measuring how structurally vulnerable an official
 * narrative is to revision. Based on graph topology, evidence properties,
 * causal chain patterns, and Bayesian sensitivity analysis.
 *
 * The hypothesis: cases that were later overturned should score high on
 * fragility even when analyzed using only pre-overturning evidence.
 * If validated across diverse cases, this becomes a predictive tool.
 */

export interface FragilityScore {
  overall: number; // 0-1 composite
  components: FragilityComponents;
  interpretation: string;
  riskFactors: string[];
}

export interface FragilityComponents {
  // Graph topology signals (0-1 each)
  suppressionDensity: number;     // Ratio of suppresses/fabricates edges to total edges
  benefitConflict: number;        // How much claimants benefit from what they claim
  sourceConcentration: number;    // How clustered the evidence sourcing is (few sources = fragile)
  contradictionLoad: number;      // Density of contradicts edges relative to graph size

  // Evidence ecosystem signals (0-1 each)
  classificationRate: number;     // What fraction of evidence was classified
  reliabilityVariance: number;    // High variance = some sources much less trusted
  singlePointFailure: number;     // How much the verdict depends on one piece of evidence
  dissenterSuppression: number;   // Evidence of dissenting views being suppressed

  // Causal pattern signals (0-1 each)
  evidenceActionDensity: number;  // Ratio of evidence_action causal factors
  narrativeChangeRate: number;    // How many narrative_change factors exist
  powerChangePressure: number;    // Power changes that precede evidence actions

  // Bayesian sensitivity signals (0-1 each)
  priorSensitivity: number;       // How much the verdict changes across prior assumptions
  evidenceFragility: number;      // Would removing 1 evidence item flip the verdict?
  verdictMargin: number;          // How close is official posterior to tipping point
}

/**
 * Compute the narrative fragility score for a case study.
 */
export function narrativeFragilityScore(caseStudy: CaseStudy): FragilityScore {
  const components = computeComponents(caseStudy);
  const overall = weightedComposite(components);
  const riskFactors = identifyRiskFactors(components);
  const interpretation = interpretScore(overall);

  return { overall, components, interpretation, riskFactors };
}

function computeComponents(cs: CaseStudy): FragilityComponents {
  const { edges, nodes, evidence, hypotheses, causalFactors, causalLinks } = cs;

  // ── Graph topology ──────────────────────────────────────────────

  const suppressionEdges = edges.filter(e => e.type === 'suppresses' || e.type === 'fabricates');
  const suppressionDensity = edges.length > 0
    ? Math.min(suppressionEdges.length / edges.length * 5, 1) // scaled: even 20% suppression edges is extreme
    : 0;

  const benefitEdges = edges.filter(e => e.type === 'benefits');
  const claimsEdges = edges.filter(e => e.type === 'claims');
  // How many actors both claim something AND benefit from it?
  const claimants = new Set(claimsEdges.map(e => e.source));
  const benefitActors = new Set(benefitEdges.map(e => e.source));
  const conflicted = [...claimants].filter(a => benefitActors.has(a));
  const benefitConflict = claimants.size > 0
    ? conflicted.length / claimants.size
    : 0;

  // Source concentration: how many distinct actors/sources provide evidence
  const evidenceSources = new Set<string>();
  for (const e of evidence) {
    for (const nodeId of e.linkedNodeIds ?? []) {
      const node = nodes.find(n => n.id === nodeId);
      if (node && (node.type === 'actor' || node.type === 'source')) {
        evidenceSources.add(nodeId);
      }
    }
  }
  // Fewer distinct sources relative to evidence count = higher concentration
  const sourceConcentration = evidence.length > 0
    ? Math.max(0, 1 - (evidenceSources.size / evidence.length))
    : 0;

  const contradictEdges = edges.filter(e => e.type === 'contradicts');
  const contradictionLoad = nodes.length > 0
    ? Math.min(contradictEdges.length / nodes.length, 1)
    : 0;

  // ── Evidence ecosystem ──────────────────────────────────────────

  const classifiedCount = evidence.filter(e => e.wasClassified).length;
  const classificationRate = evidence.length > 0 ? classifiedCount / evidence.length : 0;

  const reliabilities = evidence.map(e => e.sourceReliability);
  const meanReliability = reliabilities.reduce((s, r) => s + r, 0) / Math.max(reliabilities.length, 1);
  const variance = reliabilities.reduce((s, r) => s + (r - meanReliability) ** 2, 0) / Math.max(reliabilities.length, 1);
  const reliabilityVariance = Math.min(Math.sqrt(variance) * 3, 1); // normalized

  // Single point of failure: does removing any one evidence item flip the verdict?
  const singlePointFailure = computeSinglePointFailure(hypotheses, evidence);

  // Dissenter suppression: are there suppresses edges targeting evidence or source nodes?
  const suppressedTargets = suppressionEdges.map(e => e.target);
  const evidenceNodeIds = new Set(nodes.filter(n => n.type === 'evidence' || n.type === 'source').map(n => n.id));
  const suppressedEvidence = suppressedTargets.filter(t => evidenceNodeIds.has(t));
  const dissenterSuppression = evidenceNodeIds.size > 0
    ? Math.min(suppressedEvidence.length / evidenceNodeIds.size * 3, 1)
    : 0;

  // ── Causal patterns ─────────────────────────────────────────────

  const evidenceActions = causalFactors.filter(cf => cf.type === 'evidence_action');
  const evidenceActionDensity = causalFactors.length > 0
    ? evidenceActions.length / causalFactors.length
    : 0;

  const narrativeChanges = causalFactors.filter(cf => cf.type === 'narrative_change');
  const narrativeChangeRate = causalFactors.length > 0
    ? Math.min(narrativeChanges.length / causalFactors.length * 2, 1)
    : 0;

  // Do power changes precede or link to evidence actions?
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

  // ── Bayesian sensitivity ────────────────────────────────────────

  const priorSens = computePriorSensitivity(hypotheses, evidence);
  const evidenceFragility = singlePointFailure; // reuse — it's the same concept
  const verdictMargin = computeVerdictMargin(hypotheses, evidence);

  return {
    suppressionDensity,
    benefitConflict,
    sourceConcentration,
    contradictionLoad,
    classificationRate,
    reliabilityVariance,
    singlePointFailure,
    dissenterSuppression,
    evidenceActionDensity,
    narrativeChangeRate,
    powerChangePressure,
    priorSensitivity: priorSens,
    evidenceFragility,
    verdictMargin,
  };
}

/**
 * Does removing any single evidence item flip the verdict?
 * Returns 0-1: 0 = robust, 1 = verdict flips when one item removed.
 */
function computeSinglePointFailure(hypotheses: Hypothesis[], evidence: EvidenceItem[]): number {
  if (evidence.length === 0 || hypotheses.length === 0) return 0;

  const fullResult = updatePosteriors(hypotheses, evidence);
  const official = fullResult.find(h => h.isOfficial) ?? fullResult[0];
  if (!official) return 0;

  const fullOfficialWins = official.posterior >= Math.max(...fullResult.filter(h => h.id !== official.id).map(h => h.posterior), 0);

  let maxImpact = 0;
  for (const e of evidence) {
    const without = new Set(evidence.filter(ev => ev.id !== e.id).map(ev => ev.id));
    const result = updatePosteriors(hypotheses, evidence, without);
    const officialAfter = result.find(h => h.id === official.id)?.posterior ?? 0;
    const bestAltAfter = Math.max(...result.filter(h => h.id !== official.id).map(h => h.posterior), 0);

    const wouldFlip = fullOfficialWins && officialAfter < bestAltAfter;
    if (wouldFlip) return 1;

    // Even if it doesn't flip, measure how close it gets
    const margin = officialAfter - bestAltAfter;
    const fullMargin = official.posterior - Math.max(...fullResult.filter(h => h.id !== official.id).map(h => h.posterior), 0);
    if (fullMargin > 0) {
      const impactRatio = 1 - (margin / fullMargin);
      maxImpact = Math.max(maxImpact, Math.max(0, impactRatio));
    }
  }

  return Math.min(maxImpact, 1);
}

/**
 * How sensitive is the verdict to prior assumptions?
 * Returns 0-1: 0 = verdict holds across all priors, 1 = verdict flips easily.
 */
function computePriorSensitivity(hypotheses: Hypothesis[], evidence: EvidenceItem[]): number {
  const official = hypotheses.find(h => h.isOfficial);
  if (!official) return 0;

  const results = priorSensitivity(hypotheses, evidence, [0.1, 0.3, 0.5, 0.7, 0.9]);
  if (results.length === 0) return 0;

  // Check if the verdict changes direction across the range
  const posteriors = results.map(r => r.posterior);
  const verdicts = posteriors.map(p => p >= 0.5);
  const flips = verdicts.slice(1).filter((v, i) => v !== verdicts[i]).length;

  // Also measure the spread
  const range = Math.max(...posteriors) - Math.min(...posteriors);

  return Math.min(flips * 0.3 + range * 0.7, 1);
}

/**
 * How close is the official posterior to being overturned?
 * Returns 0-1: 0 = official dominates, 1 = verdict is razor-thin.
 */
function computeVerdictMargin(hypotheses: Hypothesis[], evidence: EvidenceItem[]): number {
  const result = updatePosteriors(hypotheses, evidence);
  const official = result.find(h => h.isOfficial) ?? result[0];
  if (!official) return 0;

  const alternatives = result.filter(h => h.id !== official.id);
  if (alternatives.length === 0) return 0;

  const bestAlt = Math.max(...alternatives.map(h => h.posterior));

  // If official has lower posterior than best alt, it's already overturned → max fragility
  if (official.posterior <= bestAlt) return 1;

  // Margin: how much larger is official vs best alt
  const margin = official.posterior - bestAlt;
  // Invert: small margin = high fragility
  return Math.max(0, 1 - margin);
}

/**
 * Weighted composite of all components.
 * Weights reflect how diagnostic each signal is for narrative manipulation.
 */
function weightedComposite(c: FragilityComponents): number {
  const weights = {
    // Graph topology — strongest signals
    suppressionDensity: 0.12,
    benefitConflict: 0.08,
    sourceConcentration: 0.06,
    contradictionLoad: 0.04,

    // Evidence ecosystem
    classificationRate: 0.08,
    reliabilityVariance: 0.06,
    singlePointFailure: 0.10,
    dissenterSuppression: 0.10,

    // Causal patterns
    evidenceActionDensity: 0.06,
    narrativeChangeRate: 0.04,
    powerChangePressure: 0.06,

    // Bayesian sensitivity
    priorSensitivity: 0.06,
    evidenceFragility: 0.06,
    verdictMargin: 0.08,
  };

  let sum = 0;
  let weightSum = 0;
  for (const [key, weight] of Object.entries(weights)) {
    sum += (c[key as keyof FragilityComponents] ?? 0) * weight;
    weightSum += weight;
  }

  return Math.round((sum / weightSum) * 100) / 100;
}

function identifyRiskFactors(c: FragilityComponents): string[] {
  const factors: string[] = [];

  if (c.suppressionDensity > 0.3) factors.push('High rate of evidence suppression in the record');
  if (c.benefitConflict > 0.5) factors.push('Key claimants directly benefit from their own claims');
  if (c.sourceConcentration > 0.6) factors.push('Evidence sourcing is highly concentrated (few independent sources)');
  if (c.classificationRate > 0.5) factors.push('Majority of evidence was classified at time of events');
  if (c.singlePointFailure > 0.7) factors.push('Verdict depends critically on a single piece of evidence');
  if (c.dissenterSuppression > 0.3) factors.push('Dissenting evidence or sources were actively suppressed');
  if (c.evidenceActionDensity > 0.3) factors.push('Causal chain includes active evidence manipulation');
  if (c.powerChangePressure > 0.5) factors.push('Power changes drove evidence actions (political pressure on record)');
  if (c.priorSensitivity > 0.5) factors.push('Conclusion sensitive to prior assumptions — not robust');
  if (c.verdictMargin < 0.3) factors.push('Verdict margin is thin — close to tipping');
  if (c.contradictionLoad > 0.3) factors.push('High density of contradictions in the knowledge graph');
  if (c.reliabilityVariance > 0.5) factors.push('Wide variance in source reliability — some sources much less trusted');

  return factors;
}

function interpretScore(score: number): string {
  if (score >= 0.7) return 'Highly fragile — structural indicators strongly suggest this narrative is vulnerable to revision. Multiple red flags in sourcing, suppression, and sensitivity.';
  if (score >= 0.5) return 'Moderately fragile — several structural indicators of potential narrative vulnerability. Further evidence could shift the conclusion significantly.';
  if (score >= 0.3) return 'Low fragility — some structural concerns but the narrative is reasonably well-supported by diverse, independent evidence.';
  return 'Robust — the narrative is structurally sound. Evidence is diverse, independently sourced, and the conclusion is stable across assumptions.';
}

// Re-export for convenience
import type { Hypothesis } from '../types/graph';
