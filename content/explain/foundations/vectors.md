---
title: Vectors
draft: true
updated: 2026-11-21
---

A vector is **a list of numbers**. You can read it in two ways, and machine learning uses both all the time.

## Two ways to read a vector

As an **arrow**: $\mathbf{v} = (3, 2)$ means "go 3 to the right and 2 up". It has a direction and a length, and it can sit anywhere: only the move matters, not where it starts.

As a **record**: a house could be described by $(\text{rooms}, \text{floor area}, \text{age}) = (3, 92, 15)$. Each position in the list always means the same thing. That is all a feature vector is.

In two or three dimensions we can draw the arrow. A model's vectors often have hundreds or thousands of entries, but every rule below works exactly the same way.

## Length

By Pythagoras, the length (or **norm**) of $\mathbf{v} = (v_1, v_2, \dots, v_n)$ is

$$
\lVert\mathbf{v}\rVert \;=\; \sqrt{v_1^2 + v_2^2 + \dots + v_n^2}
$$

So $\lVert(3, 4)\rVert =$ :reveal[$5$]. A vector of length 1 is a **unit vector**: it carries direction only.

## Adding and scaling

- **Add** two vectors entry by entry: $(3, 2) + (1, -1) = (4, 1)$. As arrows, put the second one at the tip of the first ("tip to tail").
- **Scale** a vector by multiplying every entry: $2\,(3, 2) = (6, 4)$. The arrow keeps its direction and :reveal[doubles in length]. A negative number also :reveal[flips it around].

Dividing a vector by its own length, $\mathbf{v} / \lVert\mathbf{v}\rVert$, gives a unit vector pointing the same way. This is called **normalising**.

## Where it appears

- **Inputs:** every example a model sees, whether a row of a table, the pixels of an image or a token, arrives as a vector.
- **Weights:** a neuron's weights :term[$\mathbf{w}$]{hue="blue"} form a vector of the same size as its input :term[$\mathbf{x}$]{hue="rose"}.
- **Embeddings:** words and tokens become vectors whose positions encode meaning, so similar things end up :reveal[pointing in similar directions].
