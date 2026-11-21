---
title: Maximum Likelihood
draft: true
updated: 2026-11-21
---

Maximum likelihood is a recipe for choosing a model's parameters: **pick the values that make the observed data most probable**. Many familiar losses, including squared error and cross-entropy, come straight out of this one idea.

## The idea

Five measurements: $2.1,\ 2.9,\ 3.4,\ 3.8,\ 4.8$. Suppose they come from a bell curve (a normal distribution) with an unknown centre :term[$\mu$]{hue="amber"} and spread $\sigma$. For any candidate $\mu$, the curve's height above each point says how likely the model finds that point.

If the points are independent, the probability of all of them together is the **product** of those heights, the likelihood

$$
L(\mu) \;=\; \prod_{i} p(x_i \mid \mu, \sigma)
$$

A good $\mu$ puts the curve's bulk where the points are, so every height is reasonably large and so is the product.

## Logs make it workable

Products of many small numbers become tiny very fast: with $\mu = 2.5$ and $\sigma = 1$, $L \approx 0.00018$. Taking logs turns the product into a sum, and because the log only ever goes up when its input goes up, the best $\mu$ :reveal[does not change]:

$$
\log L(\mu) \;=\; \sum_i \log p(x_i \mid \mu, \sigma)
$$

At $\mu = 2.5$ this is $-8.65$. Trying every $\mu$ traces a curve with one peak, at $\hat\mu = 3.4$, where $\log L = -6.62$. And $3.4$ is exactly :reveal[the average of the five measurements]: for a bell curve, the maximum-likelihood centre is the sample mean.

## From likelihood to loss

Training minimises a loss, so we flip the sign and minimise the **negative log-likelihood**, $-\log L$. For a bell curve,

$$
-\log L(\mu) \;=\; \frac{1}{2\sigma^2}\sum_i (x_i - \mu)^2 \;+\; \text{const.}
$$

That is the squared error, scaled. So minimising mean squared error is :reveal[maximum likelihood with a bell-curve noise model]. With categories instead of numbers, the same recipe gives cross-entropy.

## Try it

- **Too far left** ($\mu = 1.5$): most points sit in the tail, and $\log L$ drops sharply.
- **At the mean** ($\mu = 3.4$): the peak.
- **Narrow curve** ($\sigma = 0.5$): a narrow curve rewards being right and punishes being off much harder, so the log-likelihood curve becomes :reveal[steeper].
- **Wide curve** ($\sigma = 2$): everything is moderately likely, and the curve is flat.
