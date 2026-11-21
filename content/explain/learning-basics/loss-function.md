---
title: Loss Function
draft: true
updated: 2026-11-21
---

A model makes a prediction; the data holds the right answer. The **loss** turns the gap between them into a single number: $0$ when the model is perfect, larger the more wrong it is. Training means :reveal[making this number small].

## Why one number?

A model can have millions of parameters. To improve them, we need one clear signal of "better" or "worse". With a single number, calculus can tell us which way to nudge every parameter (see Gradient Descent).

## Regression: mean squared error

When the answer is a number, such as a price, a common choice is the average squared difference:

$$
L_{\text{MSE}} \;=\; \frac{1}{N}\sum_{i=1}^{N} \left(\hat{y}_i - y_i\right)^2
$$

Here $\hat{y}_i$ is the prediction and $y_i$ the true value. Squaring makes every error positive and punishes big misses far more than small ones: an error of 3 costs :reveal[9 times] as much as an error of 1.

## Classification: cross-entropy

When the answer is a class (a label, or the next token), the model outputs probabilities. The loss looks only at the probability it gave the **correct** answer:

$$
L_{\text{CE}} \;=\; -\log p_{\text{correct}}
$$

- Confident and right: $p = 0.80$ gives $L \approx 0.22$.
- Unsure: $p = 0.5$ gives $L \approx 0.69$.
- Confident and wrong: $p = 0.003$ gives $L \approx 5.8$.

As $p$ drops towards $0$, the loss :reveal[grows without limit], so confident mistakes are punished hardest.

## The loss is not the goal

The loss is a stand-in for what we actually want, such as accurate answers on new data. A model can drive its training loss very low by memorising the examples and still do badly on new ones (see Overfitting). That is why we also track the loss on data the model never trained on.
