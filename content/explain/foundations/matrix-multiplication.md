---
title: Matrix Multiplication
draft: true
updated: 2026-11-21
---

A matrix is a grid of numbers. Multiplying a matrix by a vector is simply **many dot products at once**: one for each row of the matrix.

## Matrix times vector

Each output entry is the dot product of one row with the input vector:

$$
\begin{bmatrix} 1 & 2 \\ 0 & 1 \end{bmatrix}
\begin{bmatrix} 3 \\ 1 \end{bmatrix}
=
\begin{bmatrix} 1\cdot 3 + 2\cdot 1 \\ 0\cdot 3 + 1\cdot 1 \end{bmatrix}
=
\begin{bmatrix} 5 \\ 1 \end{bmatrix}
$$

Seen as arrows, the matrix **transforms** space: this one slides points sideways in proportion to their height (a "shear"), so $(3, 1)$ lands on $(5, 1)$.

The **columns** tell the same story from the other side. The first column $(1, 0)$ is where $(1, 0)$ lands, and the second column $(2, 1)$ is where $(0, 1)$ lands. Any $\mathbf{x}$ is a mix of those two directions, so $A\mathbf{x}$ is the same mix of the columns: $3\,(1, 0) + 1\,(2, 1) = (5, 1)$.

## Try it

- **Shear** (the example above): the grid slides sideways and areas are kept, because $\det A = 1 \cdot 1 - 2 \cdot 0 = 1$.
- **Rotate 90°**: $\begin{bmatrix} 0 & -1 \\ 1 & 0 \end{bmatrix}$ turns every arrow a quarter turn, so $(3, 1)$ becomes $(-1, 3)$.
- **Stretch**: a diagonal matrix scales each axis on its own.
- **Collapse**: when one column is a multiple of the other, $\det A = 0$ and the whole plane lands on :reveal[a single line]. Different inputs give the same output, so the step :reveal[cannot be undone].

## Matrix times matrix

To multiply $A$ (size $m \times n$) by $B$ (size $n \times p$), take the dot product of **row $i$ of $A$** with **column $j$ of $B$**:

$$
(AB)_{ij} \;=\; \sum_{k=1}^{n} A_{ik}\,B_{kj}
$$

The inner sizes must match (both $n$), and the result has size :reveal[$m \times p$]. Each row-column pair needs $n$ multiplications, so the whole product costs about $m \cdot n \cdot p$ of them.

## Two surprises

- **Order matters.** In general $AB \ne BA$. Applying "rotate, then stretch" is not the same as "stretch, then rotate".
- **Composition.** Doing $B$ first and then $A$ is the single matrix :reveal[$AB$]. A stack of linear steps with nothing in between collapses into one matrix, which is why neural networks need nonlinear activations between layers.

## Where it appears

- A **dense layer** computes :reveal[$W\mathbf{x} + \mathbf{b}$]: each row of $W$ holds one neuron's weights.
- **Batches:** stacking many inputs as the columns of a matrix turns a whole batch into one matrix product, which GPUs are built to do fast.
- **Attention** computes every query-key score at once as $QK^\top$.
