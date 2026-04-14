
# 3.4 Binary Search Trees

The structures covered so far force a trade-off: unsorted linked lists give O(1) insertion and deletion but O(n) search; sorted arrays give O(log n) search but O(n) modification. Binary search trees resolve this tension by combining the navigational flexibility of a linked structure with the ordering guarantees that make binary search possible.

The key insight: binary search requires fast access to the median element above and below a given node. A linked list with **two pointers per node** — one left, one right — gives us exactly that.

---

## Structure

A **rooted binary tree** is defined recursively: it is either empty, or it consists of a root node together with two subtrees (left and right). Order among siblings matters — left is distinct from right.

A **binary search tree (BST)** adds a labelling rule: for any node with key x, all keys in the left subtree are less than x, and all keys in the right subtree are greater than x. This single constraint is what makes efficient search possible.

{% hint style="info" %}
For any binary tree on n nodes and any set of n keys, there is **exactly one** labelling that makes it a valid BST.
{% endhint %}

Each node holds four fields: the data item, a left child pointer, a right child pointer, and an optional parent pointer.

{% tabs %}
{% tab title="C" %}
```c
typedef struct tree {
    int item;           /* data item */
    struct tree *parent;
    struct tree *left;
    struct tree *right;
} tree;
```
The self-referential form `struct tree *` requires the tagged typedef (see Section 3.3) — the alias `tree` isn't complete until the closing brace, so the internal pointers must use the struct tag.
{% endtab %}
{% tab title="C++" %}
```cpp
struct Tree {
    int item;
    Tree *parent;
    Tree *left;
    Tree *right;

    Tree(int val, Tree *par = nullptr)
        : item(val), parent(par),
          left(nullptr), right(nullptr) {}
};
```
In C++, the struct name `Tree` is available inside its own definition, so no explicit tag is needed.
{% endtab %}
{% tab title="Python" %}
```python
class TreeNode:
    def __init__(self, item, parent=None):
        self.item = item
        self.parent = parent
        self.left = None
        self.right = None
```
Python's class reference is resolved at runtime, so self-referential structures require no special syntax.
{% endtab %}
{% endtabs %}

---

## Operations

### Searching

Start at the root. If the query key matches, return the node. If the query is smaller, recurse left; if larger, recurse right. The BST labelling guarantees the target can only be in one of the two subtrees.

{% tabs %}
{% tab title="C" %}
```c
tree *search_tree(tree *l, int x) {
    if (l == NULL)       return NULL;
    if (l->item == x)    return l;
    if (x < l->item)
        return search_tree(l->left, x);
    else
        return search_tree(l->right, x);
}
```
{% endtab %}
{% tab title="C++" %}
```cpp
Tree* search_tree(Tree *l, int x) {
    if (!l)              return nullptr;
    if (l->item == x)    return l;
    if (x < l->item)
        return search_tree(l->left, x);
    else
        return search_tree(l->right, x);
}
```
{% endtab %}
{% tab title="Python" %}
```python
def search_tree(node, x):
    if node is None:        return None
    if node.item == x:      return node
    if x < node.item:
        return search_tree(node.left, x)
    else:
        return search_tree(node.right, x)
```
{% endtab %}
{% endtabs %}

Search runs in **O(h)** time, where h is the height of the tree.

---

### Finding Minimum and Maximum

The minimum key is always the left-most node; the maximum is always the right-most. Follow left (or right) pointers until you hit NULL.

{% tabs %}
{% tab title="C" %}
```c
tree *find_minimum(tree *t) {
    if (t == NULL) return NULL;
    while (t->left != NULL)
        t = t->left;
    return t;
}

tree *find_maximum(tree *t) {
    if (t == NULL) return NULL;
    while (t->right != NULL)
        t = t->right;
    return t;
}
```
{% endtab %}
{% tab title="C++" %}
```cpp
Tree* find_minimum(Tree *t) {
    if (!t) return nullptr;
    while (t->left) t = t->left;
    return t;
}

Tree* find_maximum(Tree *t) {
    if (!t) return nullptr;
    while (t->right) t = t->right;
    return t;
}
```
{% endtab %}
{% tab title="Python" %}
```python
def find_minimum(node):
    if node is None: return None
    while node.left:
        node = node.left
    return node

def find_maximum(node):
    if node is None: return None
    while node.right:
        node = node.right
    return node
```
{% endtab %}
{% endtabs %}

---

### Traversal

Visiting every node in sorted order is a natural consequence of the BST property. Recursively visit the left subtree, process the current node, then visit the right subtree. This is called an **in-order traversal** and runs in **O(n)**.

Changing when you process the node gives the other traversal orders:
- **Pre-order** — process node, then left, then right.
- **Post-order** — left, then right, then process node.

Pre- and post-order are most useful when the tree represents an expression or a dependency graph, rather than a sorted dictionary.

{% tabs %}
{% tab title="C" %}
```c
void traverse_tree(tree *l) {
    if (l != NULL) {
        traverse_tree(l->left);
        printf("%d\n", l->item);   /* in-order */
        traverse_tree(l->right);
    }
}
```
{% endtab %}
{% tab title="C++" %}
```cpp
void traverse_tree(Tree *l) {
    if (l) {
        traverse_tree(l->left);
        std::cout << l->item << "\n";
        traverse_tree(l->right);
    }
}
```
{% endtab %}
{% tab title="Python" %}
```python
def traverse_tree(node):
    if node:
        traverse_tree(node.left)
        print(node.item)           # in-order
        traverse_tree(node.right)
```
{% endtab %}
{% endtabs %}

---

### Insertion

There is exactly one correct position for a new key in a BST — the NULL pointer location where an unsuccessful search for that key would terminate. The algorithm searches for the key and replaces the NULL it finds with a newly allocated node.

{% tabs %}
{% tab title="C" %}
```c
void insert_tree(tree **l, int x, tree *parent) {
    if (*l == NULL) {
        tree *p = malloc(sizeof(tree));
        p->item = x;
        p->left = p->right = NULL;
        p->parent = parent;
        *l = p;            /* link into tree */
        return;
    }
    if (x < (*l)->item)
        insert_tree(&((*l)->left), x, *l);
    else
        insert_tree(&((*l)->right), x, *l);
}
```
The double pointer `tree **l` lets us modify the parent's child pointer directly when we find the insertion site — without it, assigning `*l = p` would only update a local copy.
{% endtab %}
{% tab title="C++" %}
```cpp
void insert_tree(Tree *&l, int x, Tree *parent = nullptr) {
    if (!l) {
        l = new Tree(x, parent);
        return;
    }
    if (x < l->item)
        insert_tree(l->left, x, l);
    else
        insert_tree(l->right, x, l);
}
```
A reference-to-pointer (`Tree *&l`) achieves the same effect as C's double pointer, but with cleaner syntax.
{% endtab %}
{% tab title="Python" %}
```python
def insert_tree(root, x, parent=None):
    if root is None:
        return TreeNode(x, parent)
    if x < root.item:
        root.left = insert_tree(root.left, x, root)
    else:
        root.right = insert_tree(root.right, x, root)
    return root
```
Python returns the (possibly new) node and reassigns the child pointer at each level, which is the idiomatic alternative to pointer-to-pointer.
{% endtab %}
{% endtabs %}

Insertion costs **O(h)** — one search to find the position, then O(1) to allocate and link.

---

### Deletion

Deletion has three cases depending on how many children the target node has:

1. **Leaf node (no children):** Clear the parent's pointer. Done.
2. **One child:** Link the child directly to the deleted node's parent.
3. **Two children:** Replace the node's key with its **in-order successor** — the minimum of its right subtree. Then delete that successor, which has at most one child, reducing to case 1 or 2.

The in-order successor is always the left-most node in the right subtree. Swapping in its value preserves the BST property everywhere.

```
Initial:          Delete 6          Delete 4 (2 children)
    4                 4                   5
   / \              /   \               /   \
  2   7            2     7             2     7
 / \ / \          / \   / \           / \   / \
1  3 6  8        1   3 5   8         1   3 6   8
    \
     5
```

Deletion costs at most two O(h) searches plus a constant amount of pointer rewiring — **O(h)** overall.

---

## How Good Are BSTs?

All three core dictionary operations — search, insert, delete — run in **O(h)**. The question is what h actually is.

| Tree shape | Height | Cause |
|---|---|---|
| Perfectly balanced | O(log n) | Random or shuffled insertions |
| Degenerate (linear) | O(n) | Keys inserted in sorted order |

If keys arrive in sorted order, each new node becomes the rightmost child of the previous one — the tree degenerates into a linked list and all O(h) operations become O(n).

With random insertion order, the expected height is **Θ(log n)** with high probability. This is the same reasoning that underlies quicksort's average-case performance (Section 4.6).

---

## Balanced Search Trees

Relying on random input order is fragile. A determined adversary — or simply sorted real-world data — can reduce any naive BST to O(n) performance.

**Balanced BSTs** solve this by performing small structural adjustments (rotations) after each insertion or deletion to keep the height bounded at O(log n) always, regardless of insertion order. Common implementations include:

- **Red-black trees** — the structure used inside most standard library maps and sets.
- **Splay trees** — self-adjusting trees that move recently accessed nodes toward the root.
- **AVL trees** — the first historically, maintaining a strict balance factor at every node.

From a practical standpoint, you rarely implement these yourself. The guarantee to internalize is: **a balanced BST provides O(log n) worst-case for all dictionary operations.** When analysing algorithms that use a dictionary, this is the cost you should assume.

{% hint style="info" %}
**Take-Home Lesson:** Picking the wrong data structure can be disastrous. But identifying the single best structure is rarely critical — several choices often perform similarly. What matters is understanding the worst-case guarantees and choosing something whose weaknesses don't align with your workload.
{% endhint %}

---

## Exploiting BSTs for Sorting

A balanced BST supporting all seven dictionary operations in O(log n) is enough to sort n numbers in **O(n log n)** — and there are at least three distinct ways to do it:

**Sort 1 — Insert + in-order traversal**
Insert all n elements, then traverse in-order. The traversal visits nodes in sorted order by the BST property.

**Sort 2 — Insert + Min + Successor**
Insert all elements, find `Minimum`, then repeatedly call `Successor` until the end of the tree.

**Sort 3 — Insert + repeated Min + Delete**
Insert all elements, then repeatedly find and delete the minimum. Each deletion exposes the new minimum.

All three approaches perform O(n) operations each costing O(log n), giving **O(n log n)** total. Building the tree is the rate-limiting step — even before any traversal, O(n log n) work has already been done.

This foreshadows a deep connection: comparison-based sorting and BST operations are fundamentally the same problem viewed from different angles.
