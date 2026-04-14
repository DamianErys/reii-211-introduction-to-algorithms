
# 3.3 Dictionaries

A **dictionary** is an abstract data type that retrieves data items by content rather than by position. The three primary operations are:

- **Search(D, k)** — Return a pointer to the element with key k, if it exists.
- **Insert(D, x)** — Add data item x to the dictionary.
- **Delete(D, x)** — Given a pointer to item x, remove it from the dictionary.

Some dictionary implementations also support useful secondary operations:

- **Max(D) / Min(D)** — Retrieve the item with the largest or smallest key. This enables a dictionary to serve as a priority queue (Section 3.5).
- **Predecessor(D, x) / Successor(D, x)** — Retrieve the item whose key immediately precedes or follows x in sorted order, enabling sorted traversal.

A typical use case: removing duplicates from a mailing list and printing results in sorted order. Insert each name into an empty dictionary D, skipping any already present. Then traverse from `Min(D)` to `Max(D)` via repeated `Successor` calls — the result is a sorted, deduplicated list, achieved without ever thinking about the underlying storage.

{% hint style="info" %}
More powerful dictionary implementations — binary search trees (Section 3.4) and hash tables (Section 3.7) — are the practical choices in most real programs. This section focuses on the simpler array-based foundations that motivate why those structures exist.
{% endhint %}

---

## A Note on Types: Structs and Typedefs

Before looking at dictionary implementations, it's worth understanding how to define the record types that dictionaries store. This is one place where C, C++, and Python diverge significantly.

{% tabs %}
{% tab title="Python" %}
Python has no explicit type system for structs. The idiomatic equivalent is either a `dataclass` or a plain class:

```python
from dataclasses import dataclass

@dataclass
class Item:
    key: int
    value: str
```

You get type hints for documentation, but Python doesn't enforce them at runtime. No typedef equivalent is needed — classes are already first-class names.
{% endtab %}
{% tab title="C" %}
C has two ways to name a struct, and the difference matters.

**Without typedef — must use the `struct` keyword every time:**
```c
struct Item {
    int key;
    char value[64];
};

struct Item a;   /* must write 'struct Item', not just 'Item' */
```

**With typedef — creates an alias so you can drop the `struct` keyword:**
```c
typedef struct {
    int key;
    char value[64];
} Item;

Item a;   /* cleaner; 'Item' is now a proper type name */
```

There is also a third form that names both the struct tag and the typedef, which is useful when the struct needs to refer to itself (e.g., a linked list node):
```c
typedef struct Node {
    int data;
    struct Node *next;  /* must use 'struct Node' here, not just 'Node' */
} Node;
```

Here `struct Node` is the *tag* (visible inside the struct definition) and `Node` is the *typedef alias* (usable everywhere after the definition closes). The tag is necessary because the typedef alias isn't complete until the closing `}` — so self-referential structs always need the tag form.

In short: use the anonymous `typedef struct { ... } Name;` form for simple records, and the tagged `typedef struct Name { ... } Name;` form whenever the struct needs to point to itself.
{% endtab %}
{% tab title="C++" %}
C++ makes `typedef` largely unnecessary for structs. Struct names are automatically usable as type names without any qualifier:

```cpp
struct Item {
    int key;
    std::string value;
};

Item a;   /* works immediately — no typedef needed */
```

`typedef` still exists in C++ but is mostly used for aliasing complex types. The modern C++ equivalent is `using`:

```cpp
using KeyType = int;           /* alias a primitive */
using ItemPtr = Item*;         /* alias a pointer type */
```

For self-referential structures, C++ handles it the same way as tagged C structs — the struct name is available as a tag inside its own definition:

```cpp
struct Node {
    int data;
    Node* next;   /* 'Node' is already valid here in C++ */
};
```

This is cleaner than C because you don't need to write `struct Node*` — the name `Node` alone is enough.
{% endtab %}
{% endtabs %}

---

## Arrays as Dictionaries

### Unsorted Array

| Operation | Cost | Why |
|---|---|---|
| Search | O(n) | Must scan every element |
| Insert | O(1) | Write to A[n], increment n |
| Delete | O(1)* | Overwrite with A[n], decrement n |
| Successor / Predecessor | O(n) | Must sweep to find next-largest |
| Min / Max | O(n) | Must sweep entire array |

\* The O(1) delete uses the swap trick: overwrite the deleted element with the last element, then shrink the array by one. This only works because the array is unsorted — order is irrelevant, so the swap causes no harm.

{% tabs %}
{% tab title="Python" %}
```python
def search(arr, k):
    for i, item in enumerate(arr):
        if item['key'] == k:
            return i
    return -1

def insert(arr, x):
    arr.append(x)          # O(1) amortised

def delete(arr, i):
    arr[i] = arr[-1]       # overwrite with last
    arr.pop()              # O(1)
```
{% endtab %}
{% tab title="C" %}
```c
typedef struct { int key; } Item;

int search(Item arr[], int n, int k) {
    for (int i = 0; i < n; i++)
        if (arr[i].key == k) return i;
    return -1;
}

void insert(Item arr[], int *n, Item x) {
    arr[(*n)++] = x;
}

void delete(Item arr[], int *n, int i) {
    arr[i] = arr[*n - 1];
    (*n)--;
}
```
{% endtab %}
{% tab title="C++" %}
```cpp
struct Item { int key; };

int search(std::vector<Item>& arr, int k) {
    for (int i = 0; i < arr.size(); i++)
        if (arr[i].key == k) return i;
    return -1;
}

void insert(std::vector<Item>& arr, Item x) {
    arr.push_back(x);
}

void delete_item(std::vector<Item>& arr, int i) {
    arr[i] = arr.back();
    arr.pop_back();
}
```
{% endtab %}
{% endtabs %}

### Sorted Array

Maintaining sorted order reverses the trade-offs almost entirely:

| Operation | Cost | Why |
|---|---|---|
| Search | O(log n) | Binary search |
| Insert | O(n) | Must shift elements to make room |
| Delete | O(n) | Must shift elements to close the gap |
| Successor | O(1) | A[x+1] |
| Predecessor | O(1) | A[x-1] |
| Min | O(1) | A[0] |
| Max | O(1) | A[n-1] |

The traversal and extremum operations become trivial. But every modification now costs O(n) — the price of keeping everything in order.

{% hint style="info" %}
**Take-Home Lesson:** Data structure design must balance all the operations it supports. The fastest structure for both operation A and B may not be the fastest for either A or B alone. There is no free lunch — every gain in one operation tends to cost somewhere else.
{% endhint %}

---

## The Design Trade-Off

The two array implementations sit at opposite ends of a spectrum:

| | Unsorted Array | Sorted Array |
|---|---|---|
| Search | O(n) | O(log n) |
| Insert | O(1) | O(n) |
| Delete | O(1) | O(n) |
| Successor / Predecessor | O(n) | O(1) |
| Min / Max | O(n) | O(1) |

Neither is strictly better. If your workload is write-heavy with rare lookups, the unsorted array wins. If you need fast search and frequent traversal with infrequent modification, the sorted array is better.

This tension — fast reads vs. fast writes — is what motivates the more sophisticated structures in the sections ahead. Binary search trees (Section 3.4) and hash tables (Section 3.7) each resolve the trade-off differently, and understanding *why* begins here.
