---
title: Regularization
draft: true
updated: 2026-11-21
---

Regularization is anything that stops a model from fitting its training data **too** well, so that it does better on new data. The classic form adds a penalty for large weights to the loss.

## Big weights, wild curves

The degree-7 polynomial from Overfitting passes through all 8 training points. To do it, its weights grow large (the biggest is about $30.5$) and pull against each other, which is what makes the curve swing between the points.

## Add a penalty

L2 regularization changes what training minimises:

$$
L \;=\; \frac{1}{N}\sum_i (\hat y_i - y_i)^2 \;+\; \lambda \sum_{k} c_k^2
$$

The first term rewards fitting the data; the second charges for every weight :term[$c_k$]{hue="blue"}, scaled by :term[$\lambda$]{hue="amber"}. Large weights are now expensive, so training settles on smaller ones, a calmer curve. Because each update shrinks the weights a little, L2 is also called **weight decay**.

With $\lambda = 0.001$ the biggest weight drops to about $2.2$. Training error rises a little ($0 \to 0.0096$), and test error falls from $3.20$ to :reveal[$0.031$]: a slightly worse fit to the examples, a much better fit to new data.

## How much?

- $\lambda = 0$: no penalty, plain overfitting.
- Too small (say $10^{-5}$): the curve still chases the noise.
- Too large ($\lambda = 1$): the weights are squeezed so hard that the curve flattens and :reveal[underfits] (test error $0.40$).

The right $\lambda$ is a **hyperparameter**: chosen by trying values and checking the error on held-out data, never on the training data itself.

## Try it

- **No penalty**, **Light ($10^{-5}$)**, **Sweet spot ($10^{-3}$)**, **Too strong ($\lambda = 1$)**: watch the weights shrink and the test error trace a U.

## Other regularizers

- **Dropout**: randomly switch off neurons during training, so no single path can memorise (see Dropout).
- **Early stopping**: stop when validation loss starts rising (see Early Stopping).
- **More data** and **data augmentation**: the most reliable regularizer of all.
