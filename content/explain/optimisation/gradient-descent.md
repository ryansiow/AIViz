---
title: Gradient Descent
draft: true
updated: 2026-11-21
---

Training a model means finding the parameters that make the loss as small as possible. **Gradient descent** does it the way you would walk down a hill in fog: feel which way the ground slopes, take a step downhill, repeat.

## The landscape

Picture the loss :term[$L(\theta)$]{hue="green"} as a curve (or, with many parameters, a landscape). Each position :term[$\theta$]{hue="blue"} is one possible model; its height is how wrong that model is. We want the lowest point, but we can only see the ground right under our feet.

## The slope says which way is down

The derivative :term[$L'(\theta)$]{hue="violet"} is the slope of the curve at the current point:

- Slope negative (the curve falls to the right): step :reveal[to the right].
- Slope positive: step to the left.
- Slope zero: :reveal[a flat spot], maybe the bottom.

Either way, the rule is the same: move **against** the slope.

## The update rule

$$
\theta_{k+1} \;=\; \theta_k \;-\; \eta\, L'(\theta_k)
$$

The :term[learning rate $\eta$]{hue="amber"} sets the step size. In the visualisation's bowl, $L(\theta) = \tfrac12(\theta - 1)^2 + \tfrac12$, so $L'(\theta) = \theta - 1$. Starting at $\theta_0 = -2.5$ with $\eta = 0.5$:

$$
\theta_1 = -2.5 - 0.5 \times (-3.5) = -0.75
$$

Notice the steps get smaller on their own as you approach the bottom, because :reveal[the slope gets smaller there].

## How big a step?

In this bowl, each update multiplies the distance to the bottom by $(1 - \eta)$, which makes the effect of the learning rate easy to see:

- $\eta = 0.05$: you keep 95% of the distance each step, so progress is :reveal[very slow].
- $\eta = 0.6$: the distance shrinks fast and you settle at the bottom.
- $\eta = 1.5$: the factor is $-0.5$, so you overshoot back and forth, but still close in.
- $\eta = 2.1$: the factor is $-1.1$, so every step :reveal[lands further away]. Training diverges.

Try the **Too small**, **Just right** and **Too large** presets.

## Valleys and traps

Real loss landscapes have many valleys. Gradient descent only knows the local slope, so it settles in whichever valley it starts above, which may not be the lowest one. The **Wrong valley** preset shows this. Variants such as stochastic gradient descent (noisy steps) and momentum can help roll out of shallow valleys.

## Where it appears

Almost every neural network is trained with a variant of this loop. Backpropagation computes the slope for every parameter at once; optimisers such as SGD and Adam decide how to step.
