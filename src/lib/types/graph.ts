export type NodeType = 'claim' | 'source' | 'actor' | 'event' | 'evidence' | 'narrative';

export type EdgeType =
  | 'claims'
  | 'cites'
  | 'contradicts'
  | 'derived_from'
  | 'suppresses'
  | 'fabricates'
  | 'benefits'
  | 'precedes'
  | 'causes';

export interface GraphNode {
  id: string;
  type: NodeType;
  label: string;
  description: string;
  date: string;
  confidence: number;
  metadata: Record<string, unknown>;
  caseStudyId: string;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: EdgeType;
  weight: number;
  date?: string;
  metadata: Record<string, unknown>;
}

export interface Hypothesis {
  id: string;
  caseStudyId: string;
  label: string;
  description: string;
  prior: number;
  posterior: number;
  isOfficial: boolean;
}

export interface EvidenceItem {
  id: string;
  label: string;
  description: string;
  date: string;
  likelihoodRatios: Record<string, number>;
  sourceReliability: number;
  wasClassified: boolean;
  declassifiedDate?: string;
}

export interface CausalFactor {
  id: string;
  type: 'power_change' | 'narrative_change' | 'evidence_action' | 'institutional';
  label: string;
  date: string;
}

export interface CausalLink {
  from: string;
  to: string;
  mechanism: string;
  strength: number;
  timelag?: string;
}

export interface CaseStudy {
  id: string;
  title: string;
  period: string;
  summary: string;
  hypotheses: Hypothesis[];
  evidence: EvidenceItem[];
  nodes: GraphNode[];
  edges: GraphEdge[];
  causalFactors: CausalFactor[];
  causalLinks: CausalLink[];
  timeSlices: TimeSlice[];
}

export interface TimeSlice {
  date: string;
  label: string;
  description: string;
  activeNodeIds: string[];
  activeEdgeIds: string[];
  narrativeShift?: string;
}

export interface DiscoveryResult {
  caseStudyId: string;
  inconsistencies: Inconsistency[];
  bayesianVerdict: BayesianVerdict;
  narrativeShifts: NarrativeShift[];
}

export interface Inconsistency {
  type: 'contradiction' | 'temporal_impossibility' | 'source_clustering' | 'evidence_suppression';
  severity: number;
  description: string;
  involvedNodeIds: string[];
  involvedEdgeIds: string[];
}

export interface BayesianVerdict {
  officialHypothesis: Hypothesis;
  alternativeHypotheses: Hypothesis[];
  officialPosterior: number;
  bestAlternativePosterior: number;
  criticalEvidence: string[];
  verdict: 'official_supported' | 'official_questionable' | 'official_unlikely' | 'official_refuted';
}

export interface NarrativeShift {
  fromDate: string;
  toDate: string;
  description: string;
  claimsBefore: string[];
  claimsAfter: string[];
  trigger?: string;
}
