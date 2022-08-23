type NodeId = string;
type EdgeWeight = number;
type EncodedEdge = string;

export interface Serialized {
  nodes: { id: NodeId }[];
  links: { source: NodeId; target: NodeId; weight?: EdgeWeight }[];
}

class CycleError extends Error {
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, CycleError.prototype);
  }
}

// A graph data structure with depth-first search and topological sort.
export default class Graph {
  // The adjacency list of the graph.
  // Keys are node ids.
  // Values are adjacent node id arrays.
  private edges: Map<NodeId, NodeId[]> = new Map();

  // The weights of edges.
  // Keys are string encodings of edges.
  // Values are weights (numbers).
  private edgeWeights: Map<EncodedEdge, EdgeWeight> = new Map();

  constructor(serialized?: Serialized) {
    // If a serialized graph was passed into the constructor, deserialize it.
    if (serialized) {
      this.deserialize(serialized);
    }
  }

  // Gets the list of nodes that have been added to the graph.
  get nodes(): NodeId[] {
    // TODO: Better implementation with set data structure

    const nodeSet = new Set<NodeId>();
    this.edges.forEach((targetNodes, sourceNode) => {
      // nodeSet[u] = true;
      nodeSet.add(sourceNode);

      targetNodes.forEach((targetNode) => {
        nodeSet.add(targetNode);
      });
    });

    return [...nodeSet.values()];
  }

  /**
   * Get all nodes in the graph that have no preceeding nodes. These are the
   * "entry" nodes of the graph
   */
  get entryNodes(): NodeId[] {
    const nodeSet = new Set<NodeId>();

    this.edges.forEach((targetNodes, sourceNode) => {
      const inboundNodes = this.inbound(sourceNode);

      if (inboundNodes.length === 0) {
        nodeSet.add(sourceNode);
      }
    });

    return [...nodeSet.values()];
  }

  /**
   * Get all nodes in the graph that have no succeeding nodes. These are the
   * "exit" nodes of the graph
   */
  get exitNodes(): NodeId[] {
    const nodeSet = new Set<NodeId>();

    this.edges.forEach((targetNodes, sourceNode) => {
      const outboundNodes = this.outbound(sourceNode);

      if (outboundNodes.length === 0) {
        nodeSet.add(sourceNode);
      }
    });

    return [...nodeSet.values()];
  }

  // Adds a node to the graph.
  // If node was already added, this function does nothing.
  // If node was not already added, this function sets up an empty adjacency list.
  addNode(node: NodeId) {
    this.edges.set(node, this.adjacent(node));
    return this;
  }

  // Removes a node from the graph.
  // Also removes incoming and outgoing edges.
  removeNode(node: NodeId) {
    // Remove incoming edges.
    this.edges.forEach((targetNodes, sourceNode) => {
      targetNodes.forEach((targetNode) => {
        if (targetNode === node) {
          this.removeEdge(sourceNode, targetNode);
        }
      });
    });

    // Remove outgoing edges (and signal that the node no longer exists).
    this.edges.delete(node);
    return this;
  }

  // Gets the adjacent node list for the given node.
  // Returns an empty array for unknown nodes.
  adjacent(node: NodeId): NodeId[] {
    return this.edges.get(node) || [];
  }

  // Computes a string encoding of an edge,
  // for use as a key in an object.
  private encodeEdge(sourceNode: NodeId, targetNode: NodeId): EncodedEdge {
    return sourceNode + "|" + targetNode;
  }

  // Sets the weight of the given edge.
  setEdgeWeight(sourceNode: NodeId, targetNode: NodeId, weight: EdgeWeight) {
    this.edgeWeights.set(this.encodeEdge(sourceNode, targetNode), weight);
    return this;
  }

  // Gets the weight of the given edge.
  // Returns 1 if no weight was previously set.
  getEdgeWeight(sourceNode: NodeId, targetNode: NodeId): EdgeWeight {
    return this.edgeWeights.get(this.encodeEdge(sourceNode, targetNode)) ?? 1;
  }

  // Adds an edge from node u to node v.
  // Implicitly adds the nodes if they were not already added.
  addEdge(sourceNode: NodeId, targetNode: NodeId, weight?: EdgeWeight) {
    this.addNode(sourceNode);
    this.addNode(targetNode);
    this.adjacent(sourceNode).push(targetNode);

    if (weight !== undefined) {
      this.setEdgeWeight(sourceNode, targetNode, weight);
    }

    return this;
  }

  // Removes the edge from node u to node v.
  // Does not remove the nodes.
  // Does nothing if the edge does not exist.
  removeEdge(sourceNode: NodeId, targetNode: NodeId) {
    if (this.edges.get(sourceNode)) {
      this.edges.set(
        sourceNode,
        this.adjacent(sourceNode).filter((targetNodes) => {
          return targetNodes !== targetNode;
        })
      );
    }
    return this;
  }

  // Returns true if there is an edge from node u to node v.
  hasEdge(sourceNode: NodeId, targetNode: NodeId) {
    return this.adjacent(sourceNode).includes(targetNode);
  }

  // Computes the indegree for the given node.
  // Not very efficient, costs O(E) where E = number of edges.
  inbound(node: NodeId) {
    const inboundNodes = new Set<string>();

    this.edges.forEach((targetNodes, sourceNode) => {
      targetNodes.forEach((targetNode) => {
        if (targetNode === node) {
          inboundNodes.add(sourceNode);
        }
      });
    });

    return [...inboundNodes.values()];
  }

  // Computes the outdegree for the given node.
  outbound(node: NodeId) {
    return this.edges.get(node) ?? [];
  }

  // Depth First Search algorithm, inspired by
  // Cormen et al. "Introduction to Algorithms" 3rd Ed. p. 604
  // The additional option `includeSourceNodes` specifies whether to
  // include or exclude the source nodes from the result (true by default).
  // If `sourceNodes` is not specified, all nodes in the graph
  // are used as source nodes.
  depthFirstSearch(
    sourceNodes?: NodeId[],
    includeSourceNodes = true,
    errorOnCycle = false
  ) {
    if (!sourceNodes) {
      sourceNodes = this.nodes;
    }

    const visited: Record<NodeId, boolean> = {};
    const visiting: Record<NodeId, boolean> = {};
    const nodeList: NodeId[] = [];

    const DFSVisit = (node: NodeId) => {
      if (visiting[node] && errorOnCycle) {
        throw new CycleError("Cycle found");
      }
      if (!visited[node]) {
        visited[node] = true;
        visiting[node] = true; // temporary flag while visiting
        this.adjacent(node).forEach(DFSVisit);
        visiting[node] = false;
        nodeList.push(node);
      }
    };

    if (includeSourceNodes) {
      sourceNodes.forEach(DFSVisit);
    } else {
      sourceNodes.forEach((node) => {
        visited[node] = true;
      });
      sourceNodes.forEach((node) => {
        this.adjacent(node).forEach(DFSVisit);
      });
    }

    return nodeList;
  }

  // Returns true if the graph has one or more cycles and false otherwise
  hasCycle(): boolean {
    try {
      this.depthFirstSearch(undefined, true, true);
      // No error thrown -> no cycles
    } catch (error) {
      if (error instanceof CycleError) {
        return true;
      }

      throw error;
    }

    return false;
  }

  // Least Common Ancestors
  // Inspired by https://github.com/relaxedws/lca/blob/master/src/LowestCommonAncestor.php code
  // but uses depth search instead of breadth. Also uses some optimizations
  lowestCommonAncestors(node1: NodeId, node2: NodeId) {
    const node1Ancestors: NodeId[] = [];
    const lcas: NodeId[] = [];

    const CA1Visit = (
      visited: Record<NodeId, boolean>,
      node: NodeId
    ): boolean => {
      if (!visited[node]) {
        visited[node] = true;
        node1Ancestors.push(node);
        if (node == node2) {
          lcas.push(node);
          return false; // found - shortcut
        }
        return this.adjacent(node).every((node) => {
          return CA1Visit(visited, node);
        });
      } else {
        return true;
      }
    };

    const CA2Visit = (visited: Record<NodeId, boolean>, node: NodeId) => {
      if (!visited[node]) {
        visited[node] = true;
        if (node1Ancestors.indexOf(node) >= 0) {
          lcas.push(node);
        } else if (lcas.length == 0) {
          this.adjacent(node).forEach((node) => {
            CA2Visit(visited, node);
          });
        }
      }
    };

    if (CA1Visit({}, node1)) {
      // No shortcut worked
      CA2Visit({}, node2);
    }

    return lcas;
  }

  // The topological sort algorithm yields a list of visited nodes
  // such that for each visited edge (u, v), u comes before v in the list.
  // Amazingly, this comes from just reversing the result from depth first search.
  // Cormen et al. "Introduction to Algorithms" 3rd Ed. p. 613
  topologicalSort(sourceNodes?: NodeId[], includeSourceNodes = true) {
    return this.depthFirstSearch(
      sourceNodes,
      includeSourceNodes,
      true
    ).reverse();
  }

  // Dijkstra's Shortest Path Algorithm.
  // Cormen et al. "Introduction to Algorithms" 3rd Ed. p. 658
  // Variable and function names correspond to names in the book.
  shortestPath(sourceNode: NodeId, targetNode: NodeId) {
    // Upper bounds for shortest path weights from source.
    const d: Record<NodeId, EdgeWeight> = {};

    // Predecessors.
    const p: Record<NodeId, NodeId> = {};

    // Poor man's priority queue, keyed on d.
    let q: Record<NodeId, boolean> = {};

    const initializeSingleSource = () => {
      this.nodes.forEach((node) => {
        d[node] = Infinity;
      });
      if (d[sourceNode] !== Infinity) {
        throw new Error("Source node is not in the graph");
      }
      if (d[targetNode] !== Infinity) {
        throw new Error("Destination node is not in the graph");
      }
      d[sourceNode] = 0;
    };

    // Adds entries in q for all nodes.
    const initializePriorityQueue = () => {
      this.nodes.forEach((node) => {
        q[node] = true;
      });
    };

    // Returns true if q is empty.
    const priorityQueueEmpty = () => {
      return Object.keys(q).length === 0;
    };

    // Linear search to extract (find and remove) min from q.
    const extractMin = (): NodeId | null => {
      let min = Infinity;
      let minNode;
      Object.keys(q).forEach((node) => {
        if (d[node] < min) {
          min = d[node];
          minNode = node;
        }
      });
      if (minNode === undefined) {
        // If we reach here, there's a disconnected subgraph, and we're done.
        q = {};
        return null;
      }
      delete q[minNode];
      return minNode;
    };

    const relax = (u: NodeId, v: NodeId) => {
      const w = this.getEdgeWeight(u, v);
      if (d[v] > d[u] + w) {
        d[v] = d[u] + w;
        p[v] = u;
      }
    };

    const dijkstra = () => {
      initializeSingleSource();
      initializePriorityQueue();
      while (!priorityQueueEmpty()) {
        const u = extractMin();
        if (u === null) return;
        this.adjacent(u).forEach((v) => {
          relax(u as string, v);
        });
      }
    };

    // Assembles the shortest path by traversing the
    // predecessor subgraph from destination to source.
    const path = () => {
      const nodeList: NodeId[] & { weight?: EdgeWeight } = [];
      let weight = 0;
      let node = targetNode;
      while (p[node]) {
        nodeList.push(node);
        weight += this.getEdgeWeight(p[node], node);
        node = p[node];
      }
      if (node !== sourceNode) {
        throw new Error("No path found");
      }
      nodeList.push(node);
      nodeList.reverse();
      nodeList.weight = weight;
      return nodeList;
    };

    dijkstra();

    return path();
  }

  // Serializes the graph.
  serialize() {
    const serialized: Serialized = {
      nodes: this.nodes.map((id) => {
        return { id: id };
      }),
      links: [],
    };

    serialized.nodes.forEach((node) => {
      const source = node.id;
      this.adjacent(source).forEach((target) => {
        serialized.links.push({
          source: source,
          target: target,
          weight: this.getEdgeWeight(source, target),
        });
      });
    });

    return serialized;
  }

  // Deserializes the given serialized graph.
  deserialize(serialized: Serialized) {
    serialized.nodes.forEach((node) => {
      this.addNode(node.id);
    });
    serialized.links.forEach((link) => {
      this.addEdge(link.source, link.target, link.weight);
    });
  }
}
