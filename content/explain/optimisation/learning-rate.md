---
title: Learning Rate
draft: true
updated: 2026-11-21
---

Gradient descent knows which way is downhill, but not how far to go. The **learning rate** :term[$\eta$]{hue="amber"} (eta) is the step size, and it is often the single most important setting in training.

## Where it sits

$$
\theta_{k+1} \;=\; \theta_k \;-\; \eta\, L'(\theta_k)
$$

The slope :term[$L'(\theta)$]{hue="violet"} gives the direction and steepness; $\eta$ scales the step. Double $\eta$ and every step is :reveal[twice as long].

## Too small, just right, too large

On the Gradient Descent bowl, $L(\theta) = \tfrac12(\theta - 1)^2 + \tfrac12$, every step multiplies the distance to the bottom by $(1 - \eta)$. Starting at $\theta_0 = -2.5$, after 12 steps:

| $\eta$ | Factor $1 - \eta$ | $\theta_{12}$ | What happens |
|---|---|---|---|
| 0.05 | 0.95 | −0.89 | Crawls: still far from the bottom at $1$ |
| 0.5 | 0.5 | 0.999 | Smooth and fast |
| 1.5 | −0.5 | 0.999 | Overshoots, zig-zags, still arrives |
| 2.1 | −1.1 | −9.98 | Each step lands further away: diverges |

The rule for this bowl: converge if $0 < \eta < 2$, and :reveal[diverge if $\eta > 2$]. At exactly $\eta = 1$ it lands on the bottom in one step.

## Why steep curves need small steps

The safe range depends on how sharply the loss curves. A steeper, narrower valley has a lower limit: for a bowl with curvature $c$, steps stay stable only while $\eta < 2/c$. Real models have many directions with different curvatures, and :reveal[the sharpest one] sets the limit for all of them.

## In practice

- **Loss going up or jumping to "NaN"** usually means the learning rate is too high.
- **Loss falling painfully slowly** usually means it is too low.
- **Schedules** change $\eta$ during training: a short warm-up from small to full size, then a gradual decay so the final steps can settle into the valley.
- **Adaptive optimisers** such as Adam scale the step separately for each parameter, but they still have a base learning rate to tune.
