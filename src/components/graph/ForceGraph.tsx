'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { GraphNode, GraphEdge } from '@/lib/types/graph';

interface ForceGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  width?: number;
  height?: number;
  onNodeClick?: (node: GraphNode) => void;
}

// Node types are told apart with ink, greys, a hollow ring and the two signal colours.
const NODE_STYLES: Record<string, { fill: string; stroke: string }> = {
  claim: { fill: '#1c1d1f', stroke: '#ffffff' },
  evidence: { fill: '#c8f04a', stroke: '#4d6b00' },
  event: { fill: '#6b6f76', stroke: '#ffffff' },
  actor: { fill: '#a4a8ae', stroke: '#ffffff' },
  source: { fill: '#ffffff', stroke: '#1c1d1f' },
  narrative: { fill: '#f0502e', stroke: '#ffffff' },
};
const DEFAULT_NODE = { fill: '#a4a8ae', stroke: '#ffffff' };

const EDGE_COLORS: Record<string, string> = {
  contradicts: '#f0502e',
  causes: '#1c1d1f',
  suppresses: '#6b6f76',
  cites: '#a4a8ae',
  claims: '#6b6f76',
  benefits: '#6b6f76',
  derived_from: '#a4a8ae',
  fabricates: '#f0502e',
  precedes: '#cfd1d5',
};

interface SimNode extends d3.SimulationNodeDatum {
  id: string;
  type: string;
  label: string;
  description: string;
  confidence: number;
}

interface SimEdge {
  id: string;
  source: string | SimNode;
  target: string | SimNode;
  type: string;
  weight: number;
}

export default function ForceGraph({ nodes, edges, width = 800, height = 500, onNodeClick }: ForceGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; node: GraphNode } | null>(null);
  const [dimensions, setDimensions] = useState({ width, height });

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: Math.max(entry.contentRect.height, 400),
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const renderGraph = useCallback(() => {
    if (!svgRef.current || nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const { width: w, height: h } = dimensions;

    const simNodes: SimNode[] = nodes.map(n => ({
      id: n.id,
      type: n.type,
      label: n.label,
      description: n.description,
      confidence: n.confidence,
    }));

    const nodeMap = new Map(simNodes.map(n => [n.id, n]));
    const simEdges: SimEdge[] = edges
      .filter(e => nodeMap.has(e.source) && nodeMap.has(e.target))
      .map(e => ({
        id: e.id,
        source: e.source,
        target: e.target,
        type: e.type,
        weight: e.weight,
      }));

    const simulation = d3.forceSimulation(simNodes)
      .force('link', d3.forceLink<SimNode, SimEdge>(simEdges).id(d => d.id).distance(120))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(w / 2, h / 2))
      .force('collision', d3.forceCollide().radius(30));

    const g = svg.append('g');

    // Zoom
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });
    svg.call(zoom);

    // Edges
    const edgeGroup = g.append('g').attr('class', 'edges');
    const edgeLines = edgeGroup.selectAll('line')
      .data(simEdges)
      .join('line')
      .attr('class', d => `edge-line ${d.type}`)
      .attr('stroke', d => EDGE_COLORS[d.type] || '#cfd1d5')
      .attr('stroke-width', d => Math.max(d.weight * 2, 0.5))
      .attr('stroke-dasharray', d => d.type === 'contradicts' ? '5 3' : d.type === 'suppresses' ? '8 4' : 'none');

    // Edge labels
    const edgeLabels = edgeGroup.selectAll('text')
      .data(simEdges)
      .join('text')
      .attr('font-size', '8px')
      .attr('fill', '#6b6f76')
      .attr('text-anchor', 'middle')
      .text(d => d.type);

    // Nodes
    const nodeGroup = g.append('g').attr('class', 'nodes');
    const nodeCircles = nodeGroup.selectAll('circle')
      .data(simNodes)
      .join('circle')
      .attr('r', d => 6 + d.confidence * 8)
      .attr('fill', d => (NODE_STYLES[d.type] || DEFAULT_NODE).fill)
      .attr('stroke', d => (NODE_STYLES[d.type] || DEFAULT_NODE).stroke)
      .attr('stroke-width', 1.5)
      .attr('cursor', 'pointer')
      .on('mouseover', function (event, d) {
        d3.select(this).attr('stroke', '#1c1d1f').attr('stroke-width', 2.5);
        const original = nodes.find(n => n.id === d.id);
        if (original) {
          setTooltip({ x: event.clientX, y: event.clientY, node: original });
        }
      })
      .on('mouseout', function (_, d) {
        d3.select(this).attr('stroke', (NODE_STYLES[d.type] || DEFAULT_NODE).stroke).attr('stroke-width', 1.5);
        setTooltip(null);
      })
      .on('click', (_, d) => {
        const original = nodes.find(n => n.id === d.id);
        if (original && onNodeClick) onNodeClick(original);
      });

    // Drag
    const drag = d3.drag<SVGCircleElement, SimNode>()
      .on('start', (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    nodeCircles.call(drag as any);

    // Labels
    const labels = nodeGroup.selectAll('text')
      .data(simNodes)
      .join('text')
      .attr('class', 'node-label')
      .attr('dx', 12)
      .attr('dy', 4)
      .text(d => d.label.length > 30 ? d.label.slice(0, 30) + '...' : d.label);

    simulation.on('tick', () => {
      edgeLines
        .attr('x1', d => (d.source as SimNode).x!)
        .attr('y1', d => (d.source as SimNode).y!)
        .attr('x2', d => (d.target as SimNode).x!)
        .attr('y2', d => (d.target as SimNode).y!);

      edgeLabels
        .attr('x', d => ((d.source as SimNode).x! + (d.target as SimNode).x!) / 2)
        .attr('y', d => ((d.source as SimNode).y! + (d.target as SimNode).y!) / 2);

      nodeCircles
        .attr('cx', d => d.x!)
        .attr('cy', d => d.y!);

      labels
        .attr('x', d => d.x!)
        .attr('y', d => d.y!);
    });

    return () => simulation.stop();
  }, [nodes, edges, dimensions, onNodeClick]);

  useEffect(() => {
    renderGraph();
  }, [renderGraph]);

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[400px] graph-container">
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
      />
      {tooltip && (
        <div
          className="card fixed z-50 max-w-xs p-3 text-xs pointer-events-none"
          style={{
            left: tooltip.x + 12,
            top: tooltip.y - 10,
            background: 'var(--white)',
            borderRadius: 'var(--r-item)',
            color: 'var(--ink)',
          }}
        >
          <div className="label mb-1.5">{tooltip.node.type}</div>
          <div className="font-medium mb-1" style={{ color: 'var(--ink)' }}>{tooltip.node.label}</div>
          <div style={{ color: 'var(--body)' }}>{tooltip.node.description}</div>
          <div className="mt-1 font-mono" style={{ color: 'var(--muted)' }}>
            confidence: {(tooltip.node.confidence * 100).toFixed(0)}% | {tooltip.node.date}
          </div>
        </div>
      )}
      {/* Legend */}
      <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-x-3 gap-y-1.5">
        {Object.entries(NODE_STYLES).map(([type, s]) => (
          <span key={type} className="label flex items-center gap-1.5" style={{ fontSize: 9 }}>
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{ background: s.fill, boxShadow: `0 0 0 1px ${s.stroke === '#ffffff' ? s.fill : s.stroke}` }}
            />
            {type}
          </span>
        ))}
      </div>
    </div>
  );
}
