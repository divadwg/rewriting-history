'use client';

import { useState, useMemo } from 'react';
import { CaseStudy, GraphNode } from '@/lib/types/graph';
import ForceGraph from '@/components/graph/ForceGraph';
import BayesianDashboard from '@/components/bayesian/BayesianDashboard';
import TimeSlider from '@/components/timeline/TimeSlider';
import { integratedAnalysis } from '@/lib/engine/integration';
import { narrativeFragilityScore } from '@/lib/engine/fragility';

interface Props {
  caseStudy: CaseStudy;
}

export default function CaseStudyClient({ caseStudy }: Props) {
  const [timeIndex, setTimeIndex] = useState(caseStudy.timeSlices.length - 1);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [view, setView] = useState<'full' | 'time-sliced'>('full');

  const currentSlice = caseStudy.timeSlices[timeIndex];

  const integrated = useMemo(() => integratedAnalysis(caseStudy), [caseStudy]);
  const fragility = useMemo(() => narrativeFragilityScore(caseStudy), [caseStudy]);

  const filteredData = useMemo(() => {
    const nodes = integrated.updatedNodes;
    if (view === 'full') {
      return { nodes, edges: caseStudy.edges };
    }
    const activeNodes = new Set(currentSlice.activeNodeIds);
    const activeEdges = new Set(currentSlice.activeEdgeIds);
    return {
      nodes: nodes.filter(n => activeNodes.has(n.id)),
      edges: caseStudy.edges.filter(e => activeEdges.has(e.id)),
    };
  }, [view, timeIndex, caseStudy, currentSlice, integrated]);

  const fragilityColor = (value: number) =>
    value >= 0.7 ? 'var(--alert-deep)' : value >= 0.4 ? 'var(--body)' : 'var(--muted)';

  const certaintyColor = (value: number) =>
    value >= 0.7 ? 'var(--lime-deep)' : value >= 0.4 ? 'var(--body)' : 'var(--alert-deep)';

  return (
    <div className="case-frame flex flex-col gap-3 p-3 sm:p-4">
      {/* Header */}
      <div className="card px-4 sm:px-6 py-3 sm:py-4 flex flex-wrap items-start sm:items-center justify-between gap-3 flex-shrink-0">
        <div>
          <h1
            className="text-xl sm:text-2xl leading-tight"
            style={{ color: 'var(--ink)' }}
          >
            {caseStudy.title}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--body)' }}>
            {caseStudy.period}
          </p>
        </div>
        <div className="flex gap-3 sm:gap-4 flex-shrink-0">
          <div className="text-right">
            <div
              className="stat text-3xl sm:text-4xl leading-none"
              style={{ color: fragilityColor(fragility.structural) }}
            >
              {(fragility.structural * 100).toFixed(0)}
            </div>
            <div className="label mt-1.5">
              STRUCTURAL
            </div>
          </div>
          <div className="text-right">
            <div
              className="stat text-3xl sm:text-4xl leading-none"
              style={{ color: certaintyColor(fragility.evidentialCertainty) }}
            >
              {(fragility.evidentialCertainty * 100).toFixed(0)}
            </div>
            <div className="label mt-1.5">
              CERTAINTY
            </div>
          </div>
        </div>
      </div>

      {/* Main content: graph + sidebar — column on mobile, row on md+ */}
      <div className="flex flex-col md:flex-row flex-1 gap-3 md:min-h-0">
        {/* Graph area */}
        <div className="flex-1 flex flex-col gap-3 md:min-h-0 min-w-0">
          {/* View toggle */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 flex-shrink-0">
            <div className="seg">
              <button onClick={() => setView('full')} aria-pressed={view === 'full'}>
                Full Graph
              </button>
              <button onClick={() => setView('time-sliced')} aria-pressed={view === 'time-sliced'}>
                Time-Sliced
              </button>
            </div>
            {view === 'time-sliced' && (
              <span
                className="text-xs break-all"
                style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}
              >
                {filteredData.nodes.length} nodes, {filteredData.edges.length} edges at {currentSlice.date}
              </span>
            )}
          </div>

          {/* Timeline (when time-sliced) */}
          {view === 'time-sliced' && (
            <div className="flex-shrink-0">
              <TimeSlider
                timeSlices={caseStudy.timeSlices}
                currentIndex={timeIndex}
                onChange={setTimeIndex}
              />
            </div>
          )}

          {/* Graph */}
          <div className="card h-[420px] md:h-auto md:flex-1 md:min-h-0 overflow-hidden">
            <ForceGraph
              nodes={filteredData.nodes}
              edges={filteredData.edges}
              onNodeClick={setSelectedNode}
            />
          </div>
        </div>

        {/* Sidebar — full width below graph on mobile, fixed width on md+ */}
        <div
          className="well w-full md:w-[420px] flex-shrink-0 md:overflow-y-auto p-3 space-y-3"
          style={{ borderRadius: 'var(--r-card)' }}
        >
          {/* Selected node detail */}
          {selectedNode && (
            <div
              className="card rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span
                  className="tag text-xs px-2 py-0.5 rounded"
                  style={{
                    color: 'var(--ink)',
                    fontFamily: 'var(--font-mono)'
                  }}
                >
                  {selectedNode.type.toUpperCase()}
                </span>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="text-xs"
                  style={{ color: 'var(--muted)' }}
                >
                  close
                </button>
              </div>
              <h4
                className="font-semibold text-sm mb-1"
                style={{ color: 'var(--ink)' }}
              >
                {selectedNode.label}
              </h4>
              <p
                className="text-xs leading-relaxed"
                style={{ color: 'var(--body)' }}
              >
                {selectedNode.description}
              </p>
              <div
                className="mt-2 text-xs"
                style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}
              >
                confidence: {(selectedNode.confidence * 100).toFixed(0)}% | date: {selectedNode.date}
              </div>
            </div>
          )}

          {/* Narrative Fragility */}
          <div
            className="card rounded-lg p-4">
            <h3
              className="text-sm font-semibold mb-1"
              style={{ color: 'var(--ink)' }}
            >
              Narrative Fragility
            </h3>
            <p
              className="text-xs mb-3"
              style={{ color: 'var(--muted)' }}
            >
              {fragility.interpretation}
            </p>

            <div
              className="text-xs font-semibold mb-1.5"
              style={{ color: 'var(--body)' }}
            >
              Structural Fragility
            </div>
            <div className="space-y-1.5 mb-3">
              {([
                ['Suppression', fragility.components.suppressionDensity],
                ['Benefit conflict', fragility.components.benefitConflict],
                ['Source concentration', fragility.components.sourceConcentration],
                ['Classification rate', fragility.components.classificationRate],
                ['Dissenter suppression', fragility.components.dissenterSuppression],
                ['Evidence actions', fragility.components.evidenceActionDensity],
                ['Power pressure', fragility.components.powerChangePressure],
              ] as [string, number][]).map(([label, value]) => (
                <div key={label} className="flex items-center gap-2 text-xs">
                  <span
                    className="w-32 flex-shrink-0"
                    style={{ color: 'var(--body)' }}
                  >
                    {label}
                  </span>
                  <div className="track flex-1 h-1.5">
                    <div
                      className="ticks h-full"
                      style={{
                        width: `${Math.min(value * 100, 100)}%`,
                        background: fragilityColor(value)
                      }}
                    />
                  </div>
                  <span
                    className="w-8 text-right"
                    style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}
                  >
                    {(value * 100).toFixed(0)}
                  </span>
                </div>
              ))}
            </div>

            <div
              className="text-xs font-semibold mb-1.5"
              style={{ color: 'var(--body)' }}
            >
              Evidential Certainty
            </div>
            <div className="space-y-1.5">
              {([
                ['Verdict margin', fragility.components.verdictMargin],
                ['Evidence weight', fragility.components.evidenceWeight],
                ['Source agreement', fragility.components.sourceAgreement],
                ['Prior independence', fragility.components.priorIndependence],
              ] as [string, number][]).map(([label, value]) => (
                <div key={label} className="flex items-center gap-2 text-xs">
                  <span
                    className="w-32 flex-shrink-0"
                    style={{ color: 'var(--body)' }}
                  >
                    {label}
                  </span>
                  <div className="track flex-1 h-1.5">
                    <div
                      className="ticks h-full"
                      style={{
                        width: `${Math.min(value * 100, 100)}%`,
                        background: certaintyColor(value)
                      }}
                    />
                  </div>
                  <span
                    className="w-8 text-right"
                    style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}
                  >
                    {(value * 100).toFixed(0)}
                  </span>
                </div>
              ))}
            </div>

            {fragility.riskFactors.length > 0 && (
              <div
                className="mt-3 pt-3"
                style={{ borderTop: '1px solid var(--line)' }}
              >
                <div
                  className="text-xs font-semibold mb-1"
                  style={{ color: 'var(--ink)' }}
                >
                  Risk factors
                </div>
                {fragility.riskFactors.map((rf, i) => (
                  <div
                    key={i}
                    className="text-xs mt-1"
                    style={{ color: 'var(--ink)' }}
                  >
                    {rf}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Causal Chain */}
          <div
            className="card rounded-lg p-4">
            <h3
              className="text-sm font-semibold mb-3"
              style={{ color: 'var(--ink)' }}
            >
              Causal Chain
            </h3>
            <div className="space-y-2">
              {caseStudy.causalFactors.map((cf, i) => (
                <div key={cf.id}>
                  <div className="flex items-start gap-2">
                    <div
                      className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                      style={{
                        background:
                          cf.type === 'power_change' ? 'var(--alert)' :
                          cf.type === 'narrative_change' ? 'var(--body)' :
                          cf.type === 'evidence_action' ? 'var(--body)' : 'var(--muted)'
                      }}
                    />
                    <div>
                      <div
                        className="text-xs"
                        style={{ color: 'var(--ink)' }}
                      >
                        {cf.label}
                      </div>
                      <div
                        className="text-xs"
                        style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}
                      >
                        {cf.date}
                      </div>
                    </div>
                  </div>
                  {i < caseStudy.causalLinks.length && (
                    <div
                      className="ml-1 pl-3 py-1"
                      style={{ borderLeft: '1px solid var(--line)' }}
                    >
                      <div
                        className="text-xs italic"
                        style={{ color: 'var(--muted)' }}
                      >
                        {caseStudy.causalLinks[i]?.mechanism.slice(0, 80)}...
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Integration Effects */}
          {integrated.adjustments.length > 0 && (
            <div
              className="card rounded-lg p-4">
              <h3
                className="text-sm font-semibold mb-1"
                style={{ color: 'var(--ink)' }}
              >
                Cross-System Effects
              </h3>
              <p
                className="text-xs mb-3"
                style={{ color: 'var(--muted)' }}
              >
                Graph edges and causal factors adjusting Bayesian evidence weights
              </p>
              <div className="space-y-2">
                {integrated.adjustments.map(adj => {
                  const delta = adj.adjustedReliability - adj.originalReliability;
                  const evidence = integrated.adjustedEvidence.find(e => e.id === adj.evidenceId);
                  return (
                    <div
                      key={adj.evidenceId}
                      className="well text-xs rounded p-2">
                      <div
                        className="font-medium mb-1"
                        style={{ color: 'var(--ink)' }}
                      >
                        {evidence?.label ?? adj.evidenceId}
                      </div>
                      <div
                        style={{
                          color: delta < 0 ? 'var(--alert-deep)' : 'var(--lime-deep)',
                          fontFamily: 'var(--font-mono)'
                        }}
                      >
                        {(adj.originalReliability * 100).toFixed(0)}% → {(adj.adjustedReliability * 100).toFixed(0)}%
                        <span className="ml-1">({delta < 0 ? '' : '+'}{(delta * 100).toFixed(1)}%)</span>
                      </div>
                      {adj.reasons.map((r, i) => (
                        <div
                          key={i}
                          className="mt-0.5 italic"
                          style={{ color: 'var(--muted)' }}
                        >
                          {r}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Bayesian Dashboard */}
          <div className="card p-4">
            <BayesianDashboard
              hypotheses={caseStudy.hypotheses}
              evidence={integrated.adjustedEvidence}
              adjustments={integrated.adjustments}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
