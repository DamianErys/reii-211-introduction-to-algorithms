Here's the full Chapter 3.2 content formatted for GitBook:

---

# 3.2 Containers: Stacks and Queues

A **container** is an abstract data type that stores and retrieves data items independent of their content. This distinguishes them from *dictionaries* (Section 3.3), which retrieve based on key values.

What sets one container apart from another is its **retrieval order**. The two most important containers both base retrieval order on insertion order.

---

## Stacks

A stack supports **last-in, first-out (LIFO)** retrieval. The two core operations are:

- **Push(x, s):** Insert item x at the top of stack s.
- **Pop(s):** Return and remove the top item of stack s.

Stacks are simple to implement and highly efficient. When retrieval order doesn't matter at all — such as processing batch jobs — a stack is usually the right default choice.

LIFO order arises naturally in many contexts. People packed into a subway car exit in LIFO order. Algorithmically, LIFO appears throughout recursive execution: each function call pushes a frame onto the call stack, and returns pop it off.

{% tabs %}
{% tab title="Python" %}
```python
stack = []

stack.append(1)   # push
stack.append(2)
stack.append(3)

top = stack.pop() # pop → 3
```
Python lists serve as stacks out of the box. `append()` is push; `pop()` is pop. Both run in **O(1) amortised**.
{% endtab %}
{% tab title="C" %}
```c
#define MAX 1000

typedef struct {
    int data[MAX];
    int top;
} Stack;

void push(Stack *s, int x) {
    s->data[s->top++] = x;
}

int pop(Stack *s) {
    return s->data[--s->top];
}
```
A fixed-size array with a `top` index is the simplest stack implementation in C. Both operations are **O(1)**.
{% endtab %}
{% tab title="C++" %}
```cpp
#include <stack>

std::stack<int> s;

s.push(1);
s.push(2);
s.push(3);

int top = s.top();  // peek → 3
s.pop();            // remove top
```
The STL `std::stack` is a thin adapter over `std::deque` by default. All operations are **O(1)**.
{% endtab %}
{% endtabs %}

---

## Queues

A queue supports **first-in, first-out (FIFO)** retrieval. The two core operations are:

- **Enqueue(x, q):** Insert item x at the back of queue q.
- **Dequeue(q):** Return and remove the front item of queue q.

FIFO is the fairest way to manage waiting — it minimises the *maximum* time any item spends waiting. Queues are somewhat trickier to implement than stacks, making them most appropriate when order genuinely matters, such as in simulations or scheduling.

Queues will appear again as the fundamental data structure behind **breadth-first search (BFS)** in graphs.

{% tabs %}
{% tab title="Python" %}
```python
from collections import deque

queue = deque()

queue.append(1)     # enqueue
queue.append(2)
queue.append(3)

front = queue.popleft()  # dequeue → 1
```
Use `collections.deque` rather than a plain list. `list.pop(0)` is **O(n)** because every remaining element shifts; `deque.popleft()` is **O(1)**.
{% endtab %}
{% tab title="C" %}
```c
#define MAX 1000

typedef struct {
    int data[MAX];
    int front, back;
} Queue;

void enqueue(Queue *q, int x) {
    q->data[q->back++ % MAX] = x;
}

int dequeue(Queue *q) {
    return q->data[q->front++ % MAX];
}
```
The modulo keeps indices wrapping around the fixed buffer — this is a **circular array** queue, which avoids wasted space as front and back advance. Both operations are **O(1)**.
{% endtab %}
{% tab title="C++" %}
```cpp
#include <queue>

std::queue<int> q;

q.push(1);   // enqueue
q.push(2);
q.push(3);

int front = q.front();  // peek → 1
q.pop();                // dequeue
```
`std::queue` wraps `std::deque` and exposes only the FIFO interface. All operations are **O(1)**.
{% endtab %}
{% endtabs %}

---

## Implementation

Both stacks and queues can be backed by either an **array** or a **linked list**. The key question is whether you know an upper bound on the container's size in advance:

- **Known upper bound → static array.** Simple, cache-friendly, zero allocation overhead.
- **Unknown or unbounded size → linked list or dynamic array.** Grows on demand at the cost of allocation overhead and (for linked lists) pointer indirection.

In practice, most standard libraries use a dynamic array or circular buffer, which combines the cache performance of contiguous memory with the flexibility to grow.

{% hint style="info" %}
The stack and queue abstractions say nothing about *how* they are stored — only *how* they behave. The same LIFO or FIFO contract can be satisfied by an array, a linked list, or anything else that supports the two required operations.
{% endhint %}

---

## Comparison

| | Stack | Queue |
|---|---|---|
| Retrieval order | LIFO | FIFO |
| Core operations | push / pop | enqueue / dequeue |
| Implementation complexity | Simple | Slightly more involved |
| Typical use cases | Recursion, undo history, expression parsing | BFS, scheduling, simulations |
| Operation cost | O(1) push and pop | O(1) enqueue and dequeue |

