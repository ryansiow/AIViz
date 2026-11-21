---
title: Softmax
draft: true
updated: 2026-11-21
---

A language model scores every possible next token, but the scores are raw: some are negative, and they don't add up to anything in particular. **Softmax** turns a list of scores into probabilities: all positive, adding up to exactly 1, and keeping the order.

## Formula

For scores (called **logits**) :term[$z_1, \dots, z_n$]{hue="blue"}:

$$
p_i \;=\; \frac{e^{z_i}}{\sum_{j=1}^{n} e^{z_j}}
$$

Two moves: :term[exponentiate]{hue="violet"} each score, then divide by the total, so the results are :term[probabilities]{hue="green"}.

## Worked example

For "The capital of France is …", the visualisation starts with these logits:

| Token | Logit $z$ | $e^{z}$ | Probability |
|---|---|---|---|
| Paris | 4.0 | 54.60 | 0.804 |
| Lyon | 2.2 | 9.03 | 0.133 |
| London | 1.4 | 4.06 | 0.060 |
| banana | −1.5 | 0.22 | 0.003 |

The sum is $67.90$; each probability is its $e^{z}$ divided by that sum.

## Why the exponential?

- It makes every score :reveal[positive], even negative ones, which a probability must be.
- It never changes the order: a higher score always means a higher probability.
- It widens the gaps. Paris beats Lyon by only $1.8$ in score, but gets about :reveal[6 times] the probability, because $e^{1.8} \approx 6$.

Only the **differences** between logits matter: adding the same number to every score changes nothing. That is why real implementations subtract the largest score before exponentiating. The result is identical, and $e^{z}$ never overflows.

## Temperature

Dividing every logit by a temperature $T$ before softmax controls how sharp the result is:

$$
p_i \;=\; \frac{e^{z_i / T}}{\sum_j e^{z_j / T}}
$$

With the same logits, $T = 0.5$ gives Paris $0.968$, and $T = 2$ gives it only $0.574$. A low temperature :reveal[sharpens] the distribution; a high one flattens it. Try the **Confident** and **Creative** presets.

## Where it appears

- The last step of a language model, turning logits into next-token probabilities.
- Attention, turning query-key scores into weights that add up to 1.
- Any classifier with more than two classes, paired with cross-entropy loss.
