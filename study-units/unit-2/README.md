# Unit 2: Algorithm Analysis

## Overview

This unit develops the tools needed to compare and evaluate algorithms rigorously, without having to implement or run them. It is based on Chapter 2 of Skiena's **The Algorithm Design Manual**.

Algorithm analysis matters because the same problem can often be solved in many ways, and some ways are dramatically better than others. To make meaningful comparisons, we need a shared language and a formal framework. This unit builds that foundation.

The two central tools introduced here are the **RAM model of computation** — a simple abstract machine that lets us count operations independently of hardware — and **asymptotic analysis**, which describes how an algorithm's resource usage grows as input size increases. Together, these tools allow us to reason about efficiency in a precise, machine-independent way.

The primary notation used throughout is **Big Oh notation**, which captures the dominant growth behaviour of a function while ignoring constant factors and lower-order terms. While the formalism can feel demanding at first, the underlying intuition is straightforward: we want to know, broadly, how much slower an algorithm gets as the problem gets bigger.

{% hint style="info" %}
The mathematical content in this unit is more demanding than Unit 1. Focus on building intuition first — the formal definitions will follow naturally once the core ideas are clear.
{% endhint %}

## Why Algorithm Analysis Matters

Two algorithms that both produce correct output can differ enormously in how long they take or how much memory they consume. For small inputs, these differences may be unnoticeable. For large inputs — the kind that appear in real systems — a poor choice of algorithm can make a problem practically unsolvable.

Algorithm analysis gives us the ability to predict this behaviour before writing a single line of code. It is one of the most practically valuable skills in computer science.

## What This Unit Covers

The unit progresses through the following ideas:

- The **RAM model** provides a simplified but useful abstraction of how computers execute instructions
- **Big Oh, Omega, and Theta** give us a vocabulary for describing growth rates
- **Dominance relations** rank common growth functions from slowest to fastest
- **Working rules** for Big Oh let us simplify expressions algebraically
- **Concrete examples** including selection sort, insertion sort, string matching, and matrix multiplication ground the theory in practice
- **Summations and logarithms** are the key mathematical tools that appear repeatedly in algorithm analysis

By the end of this unit you should be comfortable reading and writing asymptotic bounds, recognising the growth class of common algorithms, and using Big Oh to compare algorithmic efficiency.