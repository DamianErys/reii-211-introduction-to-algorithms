# Growth Rates and Dominance Relations

## Why Constant Factors Don't Matter

Big Oh notation discards multiplicative constants entirely. The functions *f(n) = 0.001n²* and *g(n) = 1000n²* are treated as identical, even though one is a million times larger than the other for every value of *n*.

This might seem reckless. The justification becomes clear when you look at what actually drives runtime differences between algorithms — and it is almost never the constant factor. It is the **growth rate**.

## The Growth Rate Table

The table below shows how long algorithms with common time complexities take to run on a machine executing one operation per nanosecond (10⁻⁹ seconds):

| *n* | lg *n* | *n* | *n* lg *n* | *n*² | 2*ⁿ* | *n*! |
|-------------|----------|----------|------------|----------|------------|------------------|
| 10 | 0.003 μs | 0.01 μs | 0.033 μs | 0.1 μs | 1 μs | 3.63 ms |
| 20 | 0.004 μs | 0.02 μs | 0.086 μs | 0.4 μs | 1 ms | 77.1 years |
| 30 | 0.005 μs | 0.03 μs | 0.147 μs | 0.9 μs | 1 sec | 8.4 × 10¹⁵ yrs |
| 40 | 0.005 μs | 0.04 μs | 0.213 μs | 1.6 μs | 18.3 min | — |
| 50 | 0.006 μs | 0.05 μs | 0.282 μs | 2.5 μs | 13 days | — |
| 100 | 0.007 μs | 0.1 μs | 0.644 μs | 10 μs | 4 × 10¹³ yrs | — |
| 1,000 | 0.010 μs | 1.00 μs | 9.966 μs | 1 ms | — | — |
| 10,000 | 0.013 μs | 10 μs | 130 μs | 100 ms | — | — |
| 100,000 | 0.017 μs | 0.10 ms | 1.67 ms | 10 sec | — | — |
| 1,000,000 | 0.020 μs | 1 ms | 19.93 ms | 16.7 min | — | — |
| 10,000,000 | 0.023 μs | 0.01 sec | 0.23 sec | 1.16 days | — | — |
| 100,000,000 | 0.027 μs | 0.10 sec | 2.66 sec | 115.7 days | — | — |
| 1,000,000,000 | 0.030 μs | 1 sec | 29.90 sec | 31.7 years | — | — |

The conclusions are striking:

- For *n = 10*, all these algorithms finish in roughly the same time — growth class barely matters at small scales.
- **Factorial** algorithms become completely useless at *n ≥ 20*. At *n = 30*, the runtime exceeds the age of the universe.
- **Exponential** algorithms have a slightly wider operating range but are impractical beyond *n > 40*.
- **Quadratic** algorithms remain usable up to around *n = 10,000* but deteriorate rapidly. For *n > 1,000,000* they are essentially hopeless.
- **Linear and *n* lg *n*** algorithms remain practical even at one billion items.
- **Logarithmic** algorithms barely register any cost at all, for any conceivable input size.

{% hint style="info" %}
This table is why we are comfortable ignoring constant factors. Whether your quadratic algorithm runs at *0.001n²* or *1000n²*, both become unusable around the same input size. The growth class tells you almost everything you need to know about practical scalability.
{% endhint %}

## Dominance Relations

Big Oh groups functions into equivalence classes. All functions that are *Θ(n)* are essentially the same — *f(n) = 0.34n* and *g(n) = 234,234n* belong to the same class and are treated identically.

When two functions belong to **different** classes, one will eventually and permanently outpace the other. We say that a faster-growing function **dominates** a slower-growing one. If *f(n) = O(g(n))* but *g(n) ≠ O(f(n))*, then *g* dominates *f*, written *g ≫ f*.

The dominance hierarchy for the most common function classes, from slowest to fastest growing, is:

**1 ≪ log *n* ≪ *n* ≪ *n* log *n* ≪ *n*² ≪ *n*³ ≪ 2*ⁿ* ≪ *n*!**

Each class in this hierarchy is a different world from the ones around it. Here is what each one represents in practice:

**Constant — f(n) = 1:** The cost does not depend on input size at all. Adding two numbers, returning a value, or checking a single condition all take constant time regardless of how large the problem is.

**Logarithmic — f(n) = log n:** These functions grow extremely slowly. Binary search is the canonical example — doubling the input adds only one extra step. Algorithms in this class are essentially free at any practical scale.

**Linear — f(n) = n:** The cost of examining each element in a collection once. Finding the maximum, computing a sum, or scanning for a target value are all linear operations.

**Superlinear — f(n) = n log n:** This is the complexity class of the best general-purpose sorting algorithms, including mergesort and quicksort. They grow only slightly faster than linear, but enough to occupy a higher dominance class.

**Quadratic — f(n) = n²:** The cost of examining all pairs of elements. Simple sorting algorithms like insertion sort and selection sort fall here. Workable for moderate inputs, but the first class to become problematic as scale increases.

**Cubic — f(n) = n³:** The cost of examining all triples of elements. Some dynamic programming algorithms operate at this complexity. Usable only for relatively small inputs.

**Exponential — f(n) = 2ⁿ:** The cost of enumerating all subsets of a set. These algorithms become impractical rapidly — *n = 40* is roughly the ceiling.

**Factorial — f(n) = n!:** The cost of enumerating all permutations. Already astronomical at *n = 20*. These algorithms are practically unusable except on tiny inputs.

{% hint style="warning" %}
When you analyse an algorithm and find it falls into the exponential or factorial class, that is not a signal to optimise — it is a signal to reconsider the entire approach. No constant-factor improvement will rescue an algorithm whose growth rate is fundamentally untenable.
{% endhint %}