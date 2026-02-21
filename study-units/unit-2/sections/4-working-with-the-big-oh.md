# Working with the Big Oh

## Algebraic Rules for Asymptotic Analysis

Manipulating Big Oh expressions follows many of the same rules as ordinary algebra, with a few important simplifications that reflect the coarse-grained nature of asymptotic analysis. The key insight throughout is that constant factors are always absorbed, and only the dominant growth behaviour survives.

## Adding Functions

When two functions are added together, the result is governed entirely by whichever grows faster:

> *f(n) + g(n) → Θ(max(f(n), g(n)))*

In practice this means you can drop every lower-order term from an expression and keep only the dominant one. The polynomial *n³ + n² + n + 1* is simply *Θ(n³)* — the *n²*, *n*, and constant terms are small components that vanish into the multiplicative constant.

The intuition is straightforward: at least half the value of *f(n) + g(n)* must come from whichever term is larger. Dropping the smaller term therefore reduces the total by at most a factor of one half — and a factor of one half is just a constant, which Big Oh ignores anyway.

## Multiplying by a Constant

Multiplying a function by any fixed positive constant *c* has no effect on its asymptotic class:

> *O(c · f(n)) → O(f(n))*

> *Ω(c · f(n)) → Ω(f(n))*

> *Θ(c · f(n)) → Θ(f(n))*

This is precisely why we can ignore hardware differences in algorithm analysis. If your machine runs twice as fast as mine, every operation on your machine costs half what it costs on mine — a constant factor of *c = 0.5* applied uniformly across the entire algorithm. That factor disappears completely under Big Oh. The asymptotic class of the algorithm is unchanged, and our comparison of two algorithms is equally valid on both machines.

{% hint style="info" %}
This is one of the most practically important properties of Big Oh. It means that algorithmic analysis transcends specific hardware. An *O(n²)* algorithm does not become *O(n)* on a faster processor — it remains *O(n²)*, just with a smaller constant. The dominance hierarchy is preserved regardless of the machine.
{% endhint %}

The one caveat is that *c* must be strictly positive. Multiplying by zero collapses any function to zero, which would break the entire framework — so *c > 0* is required.

## Multiplying Two Growing Functions

When both factors in a product are themselves growing functions, both matter and neither can be dropped:

> *O(f(n)) · O(g(n)) → O(f(n) · g(n))*

> *Ω(f(n)) · Ω(g(n)) → Ω(f(n) · g(n))*

> *Θ(f(n)) · Θ(g(n)) → Θ(f(n) · g(n))*

An *O(n! · log n)* algorithm dominates *O(n!)* by exactly the same margin that *log n* dominates a constant — the two growth factors stack multiplicatively.

## Transitivity: A Worked Example

Big Oh relationships are transitive. If *f(n) = O(g(n))* and *g(n) = O(h(n))*, then *f(n) = O(h(n))*.

Going back to the definitions: we know *f(n) ≤ c₁ · g(n)* for *n > n₁*, and *g(n) ≤ c₂ · h(n)* for *n > n₂*. Cascading these inequalities directly:

> *f(n) ≤ c₁ · g(n) ≤ c₁c₂ · h(n)*

for all *n > max(n₁, n₂)*. Setting *c₃ = c₁c₂* gives us exactly what the definition of Big Oh requires. The two constants simply multiply together — which is itself just another constant. Transitivity holds.

{% hint style="warning" %}
Transitivity means you can chain dominance relationships freely. If you know your algorithm runs in *O(n²)* and *n² = O(n³)*, you can conclude the algorithm is also *O(n³)* — though this is a looser bound than necessary. Always prefer the tightest bound available.
{% endhint %}