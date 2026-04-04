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
    value >= 0.7 ? '#a23f00' : value >= 0.4 ? '#c47a20' : '#9ba2a3';

  const certaintyColor = (value: number) =>
    value >= 0.7 ? '#2a7d4c' : value >= 0.4 ? '#c47a20' : '#a23f00';

  return (
    <div className="flex flex-col h-[calc(100vh-52px)]">
      {/* Header */}
      <div
        className="px-3 sm:px-6 py-3 sm:py-4 flex flex-wrap items-start sm:items-center justify-between gap-3"
        style={{ background: '#ffffff', borderBottom: '1px solid rgba(196,203,204,0.15)' }}
      >
        <div>
          <h1
            className="text-xl sm:text-2xl font-bold leading-tight"
            style={{ color: '#2d3435', fontFamily: "'Newsreader', serif" }}
          >
            {caseStudy.title}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: '#6b7374', fontFamily: "'Work Sans', sans-serif" }}>
            {caseStudy.period}
          </p>
        </div>
        <div className="flex gap-3 sm:gap-4 flex-shrink-0">
          <div className="text-right">
            <div
              className="text-2xl sm:text-3xl font-bold leading-none"
              style={{
                color: fragilityColor(fragility.structural),
                fontFamily: "'DM Mono', monospace",
              }}
            >
              {(fragility.structural * 100).toFixed(0)}
            </div>
            <div className="text-xs mt-0.5" style={{ color: '#9ba2a3', fontFamily: "'DM Mono', monospace" }}>
              STRUCTURAL
            </div>
          </div>
          <div className="text-right">
            <div
              className="text-2xl sm:text-3xl font-bold leading-none"
              style={{
                color: certaintyColor(fragility.evidentialCertainty),
                fontFamily: "'DM Mono', monospace",
              }}
            >
              {(fragility.evidentialCertainty * 100).toFixed(0)}
            </div>
            <div className="text-xs mt-0.5" style={{ color: '#9ba2a3', fontFamily: "'DM Mono', monospace" }}>
              CERTAINTY
            </div>
          </div>
        </div>
      </div>

      {/* Main content: graph + sidebar — column on mobile, row on md+ */}
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        {/* Graph area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* View toggle */}
          <div
            className="px-3 sm:px-4 py-2 flex flex-wrap items-center gap-2 sm:gap-4"
            style={{ background: '#ffffff', borderBottom: '1px solid rgba(196,203,204,0.15)' }}
          >
            <button
              onClick={() => setView('full')}
              className="text-xs px-3 py-1 rounded-full transition-colors"
              style={{
                background: view === 'full'
                  ? 'linear-gradient(135deg, #a23f00, #8f3600)'
                  : 'transparent',
                color: view === 'full' ? '#ffffff' : '#9ba2a3',
                fontFamily: "'Work Sans', sans-serif",
              }}
            >
              Full Graph
            </button>
            <button
              onClick={() => setView('time-sliced')}
              className="text-xs px-3 py-1 rounded-full transition-colors"
              style={{
                background: view === 'time-sliced'
                  ? 'linear-gradient(135deg, #a23f00, #8f3600)'
                  : 'transparent',
                color: view === 'time-sliced' ? '#ffffff' : '#9ba2a3',
                fontFamily: "'Work Sans', sans-serif",
              }}
            >
              Time-Sliced
            </button>
            {view === 'time-sliced' && (
              <span
                className="text-xs break-all"
                style={{ color: '#9ba2a3', fontFamily: "'DM Mono', monospace" }}
              >
                {filteredData.nodes.length} nodes, {filteredData.edges.length} edges at {currentSlice.date}
              </span>
            )}
          </div>

          {/* Timeline (when time-sliced) */}
          {view === 'time-sliced' && (
            <div
              className="p-3 sm:p-4 flex-shrink-0"
              style={{ background: '#ffffff', borderBottom: '1px solid rgba(196,203,204,0.15)' }}
            >
              <TimeSlider
                timeSlices={caseStudy.timeSlices}
                currentIndex={timeIndex}
                onChange={setTimeIndex}
              />
            </div>
          )}

          {/* Graph */}
          <div className="flex-1 min-h-[300px] md:min-h-0" style={{ background: '#f9f9f9' }}>
            <ForceGraph
              nodes={filteredData.nodes}
              edges={filteredData.edges}
              onNodeClick={setSelectedNode}
            />
          </div>
        </div>

        {/* Sidebar — full width below graph on mobile, fixed width on md+ */}
        <div
          className="w-full md:w-[420px] flex-shrink-0 overflow-y-auto p-3 sm:p-4 space-y-3"
          style={{ background: '#f2f4f4' }}
        >
          {/* Selected node detail */}
          {selectedNode && (
            <div
              className="rounded-lg p-4"
              style={{
                background: '#ffffff',
                outline: '1px solid rgba(196,203,204,0.15)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className="text-xs px-2 py-0.5 rounded"
                  style={{
                    background: '#f2f4f4',
                    color: '#a23f00',
                    fontFamily: "'DM Mono', monospace",
                  }}
                >
                  {selectedNode.type.toUpperCase()}
                </span>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="text-xs"
                  style={{ color: '#9ba2a3', fontFamily: "'Work Sans', sans-serif" }}
                >
                  close
                </button>
              </div>
              <h4
                className="font-bold text-sm mb-1"
                style={{ color: '#2d3435', fontFamily: "'Newsreader', serif" }}
              >
                {selectedNode.label}
              </h4>
              <p
                className="text-xs leading-relaxed"
                style={{ color: '#6b7374', fontFamily: "'Work Sans', sans-serif" }}
              >
                {selectedNode.description}
              </p>
              <div
                className="mt-2 text-xs"
                style={{ color: '#9ba2a3', fontFamily: "'DM Mono', monospace" }}
              >
                confidence: {(selectedNode.confidence * 100).toFixed(0)}% | date: {selectedNode.date}
              </div>
            </div>
          )}

          {/* Narrative Fragility */}
          <div
            className="rounded-lg p-4"
            style={{
              background: '#ffffff',
              outline: '1px solid rgba(196,203,204,0.15)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }}
          >
            <h3
              className="text-sm font-bold mb-1"
              style={{ color: '#2d3435', fontFamily: "'Newsreader', serif" }}
            >
              Narrative Fragility
            </h3>
            <p
              className="text-xs mb-3"
              style={{ color: '#9ba2a3', fontFamily: "'Work Sans', sans-serif" }}
            >
              {fragility.interpretation}
            </p>

            <div
              className="text-xs font-bold mb-1.5"
              style={{ color: '#6b7374', fontFamily: "'Work Sans', sans-serif" }}
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
                    style={{ color: '#6b7374', fontFamily: "'Work Sans', sans-serif" }}
                  >
                    {label}
                  </span>
                  <div className="flex-1 h-1.5 rounded-full" style={{ background: '#e4e9ea' }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(value * 100, 100)}%`,
                        background: fragilityColor(value),
                      }}
                    />
                  </div>
                  <span
                    className="w-8 text-right"
                    style={{ color: '#9ba2a3', fontFamily: "'DM Mono', monospace" }}
                  >
                    {(value * 100).toFixed(0)}
                  </span>
                </div>
              ))}
            </div>

            <div
              className="text-xs font-bold mb-1.5"
              style={{ color: '#6b7374', fontFamily: "'Work Sans', sans-serif" }}
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
                    style={{ color: '#6b7374', fontFamily: "'Work Sans', sans-serif" }}
                  >
                    {label}
                  </span>
                  <div className="flex-1 h-1.5 rounded-full" style={{ background: '#e4e9ea' }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(value * 100, 100)}%`,
                        background: certaintyColor(value),
                      }}
                    />
                  </div>
                  <span
                    className="w-8 text-right"
                    style={{ color: '#9ba2a3', fontFamily: "'DM Mono', monospace" }}
                  >
                    {(value * 100).toFixed(0)}
                  </span>
                </div>
              ))}
            </div>

            {fragility.riskFactors.length > 0 && (
              <div
                className="mt-3 pt-3"
                style={{ borderTop: '1px solid rgba(196,203,204,0.15)' }}
              >
                <div
                  className="text-xs font-bold mb-1"
                  style={{ color: '#2d3435', fontFamily: "'Work Sans', sans-serif" }}
                >
                  Risk factors
                </div>
                {fragility.riskFactors.map((rf, i) => (
                  <div
                    key={i}
                    className="text-xs mt-1"
                    style={{ color: '#a23f00', fontFamily: "'Work Sans', sans-serif" }}
                  >
                    {rf}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Causal Chain */}
          <div
            className="rounded-lg p-4"
            style={{
              background: '#ffffff',
              outline: '1px solid rgba(196,203,204,0.15)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }}
          >
            <h3
              className="text-sm font-bold mb-3"
              style={{ color: '#2d3435', fontFamily: "'Newsreader', serif" }}
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
                          cf.type === 'power_change' ? '#a23f00' :
                          cf.type === 'narrative_change' ? '#c47a20' :
                          cf.type === 'evidence_action' ? '#8f3600' : '#9ba2a3',
                      }}
                    />
                    <div>
                      <div
                        className="text-xs"
                        style={{ color: '#2d3435', fontFamily: "'Work Sans', sans-serif" }}
                      >
                        {cf.label}
                      </div>
                      <div
                        className="text-xs"
                        style={{ color: '#9ba2a3', fontFamily: "'DM Mono', monospace" }}
                      >
                        {cf.date}
                      </div>
                    </div>
                  </div>
                  {i < caseStudy.causalLinks.length && (
                    <div
                      className="ml-1 pl-3 py-1"
                      style={{ borderLeft: '1px solid rgba(196,203,204,0.3)' }}
                    >
                      <div
                        className="text-xs italic"
                        style={{ color: '#c4cbcc', fontFamily: "'Work Sans', sans-serif" }}
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
              className="rounded-lg p-4"
              style={{
                background: '#ffffff',
                outline: '1px solid rgba(196,203,204,0.15)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              }}
            >
              <h3
                className="text-sm font-bold mb-1"
                style={{ color: '#2d3435', fontFamily: "'Newsreader', serif" }}
              >
                Cross-System Effects
              </h3>
              <p
                className="text-xs mb-3"
                style={{ color: '#9ba2a3', fontFamily: "'Work Sans', sans-serif" }}
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
                      className="text-xs rounded p-2"
                      style={{ background: '#f2f4f4' }}
                    >
                      <div
                        className="font-medium mb-1"
                        style={{ color: '#2d3435', fontFamily: "'Work Sans', sans-serif" }}
                      >
                        {evidence?.label ?? adj.evidenceId}
                      </div>
                      <div
                        style={{
                          color: delta < 0 ? '#a23f00' : '#2a7d4c',
                          fontFamily: "'DM Mono', monospace",
                        }}
                      >
                        {(adj.originalReliability * 100).toFixed(0)}% → {(adj.adjustedReliability * 100).toFixed(0)}%
                        <span className="ml-1">({delta < 0 ? '' : '+'}{(delta * 100).toFixed(1)}%)</span>
                      </div>
                      {adj.reasons.map((r, i) => (
                        <div
                          key={i}
                          className="mt-0.5 italic"
                          style={{ color: '#9ba2a3', fontFamily: "'Work Sans', sans-serif" }}
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
          <BayesianDashboard
            hypotheses={caseStudy.hypotheses}
            evidence={integrated.adjustedEvidence}
            adjustments={integrated.adjustments}
          />
        </div>
      </div>
    </div>
  );
}
