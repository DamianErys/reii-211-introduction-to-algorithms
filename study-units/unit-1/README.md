# Unit 1: Introduction to Algorithm Design

## Overview

This unit introduces the core ideas of algorithm design by studying simple but fundamental problems. It is based on Chapter 1 of Skiena’s **The Algorithm Design Manual**.

Algorithm design is a practical skill, not just a theoretical topic. It is concerned with creating procedures that are **correct**, **reliable**, and **general**, rather than ad-hoc solutions that work only in specific cases. A key theme of this unit is the distinction between **algorithms** and **heuristics**, and why this distinction matters in real software systems.

By the end of this unit, you should be able to reason clearly about what a problem is, what a solution requires, and whether a proposed algorithm truly solves it.

## What Is an Algorithm?

An algorithm is a precisely defined procedure for solving a problem. For a procedure to qualify as an algorithm, it must satisfy all of the following:

1. It accepts any input from a clearly defined set of valid inputs  
2. It produces an output that satisfies the problem requirements  
3. It always terminates after a finite number of steps  
4. It is correct for **every** valid input, not just typical cases  

An algorithm is therefore more than a piece of code that “seems to work”. Correctness must be guaranteed by design.

## Problem Specification

Every algorithmic problem must be defined using two parts:

* **Input specification** – what inputs are allowed  
* **Output specification** – what properties the output must satisfy  

Without a precise problem specification, it is impossible to prove correctness or to compare different solutions. Much of algorithm design is therefore about understanding and modelling the problem correctly before attempting to solve it.
