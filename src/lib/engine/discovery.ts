import {
  CaseStudy,
  DiscoveryResult,
  Inconsistency,
  NarrativeShift,
} from '../types/graph';
import { KnowledgeGraph } from './knowledge-graph';
import { generateVerdict, updatePosteriors } from './bayesian';

/**
 * Discovery engine: orchestrates graph analysis, Bayesian inference,
 * and inconsistency detection to surface where official history
 * diverges from evidence.
 */
export function runDiscovery(caseStudy: CaseStudy): DiscoveryResult {
  const graph = new KnowledgeGraph(caseStudy.nodes, caseStudy.edges);

  const inconsistencies = [
    ...findContradictions(graph),
    ...findSourceClustering(graph),
    ...findEvidenceSuppression(caseStudy),
    ...findTemporalIssues(graph),
  ].sort((a, b) => b.severity - a.severity);

  const bayesianVerdict = generateVerdict(caseStudy.hypotheses, caseStudy.evidence);
  const narrativeShifts = detectNarrativeShifts(caseStudy);

  return {
    caseStudyId: caseStudy.id,
    inconsistencies,
    bayesianVerdict,
    narrativeShifts,
  };
}

function findContradictions(graph: KnowledgeGraph): Inconsistency[] {
  return graph.findContradictions().map(({ edge, nodeA, nodeB }) => ({
    type: 'contradiction' as const,
    severity: edge.weight,
    description: `"${nodeA.label}" directly contradicts "${nodeB.label}"`,
    involvedNodeIds: [nodeA.id, nodeB.id],
    involvedEdgeIds: [edge.id],
  }));
}

function findSourceClustering(graph: KnowledgeGraph): Inconsistency[] {
  return graph.findSourceClusters().map(({ claim, sources, concentration }) => ({
    type: 'source_clustering' as const,
    severity: concentration,
    description: `Claim "${claim.label}" traces back to ${sources.length === 1 ? 'a single source' : 'a narrow cluster of sources'}: ${sources.map(s => s.label).join(', ')}`,
    involvedNodeIds: [claim.id, ...sources.map(s => s.id)],
    involvedEdgeIds: [],
  }));
}

function findEvidenceSuppression(caseStudy: CaseStudy): Inconsistency[] {
  const classifiedEvidence = caseStudy.evidence.filter(e => e.wasClassified);
  if (classifiedEvidence.length === 0) return [];

  // Check if including classified evidence flips the conclusion
  const withoutClassified = new Set(
    caseStudy.evidence.filter(e => !e.wasClassified).map(e => e.id)
  );
  const allEvidence = new Set(caseStudy.evidence.map(e => e.id));

  const withoutResult = updatePosteriors(caseStudy.hypotheses, caseStudy.evidence, withoutClassified);
  const withResult = updatePosteriors(caseStudy.hypotheses, caseStudy.evidence, allEvidence);

  const officialWithout = withoutResult.find(h => h.isOfficial)?.posterior ?? 0.5;
  const officialWith = withResult.find(h => h.isOfficial)?.posterior ?? 0.5;

  const shift = officialWithout - officialWith;

  if (shift > 0.15) {
    return [{
      type: 'evidence_suppression' as const,
      severity: Math.min(shift * 2, 1),
      description: `${classifiedEvidence.length} classified/suppressed evidence items shift the official narrative probability by ${(shift * 100).toFixed(0)}% when included. The official version was more sustainable while this evidence was hidden.`,
      involvedNodeIds: [],
      involvedEdgeIds: [],
    }];
  }

  return [];
}

function findTemporalIssues(graph: KnowledgeGraph): Inconsistency[] {
  const issues: Inconsistency[] = [];
  const claims = graph.getNodesByType('claim');

  for (const claim of claims) {
    const incoming = graph.getIncomingEdges(claim.id);
    const citesEdges = incoming.filter(e => e.type === 'cites');

    for (const cite of citesEdges) {
      const source = graph.getNode(cite.source);
      if (!source) continue;

      const claimDate = new Date(claim.date).getTime();
      const sourceDate = new Date(source.date).getTime();

      // Evidence that appears suspiciously after the claim it supports
      if (sourceDate > claimDate && source.type === 'evidence') {
        issues.push({
          type: 'temporal_impossibility',
          severity: 0.7,
          description: `Evidence "${source.label}" (${source.date}) appeared after the claim "${claim.label}" (${claim.date}) it supposedly supports`,
          involvedNodeIds: [claim.id, source.id],
          involvedEdgeIds: [cite.id],
        });
      }
    }
  }

  return issues;
}

function detectNarrativeShifts(caseStudy: CaseStudy): NarrativeShift[] {
  if (!caseStudy.timeSlices || caseStudy.timeSlices.length < 2) return [];

  const shifts: NarrativeShift[] = [];

  for (let i = 1; i < caseStudy.timeSlices.length; i++) {
    const prev = caseStudy.timeSlices[i - 1];
    const curr = caseStudy.timeSlices[i];

    const addedNodes = curr.activeNodeIds.filter(id => !prev.activeNodeIds.includes(id));
    const removedNodes = prev.activeNodeIds.filter(id => !curr.activeNodeIds.includes(id));

    if (addedNodes.length > 0 || removedNodes.length > 0) {
      shifts.push({
        fromDate: prev.date,
        toDate: curr.date,
        description: curr.narrativeShift ?? `Narrative evolved: ${addedNodes.length} claims added, ${removedNodes.length} dropped`,
        claimsBefore: prev.activeNodeIds,
        claimsAfter: curr.activeNodeIds,
        trigger: curr.label,
      });
    }
  }

  return shifts;
}
