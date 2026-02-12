# Proof by Contradiction

## The Method

**Proof by contradiction** is a powerful technique for establishing truth by showing that the alternative is impossible.

### The Three-Step Process

1. **Assume the opposite** — Suppose the statement you want to prove is false
2. **Follow the logic** — Develop logical consequences of this assumption
3. **Find the absurdity** — Show that one consequence is demonstrably false

If assuming something is false leads to an impossible conclusion, the original statement must be true.

## Classic Example: Infinitely Many Primes

**Claim:** There are infinitely many prime numbers.

**Prime numbers** are integers like 2, 3, 5, 7, 11,... that have no factors other than 1 and themselves.

### Euclid's Proof

**Step 1: Assume the opposite**

Suppose there are only finitely many primes. Call them $p_1, p_2, \ldots, p_m$ where $m$ is some fixed number.

**Step 2: Follow the logic**

Construct a new number by multiplying all known primes together:

$$N = \prod_{i=1}^{m} p_i = p_1 \times p_2 \times \cdots \times p_m$$

By construction, $N$ is divisible by every prime in our list.

Now consider $N + 1$:
- Is it divisible by $p_1 = 2$? No—because $N$ is divisible by 2, so $N+1$ leaves remainder 1
- Is it divisible by $p_2 = 3$? No—same reasoning
- Is it divisible by any $p_i$? No—same reasoning for all of them

**Step 3: Find the absurdity**

Since $N+1$ has no factors from our "complete" list of primes, either:
- $N+1$ is itself prime, OR
- $N+1$ has a prime factor not in our list

Either way, we've found a prime not in $\{p_1, \ldots, p_m\}$—contradicting our assumption that the list was complete.

{% hint style="success" %}
**Conclusion:** The assumption of finitely many primes leads to contradiction. Therefore, there must be infinitely many primes. Touché!
{% endhint %}

## Making Contradictions Convincing

For a contradiction argument to work:

**The final consequence must be obviously, ridiculously false**
- Muddy or ambiguous outcomes aren't convincing
- The absurdity should be crystal clear

**The contradiction must follow logically from the assumption**
- Every step must be a valid logical consequence
- No hidden assumptions or leaps

{% hint style="warning" %}
Proof by contradiction is elegant when done well, but requires careful reasoning at every step. Make sure your logic is airtight.
{% endhint %}

---

## When to Use Contradiction

Contradiction works well for proving:
- Existence claims ("there exists at least one...")
- Impossibility results ("no algorithm can...")
- Statements about infinity
- Claims where the direct proof is unclear

It's one of several proof techniques in the algorist's toolkit—alongside induction, construction, and case analysis.