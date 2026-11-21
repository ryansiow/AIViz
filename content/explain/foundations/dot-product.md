---
title: Dot Product
draft: true
updated: 2026-11-21
---

The dot product takes two vectors, :term[$\mathbf{w}$]{hue="blue"} and :term[$\mathbf{x}$]{hue="rose"}, and returns **one number** that says how much they point the same way. Every neuron, every attention score and every embedding search is built from it.

## Formula

Multiply the vectors component by component, then add everything up:

$$
\mathbf{w}\cdot\mathbf{x} \;=\; \sum_{i=1}^{n} w_i\,x_i \;=\; w_1x_1 + w_2x_2 + \dots + w_nx_n
$$

With the visualisation's starting vectors, $\mathbf{w} = (3, 1)$ and $\mathbf{x} = (1, 2)$, that is $3\cdot 1 + 1\cdot 2 =$ :reveal[$5$].

## The same number, seen as an angle

There is a second formula that gives exactly the same result:

$$
\mathbf{w}\cdot\mathbf{x} \;=\; \lVert\mathbf{w}\rVert\,\lVert\mathbf{x}\rVert\cos\theta
$$

Here $\lVert\mathbf{w}\rVert$ is the length of $\mathbf{w}$ and :term[$\theta$]{hue="violet"} is the angle between the two arrows. The lengths are never negative, so the angle alone decides the sign:

- Positive means the vectors :reveal[point roughly the same way] ($\theta < 90^\circ$).
- Zero means they are :reveal[perpendicular] ($\theta = 90^\circ$).
- Negative means they :reveal[point in opposite directions] ($\theta > 90^\circ$).

For $(3, 1)$ and $(1, 2)$: $\lVert\mathbf{w}\rVert = \sqrt{10} \approx 3.162$, $\lVert\mathbf{x}\rVert = \sqrt{5} \approx 2.236$ and $\theta = 45^\circ$, so $3.162 \times 2.236 \times 0.707 \approx 5$. Same answer.

## Geometric view: the shadow

The :term[projection]{hue="green"} of $\mathbf{x}$ on $\mathbf{w}$ is the shadow $\mathbf{x}$ casts along the line of $\mathbf{w}$:

$$
\operatorname{proj}_{\mathbf{w}}(\mathbf{x}) \;=\; \frac{\mathbf{w}\cdot\mathbf{x}}{\lVert\mathbf{w}\rVert^{2}}\,\mathbf{w}
$$

Its signed length is $\lVert\mathbf{x}\rVert\cos\theta$. Multiply that by $\lVert\mathbf{w}\rVert$ and you get the dot product back. So the dot product is "how far $\mathbf{x}$ reaches along $\mathbf{w}$", scaled by how long $\mathbf{w}$ is.

## Try it

- Use the **Perpendicular** preset. The shadow shrinks to a point and the result is :reveal[exactly $0$].
- Use **Same direction**, then double the length of $\mathbf{x}$. The angle stays at $0^\circ$, but the dot product :reveal[doubles].
- Use **Opposite**. The shadow points backwards along $\mathbf{w}$, and the result is negative.

## Where it appears

- A single neuron computes :reveal[$\mathbf{w}\cdot\mathbf{x} + b$] before its activation function: weights times inputs, plus a bias.
- Attention compares a query with every key using :reveal[$\dfrac{\mathbf{q}\cdot\mathbf{k}}{\sqrt{d_k}}$].
- Cosine similarity is the dot product with the lengths divided out, so only the angle is left.
