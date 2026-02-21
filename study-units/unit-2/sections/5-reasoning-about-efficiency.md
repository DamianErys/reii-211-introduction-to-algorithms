# Reasoning about Efficiency

## From Rules to Practice

The previous sections established the rules of Big Oh analysis. This section applies those rules to real algorithms, building the intuition needed to analyse code by inspection. We work through four examples of increasing complexity.

## Selection Sort

Selection sort works by repeatedly scanning the unsorted portion of the array, identifying the smallest remaining element, and swapping it into its final position. After *i* iterations, the first *i* elements are sorted and will never be touched again.
```c
void selection_sort(item_type s[], int n) {
    int i, j;
    int min;

    for (i = 0; i < n; i++) {
        min = i;
        for (j = i + 1; j < n; j++) {
            if (s[j] < s[min]) {
                min = j;
            }
        }
        swap(&s[i], &s[min]);
    }
}
```

The outer loop runs *n* times. On iteration *i*, the inner loop scans from position *i+1* to the end — that is, *n − (i+1)* comparisons. The total number of comparisons is:

> *T(n) = (n−1) + (n−2) + (n−3) + ... + 2 + 1*

This is the sum of integers from 1 to *n−1*. One way to reason about it: there are roughly *n* terms, and their average value is about *n/2*, giving *T(n) ≈ n²/2 = O(n²)*.

**Proving the Theta** requires both an upper and lower bound. For the upper bound: there are at most *n* terms, each at most *n−1*, so *T(n) ≤ n(n−1) = O(n²)*. For the lower bound: the first *n/2* terms are each greater than *n/2*, so *T(n) ≥ (n/2)(n/2) = Ω(n²)*. Together: selection sort is *Θ(n²)*.

{% hint style="info" %}
Selection sort is unusual among sorting algorithms in that it takes **exactly the same time on every input** of size *n*. There is no best case or worst case — every arrangement of *n* elements requires the same *n(n−1)/2* comparisons, because the inner loop always scans the entire remaining unsorted region regardless of what is in it.
{% endhint %}

## Insertion Sort

Insertion sort works differently. It builds the sorted portion of the array one element at a time, taking each new element and **sliding it leftward** through the sorted region, swapping it with each predecessor that is larger, until it reaches its correct position. Elements do not jump to their final position in one step — they migrate there through a chain of adjacent swaps.
```c
for (i = 1; i < n; i++) {
    j = i;
    while ((j > 0) && (s[j] < s[j-1])) {
        swap(&s[j], &s[j-1]);
        j = j - 1;
    }
}
```

The inner while loop has two stopping conditions: it stops if the element has reached the front of the array (*j > 0* fails), or if it has found its correct position (*s[j] < s[j-1]* fails). For worst-case analysis, we ignore the early termination and assume the inner loop always runs the maximum possible number of iterations — at most *i* times on the *i*th iteration, and at most *n* times since *i < n*.

The outer loop runs *n* times. The inner loop runs at most *n* times. Multiplying gives *O(n²)*.

{% hint style="warning" %}
This "round it up" approach — assuming every loop runs its maximum possible iterations — always produces a **correct** Big Oh upper bound, though it can occasionally be pessimistic. It is the right starting point for any loop-based analysis.
{% endhint %}

**Proving the Theta** requires identifying the worst-case input. The worst case for insertion sort occurs when the array is given in **reverse sorted order**. Every newly inserted element is smaller than everything already sorted, so it must slide all the way to the front. Each of the last *n/2* elements must make at least *n/2* swaps, giving at least *(n/2)² = Ω(n²)* total work.

### Comparing the Two Sorts

Both algorithms are *Θ(n²)*, but they behave very differently in practice:

- **Selection sort** always does exactly *n(n−1)/2* comparisons, regardless of input order. It never terminates early.
- **Insertion sort** can terminate the inner loop early when the element finds its position. On a nearly-sorted array, it can approach *O(n)* behaviour. On a reverse-sorted array, it degrades to its full *Θ(n²)* cost.

This distinction matters in practice even when two algorithms share the same asymptotic class.

## String Pattern Matching

Pattern matching is the problem of finding where a short pattern string *p* (of length *m*) first appears within a longer text string *t* (of length *n*).
```c
int findmatch(char *p, char *t) {
    int i, j;
    int plen, tlen;

    plen = strlen(p);
    tlen = strlen(t);

    for (i = 0; i <= (tlen - plen); i++) {
        j = 0;
        while ((j < plen) && (t[i+j] == p[j])) {
            j = j + 1;
        }
        if (j == plen) return(i);
    }
    return(-1);
}
```

The outer loop tries each possible starting position in *t* — at most *n − m* positions, since the pattern cannot start so late that it overhangs the end of the text. The inner while loop matches characters one at a time, running at most *m* times per position.

The `strlen` calls also cost time — if they count characters explicitly, each is linear in the length of its string. This gives an initial worst-case bound of:

> *O(n + m + (n − m)(m + 2))*

We can simplify this step by step using what we know about Big Oh:

1. *m + 2 = Θ(m)*, so the "+2" disappears: *O(n + m + (n−m)m)*
2. Expanding: *O(n + m + nm − m²)*
3. Since *n ≥ m* (the pattern cannot be longer than the text), *n + m ≤ 2n = Θ(n)*, so: *O(n + nm − m²)*
4. Since *m ≥ 1*, we have *n ≤ nm*, so *n + nm = Θ(nm)*: *O(nm − m²)*
5. The *−m²* term is negative and only lowers the value. Since we are expressing an upper bound, we can drop it: **O(nm)**

**Proving the Theta** requires a worst-case input. Consider a text of *n* repeated `a` characters and a pattern of *m−1* `a` characters followed by a single `b`. At every position, the inner loop will successfully match *m−1* characters before failing on the last one. There are *n − m + 1* positions, giving:

> *(n − m + 1)(m) = mn − m² + m = Ω(mn)*

So this naive string matching algorithm runs in *Θ(nm)* time. Faster algorithms exist — we will encounter an expected linear-time approach in a later unit.

## Matrix Multiplication

Matrix multiplication takes an *x × y* matrix *A* and a *y × z* matrix *B* and produces an *x × z* matrix *C*, where each entry *C[i][j]* is the dot product of the *i*th row of *A* with the *j*th column of *B*.
```c
for (i = 1; i <= a->rows; i++) {
    for (j = 1; j <= b->columns; j++) {
        c->m[i][j] = 0;
        for (k = 1; k <= b->rows; k++) {
            c->m[i][j] += a->m[i][k] * b->m[k][j];
        }
    }
}
```

Three nested loops. The total number of multiplications is:

> *M(x, y, z) = Σᵢ Σⱼ Σₖ 1*

Evaluating from the innermost loop outward: the innermost sum over *k* gives *z*. The middle sum of *y* copies of *z* gives *yz*. The outer sum of *x* copies of *yz* gives *xyz*.

For the common case where all three dimensions equal *n*, this is *O(n³)*. The same reasoning gives *Ω(n³)* since the loop counts are fixed by the matrix dimensions — there is no early termination. Matrix multiplication by this algorithm is *Θ(n³)*.

{% hint style="info" %}
Three nested loops whose iteration counts are independent of one another should immediately suggest *O(n³)* to you. More generally, *k* fully nested independent loops over a structure of size *n* suggests *O(nᵏ)*. This pattern is one of the most useful shortcuts in practical algorithm analysis.
{% endhint %}

Faster matrix multiplication algorithms do exist — the naive cubic algorithm is not the final word on this problem.