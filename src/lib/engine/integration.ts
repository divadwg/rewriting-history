import { CaseStudy, EvidenceItem, GraphEdge, GraphNode, Hypothesis, BayesianVerdict } from '../types/graph';
import { updatePosteriors, generateVerdict } from './bayesian';

/**
 * Integration layer that wires the knowledge graph, causal model, and Bayesian
 * inference engine together. Each system informs the others:
 *
 * 1. Graph edges → Bayesian: edge types adjust evidence reliability and likelihood ratios
 * 2. Causal factors → Bayesian: evidence_action factors adjust evidence weight
 * 3. Bayesian posteriors → Graph: claim node confidence updated from posteriors
 */

export interface IntegrationAdjustment {
  evidenceId: string;
  originalReliability: number;
  adjustedReliability: number;
  reasons: string[];
}

export interface IntegratedResult {
  adjustedEvidence: EvidenceItem[];
  adjustments: IntegrationAdjustment[];
  hypotheses: Hypothesis[];
  verdict: BayesianVerdict;
  updatedNodes: GraphNode[];
}

/**
 * Run full integrated analysis: graph → bayesian → graph feedback loop.
 */
export function integratedAnalysis(caseStudy: CaseStudy): IntegratedResult {
  const { adjustedEvidence, adjustments } = applyGraphAdjustments(caseStudy);
  const withCausal = applyCausalAdjustments(caseStudy, adjustedEvidence, adjustments);

  const hypotheses = updatePosteriors(caseStudy.hypotheses, withCausal.adjustedEvidence);
  const verdict = generateVerdict(caseStudy.hypotheses, withCausal.adjustedEvidence);

  const updatedNodes = feedbackToGraph(caseStudy, hypotheses);

  return {
    adjustedEvidence: withCausal.adjustedEvidence,
    adjustments: withCausal.adjustments,
    hypotheses,
    verdict,
    updatedNodes,
  };
}

/**
 * Step 1: Graph edges modify evidence reliability.
 *
 * - `suppresses`: If an actor suppresses evidence, that actor's own claims become
 *   less reliable (why suppress if you're telling the truth?)
 * - `fabricates`: Evidence from a fabricating source gets very low reliability
 * - `benefits`: Evidence from actors who benefit from a claim is discounted (self-serving)
 * - `contradicts`: When claims contradict each other, evidence supporting the
 *   lower-confidence claim gets a reliability penalty
 */
function applyGraphAdjustments(
  caseStudy: CaseStudy
): { adjustedEvidence: EvidenceItem[]; adjustments: IntegrationAdjustment[] } {
  const { evidence, nodes, edges } = caseStudy;
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const adjustments: IntegrationAdjustment[] = [];

  // Build a map of which actors suppress/fabricate and which actors benefit
  const suppressors = new Set<string>();
  const fabricators = new Set<string>();
  const beneficiaries = new Map<string, string[]>(); // actor → benefiting event/claim IDs

  for (const edge of edges) {
    if (edge.type === 'suppresses') {
      suppressors.add(edge.source);
    }
    if (edge.type === 'fabricates') {
      fabricators.add(edge.source);
    }
    if (edge.type === 'benefits') {
      if (!beneficiaries.has(edge.source)) beneficiaries.set(edge.source, []);
      beneficiaries.get(edge.source)!.push(edge.target);
    }
  }

  const adjustedEvidence = evidence.map(e => {
    const linkedNodes = (e.linkedNodeIds ?? []).map(id => nodeMap.get(id)).filter(Boolean) as GraphNode[];
    const linkedActors = linkedNodes.filter(n => n.type === 'actor');
    const linkedSources = linkedNodes.filter(n => n.type === 'source');

    let reliability = e.sourceReliability;
    const reasons: string[] = [];

    // Check if any linked actor is a suppressor
    for (const actor of linkedActors) {
      if (suppressors.has(actor.id)) {
        const penalty = 0.15;
        reliability = Math.max(0.05, reliability - penalty);
        reasons.push(`${actor.label} suppresses contradicting evidence (-${(penalty * 100).toFixed(0)}%)`);
      }
    }

    // Check if any linked source is involved in fabrication
    for (const source of linkedSources) {
      if (fabricators.has(source.id)) {
        reliability = Math.max(0.05, reliability * 0.2);
        reasons.push(`${source.label} linked to fabrication (reliability ×0.2)`);
      }
    }

    // Check if linked actor benefits from a claim this evidence supports
    for (const actor of linkedActors) {
      const benefitTargets = beneficiaries.get(actor.id);
      if (benefitTargets && benefitTargets.length > 0) {
        // Check if this evidence's linked nodes overlap with what the actor benefits from
        const evidenceNodeIds = new Set(e.linkedNodeIds ?? []);
        const selfServing = benefitTargets.some(t => {
          // Check if any claim/event the actor benefits from is related to this evidence
          return edgesConnecting(edges, t, [...evidenceNodeIds]).length > 0;
        });
        if (selfServing) {
          const penalty = 0.1;
          reliability = Math.max(0.05, reliability - penalty);
          reasons.push(`${actor.label} benefits from related claims — self-serving discount (-${(penalty * 100).toFixed(0)}%)`);
        }
      }
    }

    // Check contradiction edges: if evidence supports a claim that contradicts a higher-confidence claim
    for (const node of linkedNodes) {
      if (node.type === 'claim') {
        const contradictions = edges.filter(
          edge => edge.type === 'contradicts' &&
            (edge.source === node.id || edge.target === node.id)
        );
        for (const c of contradictions) {
          const otherId = c.source === node.id ? c.target : c.source;
          const otherNode = nodeMap.get(otherId);
          if (otherNode && otherNode.type === 'claim' && otherNode.confidence > node.confidence) {
            const gap = otherNode.confidence - node.confidence;
            const penalty = gap * 0.1 * c.weight;
            reliability = Math.max(0.05, reliability - penalty);
            reasons.push(`Supports "${node.label}" which contradicts higher-confidence "${otherNode.label}" (-${(penalty * 100).toFixed(1)}%)`);
          }
        }
      }
    }

    if (reasons.length > 0) {
      adjustments.push({
        evidenceId: e.id,
        originalReliability: e.sourceReliability,
        adjustedReliability: reliability,
        reasons,
      });
    }

    return { ...e, sourceReliability: reliability };
  });

  return { adjustedEvidence, adjustments };
}

/**
 * Step 2: Causal factors modify evidence weight.
 *
 * - `evidence_action` factors (classification/declassification) adjust the
 *   reliability of evidence that was classified during the same period
 * - If evidence was classified and a causal factor describes suppression of
 *   contradicting evidence, that classification is suspicious → lower reliability
 *   for evidence that supported the official story during that period
 */
function applyCausalAdjustments(
  caseStudy: CaseStudy,
  evidence: EvidenceItem[],
  existingAdjustments: IntegrationAdjustment[]
): { adjustedEvidence: EvidenceItem[]; adjustments: IntegrationAdjustment[] } {
  const { causalFactors } = caseStudy;
  const adjustments = [...existingAdjustments];

  const evidenceActions = causalFactors.filter(cf => cf.type === 'evidence_action');

  const adjustedEvidence = evidence.map(e => {
    let reliability = e.sourceReliability;
    const reasons: string[] = [];

    for (const cf of evidenceActions) {
      // If this factor describes classification/suppression of evidence
      const isAboutSuppression = cf.label.toLowerCase().includes('classif') ||
        cf.label.toLowerCase().includes('suppress') ||
        cf.label.toLowerCase().includes('buried');

      if (isAboutSuppression && e.wasClassified) {
        // Evidence that was classified during active suppression is suspicious
        // if it supported the official narrative
        const official = caseStudy.hypotheses.find(h => h.isOfficial);
        if (official && e.likelihoodRatios[official.id] > 0.5) {
          // This classified evidence supported the official story — that's suspicious
          const penalty = 0.08;
          reliability = Math.max(0.05, reliability - penalty);
          reasons.push(`Classified during "${cf.label}" while supporting official narrative (-${(penalty * 100).toFixed(0)}%)`);
        }
      }

      // Declassification events boost reliability of previously suppressed evidence
      const isAboutDeclassification = cf.label.toLowerCase().includes('declassif') ||
        cf.label.toLowerCase().includes('debunk') ||
        cf.label.toLowerCase().includes('confirm');

      if (isAboutDeclassification && e.wasClassified && e.declassifiedDate) {
        const official = caseStudy.hypotheses.find(h => h.isOfficial);
        if (official && e.likelihoodRatios[official.id] < 0.5) {
          // Declassified evidence that contradicts the official story gets a small boost
          const boost = 0.03;
          reliability = Math.min(1.0, reliability + boost);
          reasons.push(`Validated by declassification: "${cf.label}" (+${(boost * 100).toFixed(0)}%)`);
        }
      }
    }

    if (reasons.length > 0) {
      const existing = adjustments.find(a => a.evidenceId === e.id);
      if (existing) {
        existing.adjustedReliability = reliability;
        existing.reasons.push(...reasons);
      } else {
        adjustments.push({
          evidenceId: e.id,
          originalReliability: e.sourceReliability,
          adjustedReliability: reliability,
          reasons,
        });
      }
    }

    return { ...e, sourceReliability: reliability };
  });

  return { adjustedEvidence, adjustments };
}

/**
 * Step 3: Bayesian posteriors feed back to update graph node confidence.
 *
 * Claim nodes that align with the winning hypothesis get their confidence
 * adjusted toward the posterior. Claim nodes that align with losing
 * hypotheses get confidence reduced.
 */
function feedbackToGraph(caseStudy: CaseStudy, posteriors: Hypothesis[]): GraphNode[] {
  const hypothesisMap = new Map(posteriors.map(h => [h.id, h]));

  return caseStudy.nodes.map(node => {
    if (node.type !== 'claim') return node;

    // Find which hypothesis this claim most aligns with based on evidence
    // A claim node is "aligned" with a hypothesis if evidence linked to this
    // claim tends to support that hypothesis
    const linkedEvidence = caseStudy.evidence.filter(
      e => e.linkedNodeIds?.includes(node.id)
    );

    if (linkedEvidence.length === 0) return node;

    // Compute average support for each hypothesis from linked evidence
    let bestHypothesisId: string | null = null;
    let bestAvgLikelihood = 0;

    for (const h of posteriors) {
      const avgLikelihood = linkedEvidence.reduce(
        (sum, e) => sum + (e.likelihoodRatios[h.id] ?? 0.5),
        0
      ) / linkedEvidence.length;

      if (avgLikelihood > bestAvgLikelihood) {
        bestAvgLikelihood = avgLikelihood;
        bestHypothesisId = h.id;
      }
    }

    if (!bestHypothesisId) return node;

    const alignedHypothesis = hypothesisMap.get(bestHypothesisId);
    if (!alignedHypothesis) return node;

    // Blend node confidence toward aligned hypothesis posterior
    // Use a conservative blend: 70% original, 30% posterior-derived
    const posteriorDerived = alignedHypothesis.posterior;
    const blended = node.confidence * 0.7 + posteriorDerived * 0.3;

    return { ...node, confidence: Math.round(blended * 100) / 100 };
  });
}

/**
 * Helper: find edges connecting two sets of node IDs.
 */
function edgesConnecting(edges: GraphEdge[], nodeId: string, otherIds: string[]): GraphEdge[] {
  const others = new Set(otherIds);
  return edges.filter(
    e => (e.source === nodeId && others.has(e.target)) ||
      (e.target === nodeId && others.has(e.source))
  );
}
