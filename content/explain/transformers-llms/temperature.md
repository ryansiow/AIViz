---
title: Temperature
draft: true
updated: 2026-11-21
---

When a language model picks its next token, it samples from a probability distribution made by softmax. **Temperature** :term[$T$]{hue="amber"} is one number that decides how adventurous that choice is.

## Formula

Divide every logit :term[$z_i$]{hue="blue"} by $T$ before applying softmax:

$$
p_i \;=\; \frac{e^{z_i / T}}{\sum_j e^{z_j / T}}
$$

At $T = 1$ you get the model's own distribution. Everything else is a reshaping of it.

## Low, normal, high

Using the Softmax example's logits for "The capital of France is …" (Paris 4.0, Lyon 2.2, London 1.4, banana −1.5):

| Temperature | Paris | Lyon | London | banana |
|---|---|---|---|---|
| $T = 0.5$ | 0.968 | 0.026 | 0.005 | < 0.001 |
| $T = 1$ | 0.804 | 0.133 | 0.060 | 0.003 |
| $T = 2$ | 0.574 | 0.233 | 0.156 | 0.037 |

- **Below 1**, the gaps between scores are stretched: the favourite takes almost everything.
- **Above 1**, the gaps shrink: unlikely tokens get a real chance.
- As $T$ approaches $0$, sampling becomes :reveal[always picking the top token] (greedy decoding).

Whatever the temperature, the order never changes: Paris is always the most likely here. Temperature changes :reveal[how much more likely], not which token leads.

## Why it works

The ratio between any two probabilities is

$$
\frac{p_i}{p_j} \;=\; e^{(z_i - z_j)/T}
$$

Dividing by a small $T$ makes the exponent large, so the ratio explodes. Dividing by a large $T$ pulls it towards :reveal[$1$], where every token is equally likely.

## Try it

- **Greedy-ish ($T = 0.2$)**: almost all 20 samples are "Paris". The spread meter drops close to :reveal[0 bits].
- **Hot ($T = 2.5$)**: "banana" starts to appear in the samples. The favourite still leads, but by much less.
- **Open-ended prompt**: for "The old house was …" the model has several good options already. A little extra temperature makes them :reveal[almost equally likely].

The outlines always show the $T = 1$ distribution, so you can see exactly what temperature changed.

## Choosing a temperature

- **Low** for tasks with one right answer, such as extraction, code or factual questions: you want the most likely token.
- **Higher** for brainstorming or creative writing, where variety matters more than predictability.
- **Too high** and the text drifts into nonsense, because rare and wrong tokens get sampled.
