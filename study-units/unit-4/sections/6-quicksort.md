# 4.6 Quicksort: Sorting by Partitioning

Quicksort is the "aggressive" cousin of Mergesort. While Mergesort carefully splits first and does the hard work during the merge, Quicksort does the **hard work upfront by partitioning** and then simply lets recursion handle the rest.

{% hint style="info" %}
**Core idea:** Pick an element (the **pivot**). Rearrange the array so everything smaller than the pivot is on the left and everything larger is on the right. Repeat for both sides.
{% endhint %}

---

## How It Actually Works

Let's trace sorting `[2, 8, 7, 1, 3, 5, 6, 4]` all the way down to the final sorted array.

---

### Pass 1 — Full Array, Pivot = `4`

We use two pointers: `i` (the boundary for small elements) and `j` (our scanner).

1. `j` finds `2`: `2 < 4` → swap `2` with itself, advance `i`.
2. `j` finds `8`: `8 > 4` → do nothing.
3. `j` finds `7`: `7 > 4` → do nothing.
4. `j` finds `1`: `1 < 4` → swap `1` with `8`, advance `i`.
5. `j` finds `3`: `3 < 4` → swap `3` with `7`, advance `i`.
6. `j` finds `5`: `5 > 4` → do nothing.
7. `j` finds `6`: `6 > 4` → do nothing.
8. End of scan → swap pivot `4` into the boundary position.

**Result:**
```
[2, 1, 3] | 4 | [5, 6, 8, 7]
```
`4` is now in its **permanent sorted position** at index 3.

---

### Pass 2 — Left subarray `[2, 1, 3]`, Pivot = `3`

1. `j` finds `2`: `2 < 3` → swap `2` with itself, advance `i`.
2. `j` finds `1`: `1 < 3` → swap `1` with itself, advance `i`.
3. End of scan → swap pivot `3` into the boundary position.

**Result:**
```
[2, 1] | 3
```
`3` is now in its **permanent sorted position**.

---

### Pass 3 — Left subarray `[2, 1]`, Pivot = `1`

1. `j` finds `2`: `2 > 1` → do nothing.
2. End of scan → swap pivot `1` into the boundary position (index 0).

**Result:**
```
1 | [2]
```
Both `1` and `2` are now in their **permanent sorted positions** (a single-element subarray is trivially sorted).

**Left side is fully sorted: `[1, 2, 3, 4, ...]`**

---

### Pass 4 — Right subarray `[5, 6, 8, 7]`, Pivot = `7`

1. `j` finds `5`: `5 < 7` → swap `5` with itself, advance `i`.
2. `j` finds `6`: `6 < 7` → swap `6` with itself, advance `i`.
3. `j` finds `8`: `8 > 7` → do nothing.
4. End of scan → swap pivot `7` into the boundary position.

**Result:**
```
[5, 6] | 7 | [8]
```
`7` and `8` are now in their **permanent sorted positions**.

---

### Pass 5 — Left subarray `[5, 6]`, Pivot = `6`

1. `j` finds `5`: `5 < 6` → swap `5` with itself, advance `i`.
2. End of scan → swap pivot `6` into the boundary position.

**Result:**
```
5 | 6
```
Both `5` and `6` are now in their **permanent sorted positions**.

---

### Final Result

Assembling all the pieces:

```
[1, 2, 3, 4, 5, 6, 7, 8] ✓
```

---

## Why the Partition Works

The magic of Quicksort is that the partition step achieves two goals at once:

1. The **pivot** is placed in its final resting place.
2. The array is **segregated**: no element on the left will ever need to swap with an element on the right.

> Unlike Mergesort, which requires an extra array ($$O(n)$$ space) to merge, Quicksort swaps elements **in-place**.

---

## Understanding the Complexity

### The Best Case: $$O(n \log n)$$

If our pivot always lands near the middle, we halve the problem size every time (just like Mergesort).

* **Levels:** $$\log_2 n$$
* **Work per level:** $$O(n)$$ to scan and swap.
* **Total:** $$O(n \log n)$$

### The Worst Case: $$O(n^2)$$

If we pick a terrible pivot (like the smallest or largest element every time), we only reduce the problem size by **one** element per level.

* **Levels:** $$n$$
* **Work per level:** $$O(n)$$
* **Total:** $$O(n^2)$$

{% hint style="warning" %}
This worst case occurs when the array is already sorted and we always pick the last element as the pivot!
{% endhint %}

### The Solution: Randomization

To avoid the $$O(n^2)$$ trap, we don't just pick the last element. We pick a **random** element and swap it to the end to be our pivot. This makes it statistically impossible to hit the worst case on any input.

---

## Implementation (Standard Partition)

{% tabs %}
{% tab title="C" %}

```c
#include <stdio.h>

void swap(int *a, int *b) {
    int tmp = *a;
    *a = *b;
    *b = tmp;
}

int partition(int arr[], int low, int high) {
    int pivot = arr[high];
    int i = low;
    for (int j = low; j < high; j++) {
        if (arr[j] < pivot) {
            swap(&arr[i], &arr[j]);
            i++;
        }
    }
    swap(&arr[i], &arr[high]);
    return i;
}

void quicksort(int arr[], int low, int high) {
    if (low < high) {
        int p = partition(arr, low, high);
        quicksort(arr, low, p - 1);
        quicksort(arr, p + 1, high);
    }
}
```

{% endtab %}

{% tab title="C++" %}

```cpp
#include <algorithm>
#include <vector>

int partition(std::vector<int>& arr, int low, int high) {
    int pivot = arr[high];
    int i = low;
    for (int j = low; j < high; j++) {
        if (arr[j] < pivot) {
            std::swap(arr[i], arr[j]);
            i++;
        }
    }
    std::swap(arr[i], arr[high]);
    return i;
}

void quicksort(std::vector<int>& arr, int low, int high) {
    if (low < high) {
        int p = partition(arr, low, high);
        quicksort(arr, low, p - 1);
        quicksort(arr, p + 1, high);
    }
}
```

{% endtab %}

{% tab title="Python" %}

```python
def quicksort(arr, low, high):
    if low < high:
        p = partition(arr, low, high)
        quicksort(arr, low, p - 1)
        quicksort(arr, p + 1, high)

def partition(arr, low, high):
    pivot = arr[high]
    i = low
    for j in range(low, high):
        if arr[j] < pivot:
            arr[i], arr[j] = arr[j], arr[i]
            i += 1
    arr[i], arr[high] = arr[high], arr[i]
    return i
```

{% endtab %}
{% endtabs %}

---

## Summary

| Property | Quicksort |
| --- | --- |
| **Worst case** | $$O(n^2)$$ (rare with randomization) |
| **Average case** | $$\Theta(n \log n)$$ |
| **Space** | $$O(\log n)$$ (stack space) |
| **Stable?** | No |
| **Best for** | General purpose sorting, in-memory arrays |

{% hint style="success" %}
Quicksort is usually **2–3× faster** than Mergesort in practice because its inner loop is incredibly simple and it plays nicely with CPU caches (it doesn't jump between different arrays).
{% endhint %}