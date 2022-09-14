import { Graph, NodeId, Serialized, UndirectedGraph } from "../Graph";

function withWeight(
  nodeList: string[] & {
    weight?: number | undefined;
  },
  weight: number
) {
  nodeList.weight = weight;
  return nodeList;
}

describe("Graph", () => {
  describe("Data structure", () => {
    it("Should add nodes and list them.", () => {
      const graph = new Graph();
      graph.addNode("a");
      graph.addNode("b");
      expect(graph.nodes.length).toBe(2);
      expect(graph.nodes).toContain("a");
      expect(graph.nodes).toContain("b");
    });

    it("Should chain addNode.", function () {
      const graph = new Graph().addNode("a").addNode("b");
      expect(graph.nodes.length).toBe(2);
      expect(graph.nodes).toContain("a");
      expect(graph.nodes).toContain("b");
    });

    it("Should remove nodes.", () => {
      const graph = new Graph();
      graph.addNode("a");
      graph.addNode("b");
      graph.removeNode("a");
      graph.removeNode("b");
      expect(graph.nodes.length).toBe(0);
    });

    it("Should chain removeNode.", function () {
      const graph = new Graph()
        .addNode("a")
        .addNode("b")
        .removeNode("a")
        .removeNode("b");
      expect(graph.nodes.length).toBe(0);
    });

    it("Should add edges and query for adjacent nodes.", () => {
      const graph = new Graph();
      graph.addNode("a");
      graph.addNode("b");
      graph.addEdge("a", "b");
      expect(graph.adjacent("a").length).toBe(1);
      expect(graph.adjacent("a")[0]).toBe("b");
    });

    it("Should implicitly add nodes when edges are added.", () => {
      const graph = new Graph();
      graph.addEdge("a", "b");

      expect(graph.adjacent("a").length).toBe(1);
      expect(graph.adjacent("a")[0]).toBe("b");
      expect(graph.nodes.length).toBe(2);
      expect(graph.nodes).toContain("a");
      expect(graph.nodes).toContain("b");
    });

    it("Should add edges.", () => {
      const graph = new Graph();
      graph.addEdge("a", "b");
      expect(graph.adjacent("a").length).toBe(1);
      expect(graph.adjacent("a")[0]).toBe("b");
    });

    it("Should chain addEdge.", () => {
      const graph = new Graph().addEdge("a", "b");
      expect(graph.adjacent("a").length).toBe(1);
      expect(graph.adjacent("a")[0]).toBe("b");
    });

    it("Should remove edges.", () => {
      const graph = new Graph();
      graph.addEdge("a", "b");
      graph.removeEdge("a", "b");
      expect(graph.adjacent("a").length).toBe(0);
    });

    it("Should chain removeEdge.", () => {
      const graph = new Graph();
      graph.addEdge("a", "b");
      graph.removeEdge("a", "b");
      expect(graph.adjacent("a").length).toBe(0);
    });

    // it("Should add edges kommutatively.", () => {
    //   const graph1 = new Graph();
    //   graph1.addEdge(
    //     "c4fdb5fc-453b-421d-92d5-9f6e89a90e0b",
    //     "d9bc01a4-af51-4664-8abd-5b7b69238487"
    //   );
    //   graph1.addEdge(
    //     "d9bc01a4-af51-4664-8abd-5b7b69238487",
    //     "6b9c4966-34dc-4cd4-8eeb-692d9d18da19"
    //   );

    //   const graph2 = new Graph();
    //   graph2.addEdge(
    //     "d9bc01a4-af51-4664-8abd-5b7b69238487",
    //     "6b9c4966-34dc-4cd4-8eeb-692d9d18da19"
    //   );
    //   graph2.addEdge(
    //     "c4fdb5fc-453b-421d-92d5-9f6e89a90e0b",
    //     "d9bc01a4-af51-4664-8abd-5b7b69238487"
    //   );

    //   console.log(graph1, graph2);

    //   expect(graph1.adjacent("a").length).toBe(0);
    // });

    it("Should not remove nodes when edges are removed.", () => {
      const graph = new Graph();
      graph.addEdge("a", "b");
      graph.removeEdge("a", "b");
      expect(graph.nodes.length).toBe(2);
      expect(graph.nodes).toContain("a");
      expect(graph.nodes).toContain("b");
    });

    it("Should remove outgoing edges when a node is removed.", () => {
      const graph = new Graph();
      graph.addEdge("a", "b");
      graph.removeNode("a");
      expect(graph.adjacent("a").length).toBe(0);
    });

    it("Should remove incoming edges when a node is removed.", () => {
      const graph = new Graph();
      graph.addEdge("a", "b");
      graph.removeNode("b");
      expect(graph.adjacent("a").length).toBe(0);
    });

    it("Should compute inbound.", () => {
      const graph = new Graph();
      graph.addEdge("a", "b");
      expect(graph.inbound("a").length).toBe(0);
      expect(graph.inbound("b").length).toBe(1);

      graph.addEdge("c", "b");
      expect(graph.inbound("b").length).toBe(2);
    });

    it("Should compute outbound.", () => {
      const graph = new Graph();
      graph.addEdge("a", "b");
      expect(graph.outbound("a").length).toBe(1);
      expect(graph.outbound("b").length).toBe(0);

      graph.addEdge("a", "c");
      expect(graph.outbound("a").length).toBe(2);
    });

    it("should give the correct entry nodes", () => {
      const graph = new Graph();
      graph.addEdge("a", "b");
      graph.addEdge("b", "c");
      graph.addEdge("c", "d");
      graph.addEdge("c", "e");
      graph.addEdge("f", "c");

      expect(graph.entryNodes).toEqual(["a", "f"]);
    });

    it("should give the correct exit nodes", () => {
      const graph = new Graph();
      graph.addEdge("a", "b");
      graph.addEdge("a", "c");
      graph.addEdge("c", "d");
      graph.addEdge("c", "e");
      graph.addEdge("d", "e");

      expect(graph.exitNodes).toEqual(["b", "e"]);
    });
  });

  describe("Algorithms", () => {
    it("Should detect cycle.", () => {
      const graph = new Graph();
      graph.addEdge("a", "b");
      graph.addEdge("b", "a");
      expect(graph.hasCycle()).toBe(true);
    });

    it("Should detect cycle (long).", () => {
      const graph = new Graph();
      graph.addEdge("a", "b");
      graph.addEdge("b", "c");
      graph.addEdge("c", "d");
      graph.addEdge("d", "a");
      expect(graph.hasCycle()).toBe(true);
    });

    it("Should detect cycle (loop).", () => {
      const graph = new Graph();
      graph.addEdge("a", "a");
      expect(graph.hasCycle()).toBe(true);
    });

    it("Should not detect cycle.", () => {
      const graph = new Graph();
      graph.addEdge("a", "b");
      expect(graph.hasCycle()).toBe(false);
    });

    // This example is from Cormen et al. "Introduction to Algorithms" page 550
    it("Should compute topological sort.", () => {
      const graph = new Graph();

      // Shoes depend on socks.
      // Socks need to be put on before shoes.
      graph.addEdge("socks", "shoes");

      graph.addEdge("shirt", "belt");
      graph.addEdge("shirt", "tie");
      graph.addEdge("tie", "jacket");
      graph.addEdge("belt", "jacket");
      graph.addEdge("pants", "shoes");
      graph.addEdge("underpants", "pants");
      graph.addEdge("pants", "belt");

      const sorted = graph.topologicalSort();

      expect(comesBefore(sorted, "pants", "shoes")).toBe(true);
      expect(comesBefore(sorted, "underpants", "pants")).toBe(true);
      expect(comesBefore(sorted, "underpants", "shoes")).toBe(true);
      expect(comesBefore(sorted, "shirt", "jacket")).toBe(true);
      expect(comesBefore(sorted, "shirt", "belt")).toBe(true);
      expect(comesBefore(sorted, "belt", "jacket")).toBe(true);
      expect(sorted.length).toBe(8);
    });

    it("Should compute topological sort, excluding source nodes.", () => {
      const graph = new Graph();
      graph.addEdge("a", "b");
      graph.addEdge("b", "c");
      const sorted = graph.topologicalSort(["a"], false);
      expect(sorted.length).toBe(2);
      expect(sorted[0]).toBe("b");
      expect(sorted[1]).toBe("c");
    });

    it("Should compute topological sort tricky case.", () => {
      const graph = new Graph(); //      a
      //     / \
      graph.addEdge("a", "b"); //    b   |
      graph.addEdge("a", "d"); //    |   d
      graph.addEdge("b", "c"); //    c   |
      graph.addEdge("d", "e"); //     \ /
      graph.addEdge("c", "e"); //      e

      const sorted = graph.topologicalSort(["a"], false);
      expect(sorted.length).toBe(4);
      expect(sorted).toContain("b");
      expect(sorted).toContain("c");
      expect(sorted).toContain("d");
      expect(sorted[sorted.length - 1]).toBe("e");
      expect(comesBefore(sorted, "b", "c")).toBe(true);
      expect(comesBefore(sorted, "b", "e")).toBe(true);
      expect(comesBefore(sorted, "c", "e")).toBe(true);
      expect(comesBefore(sorted, "d", "e")).toBe(true);
    });

    it("Should exclude source nodes with a cycle.", () => {
      const graph = new Graph();
      graph.addEdge("a", "b");
      graph.addEdge("b", "c");
      graph.addEdge("c", "a");
      const sorted = graph.topologicalSort(["a"], false);

      expect(sorted.length).toBe(2);
      expect(sorted[0]).toBe("b");
      expect(sorted[1]).toBe("c");
    });

    it("Should exclude source nodes with multiple cycles.", () => {
      const graph = new Graph();
      graph.addEdge("a", "b");
      graph.addEdge("b", "a");

      graph.addEdge("b", "c");
      graph.addEdge("c", "b");

      graph.addEdge("a", "c");
      graph.addEdge("c", "a");

      const sorted = graph.topologicalSort(["a", "b"], false);
      expect(sorted).toContain("c");
    });

    it("Should error on non-DAG topological sort", () => {
      const graph = new Graph();
      graph.addEdge("a", "b");
      graph.addEdge("b", "a");
      expect(() => graph.topologicalSort()).toThrow();
    });

    it("Should compute lowest common ancestors.", () => {
      const graph = new Graph();
      graph.addEdge("a", "b");
      graph.addEdge("b", "d");
      graph.addEdge("c", "d");
      graph.addEdge("b", "e");
      graph.addEdge("c", "e");
      graph.addEdge("d", "g");
      graph.addEdge("e", "g");
      graph.addNode("f");

      expect(graph.lowestCommonAncestors("a", "a")).toContain("a");
      expect(graph.lowestCommonAncestors("a", "b")).toContain("b");
      expect(graph.lowestCommonAncestors("a", "c")).toContain("d");
      expect(graph.lowestCommonAncestors("a", "c")).toContain("e");
      expect(graph.lowestCommonAncestors("a", "f")).toEqual([]);
    });
  });

  describe("Edge cases and error handling", () => {
    it("Should return empty array of adjacent nodes for unknown nodes.", () => {
      const graph = new Graph();
      expect(graph.adjacent("a").length).toBe(0);
      expect(graph.nodes.length).toBe(0);
    });

    it("Should do nothing if removing an edge that does not exist.", () => {
      expect(() => {
        const graph = new Graph();
        graph.removeEdge("a", "b");
      }).not.toThrow();
    });

    it("Should return inbound of 0 for unknown nodes.", () => {
      const graph = new Graph();
      expect(graph.inbound("z").length).toBe(0);
    });

    it("Should return outbound of 0 for unknown nodes.", () => {
      const graph = new Graph();
      expect(graph.outbound("z").length).toBe(0);
    });
  });

  describe("Serialization", () => {
    let serialized: any;

    function checkSerialized(graph: Serialized) {
      expect(graph.nodes.length).toBe(3);
      expect(graph.links.length).toBe(2);

      expect(graph.nodes[0].id).toBe("a");
      expect(graph.nodes[1].id).toBe("b");
      expect(graph.nodes[2].id).toBe("c");

      expect(graph.links[0].source).toBe("a");
      expect(graph.links[0].target).toBe("b");
      expect(graph.links[1].source).toBe("b");
      expect(graph.links[1].target).toBe("c");
    }

    it("Should serialize a graph.", () => {
      const graph = new Graph();
      graph.addEdge("a", "b");
      graph.addEdge("b", "c");
      serialized = graph.serialize();
      checkSerialized(serialized);
    });

    it("Should deserialize a graph.", () => {
      const graph = new Graph();
      graph.deserialize(serialized);
      checkSerialized(graph.serialize());
    });

    it("Should chain deserialize a graph.", () => {
      const graph = new Graph();
      graph.deserialize(serialized);
      checkSerialized(graph.serialize());
    });

    it("Should deserialize a graph passed to constructor.", () => {
      const graph = new Graph(serialized);
      checkSerialized(graph.serialize());
    });
  });

  describe("Edge Weights", () => {
    it("Should set and get an edge weight.", () => {
      const graph = new Graph();
      graph.addEdge("a", "b", 5);

      expect(graph.getEdgeWeight("a", "b")).toBe(5);
    });

    it("Should set edge weight via setEdgeWeight.", () => {
      const graph = new Graph();
      graph.addEdge("a", "b");
      graph.setEdgeWeight("a", "b", 5);
      expect(graph.getEdgeWeight("a", "b")).toBe(5);
    });

    it("Should return weight of 1 if no weight set.", () => {
      const graph = new Graph();
      graph.addEdge("a", "b");
      expect(graph.getEdgeWeight("a", "b")).toBe(1);
    });
  });

  describe("Dijkstra's Shortest Path Algorithm", () => {
    it("Should compute shortest path on a single edge.", () => {
      const graph = new Graph();
      graph.addEdge("a", "b");
      expect(graph.shortestPath("a", "b")).toStrictEqual(
        withWeight(["a", "b"], 1)
      );
    });

    it("Should compute shortest path on two edges.", () => {
      const graph = new Graph();
      graph.addEdge("a", "b");
      graph.addEdge("b", "c");

      expect(graph.shortestPath("a", "c")).toStrictEqual(
        withWeight(["a", "b", "c"], 2)
      );
    });

    it("Should compute shortest path on example from Cormen text (p. 659).", () => {
      const graph = new Graph();
      graph.addEdge("s", "t", 10);
      graph.addEdge("s", "y", 5);
      graph.addEdge("t", "y", 2);
      graph.addEdge("y", "t", 3);
      graph.addEdge("t", "x", 1);
      graph.addEdge("y", "x", 9);
      graph.addEdge("y", "z", 2);
      graph.addEdge("x", "z", 4);
      graph.addEdge("z", "x", 6);

      expect(graph.shortestPath("s", "z")).toStrictEqual(
        withWeight(["s", "y", "z"], 5 + 2)
      );

      expect(graph.shortestPath("s", "x")).toStrictEqual(
        withWeight(["s", "y", "t", "x"], 5 + 3 + 1)
      );
    });

    it("Should throw error if source node not in graph.", () => {
      const graph = new Graph();
      graph.addEdge("b", "c");
      expect(() => graph.shortestPath("a", "c")).toThrow(/Source node/);
    });

    it("Should throw error if dest node not in graph.", () => {
      const graph = new Graph();
      graph.addEdge("b", "c");
      expect(() => graph.shortestPath("b", "g")).toThrow(/Destination node/);
    });

    it("Should throw error if no path exists.", () => {
      const graph = new Graph();
      graph.addEdge("a", "b");
      graph.addEdge("d", "e");
      expect(() => graph.shortestPath("a", "e")).toThrow(/No path/);
    });

    it("Should be robust to disconnected subgraphs.", () => {
      const graph = new Graph();
      graph.addEdge("a", "b");
      graph.addEdge("b", "c");
      graph.addEdge("d", "e");
      expect(graph.shortestPath("a", "c")).toStrictEqual(
        withWeight(["a", "b", "c"], 2)
      );
    });
  });

  describe("hadEdge", () => {
    it("Should compute hasEdge.", () => {
      const graph = new Graph();
      graph.addEdge("a", "b");
      expect(graph.hasEdge("a", "b")).toBe(true);
      expect(graph.hasEdge("b", "a")).toBe(false);
      expect(graph.hasEdge("c", "a")).toBe(false);
    });
  });

  describe("findComponents", () => {
    it("Should return all component groupings", () => {
      const graph = new UndirectedGraph();

      graph.addEdge("a", "b");
      graph.addEdge("b", "c");
      graph.addEdge("e", "f");
      graph.addEdge("d", "d");

      const components = graph.findComponents();

      console.log("sdfdsfsf", graph);

      expect(components.length).toBe(3);
      expect(components[0]).toStrictEqual(["a", "b", "c"]);
      expect(components[1]).toStrictEqual(["e", "f"]);
      expect(components[2]).toStrictEqual(["d"]);
    });

    it("Correctly compute components", () => {
      const graph = new UndirectedGraph();

      graph.addEdge(
        "d9bc01a4-af51-4664-8abd-5b7b69238487",
        "6b9c4966-34dc-4cd4-8eeb-692d9d18da19"
      );

      graph.addEdge(
        "c4fdb5fc-453b-421d-92d5-9f6e89a90e0b",
        "d9bc01a4-af51-4664-8abd-5b7b69238487"
      );

      graph.addEdge(
        "4f1dd46c-f486-4673-b584-48d66fa71c59",
        "ca12c082-f266-4e7b-a689-27821a8477f0"
      );
      graph.addEdge(
        "3ad67cb3-06be-4477-b2a6-a59413733a6d",
        "4f1dd46c-f486-4673-b584-48d66fa71c59"
      );

      graph.addEdge(
        "7f02a04e-5c8e-40e9-b9f4-95a9c16fc2c5",
        "53bfbef1-b98f-43b5-a599-0ba874c72f1a"
      );

      const components = graph.findComponents();

      expect(components.length).toBe(3);
    });
  });
});

function comesBefore(arr: NodeId[], a: NodeId, b: NodeId) {
  let aIndex: number | undefined = undefined;
  let bIndex: number | undefined = undefined;
  arr.forEach(function (d, i) {
    if (d === a) {
      aIndex = i;
    }
    if (d === b) {
      bIndex = i;
    }
  });

  if (aIndex != undefined && bIndex != undefined) {
    return aIndex < bIndex;
  } else {
    throw new Error("Indecies not defined");
  }
}
