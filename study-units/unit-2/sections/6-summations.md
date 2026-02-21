# Summations

## Why Summations Matter

Summations appear constantly in algorithm analysis — we already encountered one when analysing selection sort. They also serve as the canonical subject for proofs by mathematical induction. This section reviews the key forms you will encounter repeatedly.

A summation is simply a compact way of writing an addition over many terms:

> *Σᵢ₌₁ⁿ f(i) = f(1) + f(2) + ... + f(n)*

## Two Classes That Cover Most Cases

### Sums of Powers of Integers

The most familiar example is the sum of the first *n* positive integers. When *n = 2k* is even, we can pair up the *i*th and *(n − i + 1)*th terms:

> *Σᵢ₌₁ⁿ i = k(2k + 1) = n(n + 1)/2*

We saw this exact sum in the analysis of selection sort — it is what gives that algorithm its *Θ(n²)* running time. The constant *1/2* is not what matters; the fact that the result is quadratic in *n* is.

The general rule for sums of integer powers is:

> *S(n, p) = Σᵢ₌₁ⁿ iᵖ = Θ(nᵖ⁺¹)* for *p ≥ 0*

The exponent goes up by one. The sum of squares is cubic. The sum of cubes is quartic. This pattern is worth memorising — it comes up whenever nested loops have iteration counts that depend on the outer loop index.

For *p < −1*, the sum converges to a constant as *n → ∞*. The boundary case between convergence and divergence is the **Harmonic numbers**:

> *H(n) = Σᵢ₌₁ⁿ 1/i = Θ(log n)*

This turns up in the analysis of several important algorithms and is worth recognising on sight.

### Geometric Progressions

In a geometric progression, the index appears as an exponent rather than a base:

> *G(n, a) = Σᵢ₌₀ⁿ aⁱ = (aⁿ⁺¹ − 1) / (a − 1)*

The behaviour depends entirely on the base *a*:

**When |a| < 1**, the sum converges to a constant regardless of how many terms are added. The classic example is *1 + 1/2 + 1/4 + 1/8 + ...* which never exceeds 2, no matter how many terms you include.

{% hint style="success" %}
This convergence is one of the most useful results in algorithm analysis. It means that an algorithm which does a linear amount of work at the first level, half as much at the second, a quarter at the third, and so on, does **constant total work** — not linear work. Recognising a converging geometric series can transform what looks like an expensive algorithm into an efficient one.
{% endhint %}

**When a > 1**, the sum is dominated by the final term and grows as *Θ(aⁿ⁺¹)*. Each new term more than doubles the running total — *1 + 2 + 4 + 8 + 16 + 32 = 63*, where the last term alone is 32.

## A Worked Inductive Proof

**Claim:** *Σᵢ₌₁ⁿ i × i! = (n + 1)! − 1*

**Base case:** For *n = 1*: the left side gives *1 × 1! = 1*. The right side gives *2! − 1 = 1*. They match.

**Inductive step:** Assume the formula holds for *n*. We want to show it holds for *n + 1*. Separate out the largest term:

> *Σᵢ₌₁ⁿ⁺¹ i × i! = (n+1) × (n+1)! + Σᵢ₌₁ⁿ i × i!*

Apply the inductive hypothesis to the remaining sum:

> *= (n+1) × (n+1)! + (n+1)! − 1*

> *= (n+1)! × ((n+1) + 1) − 1*

> *= (n+2)! − 1*

This is exactly the formula evaluated at *n + 1*, so the proof is complete.

{% hint style="info" %}
The key move in almost every inductive proof on summations is the same: **separate out the largest term** to expose the sum up to *n*, then substitute the inductive hypothesis. Once you see this pattern, these proofs become routine.
{% endhint %}