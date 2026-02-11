# Reasoning about Correctness

## The Role of Proofs

How do we know if an algorithm is correct? We need rigorous reasoning—typically in the form of a proof.

**A mathematical proof consists of:**
1. A clear statement of what you're trying to prove
2. A set of assumptions (things taken as true)
3. A logical chain of reasoning from assumptions to conclusion
4. A marker indicating completion (□ or QED)

{% hint style="info" %}
This book de-emphasizes formal proofs because they're difficult to execute properly and can be misleading when done incorrectly. Instead, the focus is on clear, honest arguments that explain *why* an algorithm works.
{% endhint %}

## Problem Specifications

Before designing an algorithm, you need a precise problem definition with two components:

1. **Input:** The set of allowed instances
2. **Output:** The required properties of the solution

{% hint style="warning" %}
You cannot prove an algorithm correct for a poorly-defined problem. Ask the wrong question, get the wrong answer.
{% endhint %}

### Common Specification Pitfalls

**Pitfall 1: Input too broad**

Remember the movie scheduling problem? If we allowed films with production gaps (filming in September and November, but not October), our earliest-completion algorithm would fail. The problem would become much harder—in fact, no efficient algorithm exists for this generalized version.

{% hint style="success" %}
**Take-Home Lesson:** Narrowing the problem scope is an honorable technique. Restrict general graphs to trees, or two-dimensional geometry to one dimension, until an efficient algorithm exists.
{% endhint %}

**Pitfall 2: ill-defined output**

"Find the best route between two cities" is meaningless without defining "best":
- Shortest distance?
- Fastest time?
- Fewest turns?

Each leads to a different, well-defined optimization problem.

**Pitfall 3: Compound goals**

"Find the shortest route that doesn't use more than twice as many turns as necessary" is well-defined but complicated. Simple, single-objective problems are easier to solve and reason about.

## Expressing Algorithms

Algorithms can be described in three ways:

| Method | Precision | Ease of Expression |
|--------|-----------|-------------------|
| **English** | Low | High |
| **Pseudocode** | Medium | Medium |
| **Real code** | High | Low |

**English** is natural but imprecise. **Real code** (Java, C++, Python) is precise but verbose. **Pseudocode** is a "programming language that never complains about syntax errors"—a happy medium.

{% hint style="warning" %}
Don't use pseudocode to dress up an unclear idea. Clarity is the goal, not formality.
{% endhint %}

### Example: Good vs. Bad Pseudocode

**Bad** (obscures the idea):
```
ExhaustiveScheduling(I)
    j = 0
    Sₘₐₓ = ∅
    For each of the 2ⁿ subsets Sᵢ of intervals I
        If (Sᵢ is mutually non-overlapping) and (size(Sᵢ) > j)
            then j = size(Sᵢ) and Sₘₐₓ = Sᵢ
    Return Sₘₐₓ
```

**Good** (reveals the idea):
```
ExhaustiveScheduling(I)
    Test all 2ⁿ subsets of intervals from I, and return the 
    largest subset consisting of mutually non-overlapping intervals
```

{% hint style="success" %}
**Take-Home Lesson:** The heart of any algorithm is an idea. If your notation obscures that idea, you're working at too low a level.
{% endhint %}

## Demonstrating Incorrectness

The fastest way to prove an algorithm wrong is to find a **counterexample**—an input where the algorithm produces an incorrect answer.

### Properties of Good Counterexamples

**1. Verifiable**
- You can calculate what the algorithm returns
- You can show a better answer exists

**2. Simple**
- Strip away unnecessary details
- Make the failure mechanism crystal clear
- Keep it small enough to reason about mentally

### Hunting for Counterexamples

**Think small**

The robot tour counterexamples used ≤6 points. The scheduling counterexamples used ≤3 intervals. When algorithms fail, they usually fail on simple cases. Don't draw large messy instances—analyze small, clear ones.

**Think exhaustively**

For small *n*, enumerate all possible configurations. For two intervals, there are only three cases:
- Disjoint
- Overlapping
- Nested (one inside the other)

For three intervals, systematically add a third to each of these cases.

**Hunt for the weakness**

If an algorithm is greedy ("always pick the biggest/smallest/earliest"), ask: when would that choice be wrong?

**Go for a tie**

Break greedy heuristics by making everything equal. If all items are the same size, the heuristic has nothing to decide on and might return something suboptimal.

**Seek extremes**

Mix huge and tiny, left and right, near and far. Extreme cases are easier to analyze.

*Example:* Two tight clusters of points separated by distance *d*. The optimal TSP tour is approximately 2*d* regardless of cluster size—what happens inside each cluster barely matters.

{% hint style="success" %}
**Take-Home Lesson:** Searching for counterexamples is the best way to disprove the correctness of a heuristic.
{% endhint %}

---

## Summary: The Three-Step Process

When evaluating an algorithm:

1. **Define the problem precisely** (inputs and required outputs)
2. **Express the algorithm clearly** (reveal the core idea)
3. **Test correctness** (search for counterexamples; prove correctness if none exist)

This disciplined approach separates correct algorithms from plausible-looking heuristics that fail in subtle cases.