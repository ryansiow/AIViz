---
title: Training Curve
draft: true
updated: 2026-11-21
---

A training curve plots the loss after every **epoch** (one full pass over the training data). Drawn for both the training data and a held-out **validation** set, the two curves are the quickest diagnosis of how a training run is going.

## Two curves

- **Training loss**: measured on the data the model learns from. It usually keeps falling.
- **Validation loss**: the same loss on data the model never trains on. It is the honest estimate of how the model will do on new inputs.

The **gap** between them is how much worse the model does on data it has not seen.

## Four shapes worth recognising

- **Healthy**: both fall and level off together, with a small gap.
- **Overfitting**: training loss keeps falling towards 0, while validation loss bottoms out and climbs. In the example, validation is lowest ($0.48$) at epoch 23; by epoch 45 training is $0.05$ but validation is back up to $0.91$. Keep the epoch-23 checkpoint (:reveal[early stopping]), or add regularization or data.
- **Underfitting**: both stay high and close together. The model is too simple, or training too short: try :reveal[a bigger model] or better features.
- **Unstable**: the loss bounces instead of settling, the classic sign of :reveal[a learning rate that is too high].

## Try it

Pick each run, then move the epoch slider to read training and validation loss at any point. Note where the best epoch (lowest validation loss) falls in each case.

## Note

The curves in this visualisation are synthetic, shaped like typical runs. Real curves are noisier, and with mini-batches the training loss jitters from step to step; people usually plot a smoothed average.
