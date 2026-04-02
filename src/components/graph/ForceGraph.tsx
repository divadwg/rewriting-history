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

const NODE_COLORS: Record<string, string> = {
  claim: '#e87b35',
  evidence: '#2a9d5c',
  event: '#d06a2a',
  actor: '#c44536',
  source: '#4a8fa8',
  narrative: '#b07030',
};

const EDGE_COLORS: Record<string, string> = {
  contradicts: '#c44536',
  causes: '#e87b35',
  suppresses: '#d06a2a',
  cites: '#999999',
  claims: '#b07030',
  benefits: '#d06a2a',
  derived_from: '#999999',
  fabricates: '#c44536',
  precedes: '#cccccc',
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
      .attr('stroke', d => EDGE_COLORS[d.type] || '#cccccc')
      .attr('stroke-width', d => Math.max(d.weight * 2, 0.5))
      .attr('stroke-dasharray', d => d.type === 'contradicts' ? '5 3' : d.type === 'suppresses' ? '8 4' : 'none');

    // Edge labels
    const edgeLabels = edgeGroup.selectAll('text')
      .data(simEdges)
      .join('text')
      .attr('font-size', '8px')
      .attr('fill', '#999999')
      .attr('text-anchor', 'middle')
      .text(d => d.type);

    // Nodes
    const nodeGroup = g.append('g').attr('class', 'nodes');
    const nodeCircles = nodeGroup.selectAll('circle')
      .data(simNodes)
      .join('circle')
      .attr('r', d => 6 + d.confidence * 8)
      .attr('fill', d => NODE_COLORS[d.type] || '#999999')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 1.5)
      .attr('cursor', 'pointer')
      .on('mouseover', function (event, d) {
        d3.select(this).attr('stroke', '#1a1a1a').attr('stroke-width', 2);
        const original = nodes.find(n => n.id === d.id);
        if (original) {
          setTooltip({ x: event.clientX, y: event.clientY, node: original });
        }
      })
      .on('mouseout', function () {
        d3.select(this).attr('stroke', '#ffffff').attr('stroke-width', 1.5);
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
        style={{ background: '#f7f7f7', borderRadius: '8px' }}
      />
      {tooltip && (
        <div
          className="fixed z-50 max-w-xs rounded-lg p-3 text-xs pointer-events-none"
          style={{
            left: tooltip.x + 12,
            top: tooltip.y - 10,
            background: '#ffffff',
            border: '1px solid #e5e5e5',
            color: '#1a1a1a',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}
        >
          <div className="font-bold mb-1" style={{ color: NODE_COLORS[tooltip.node.type] }}>
            [{tooltip.node.type.toUpperCase()}] {tooltip.node.label}
          </div>
          <div style={{ color: '#6b6b6b' }}>{tooltip.node.description}</div>
          <div className="mt-1 font-mono" style={{ color: '#999999' }}>
            confidence: {(tooltip.node.confidence * 100).toFixed(0)}% | {tooltip.node.date}
          </div>
        </div>
      )}
      {/* Legend */}
      <div
        className="absolute bottom-2 left-2 rounded p-2 text-xs flex flex-wrap gap-3"
        style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid #e5e5e5' }}
      >
        {Object.entries(NODE_COLORS).map(([type, color]) => (
          <span key={type} className="flex items-center gap-1" style={{ color: '#6b6b6b' }}>
            <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: color }} />
            {type}
          </span>
        ))}
      </div>
    </div>
  );
}
