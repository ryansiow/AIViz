---
title: Cross-Entropy Loss
draft: true
updated: 2026-11-21
---

Cross-entropy is the loss for **classification**: the model outputs probabilities over classes, and the loss looks only at the probability it gave the **right** one. It is the loss every language model is trained with, once per token.

## One number from the right answer

After “The capital of France is …”, a model (the Softmax example) gives Paris $80.4\%$, Lyon $13.3\%$, London $6.0\%$ and banana $0.33\%$. If the text really continues with “Paris”, the loss is

$$
L_{\text{CE}} \;=\; -\log p_{\text{right}} \;=\; -\log 0.804 \;\approx\; 0.22
$$

The other probabilities do not appear in the formula, but they still matter: the probabilities sum to 1, so any weight on wrong tokens is :reveal[weight taken away from the right one].

## The shape of $-\log p$

- $p = 1$: loss $0$, a perfect prediction.
- A random guess among 4 tokens, $p = 0.25$: loss $\log 4 \approx 1.39$.
- If the right answer had been “banana”, $p = 0.0033$: loss $\approx 5.72$.

As $p$ falls towards 0 the loss :reveal[grows without limit]. Confident mistakes cost far more than hesitant ones, which pushes the model to keep some probability on everything plausible.

## Why the name

“Cross-entropy” compares two distributions: the true one (all weight on the right answer) and the model's. With a single right answer it reduces to $-\log p_{\text{right}}$. It is also maximum likelihood in disguise: minimising $-\log p$ of the right answers is the same as :reveal[maximising the probability of the training data].

## Try it

- **Right & confident**: Paris at $80\%$, loss $0.22$.
- **Wrong & confident**: banana was right, loss $5.72$.
- **Unsure ($T = 3$)**: a high temperature flattens the probabilities; Paris drops to $47\%$, loss $0.76$.
- **Plausible but wrong**: Lyon at $13\%$, loss $2.02$, worse than a random guess.
