
# Priority Queues

Sorting gives you a one-time ordered sequence. A **priority queue** does something more flexible: it lets new items arrive at any time, always giving you efficient access to the most important one. Rather than re-sorting everything on each new arrival, the priority queue maintains order incrementally.

The three core operations are:

- **Insert(Q, x)** — Add item x to the priority queue.
- **Find-Minimum(Q)** — Return the item with the smallest key, without removing it.
- **Delete-Minimum(Q)** — Remove and return the item with the smallest key.

A real-world mental model: a hospital triage system. New patients arrive continuously and are assessed for urgency on arrival (Insert). The most critical patient is always treated next (Delete-Minimum), regardless of when they arrived. Re-sorting every waiting patient each time someone new walks in would be absurd — a priority queue handles this naturally.

---

## Implementation Trade-offs

The right implementation depends on which operations dominate your workload. The key insight is maintaining a cached pointer to the current minimum, so Find-Minimum is always O(1) regardless of the underlying structure:

| | Unsorted Array | Sorted Array | Balanced BST |
|---|---|---|---|
| Insert | O(1) | O(n) | O(log n) |
| Find-Minimum | O(1)* | O(1)* | O(1)* |
| Delete-Minimum | O(n) | O(1) | O(log n) |

\* Achieved by maintaining a cached pointer to the minimum element.

The trick behind Find-Minimum being O(1) everywhere: keep a separate variable pointing to the current minimum. On each Insert, update it if the new item is smaller. On Delete-Minimum, delete the cached element and pay the cost of one search to find the new minimum — this search cost gets folded into the deletion's complexity.

For the sorted array, storing elements in **reverse order** (largest first) means the minimum always sits at the tail. Deletion is then just a decrement of the count — no shifting required.

{% tabs %}
{% tab title="Python" %}
```python
import heapq

pq = []
heapq.heappush(pq, 5)
heapq.heappush(pq, 1)
heapq.heappush(pq, 3)

minimum = pq[0]              # Find-Minimum: O(1)
smallest = heapq.heappop(pq) # Delete-Minimum: O(log n)
```
Python's `heapq` implements a binary min-heap — the most practical priority queue structure, covered in depth in Section 4.3.
{% endtab %}
{% tab title="C" %}
```c
/* Simple unsorted array priority queue */
typedef struct {
    int data[1000];
    int n;
    int min_idx;
} PriorityQueue;

void insert(PriorityQueue *pq, int x) {
    pq->data[pq->n] = x;
    if (pq->n == 0 || x < pq->data[pq->min_idx])
        pq->min_idx = pq->n;
    pq->n++;
}

int find_minimum(PriorityQueue *pq) {
    return pq->data[pq->min_idx];  /* O(1) via cached pointer */
}
```
{% endtab %}
{% tab title="C++" %}
```cpp
#include <queue>

/* Min-heap via priority_queue with greater<> comparator */
std::priority_queue<int,
    std::vector<int>,
    std::greater<int>> pq;

pq.push(5);
pq.push(1);
pq.push(3);

int minimum = pq.top();  // Find-Minimum: O(1)
pq.pop();                // Delete-Minimum: O(log n)
```
By default `std::priority_queue` is a max-heap. Passing `std::greater<int>` flips it to a min-heap.
{% endtab %}
{% endtabs %}

{% hint style="info" %}
**Take-Home Lesson:** Building algorithms around clean abstractions like priority queues leads to both clearer structure and good performance. The heap — the most efficient concrete priority queue implementation — will be covered in Section 4.3.
{% endhint %}
