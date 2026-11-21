---
title: Supervised Learning
draft: true
updated: 2026-11-21
---

Supervised learning means learning from **examples that come with the right answer**. Each example pairs an input $x$ with its label $y$, and the goal is a function $f$ that maps inputs to labels well enough to be trusted on inputs it has never seen.

## Examples in, a rule out

Take six students: hours studied and exam score.

| hours $x$ | 1 | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|---|
| score $y$ | 51 | 60 | 64 | 68 | 77 | 82 |

We choose a **family** of models first, here straight lines $f(x) = w\,x + b$, and let training pick the numbers. Before training, $w$ and $b$ are arbitrary, so the line misses most points. Training adjusts them to make the error as small as possible (see Loss Function), and for this data it lands on exactly

$$
f(x) = 6x + 46
$$

The learned rule says each extra hour is worth about :reveal[6 points].

## Predicting

A new student who studied 4.5 hours gets $f(4.5) = 6 \times 4.5 + 46 =$ :reveal[$73$]. That is the whole point: the model was never shown this student.

## Know where the rule was learned

The model only saw students between 1 and 6 hours. Ask it about 12 hours and it answers $6 \times 12 + 46 = 118$, an :reveal[impossible] score: the line keeps rising, but real scores stop at 100. Predictions far outside the training data (**extrapolation**) deserve much less trust than predictions inside it.

## Try it

- **Inside the data (4.5 h)**: a prediction backed by nearby examples.
- **No study (0 h)**: just outside the data; the line says 46.
- **Far outside (12 h)**: the impossible 118.

## Where it appears

- **Regression**: the label is a number (a price, a score, a temperature).
- **Classification**: the label is a category (spam or not, which digit, which next token). A language model is trained in a supervised way on text: every position's label is :reveal[the token that actually comes next].
