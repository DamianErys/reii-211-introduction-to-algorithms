# 5.3 Traversing a Graph

The most fundamental graph problem is to visit every vertex and edge in a systematic way. This is not just an academic exercise — printing a graph, copying it, converting between representations, and almost every higher-level algorithm (shortest paths, connectivity, cycle detection) all reduce to traversal at their core.

---

## The Maze Analogy

Graphs and mazes are natural partners. Each junction in a maze is a vertex; each passageway is an edge. Any graph traversal algorithm must be powerful enough to escape an arbitrary maze — and to do so efficiently, without wandering in circles.

Two requirements follow immediately:

- **Correctness** — the traversal must be systematic enough to guarantee every reachable vertex is eventually visited.
- **Efficiency** — we must never visit the same place twice, or we risk looping forever.

The classical solution to both problems is the same one used in fairy tales: leave a mark. In algorithms, that mark is a state flag on each vertex.

---

## Vertex States

At any point during a traversal, every vertex is in exactly one of three states:

| State | Meaning |
|---|---|
| **Undiscovered** | Not yet seen|
| **Discovered** | Found, but not all its edges have been examined yet |
| **Processed** | All incident edges have been fully explored |

States only move forward — undiscovered → discovered → processed — and a vertex can never skip directly from undiscovered to processed. This ordering is what makes the traversal well-defined.

---

## The Work Queue

To manage the frontier between what we know and what we haven't explored yet, we maintain a structure holding all **discovered but not yet processed** vertices. Initially this contains only the start vertex.

The core loop is:

1. Take a discovered vertex v from the structure.
2. For each edge (v, u) leaving v:
   - If u is **undiscovered** — mark it discovered and add it to the structure.
   - If u is **discovered or processed** — ignore it. It is already accounted for.
3. Mark v as **processed**.

The choice of data structure in step 1 — queue vs. stack — is what distinguishes the two major traversal strategies covered in the next two sections.

---

## Why Does This Find Everything?

Suppose some vertex u remains unvisited after the traversal ends, but u has a neighbour v that was visited. Eventually v gets processed — and at that point, every edge leaving v is examined, including (v, u). So u would have been discovered. Contradiction.

This argument shows that every vertex reachable from the start vertex must be found. For a **connected** graph, that means the entire graph. For a **disconnected** graph, a single traversal from one start vertex covers only its connected component — you must restart from an unvisited vertex to cover the rest.

---

## Edge Accounting

Each **undirected edge** (x, y) is considered exactly twice during traversal: once when x is being processed (examining its neighbour y) and once when y is being processed (examining its neighbour x). Each **directed edge** is considered exactly once, when its source vertex is processed.

This gives a clean total cost: **Θ(n + m)** — linear in the size of the graph, regardless of traversal strategy. No edge is wasted; no vertex is revisited.

{% hint style="info" %}
**Take-Home Lesson:** The three-state vertex model — undiscovered, discovered, processed — is the foundation of both BFS and DFS. The only difference between the two algorithms is the order in which discovered vertices are pulled off the work structure. Everything else is identical.
{% endhint %}