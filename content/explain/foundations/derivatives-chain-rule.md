---
title: Derivatives & Chain Rule
draft: true
updated: 2026-11-21
---

A derivative answers one practical question: **if I nudge the input a little, how much does the output move?** The chain rule answers the same question when one function feeds into another. Training a neural network is mostly these two ideas, run millions of times.

## A derivative is a local multiplier

Nudge the input of a function $g$ by a small amount $\Delta x$ and watch the output change by $\Delta u$. The ratio $\Delta u / \Delta x$ is the slope of the line through the two points, a rise over a run.

As the nudge gets smaller, that ratio settles on one number: the slope of the **tangent** line at that point. That number is the derivative,

$$
g'(x) \;=\; \lim_{\Delta x \to 0} \frac{g(x + \Delta x) - g(x)}{\Delta x}
$$

Read it as a multiplier: near $x$, a small change in the input is multiplied by $g'(x)$ on its way to the output. A positive slope means the output moves the same way as the input, a negative slope means :reveal[the opposite way], and a slope of zero means :reveal[a small nudge barely moves it at all].

## The chain rule

Now put two functions in a row: first :term[$u$]{hue="violet"} $= g(x)$, then :term[$y$]{hue="green"} $= f(u)$. A nudge to :term[$x$]{hue="blue"} is multiplied by $g'(x)$ to become a change in $u$, and that change is multiplied by $f'(u)$ to become a change in $y$. So the two multipliers simply multiply:

$$
\frac{dy}{dx} \;=\; f'(u)\cdot g'(x)
$$

Note where each slope is measured: $g'$ at the input $x$, and $f'$ at the value $u$ that actually reaches $f$.

## Worked example

Take :term[$u = 2x + 1$]{hue="violet"} and :term[$y = u^2$]{hue="green"}, at :term[$x = 1$]{hue="blue"}.

1. Forward: $u = 3$ and $y = 9$.
2. Slopes: $g'(x) = 2$ everywhere (a straight line), and $f'(u) = 2u = 6$ at $u = 3$.
3. Chain rule: $\dfrac{dy}{dx} = 6 \times 2 =$ :reveal[$12$].

Check it with an actual nudge of $\Delta x = 0.5$: $u$ goes from 3 to 4 ($\Delta u = 1$), and $y$ goes from 9 to 16 ($\Delta y = 7$). The measured ratio is $7 / 0.5 = 14$, not 12, because the nudge is not small and $u^2$ curves upward. With $\Delta x = 0.05$, $y$ goes from 9 to 9.61 and the ratio is :reveal[$12.2$], already close.

## Try it

- **Tiny nudge** ($\Delta x = 0.05$): the measured $\Delta y / \Delta x$ lands almost on $dy/dx$.
- **Neuron: σ(2x + 1)**: a weighted input passed through a sigmoid. At $x = 0$, the sigmoid's slope is only about $0.197$, so the whole chain gives $0.393$.
- **(x²)²**: squaring twice is $x^4$, whose derivative at $x = 1$ is $4$; the chain rule gives $2u \cdot 2x = 2 \times 2 = 4$.
- **Flat spot**: $\sin x$ is almost flat at $x = 1.6$ (slope about $-0.03$), so the product is tiny, however steep the outer function is. One near-zero factor :reveal[shrinks the whole product].

## Where it appears

- **Backpropagation** is the chain rule applied through a whole network: the slope of the loss with respect to each weight is a product of local slopes, computed from the output back towards the input.
- **Vanishing gradients:** a sigmoid's slope is at most $0.25$, so a long chain of them multiplies many small factors and the gradient for early layers :reveal[shrinks towards zero]. This is one reason modern networks prefer activations like ReLU.
- **Gradient descent** needs exactly these derivatives to know which way, and how far, to move each parameter.
