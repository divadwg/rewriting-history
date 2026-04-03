import { Hypothesis, EvidenceItem, BayesianVerdict } from '../types/graph';

/**
 * Core Bayesian inference engine.
 * Updates hypothesis probabilities given evidence using Bayes' theorem:
 * P(H|E) = P(E|H) * P(H) / P(E)
 * where P(E) = sum over all hypotheses of P(E|Hi) * P(Hi)
 */

export function updatePosteriors(
  hypotheses: Hypothesis[],
  evidence: EvidenceItem[],
  activeEvidenceIds: Set<string> = new Set(evidence.map(e => e.id))
): Hypothesis[] {
  // Start from priors
  let current = hypotheses.map(h => ({ ...h, posterior: h.prior }));

  // Sequentially apply each active evidence item
  for (const e of evidence) {
    if (!activeEvidenceIds.has(e.id)) continue;
    current = applySingleEvidence(current, e);
  }

  return current;
}

function applySingleEvidence(hypotheses: Hypothesis[], evidence: EvidenceItem): Hypothesis[] {
  const reliability = evidence.sourceReliability;

  // Calculate P(E) = sum of P(E|Hi) * P(Hi)
  // Adjust likelihoods by source reliability
  const adjustedLikelihoods = hypotheses.map(h => {
    const rawLikelihood = evidence.likelihoodRatios[h.id] ?? 0.5;
    // Reliability-weighted: if source is unreliable, likelihood moves toward 0.5 (uninformative)
    return reliability * rawLikelihood + (1 - reliability) * 0.5;
  });

  const pEvidence = hypotheses.reduce((sum, h, i) => {
    return sum + adjustedLikelihoods[i] * h.posterior;
  }, 0);

  if (pEvidence === 0) return hypotheses;

  return hypotheses.map((h, i) => ({
    ...h,
    posterior: (adjustedLikelihoods[i] * h.posterior) / pEvidence,
  }));
}

/**
 * Compute which single evidence item most shifts the posterior.
 * Uses log-odds impact to differentiate at extremes where raw probability
 * differences are negligible (e.g., 0.001% vs 0.003% is a 3x difference).
 */
export function evidenceSensitivity(
  hypotheses: Hypothesis[],
  evidence: EvidenceItem[]
): Array<{ evidenceId: string; label: string; impact: number }> {
  // Compute impact of each evidence item individually (from prior)
  return evidence
    .map(e => {
      const onlyThis = new Set([e.id]);
      const result = updatePosteriors(hypotheses, evidence, onlyThis);
      const officialAfter = result.find(h => h.isOfficial)?.posterior ?? 0.5;
      const officialPrior = hypotheses.find(h => h.isOfficial)?.prior ?? 0.5;

      // Use log-odds shift as impact metric, normalized to 0-1
      const priorOdds = officialPrior / (1 - officialPrior + 1e-10);
      const postOdds = officialAfter / (1 - officialAfter + 1e-10);
      const logOddsShift = Math.abs(Math.log(postOdds / (priorOdds + 1e-10) + 1e-10));
      // Normalize: a shift of ~3 log-odds is very strong
      const normalized = Math.min(logOddsShift / 4, 1);

      return {
        evidenceId: e.id,
        label: e.label,
        impact: normalized,
      };
    })
    .sort((a, b) => b.impact - a.impact);
}

/**
 * Prior sensitivity analysis.
 * Tests how robust the conclusion is across a range of priors.
 */
export function priorSensitivity(
  hypotheses: Hypothesis[],
  evidence: EvidenceItem[],
  officialPriorRange: number[] = [0.1, 0.3, 0.5, 0.7, 0.9]
): Array<{ prior: number; posterior: number }> {
  const official = hypotheses.find(h => h.isOfficial);
  if (!official) return [];

  return officialPriorRange.map(prior => {
    const remaining = 1 - prior;
    const nonOfficial = hypotheses.filter(h => !h.isOfficial);
    const share = remaining / Math.max(nonOfficial.length, 1);

    const adjusted = hypotheses.map(h => ({
      ...h,
      prior: h.isOfficial ? prior : share,
      posterior: h.isOfficial ? prior : share,
    }));

    const result = updatePosteriors(adjusted, evidence);
    const officialPosterior = result.find(h => h.isOfficial)?.posterior ?? 0;

    return { prior, posterior: officialPosterior };
  });
}

/**
 * Generate a Bayesian verdict for a case study.
 */
export function generateVerdict(
  hypotheses: Hypothesis[],
  evidence: EvidenceItem[]
): BayesianVerdict {
  const updated = updatePosteriors(hypotheses, evidence);
  // If no hypothesis is marked isOfficial, treat the first one as official
  const official = updated.find(h => h.isOfficial) ?? updated[0];
  if (!official) {
    return {
      officialHypothesis: { id: 'none', caseStudyId: '', label: 'No hypotheses', description: '', prior: 0, posterior: 0, isOfficial: true },
      alternativeHypotheses: [],
      officialPosterior: 0,
      bestAlternativePosterior: 0,
      criticalEvidence: [],
      verdict: 'official_questionable' as const,
    };
  }
  const alternatives = updated.filter(h => h.id !== official.id);
  const bestAlt = alternatives.length > 0
    ? alternatives.reduce((best, h) => (h.posterior > best.posterior ? h : best), alternatives[0])
    : null;

  const sensitivity = evidenceSensitivity(hypotheses, evidence);
  const criticalEvidence = sensitivity.slice(0, 3).map(s => s.evidenceId);

  let verdict: BayesianVerdict['verdict'];
  if (official.posterior >= 0.7) verdict = 'official_supported';
  else if (official.posterior >= 0.4) verdict = 'official_questionable';
  else if (official.posterior >= 0.2) verdict = 'official_unlikely';
  else verdict = 'official_refuted';

  return {
    officialHypothesis: official,
    alternativeHypotheses: alternatives,
    officialPosterior: official.posterior,
    bestAlternativePosterior: bestAlt?.posterior ?? 0,
    criticalEvidence,
    verdict,
  };
}
