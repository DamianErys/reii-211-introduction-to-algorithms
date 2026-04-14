

# Hashing

A hash table is the practical first choice for implementing a dictionary. The core idea is simple: if you could store every item at an array index equal to its key, lookup would be O(1). The problem is that keys are rarely integers in a conveniently bounded range. A **hash function** bridges that gap — it maps arbitrary keys to array indices.

## The Idea

A good hash function takes a key (a string, an object, a number) and produces an integer in the range `[0, m)` for a table of size m. For string keys, a common approach treats the string as a number in base-α (where α is the alphabet size), then takes the result modulo m:

```
H'(S) = H(S) mod m
```

Choosing m to be a large prime reduces clustering effects. The output should be as uniformly distributed across `[0, m)` as possible — any bias causes some slots to fill up while others sit empty.

## Collision Resolution

Two keys will occasionally hash to the same slot. This is unavoidable — it is a consequence of mapping a large key space into a smaller index space. There are two standard strategies:

**Chaining** stores a linked list at each slot. Any key that hashes to index i is appended to the list at slot i. Search, insert, and delete become linked list operations within the relevant bucket. With n items spread uniformly across m slots, each list has expected length n/m — constant when m ≈ n.

**Open addressing** uses a plain array with no auxiliary lists. When a collision occurs, the algorithm probes forward (sequentially or with a more sophisticated scheme) until an empty slot is found. This is more cache-friendly than chaining but makes deletion awkward — removing one element can break the probe chain for others, requiring reinsertion of affected items.

| Operation | Expected | Worst Case |
|---|---|---|
| Search | O(n/m) | O(n) |
| Insert | O(1) | O(1) |
| Delete | O(1) | O(1) |
| Min / Max / Successor | O(n + m) | O(n + m) |

The worst case arises when every key hashes to the same slot — degenerate behaviour that a good hash function makes vanishingly unlikely in practice.

{% hint style="info" %}
Hash tables give up sorted order entirely. Min, Max, Successor, and Predecessor all require scanning every bucket — O(n + m). If your workload needs sorted traversal, a balanced BST is the better choice. If it doesn't, a hash table will almost always outperform everything else.
{% endhint %}

## Beyond Dictionary Lookup

Hashing's deeper power lies in representing large objects by small fixed-size values. A few notable applications:

**Duplicate detection.** To check whether a new document has been seen before in a large corpus, hash the document to a single integer and compare against stored hashes. Only collisions warrant a full comparison — and collisions are rare.

**Plagiarism detection.** Build a hash table of all substrings of length w across a document corpus. A hash collision between two documents signals a likely shared passage, which can then be verified directly.

**Canonicalisation.** To find all anagrams of a word, sort its letters and use the result as a hash key. *kale*, *lake*, and *leak* all sort to *aekl*, landing in the same bucket. This reduces a complex matching problem to a single hash lookup.

**Fingerprinting.** Represent large objects (books, files, videos) by compact hash codes for fast comparison. Sorting a library by content becomes sorting by prefix hash — short strings instead of full texts, with collisions resolved only when necessary.

{% hint style="info" %}
As Udi Manber — once responsible for all search products at Google — described the most important algorithms used in industry: *"hashing, hashing, and hashing."* The worst-case bounds are poor, but with a good hash function the expected behaviour is hard to beat.
{% endhint %}
