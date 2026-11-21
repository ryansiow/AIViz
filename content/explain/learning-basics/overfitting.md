---
title: Overfitting
draft: true
updated: 2026-11-21
---

A model **overfits** when it learns the training examples, noise included, instead of the pattern behind them. It then looks excellent on the data it trained on and disappoints on anything new.

## Too simple, just right, too flexible

Take eight noisy points from a smooth wave and fit polynomials of rising degree. A degree-$d$ polynomial has $d + 1$ numbers to tune, so higher degrees bend more freely.

| degree | training error | test error |
|---|---|---|
| 1 (a line) | 0.187 | 0.249 |
| 3 | 0.011 | 0.017 |
| 7 | 0.000 | 3.20 |

- **Degree 1** cannot follow the wave at all: both errors are high. That is **underfitting**.
- **Degree 3** follows the wave and ignores the bumps: the lowest test error.
- **Degree 7** has 8 numbers for 8 points, so it can pass :reveal[exactly through every one]. Its training error is zero, and between the points it swings wildly, so new points land far from it.

## Training error is not enough

Training error can only fall as the model gets more flexible. Test error (on held-out points the model never trained on) falls at first, then rises. That U shape is the signature of overfitting, and it is why you always keep some data aside: :reveal[only held-out data] can tell you how well the model will do on new inputs.

## Try it

- **Too simple (1)**: underfitting, both errors high.
- **Just right (3)**: the bottom of the U.
- **Memorised (7)**: training error 0, test error 3.20.

## What helps

- More data: harder to memorise, easier to see the pattern.
- **Regularization**: penalise complexity (see Regularization).
- Early stopping: stop training when the validation error starts rising (see Training Curve).
- A simpler model, when the data really is simple.
