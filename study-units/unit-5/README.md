# Study Unit 5: Graphs

Graphs are among the most expressive data structures in computer science. 
Almost any problem involving relationships, networks, dependencies, or 
reachability can be modelled as a graph — and once it is, a small set of 
well-understood algorithms becomes immediately applicable.

This study unit is built on Chapters 7 and 8 of Skiena's *The Algorithm 
Design Manual*. It covers how graphs are defined, stored, and traversed, 
and develops the core algorithms that operate on them.

---

## Study Outcomes

By the end of this unit you should be able to:

- Identify and describe the fundamental properties of a graph (directed, 
  weighted, sparse, cyclic, etc.) and explain how each property affects 
  algorithm and data structure choice.

- Implement an adjacency list representation of a graph and construct one 
  from raw data such as a CSV edge list.

- Explain the three-state vertex model (undiscovered, discovered, processed) 
  and use it to reason about the correctness of any graph traversal.

- Implement breadth-first search and use it to find connected components 
  and shortest paths in unweighted graphs.

- Implement depth-first search, interpret entry and exit timestamps, and 
  classify edges as tree edges or back edges.

- Apply DFS to detect cycles and identify articulation vertices and bridges 
  in an undirected graph.

- Implement Prim's and Kruskal's algorithms for finding a minimum spanning 
  tree, and explain why greedy choices produce a globally optimal result.

- Implement Dijkstra's algorithm for single-source shortest paths on 
  non-negative weighted graphs, and recover the actual path using the 
  parent array.

- Recognise the structural relationship between Prim's algorithm and 
  Dijkstra's algorithm, and articulate the single difference between them.

---

## Sections

| Section | Topic |
|---|---|
| 5.1 | Flavours of Graphs |
| 5.2 | Data Structures for Graphs |
| 5.3 | Traversing a Graph |
| 5.4 | Breadth-First Search |
| 5.5 | Depth-First Search |
| 5.6 | Applications of BFS and DFS |
| 5.7 | Minimum Spanning Trees |
| 5.8 | Shortest Paths |

---