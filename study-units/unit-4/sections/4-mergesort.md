# 4.5 Mergesort: Sorting by Divide and Conquer

Mergesort is built on a simple insight: **splitting a problem in half repeatedly until it's trivial, then carefully combining the results back up**.

{% hint style="info" %}
**Core idea:** A single element is always sorted. Two sorted halves can be merged into one sorted whole efficiently. Therefore — split everything down to single elements, then merge back up.
{% endhint %}

---

## How It Actually Works

Let's trace through sorting `[38, 27, 43, 3]` step by step.

### Step 1 — Split all the way down

Keep halving until every subarray has one element:
```
[38, 27, 43, 3]
    /          \
[38, 27]     [43, 3]
  /    \       /   \
[38]  [27]  [43]   [3]
```

Single elements are trivially sorted. Now we work **back up**.

### Step 2 — Merge pairs

To merge two sorted lists, use a **two-pointer approach**: always pick the smaller of the two front elements.
```
Merge [38] and [27]:
  Compare 38 vs 27 → take 27
  Nothing left to compare → take 38
  Result: [27, 38] ✓

Merge [43] and [3]:
  Compare 43 vs 3 → take 3
  Nothing left to compare → take 43
  Result: [3, 43] ✓
```

### Step 3 — Merge the merged halves
```
Merge [27, 38] and [3, 43]:
  Compare 27 vs 3  → take 3   → [3]
  Compare 27 vs 43 → take 27  → [3, 27]
  Compare 38 vs 43 → take 38  → [3, 27, 38]
  Nothing left to compare → take 43
  Result: [3, 27, 38, 43] ✓
```

The key insight is that **the merge step costs at most n − 1 comparisons** for two lists totalling n elements — because every comparison places exactly one element, and the last element needs no comparison at all.

---

## Why the Merge Works

Two sorted lists always have their **smallest remaining element at the front**. So at each step you only need to look at two elements — the heads of each list — and take the smaller one. You never need to look further into either list.
```
Left:  [1, 4, 7]
Right: [2, 3, 9]

Step 1: 1 vs 2 → take 1   →  result: [1]
Step 2: 4 vs 2 → take 2   →  result: [1, 2]
Step 3: 4 vs 3 → take 3   →  result: [1, 2, 3]
Step 4: 4 vs 9 → take 4   →  result: [1, 2, 3, 4]
Step 5: 7 vs 9 → take 7   →  result: [1, 2, 3, 4, 7]
Step 6: nothing left on left → take 9
Final:  [1, 2, 3, 4, 7, 9] ✓
```

---

## Understanding the O(n log n) Complexity

This is where it gets interesting. Let's build the intuition from the ground up.

### The recursion tree

Every time mergesort runs, it splits into two halves. We can draw this as a tree:
```
Level 0:  [•••••••• n elements ••••••••]          → 1 merge of n elements
Level 1:  [•••• n/2 ••••] [•••• n/2 ••••]         → 2 merges of n/2 elements
Level 2:  [•n/4•][•n/4•] [•n/4•][•n/4•]           → 4 merges of n/4 elements
  ...
Level k:  2ᵏ subarrays of n/2ᵏ elements each
  ...
Level lg n: [•][•][•][•]...[•]                     → n subarrays of 1 element
```

### Work done per level

At level k there are **2ᵏ merge operations**, each on a subarray of **n/2ᵏ elements**:
```
Work at level k = (number of merges) × (cost per merge)
               = 2ᵏ × O(n/2ᵏ)
               = O(n)
```

The 2ᵏ and 2ᵏ cancel — **every level costs exactly O(n) work**, regardless of which level it is.

### Number of levels

How many times can you halve n before reaching 1? You're asking: how many times can you divide n by 2?
```
n → n/2 → n/4 → n/8 → ... → 1
```

That's **log₂ n levels**.

### Putting it together
```
Total work = (work per level) × (number of levels)
           = O(n)             × O(log n)
           = O(n log n)
```

### Upper, Average, and Lower Bounds

{% tabs %}
{% tab title="Upper Bound O(n log n)" %}
The **worst case** for mergesort is when every merge step requires the maximum number of comparisons — this happens when the two halves interleave perfectly (no early exhaustion of either list).

At each of the lg n levels, we do at most n − 1 comparisons across all merges on that level. So total comparisons ≤ n lg n.

**Worst case: O(n log n)**

This is tight — mergesort hits this bound on adversarial inputs like perfectly interleaved sorted halves.
{% endtab %}

{% tab title="Average Case Θ(n log n)" %}
Across all possible input permutations, the expected number of comparisons during each merge is still proportional to n. The split is always exactly in half regardless of input, so the recursion tree always has exactly lg n levels.

Unlike quicksort, the structure of mergesort does **not** depend on the values in the array — only the size matters. This means there is no lucky or unlucky input that changes the tree shape.

**Average case: Θ(n log n)** — same as worst case.
{% endtab %}

{% tab title="Lower Bound Ω(n log n)" %}
Can any comparison-based sorting algorithm do better than n log n?

**No.** Here's why:

- There are n! possible orderings of n elements
- Each comparison splits the remaining possibilities in two at best
- To distinguish between n! outcomes, you need at least log₂(n!) comparisons

By Stirling's approximation: log₂(n!) ≈ n log₂ n − n log₂ e ∈ Ω(n log n)

This means **no comparison-based algorithm can sort faster than Ω(n log n)** in the worst case. Mergesort achieves this bound — it is **optimal** among comparison sorts.
{% endtab %}
{% endtabs %}

---

## The Auxiliary Buffer Problem

Mergesort has one practical drawback with arrays: **you cannot merge two halves of an array in-place safely**.

Consider merging `{4, 5, 6}` and `{1, 2, 3}` packed side-by-side in one array:
```
[4, 5, 6, 1, 2, 3]
 ^           ^
 |           |
 left half   right half
```

The first element placed would overwrite position 0 with `1`, destroying the `4` before it's been used. To avoid this, mergesort copies each half into a temporary buffer before merging back.

{% hint style="warning" %}
This means mergesort requires **O(n) auxiliary space** when sorting arrays. For linked lists however, no extra space is needed — you simply re-link pointers, making mergesort the preferred algorithm for linked list sorting.
{% endhint %}

---

## Implementation

{% tabs %}
{% tab title="C" %}
```c
void merge(item_type s[], int low, int middle, int high) {
    int i;
    queue buffer1, buffer2;

    init_queue(&buffer1);
    init_queue(&buffer2);

    // Copy each half into a separate buffer
    for (i = low; i <= middle; i++)       enqueue(&buffer1, s[i]);
    for (i = middle + 1; i <= high; i++)  enqueue(&buffer2, s[i]);

    i = low;

    // Merge: always take the smaller front element
    while (!(empty_queue(&buffer1) || empty_queue(&buffer2))) {
        if (headq(&buffer1) <= headq(&buffer2))
            s[i++] = dequeue(&buffer1);
        else
            s[i++] = dequeue(&buffer2);
    }

    // Drain whichever buffer still has elements
    while (!empty_queue(&buffer1)) s[i++] = dequeue(&buffer1);
    while (!empty_queue(&buffer2)) s[i++] = dequeue(&buffer2);
}

void merge_sort(item_type s[], int low, int high) {
    int middle;
    if (low < high) {
        middle = (low + high) / 2;
        merge_sort(s, low, middle);
        merge_sort(s, middle + 1, high);
        merge(s, low, middle, high);
    }
}
```
{% endtab %}

{% tab title="C++" %}
```cpp
#include <vector>
#include <algorithm>

void merge(std::vector<int>& arr, int low, int mid, int high) {
    // Copy halves into temporary vectors
    std::vector<int> left(arr.begin() + low, arr.begin() + mid + 1);
    std::vector<int> right(arr.begin() + mid + 1, arr.begin() + high + 1);

    int i = 0, j = 0, k = low;

    // Merge: always take the smaller front element
    while (i < left.size() && j < right.size()) {
        if (left[i] <= right[j])
            arr[k++] = left[i++];
        else
            arr[k++] = right[j++];
    }

    // Drain whichever half still has elements
    while (i < left.size())  arr[k++] = left[i++];
    while (j < right.size()) arr[k++] = right[j++];
}

void mergeSort(std::vector<int>& arr, int low, int high) {
    if (low < high) {
        int mid = (low + high) / 2;
        mergeSort(arr, low, mid);
        mergeSort(arr, mid + 1, high);
        merge(arr, low, mid, high);
    }
}
```
{% endtab %}

{% tab title="Python" %}
```python
def merge_sort(arr):
    if len(arr) <= 1:
        return arr

    mid = len(arr) // 2
    left  = merge_sort(arr[:mid])
    right = merge_sort(arr[mid:])

    return merge(left, right)

def merge(left, right):
    result = []
    i = j = 0

    # Always take the smaller front element
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            result.append(left[i])
            i += 1
        else:
            result.append(right[j])
            j += 1

    # Drain whichever half still has elements
    result.extend(left[i:])
    result.extend(right[j:])

    return result
```
{% endtab %}
{% endtabs %}

---

## Summary

| Property | Mergesort |
|---|---|
| Worst case | O(n log n) |
| Average case | Θ(n log n) |
| Best case | Ω(n log n) |
| Space | O(n) auxiliary |
| Stable? | Yes |
| Best for | Linked lists, external sorting, guaranteed performance |

{% hint style="success" %}
Mergesort is one of the few sorting algorithms that is **optimal in all cases** — its worst case matches the theoretical lower bound for comparison sorting. The cost is extra memory.
{% endhint %}