# 4.2 Pragmatics of Sorting

Before diving into algorithms, there's a practical question to settle: **in what order do we actually want things sorted?** The answer is always application-specific.

## Key Considerations

{% tabs %}
{% tab title="Increasing or Decreasing?" %}
A set of keys is in **ascending order** when Sᵢ ≤ Sᵢ₊₁ for all 1 ≤ i < n, and **descending order** when Sᵢ ≥ Sᵢ₊₁. Different applications call for different directions — there is no universal default.
{% endtab %}

{% tab title="Key or Full Record?" %}
Sorting a dataset means maintaining integrity across complex records. A mailing list sorted by name must keep names linked to their addresses and phone numbers. Always identify the **key field** and understand the full extent of each record.
{% endtab %}

{% tab title="Equal Keys?" %}
Equal keys bunch together in any total order, but their **relative ordering may matter**. You may need secondary keys to break ties meaningfully.

Sorting algorithms that preserve the original relative order of equal elements are called **stable**. Few fast algorithms are naturally stable — but stability can be achieved in any algorithm by appending the element's original index as a secondary key.

{% hint style="warning" %}
Certain algorithms (notably quicksort) can degrade to **quadratic performance** if not explicitly engineered to handle large numbers of equal keys.
{% endhint %}
{% endtab %}

{% tab title="Non-Numerical Data?" %}
Alphabetising text strings involves surprisingly complex rules — punctuation, case sensitivity, hyphenation. Is `Skiena` the same key as `skiena`? Does `Brown-Williams` come before or after `Brown, John`?

These decisions belong in a **comparison function**, not hardcoded into the algorithm.
{% endtab %}
{% endtabs %}

## The Comparison Function

The clean solution to all of the above is to abstract ordering logic into a **pairwise comparison function** passed as an argument to your sort routine. It takes pointers to two elements a and b and returns:

- `< 0` if a belongs before b
- `> 0` if b belongs before a  
- `0` if they are equal

{% hint style="info" %}
Any reasonable language has a built-in sort routine. Use it — you are almost always better off than writing your own.
{% endhint %}

{% tabs %}
{% tab title="C" %}
```c
#include <stdlib.h>

/* Sort integers in increasing order */
int intcompare(int *i, int *j)
{
    if (*i > *j) return (1);
    if (*i < *j) return (-1);
    return (0);
}

/* Sort first n elements of array a */
qsort(a, n, sizeof(int), intcompare);
```

`qsort` sorts the first `nel` elements of the array at `base`, where each element is `width` bytes wide — making it generic across chars, ints, or arbitrary structs.
{% endtab %}

{% tab title="C++" %}
```cpp
#include <algorithm>
#include <vector>

std::vector<int> a = {5, 2, 8, 1};

// Using a lambda as the comparison function
std::sort(a.begin(), a.end(), [](int i, int j) {
    return i < j;
});
```
{% endtab %}

{% tab title="Python" %}
```python
a = [5, 2, 8, 1]

# key function specifies what to sort by
a.sort(key=lambda x: x)

# For descending order
a.sort(key=lambda x: x, reverse=True)

# For complex records, e.g. sort by second field
records.sort(key=lambda x: x[1])
```
{% endtab %}
{% endtabs %}