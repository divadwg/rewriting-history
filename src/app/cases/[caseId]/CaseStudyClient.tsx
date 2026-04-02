'use client';

import { useState, useMemo } from 'react';
import { CaseStudy, GraphNode } from '@/lib/types/graph';
import ForceGraph from '@/components/graph/ForceGraph';
import BayesianDashboard from '@/components/bayesian/BayesianDashboard';
import TimeSlider from '@/components/timeline/TimeSlider';

interface Props {
  caseStudy: CaseStudy;
}

export default function CaseStudyClient({ caseStudy }: Props) {
  const [timeIndex, setTimeIndex] = useState(caseStudy.timeSlices.length - 1);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [view, setView] = useState<'full' | 'time-sliced'>('full');

  const currentSlice = caseStudy.timeSlices[timeIndex];

  const filteredData = useMemo(() => {
    if (view === 'full') {
      return { nodes: caseStudy.nodes, edges: caseStudy.edges };
    }
    const activeNodes = new Set(currentSlice.activeNodeIds);
    const activeEdges = new Set(currentSlice.activeEdgeIds);
    return {
      nodes: caseStudy.nodes.filter(n => activeNodes.has(n.id)),
      edges: caseStudy.edges.filter(e => activeEdges.has(e.id)),
    };
  }, [view, timeIndex, caseStudy, currentSlice]);

  return (
    <div className="flex flex-col h-[calc(100vh-52px)]">
      {/* Header */}
      <div className="px-6 py-4" style={{ borderBottom: '1px solid #e5e5e5' }}>
        <h1 className="text-2xl font-bold" style={{ color: '#1a1a1a' }}>{caseStudy.title}</h1>
        <p className="text-sm mt-1" style={{ color: '#6b6b6b' }}>{caseStudy.period}</p>
      </div>

      {/* Main content: graph + sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Graph area */}
        <div className="flex-1 flex flex-col">
          {/* View toggle */}
          <div className="px-4 py-2 flex items-center gap-4" style={{ borderBottom: '1px solid #f0f0f0' }}>
            <button
              onClick={() => setView('full')}
              className="text-xs px-3 py-1 rounded-full transition-colors"
              style={{
                background: view === 'full' ? '#e87b35' : 'transparent',
                color: view === 'full' ? 'white' : '#999999',
              }}
            >
              Full Graph
            </button>
            <button
              onClick={() => setView('time-sliced')}
              className="text-xs px-3 py-1 rounded-full transition-colors"
              style={{
                background: view === 'time-sliced' ? '#e87b35' : 'transparent',
                color: view === 'time-sliced' ? 'white' : '#999999',
              }}
            >
              Time-Sliced
            </button>
            {view === 'time-sliced' && (
              <span className="text-xs font-mono" style={{ color: '#999999' }}>
                Showing {filteredData.nodes.length} nodes, {filteredData.edges.length} edges at {currentSlice.date}
              </span>
            )}
          </div>

          {/* Timeline (when time-sliced) */}
          {view === 'time-sliced' && (
            <div className="p-4 flex-shrink-0" style={{ borderBottom: '1px solid #f0f0f0' }}>
              <TimeSlider
                timeSlices={caseStudy.timeSlices}
                currentIndex={timeIndex}
                onChange={setTimeIndex}
              />
            </div>
          )}

          {/* Graph */}
          <div className="flex-1 min-h-0">
            <ForceGraph
              nodes={filteredData.nodes}
              edges={filteredData.edges}
              onNodeClick={setSelectedNode}
            />
          </div>

        </div>

        {/* Sidebar */}
        <div
          className="w-[420px] flex-shrink-0 overflow-y-auto p-4"
          style={{ borderLeft: '1px solid #e5e5e5', background: '#f7f7f7' }}
        >
          {/* Selected node detail */}
          {selectedNode && (
            <div className="rounded-lg p-4 mb-4" style={{ background: '#ffffff', border: '1px solid #e5e5e5', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono px-2 py-0.5 rounded"
                  style={{
                    background: '#fdf0e6',
                    color: '#e87b35',
                  }}>
                  {selectedNode.type.toUpperCase()}
                </span>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="text-xs"
                  style={{ color: '#999999' }}
                >
                  close
                </button>
              </div>
              <h4 className="font-bold text-sm mb-1" style={{ color: '#1a1a1a' }}>{selectedNode.label}</h4>
              <p className="text-xs leading-relaxed" style={{ color: '#6b6b6b' }}>{selectedNode.description}</p>
              <div className="mt-2 text-xs font-mono" style={{ color: '#999999' }}>
                confidence: {(selectedNode.confidence * 100).toFixed(0)}% | date: {selectedNode.date}
              </div>
            </div>
          )}

          {/* Causal Chain */}
          <div className="rounded-lg p-4 mb-4" style={{ background: '#ffffff', border: '1px solid #e5e5e5', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <h3 className="text-sm font-bold mb-3" style={{ color: '#1a1a1a' }}>Causal Chain</h3>
            <div className="space-y-2">
              {caseStudy.causalFactors.map((cf, i) => (
                <div key={cf.id}>
                  <div className="flex items-start gap-2">
                    <div
                      className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                      style={{
                        background: cf.type === 'power_change' ? '#c44536' :
                          cf.type === 'narrative_change' ? '#e87b35' :
                          cf.type === 'evidence_action' ? '#d06a2a' : '#999999'
                      }}
                    />
                    <div>
                      <div className="text-xs" style={{ color: '#1a1a1a' }}>{cf.label}</div>
                      <div className="text-xs font-mono" style={{ color: '#999999' }}>{cf.date}</div>
                    </div>
                  </div>
                  {i < caseStudy.causalLinks.length && (
                    <div className="ml-1 pl-3 py-1" style={{ borderLeft: '1px solid #e5e5e5' }}>
                      <div className="text-xs italic" style={{ color: '#bbbbbb' }}>
                        {caseStudy.causalLinks[i]?.mechanism.slice(0, 80)}...
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Bayesian Dashboard */}
          <BayesianDashboard
            hypotheses={caseStudy.hypotheses}
            evidence={caseStudy.evidence}
          />
        </div>
      </div>
    </div>
  );
}
