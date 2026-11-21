---
title: Cosine Similarity
draft: true
updated: 2026-11-21
---

Two vectors can point the same way and still have very different lengths. **Cosine similarity** compares their direction only, and ignores how long they are.

## Formula

Take the dot product, then divide out both lengths:

$$
\cos\theta \;=\; \frac{\mathbf{a}\cdot\mathbf{b}}{\lVert\mathbf{a}\rVert\,\lVert\mathbf{b}\rVert}
$$

This is the dot product's angle form, $\mathbf{a}\cdot\mathbf{b} = \lVert\mathbf{a}\rVert\lVert\mathbf{b}\rVert\cos\theta$, solved for the cosine of the :term[angle]{hue="violet"}.

## Reading the number

The result always lies between $-1$ and $1$:

- $1$: same direction ($\theta = 0^\circ$), whatever the lengths.
- $0$: :reveal[perpendicular], no shared direction at all.
- $-1$: :reveal[opposite directions].

For example, $(3, 1)$ and $(6, 2)$ have cosine similarity :reveal[$1$], because the second is just the first scaled by 2. Their dot product is $20$, but that number grows with length; the cosine does not.

## Why ignore length?

In text embeddings, length often reflects things you don't care about when comparing meaning, such as how long or how common a piece of text is. Direction carries the meaning. Cosine similarity asks "are these about the same thing?" without being fooled by size.

## Try it

The visualisation starts from $\mathbf{a} = (3, 1)$ and $\mathbf{b} = (1, 2)$: dot product $5$, lengths $\sqrt{10}$ and $\sqrt{5}$, so $\cos\theta = 5 / \sqrt{50} \approx 0.707$ and $\theta = 45^\circ$. Stretching $\mathbf{b}$ by $k = 2$ doubles the dot product to $10$ but leaves the cosine :reveal[at $0.707$].

- **Same direction**: $(3, 1)$ and $(6, 2)$, the example above.
- **Perpendicular**: $(3, 1)$ and $(-1, 3)$ give $0$.
- **Opposite**: $(3, 1)$ and $(-3, -1)$ give $-1$.
- **Short but aligned**: a long and a short vector along the same line still score $1$.

A useful shortcut: if every vector is normalised to length 1 first, cosine similarity :reveal[is just the dot product]. Many vector databases store normalised embeddings for exactly this reason.

## Where it appears

- **Semantic search and retrieval:** rank documents by the cosine similarity between their embedding and the query's embedding.
- **Recommendations:** "users who liked this" compares taste vectors.
- **Attention** uses a scaled dot product rather than a true cosine: length still counts there.
