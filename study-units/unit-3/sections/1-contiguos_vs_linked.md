# 3.1 Contiguous vs. Linked Data Structures

Every data structure is built on one of two physical foundations: a 
**contiguous block of memory** (arrays) or **chunks of memory connected 
by pointers** (linked structures). Everything else — stacks, queues, 
trees, hash tables — is built on top of one of these two ideas.

The choice matters more than it might seem at first. The same logical 
operation (say, deleting an element) can be trivial on one and expensive 
on the other.

---
## Arrays

### Searching

{% tabs %}
{% tab title="Searching" %}
### Searching an Array

**Unsorted array:** You have no choice but to check each element one by one until you find a match — or run out of elements. This is **O(n)** in the worst case.

**Sorted array:** You can use binary search. Start at the middle, and depending on whether your target is higher or lower, discard half the remaining elements and repeat. This gives **O(log n)** — a dramatic improvement for large arrays.

{% tabs %}
{% tab title="Python" %}
```python
def binary_search(arr, target):
    low, high = 0, len(arr) - 1
    while low <= high:
        mid = (low + high) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            low = mid + 1
        else:
            high = mid - 1
    return -1
```
{% endtab %}
{% tab title="C" %}
```c
int binary_search(int arr[], int n, int target) {
    int low = 0, high = n - 1;
    while (low <= high) {
        int mid = low + (high - low) / 2;
        if (arr[mid] == target)
            return mid;
        else if (arr[mid] < target)
            low = mid + 1;
        else
            high = mid - 1;
    }
    return -1;
}
```
{% endtab %}
{% tab title="C++" %}
```cpp
int binary_search(const std::vector<int>& arr, int target) {
    int low = 0, high = static_cast<int>(arr.size()) - 1;
    while (low <= high) {
        int mid = low + (high - low) / 2;
        if (arr[mid] == target)
            return mid;
        else if (arr[mid] < target)
            low = mid + 1;
        else
            high = mid - 1;
    }
    return -1;
}
```
{% endtab %}
{% endtabs %}

Binary search is only possible because arrays give you **random access** — you can jump to the middle element in O(1). A linked list cannot do this.
{% endtab %}

{% tab title="Deleting" %}
### Deleting from an Array

Deletion is straightforward if you know the index, but it leaves a hole that needs to be dealt with.

**Unsorted array:** The cleanest solution is to overwrite the deleted element with the last element in the array, then decrement the length counter. No shifting required — this runs in **O(1)**.

**Sorted array:** You can't use the swap trick without destroying the ordering. Every element after the deleted one must shift one position left — **O(n)** in the worst case.

{% tabs %}
{% tab title="Python" %}
```python
def delete_by_index(arr, i):
    arr[i] = arr[-1]
    arr.pop()
```
{% endtab %}
{% tab title="C" %}
```c
void delete_by_index(int arr[], int *n, int i) {
    arr[i] = arr[*n - 1];
    (*n)--;
}
```
{% endtab %}
{% tab title="C++" %}
```cpp
void delete_by_index(std::vector<int>& arr, int i) {
    arr[i] = arr.back();
    arr.pop_back();
}
```
{% endtab %}
{% endtabs %}

The key insight is that deletion is only cheap when you don't care about order. As soon as sorted order matters, arrays make deletion expensive.
{% endtab %}

{% tab title="Appending" %}
### Appending to an Array

Adding to the end of an array is the best-case scenario.

In Python, lists are **dynamic arrays** under the hood. When you call `.append()`, it adds to the end in **O(1) amortised** time. Occasionally the underlying array runs out of space and must be resized — Python allocates a new block roughly double the size and copies everything over. This copy is O(n), but it happens so rarely that the average cost per append is still constant.

{% tabs %}
{% tab title="Python" %}
```python
arr = [1, 2, 3]
arr.append(4)  # O(1) amortised
```
{% endtab %}
{% tab title="C" %}
```c
/* C has no built-in dynamic array; manual growth shown for illustration */
void append(int **arr, int *n, int *capacity, int value) {
    if (*n == *capacity) {
        *capacity *= 2;
        *arr = realloc(*arr, *capacity * sizeof(int));
    }
    (*arr)[(*n)++] = value;
}
```
{% endtab %}
{% tab title="C++" %}
```cpp
std::vector<int> arr = {1, 2, 3};
arr.push_back(4);  // O(1) amortised
```
{% endtab %}
{% endtabs %}

The word *amortised* is important here. No individual operation is guaranteed to be O(1) — but the total cost across n appends is O(n), so the average is O(1). Think of it like a bus fare: each journey is cheap, and occasionally you top up your card, but the average cost per trip stays the same.
{% endtab %}

{% tab title="Inserting" %}
### Inserting into an Array

Inserting at an arbitrary position is costly.

Every element from the insertion point to the end must shift one place to the right to make room. In the worst case — inserting at index 0 — every element moves. This is **O(n)**.

{% tabs %}
{% tab title="Python" %}
```python
arr = [1, 2, 4, 5]
arr.insert(2, 3)  # inserts 3 at index 2 → [1, 2, 3, 4, 5]
```
{% endtab %}
{% tab title="C" %}
```c
void insert_at(int arr[], int *n, int i, int value) {
    for (int j = *n; j > i; j--)
        arr[j] = arr[j - 1];
    arr[i] = value;
    (*n)++;
}
```
{% endtab %}
{% tab title="C++" %}
```cpp
std::vector<int> arr = {1, 2, 4, 5};
arr.insert(arr.begin() + 2, 3);  // → [1, 2, 3, 4, 5]
```
{% endtab %}
{% endtabs %}

This is one of the main weaknesses of arrays. If your workload involves frequent insertion in the middle of a sequence, an array is the wrong choice.
{% endtab %}
{% endtabs %}

---

## Pointers and Linked Structures

*(diagram and hints unchanged)*

{% tabs %}
{% tab title="Searching" %}
### Searching a Linked List

There is no shortcut here. Regardless of whether the list is sorted, you must start at the head and follow pointers until you find the target or reach the end. This is **O(n)** always.

{% tabs %}
{% tab title="Python" %}
```python
class Node:
    def __init__(self, data):
        self.data = data
        self.next = None

def search(head, target):
    current = head
    while current:
        if current.data == target:
            return current
        current = current.next
    return None
```
{% endtab %}
{% tab title="C" %}
```c
typedef struct Node {
    int data;
    struct Node *next;
} Node;

Node* search(Node *head, int target) {
    while (head) {
        if (head->data == target)
            return head;
        head = head->next;
    }
    return NULL;
}
```
{% endtab %}
{% tab title="C++" %}
```cpp
struct Node {
    int data;
    Node* next;
    Node(int d) : data(d), next(nullptr) {}
};

Node* search(Node* head, int target) {
    while (head) {
        if (head->data == target)
            return head;
        head = head->next;
    }
    return nullptr;
}
```
{% endtab %}
{% endtabs %}

Sorting a linked list does offer one minor benefit: if you pass the value you're looking for, you can stop early. But the worst case remains O(n). Binary search is not possible on a linked list — to reach the middle element you would have to traverse half the list first, which defeats the purpose entirely.
{% endtab %}

{% tab title="Deleting" %}
### Deleting from a Linked List

This is where the singly vs. doubly linked distinction really matters.

**Singly linked:** You only have a pointer to the node you want to delete, not to its predecessor. You have to traverse the list from the head to find who points to it — **O(n)**.

**Doubly linked:** Each node already holds a pointer to its predecessor. You can rewire the pointers immediately — **O(1)**.

{% tabs %}
{% tab title="Python" %}
```python
# Doubly linked deletion (given the node to delete)
def delete_node(node):
    if node.prev:
        node.prev.next = node.next
    if node.next:
        node.next.prev = node.prev
```
{% endtab %}
{% tab title="C" %}
```c
typedef struct DNode {
    int data;
    struct DNode *prev, *next;
} DNode;

void delete_node(DNode *node) {
    if (node->prev)
        node->prev->next = node->next;
    if (node->next)
        node->next->prev = node->prev;
    free(node);
}
```
{% endtab %}
{% tab title="C++" %}
```cpp
struct DNode {
    int data;
    DNode *prev, *next;
    DNode(int d) : data(d), prev(nullptr), next(nullptr) {}
};

void delete_node(DNode* node) {
    if (node->prev) node->prev->next = node->next;
    if (node->next) node->next->prev = node->prev;
    delete node;
}
```
{% endtab %}
{% endtabs %}

No elements shift. No memory is copied. The surrounding nodes simply update where they point.
{% endtab %}

{% tab title="Appending" %}
### Appending to a Linked List

If you maintain a pointer to the tail of the list, appending is **O(1)**. Allocate a new node, point the current tail at it, update the tail pointer.

{% tabs %}
{% tab title="Python" %}
```python
class LinkedList:
    def __init__(self):
        self.head = None
        self.tail = None

    def append(self, data):
        new_node = Node(data)
        if self.tail:
            self.tail.next = new_node
        else:
            self.head = new_node
        self.tail = new_node
```
{% endtab %}
{% tab title="C" %}
```c
typedef struct List {
    Node *head, *tail;
} List;

void append(List *list, int data) {
    Node *new_node = malloc(sizeof(Node));
    new_node->data = data;
    new_node->next = NULL;
    if (list->tail)
        list->tail->next = new_node;
    else
        list->head = new_node;
    list->tail = new_node;
}
```
{% endtab %}
{% tab title="C++" %}
```cpp
class LinkedList {
public:
    Node* head = nullptr;
    Node* tail = nullptr;

    void append(int data) {
        Node* new_node = new Node(data);
        if (tail)
            tail->next = new_node;
        else
            head = new_node;
        tail = new_node;
    }
};
```
{% endtab %}
{% endtabs %}

Without a tail pointer, you would have to walk the entire list to find the end — **O(n)**. Maintaining that extra pointer is almost always worth it.
{% endtab %}

{% tab title="Inserting" %}
### Inserting into a Linked List

Once you have a pointer to the insertion point, rewiring two pointers is all it takes — **O(1)**.

{% tabs %}
{% tab title="Python" %}
```python
def insert_after(given_node, new_data):
    new_node = Node(new_data)
    new_node.next = given_node.next
    given_node.next = new_node
```
{% endtab %}
{% tab title="C" %}
```c
void insert_after(Node *given_node, int new_data) {
    Node *new_node = malloc(sizeof(Node));
    new_node->data = new_data;
    new_node->next = given_node->next;
    given_node->next = new_node;
}
```
{% endtab %}
{% tab title="C++" %}
```cpp
void insert_after(Node* given_node, int new_data) {
    Node* new_node = new Node(new_data);
    new_node->next = given_node->next;
    given_node->next = new_node;
}
```
{% endtab %}
{% endtabs %}

No elements shift. No memory is reallocated. The catch is getting to the insertion point in the first place — if you have to search for it, that search is O(n) regardless.
{% endtab %}
{% endtabs %}

---
Today's computers have gigabytes of RAM, so the extra memory used by 
pointer fields in a linked list is rarely a concern in practice. What 
matters more is **time** — specifically, how the choice of structure 
affects the operations your program performs most often.

| Operation | Unsorted Array | Sorted Array | Singly Linked | Doubly Linked |
|---|---|---|---|---|
| Search | O(n) | O(log n) | O(n) | O(n) |
| Append | O(1)* | O(n) | O(1)** | O(1)** |
| Insert at position | O(n) | O(n) | O(1)*** | O(1)*** |
| Delete | O(1)* | O(n) | O(n) | O(1) |
| Access by index | O(1) | O(1) | O(n) | O(n) |

\* Amortised for dynamic arrays; requires the swap trick for deletion.  
\** Requires a tail pointer.  
\*** Given a pointer to the insertion point; finding that point is O(n).

{% hint style="info" %}
The right question is never "which structure is faster?" but rather 
**"which operations does my program perform most, and which structure 
makes those cheapest?"** A structure that excels at search may be poor 
at insertion, and vice versa.
{% endhint %}