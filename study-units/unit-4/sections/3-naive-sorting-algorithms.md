# 4.3 Naive Sorts: Exchange Sort and Bubble Sort

Before we reach the elegant efficiency of mergesort, it's worth understanding the simpler — and slower — sorting algorithms that come naturally to most people. This section covers **exchange sort** and its more famous cousin **bubble sort**, and explains exactly why they all land at O(n²).

---

## Exchange Sort

Exchange sort is perhaps the most intuitive sorting algorithm you can write. The idea is almost embarrassingly direct: compare every element with every other element that comes after it, and swap them if they're in the wrong order.

### How It Works
```
for a := 0 to n-1 do
  for b := a+1 to n do
    if arr[a] > arr[b] then swap(arr[a], arr[b])
```

Pick element at position `a`. Then scan every position `b` after it. If you ever find something smaller than `arr[a]`, swap immediately. Then keep scanning. When the inner loop finishes, `arr[a]` holds something — but not necessarily the global minimum. It holds whatever survived all those swaps, which may have changed multiple times.

{% hint style="info" %}
**Think of it as broken selection sort.** Selection sort finds the minimum of the remaining unsorted region *first*, then swaps it into place *once*. Exchange sort skips the "find first" step and just swaps eagerly — which means it may swap the same position many times per outer loop iteration.
{% endhint %}

### Tracing Through an Example

Let's sort `[4, 2, 5, 1, 3]`:
```
Outer loop a=0, arr[0]=4:
  Compare 4 vs 2 → swap → [2, 4, 5, 1, 3]
  Compare 2 vs 5 → no swap
  Compare 2 vs 1 → swap → [1, 4, 5, 2, 3]
  Compare 1 vs 3 → no swap
  arr[0] = 1 ✓ (but took 2 swaps to get there)

Outer loop a=1, arr[1]=4:
  Compare 4 vs 5 → no swap
  Compare 4 vs 2 → swap → [1, 2, 5, 4, 3]
  Compare 2 vs 3 → no swap
  arr[1] = 2 ✓

... and so on
```

Notice that position 0 got swapped twice before landing on `1`. Selection sort would have found `1` first and placed it in one swap.

### Implementation

{% tabs %}
{% tab title="C" %}
```c
void exchange_sort(int arr[], int n) {
    int a, b, hold;

    for (a = 0; a < n - 1; a++) {
        for (b = a + 1; b < n; b++) {
            if (arr[a] > arr[b]) {
                hold    = arr[a];
                arr[a]  = arr[b];
                arr[b]  = hold;
            }
        }
    }
}
```
{% endtab %}

{% tab title="C++" %}
```cpp
#include <vector>
#include <algorithm>

void exchange_sort(std::vector<int>& arr) {
    int n = arr.size();

    for (int a = 0; a < n - 1; a++) {
        for (int b = a + 1; b < n; b++) {
            if (arr[a] > arr[b]) {
                std::swap(arr[a], arr[b]);
            }
        }
    }
}
```
{% endtab %}

{% tab title="Python" %}
```python
def exchange_sort(arr):
    n = len(arr)
    for a in range(n - 1):
        for b in range(a + 1, n):
            if arr[a] > arr[b]:
                arr[a], arr[b] = arr[b], arr[a]
    return arr
```
{% endtab %}
{% endtabs %}

### Where Exchange Sort Sits

Exchange sort lives in an interesting middle ground between **insertion sort** and **selection sort**:

| Algorithm | Swaps per outer loop (average) |
|---|---|
| Selection sort | 1 — finds minimum first, then swaps |
| Exchange sort | Varies — swaps eagerly, may swap multiple times |
| Insertion sort | Up to n — shifts elements one by one |

Exchange sort does **fewer swaps on average than insertion sort**, but **more than selection sort** (which always does exactly 1 swap per outer loop iteration). All three are O(n²) — but the constant factors differ in practice.

---

## Bubble Sort

Bubble sort works differently from exchange sort. Instead of anchoring position `a` and scanning everything ahead of it, bubble sort makes repeated **passes through the whole array**, comparing and swapping adjacent pairs. Larger elements slowly "bubble up" to the right with each pass.

There are three natural versions of bubble sort, each a refinement of the last.

---

### Version 1 — The Pure O(n²) Algorithm
```python
def bubble_sort_v1(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr
```

This is textbook O(n²) in the most literal sense possible. The outer loop runs exactly `n` times. The inner loop runs exactly `n − 1` times. Every single time. No matter what.
```
Total iterations = n × (n − 1) = n² − n
```

Even if the array is already sorted, both loops run to completion. Even on the last pass, when there's nothing left to do, it still checks every adjacent pair. This is the **worst case locked in as the only case** — upper, lower, and average bound are all exactly Θ(n²).

---

### Version 2 — Shrinking the Inner Loop
```python
def bubble_sort_v2(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr
```

This version exploits a key observation: **after each pass, the largest unsorted element has bubbled all the way to its final position at the right end**. So the next pass doesn't need to go that far.

After pass 1 → last element is in place, inner loop can stop 1 earlier  
After pass 2 → last 2 elements are in place, inner loop stops 2 earlier  
After pass k → last k elements are in place

The inner loop shrinks from `n−1` down to `1`:
```
Pass 1: n−1 comparisons  →  █████████
Pass 2: n−2 comparisons  →  ████████
Pass 3: n−3 comparisons  →  ███████
Pass 4: n−4 comparisons  →  ██████
...
Pass n: 1   comparison   →  █
```

Stack them together and you get a **triangle**. The area of that triangle is exactly:

$$\sum_{k=1}^{n-1} k = \frac{n(n-1)}{2} = \frac{n^2 - n}{2}$$

Expanding:

$$\frac{n^2 - n}{2}$$

Big-O drops the constant factor and the lower-order term:

$$\frac{n^2 - n}{2} \longrightarrow O(n^2)$$

The dominant term is n², so despite doing roughly **half the work** of Version 1 in practice, it is still classified as O(n²). The triangle is half the square — but a half-square still grows quadratically.

{% hint style="info" %}
Version 2 is strictly faster than Version 1 in practice — roughly 2× fewer comparisons — but both belong to the same complexity class. Big-O ignores constant factors.
{% endhint %}

This version still has no early exit. Even if the array becomes sorted halfway through, the outer loop continues running until all `n` passes are done. Best, worst, and average case are all still Θ(n²).

---

### Version 3 — The Early Exit Optimisation
```python
def bubble_sort_v3(arr):
    n = len(arr)
    for i in range(n):
        swapped = False
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
                swapped = True
        if not swapped:
            break
    return arr
```

This is a small change with a significant consequence. We introduce a boolean flag `swapped`. At the start of each pass, it's set to `False`. If any swap happens during the pass, it's flipped to `True`. After the pass, we check: **if no swaps occurred, the array must already be sorted**, and we stop immediately.

### Why This Changes the Complexity

In Versions 1 and 2, the best case and worst case were the same: Θ(n²). There was no way out early. The loops always ran to completion.

Version 3 breaks this symmetry.

**Worst case** — A reverse-sorted array like `[5, 4, 3, 2, 1]`: every pass has swaps, the flag never stays `False`, and we go through all n passes. **O(n²) — unchanged.**

**Best case** — An already-sorted array like `[1, 2, 3, 4, 5]`: the very first pass makes zero swaps, `swapped` stays `False`, and we exit after just one full scan of the array. That single scan costs **O(n)** — a dramatic improvement.

**Average case** — Now lives somewhere *between* O(n) and O(n²). For a random array, the algorithm will typically need several passes before it detects a clean pass with no swaps, but it won't always need all n passes. The average case is still O(n²) in the formal sense — for most random inputs the algorithm needs O(n) passes — but in practice Version 3 is noticeably faster than Versions 1 and 2 on partially sorted data.
```
Version 1:  Best = Θ(n²),  Average = Θ(n²),  Worst = Θ(n²)
Version 2:  Best = Θ(n²),  Average = Θ(n²),  Worst = Θ(n²)
Version 3:  Best = Ω(n),   Average = O(n²),   Worst = O(n²)
```

The best case dropping to Ω(n) means the average can now genuinely vary. With Versions 1 and 2, every input forced quadratic behaviour — there was no "lucky" input. With Version 3, nearly-sorted arrays can exit very early, shifting the average down toward the lower end. The algorithm is now **adaptive**: it responds to the structure of the input.

{% hint style="success" %}
This is the key insight of the early-exit optimisation: it doesn't improve the worst case at all, but it opens up a gap between best and worst case that didn't exist before. That gap is where real-world performance improvements live.
{% endhint %}

### Implementation — All Three Versions

{% tabs %}
{% tab title="Version 1" %}

{% tabs %}
{% tab title="C" %}
```c
void bubble_sort_v1(int arr[], int n) {
    int i, j, temp;
    for (i = 0; i < n; i++) {
        for (j = 0; j < n - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                temp        = arr[j];
                arr[j]      = arr[j + 1];
                arr[j + 1]  = temp;
            }
        }
    }
}
```
{% endtab %}

{% tab title="C++" %}
```cpp
#include <vector>
#include <algorithm>

void bubble_sort_v1(std::vector<int>& arr) {
    int n = arr.size();
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                std::swap(arr[j], arr[j + 1]);
            }
        }
    }
}
```
{% endtab %}

{% tab title="Python" %}
```python
def bubble_sort_v1(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr
```
{% endtab %}
{% endtabs %}

{% endtab %}

{% tab title="Version 2" %}

{% tabs %}
{% tab title="C" %}
```c
void bubble_sort_v2(int arr[], int n) {
    int i, j, temp;
    for (i = 0; i < n; i++) {
        for (j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                temp        = arr[j];
                arr[j]      = arr[j + 1];
                arr[j + 1]  = temp;
            }
        }
    }
}
```
{% endtab %}

{% tab title="C++" %}
```cpp
#include <vector>
#include <algorithm>

void bubble_sort_v2(std::vector<int>& arr) {
    int n = arr.size();
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                std::swap(arr[j], arr[j + 1]);
            }
        }
    }
}
```
{% endtab %}

{% tab title="Python" %}
```python
def bubble_sort_v2(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr
```
{% endtab %}
{% endtabs %}

{% endtab %}

{% tab title="Version 3" %}

{% tabs %}
{% tab title="C" %}
```c
void bubble_sort_v3(int arr[], int n) {
    int i, j, temp;
    int swapped;

    for (i = 0; i < n; i++) {
        swapped = 0;
        for (j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                temp        = arr[j];
                arr[j]      = arr[j + 1];
                arr[j + 1]  = temp;
                swapped     = 1;
            }
        }
        if (!swapped) break;
    }
}
```
{% endtab %}

{% tab title="C++" %}
```cpp
#include <vector>
#include <algorithm>

void bubble_sort_v3(std::vector<int>& arr) {
    int n = arr.size();
    for (int i = 0; i < n; i++) {
        bool swapped = false;
        for (int j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                std::swap(arr[j], arr[j + 1]);
                swapped = true;
            }
        }
        if (!swapped) break;
    }
}
```
{% endtab %}

{% tab title="Python" %}
```python
def bubble_sort_v3(arr):
    n = len(arr)
    for i in range(n):
        swapped = False
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
                swapped = True
        if not swapped:
            break
    return arr
```
{% endtab %}
{% endtabs %}

{% endtab %}
{% endtabs %}

---

## Summary

| Algorithm | Best Case | Average Case | Worst Case | Notes |
|---|---|---|---|---|
| Exchange Sort | Ω(n²) | Θ(n²) | O(n²) | Eager swapping; more swaps than selection sort |
| Bubble Sort v1 | Ω(n²) | Θ(n²) | O(n²) | Exact n² iterations; no optimisation |
| Bubble Sort v2 | Ω(n²) | Θ(n²) | O(n²) | ~half the comparisons; still Θ(n²) |
| Bubble Sort v3 | Ω(n) | O(n²) | O(n²) | Adaptive; exits early on sorted input |

{% hint style="warning" %}
All of these algorithms are O(n²) and are generally unsuitable for large datasets. Their value is pedagogical — they illustrate clearly how nested loops produce quadratic complexity, and how small optimisations can improve practical performance without changing the asymptotic class.
{% endhint %}