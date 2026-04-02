import { GraphNode, GraphEdge, NodeType, EdgeType } from '../types/graph';

export class KnowledgeGraph {
  private nodes: Map<string, GraphNode>;
  private edges: Map<string, GraphEdge>;
  private adjacency: Map<string, Set<string>>; // nodeId -> set of edgeIds
  private reverseAdjacency: Map<string, Set<string>>; // nodeId -> set of incoming edgeIds

  constructor(nodes: GraphNode[], edges: GraphEdge[]) {
    this.nodes = new Map(nodes.map(n => [n.id, n]));
    this.edges = new Map(edges.map(e => [e.id, e]));
    this.adjacency = new Map();
    this.reverseAdjacency = new Map();

    for (const node of nodes) {
      this.adjacency.set(node.id, new Set());
      this.reverseAdjacency.set(node.id, new Set());
    }

    for (const edge of edges) {
      this.adjacency.get(edge.source)?.add(edge.id);
      this.reverseAdjacency.get(edge.target)?.add(edge.id);
    }
  }

  getNode(id: string): GraphNode | undefined {
    return this.nodes.get(id);
  }

  getEdge(id: string): GraphEdge | undefined {
    return this.edges.get(id);
  }

  getAllNodes(): GraphNode[] {
    return Array.from(this.nodes.values());
  }

  getAllEdges(): GraphEdge[] {
    return Array.from(this.edges.values());
  }

  getNodesByType(type: NodeType): GraphNode[] {
    return this.getAllNodes().filter(n => n.type === type);
  }

  getEdgesByType(type: EdgeType): GraphEdge[] {
    return this.getAllEdges().filter(e => e.type === type);
  }

  getOutgoingEdges(nodeId: string): GraphEdge[] {
    const edgeIds = this.adjacency.get(nodeId) ?? new Set();
    return Array.from(edgeIds).map(id => this.edges.get(id)!).filter(Boolean);
  }

  getIncomingEdges(nodeId: string): GraphEdge[] {
    const edgeIds = this.reverseAdjacency.get(nodeId) ?? new Set();
    return Array.from(edgeIds).map(id => this.edges.get(id)!).filter(Boolean);
  }

  getNeighbors(nodeId: string): GraphNode[] {
    const outgoing = this.getOutgoingEdges(nodeId).map(e => e.target);
    const incoming = this.getIncomingEdges(nodeId).map(e => e.source);
    const neighborIds = new Set([...outgoing, ...incoming]);
    return Array.from(neighborIds).map(id => this.nodes.get(id)!).filter(Boolean);
  }

  /**
   * Find all contradictions in the graph (pairs of nodes connected by 'contradicts' edges).
   */
  findContradictions(): Array<{ edge: GraphEdge; nodeA: GraphNode; nodeB: GraphNode }> {
    return this.getEdgesByType('contradicts').map(edge => ({
      edge,
      nodeA: this.nodes.get(edge.source)!,
      nodeB: this.nodes.get(edge.target)!,
    })).filter(c => c.nodeA && c.nodeB);
  }

  /**
   * Find nodes where all supporting evidence traces back to a single source.
   * Returns claims with fragile evidence bases.
   */
  findSourceClusters(): Array<{ claim: GraphNode; sources: GraphNode[]; concentration: number }> {
    const claims = this.getNodesByType('claim');

    return claims.map(claim => {
      // Walk backward from claim through 'cites' and 'derived_from' edges
      const sources = this.traceToSources(claim.id);
      const uniqueActors = new Set(sources.map(s => s.metadata?.actor ?? s.id));
      const concentration = uniqueActors.size === 0 ? 0 : 1 / uniqueActors.size;

      return { claim, sources, concentration };
    }).filter(c => c.concentration > 0.5 && c.sources.length > 0);
  }

  private traceToSources(nodeId: string, visited: Set<string> = new Set()): GraphNode[] {
    if (visited.has(nodeId)) return [];
    visited.add(nodeId);

    const incoming = this.getIncomingEdges(nodeId)
      .filter(e => e.type === 'cites' || e.type === 'derived_from');

    if (incoming.length === 0) {
      const node = this.nodes.get(nodeId);
      return node?.type === 'source' || node?.type === 'actor' ? [node] : [];
    }

    return incoming.flatMap(e => this.traceToSources(e.source, visited));
  }

  /**
   * Filter graph to only include nodes/edges active at a given date.
   */
  filterByDate(beforeDate: string): { nodes: GraphNode[]; edges: GraphEdge[] } {
    const cutoff = new Date(beforeDate).getTime();
    const activeNodes = this.getAllNodes().filter(n => {
      const nodeDate = new Date(n.date).getTime();
      return !isNaN(nodeDate) && nodeDate <= cutoff;
    });
    const activeNodeIds = new Set(activeNodes.map(n => n.id));

    const activeEdges = this.getAllEdges().filter(e => {
      if (!activeNodeIds.has(e.source) || !activeNodeIds.has(e.target)) return false;
      if (e.date) {
        return new Date(e.date).getTime() <= cutoff;
      }
      return true;
    });

    return { nodes: activeNodes, edges: activeEdges };
  }
}
