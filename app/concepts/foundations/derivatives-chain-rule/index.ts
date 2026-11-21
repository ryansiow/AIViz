import { activate, drawIn, fadeIn, holdUntil, popIn, riseIn } from '~/engine/beats'
import type { BuildContext } from '~/engine/types'
import { defineConcept } from '~/engine/types'
import { roundTo } from '~/utils/math'
import { derive, INNER, OUTER, params, VIEW, type ChainData } from './derive'
import Scene from './Scene.vue'

/** Number for LaTeX (ASCII minus). */
const n = (v: number, d = 2) => String(roundTo(v, d))
const gTex = (d: ChainData) => INNER[d.inner].tex
const fTex = (d: ChainData) => OUTER[d.outer].tex

/** The nudge on one plot: run, rise and the landing point. */
function nudgeBeat(ctx: BuildContext<ChainData>, k: 'g' | 'f', at: number) {
  const { el } = ctx
  drawIn(ctx, el(`run-${k}`), at, 0.4, 'power1.inOut')
  riseIn(ctx, el(`run-label-${k}`), at + 0.25, 0.3)
  drawIn(ctx, el(`rise-${k}`), at + 0.45, 0.4, 'power1.inOut')
  popIn(ctx, el(`pt2-${k}`), at + 0.75)
  riseIn(ctx, el(`rise-label-${k}`), at + 0.7, 0.3)
  fadeIn(ctx, el(`secant-${k}`), at + 0.9, 0.3, 0.7)
  activate(ctx, el(`nudge-hit-${k}`), at + 0.9)
}

/** The tangent: the lead of a slope step, then its number and the multiplier on the chain. */
function slopeBeat(ctx: BuildContext<ChainData>, k: 'g' | 'f', at: number) {
  const { el } = ctx
  drawIn(ctx, el(`tan-${k}-line`), at, 0.7, 'power1.inOut')
  riseIn(ctx, el(`slope-${k}`), at + 0.45, 0.3)
  riseIn(ctx, el(`mult-${k}`), at + 0.6, 0.3)
  activate(ctx, el(`tan-${k}-hit`), at + 0.7)
}

export default defineConcept({
  params,
  presets: [
    { label: 'Neuron: σ(2x + 1)', values: { inner: 'linear', outer: 'sigmoid', x: 0, dx: 0.5 } },
    { label: '(x²)²', values: { inner: 'square', outer: 'square', x: 1, dx: 0.5 } },
    { label: 'Tiny nudge', values: { inner: 'linear', outer: 'square', x: 1, dx: 0.05 } },
    { label: 'Flat spot', values: { inner: 'sine', outer: 'square', x: 1.6, dx: 0.3 } },
  ],
  derive,
  viewBox: `0 0 ${VIEW.w} ${VIEW.h}`,
  scene: Scene,

  steps: [
    {
      id: 'chain',
      caption: (d) => `Two functions in a row: first $u = g(x) = ${gTex(d)}$, then $y = f(u) = ${fTex(d)}$. Their graphs are below.`,
      log: (d) => [{ text: `g(x) = ${INNER[d.inner].label}   f(u) = ${OUTER[d.outer].label}` }],
    },
    {
      id: 'forward',
      caption: (d) => `Forward: $x = ${n(d.x)}$ gives $u = g(${n(d.x)}) = ${n(d.u)}$, and $u = ${n(d.u)}$ gives $y = f(${n(d.u)}) = ${n(d.y)}$.`,
      log: (d) => [{ text: `x = ${n(d.x)} → u = ${n(d.u)} → y = ` }, { text: n(d.y), hue: 'green' }],
    },
    {
      id: 'nudge',
      caption: (d) =>
        `Nudge $x$ by $\\Delta x = ${n(d.dx)}$. Then $u$ changes by $\\Delta u = ${n(d.du)}$: a rise of ${n(d.du)} over a run of ${n(d.dx)}, a ratio of ${n(d.du / d.dx)}.`,
      log: (d) => [{ text: `Δx = ${n(d.dx)}   Δu = ` }, { text: n(d.du), hue: 'amber' }],
    },
    {
      id: 'slope-g',
      caption: (d) =>
        d.inner === 'linear'
          ? `For a straight line that ratio is the same for any nudge: it is the slope, the derivative $g'(x) = ${n(d.dg, 3)}$. Near $x$, $g$ multiplies small changes by ${n(d.dg, 3)}.`
          : `As the nudge shrinks, $\\Delta u / \\Delta x$ approaches the slope of the tangent: the derivative $g'(${n(d.x)}) = ${n(d.dg, 3)}$. Near $x$, $g$ multiplies small changes by ${n(d.dg, 3)}.`,
      log: (d) => [{ text: "g′(x) = " }, { text: n(d.dg, 3), hue: 'violet' }],
    },
    {
      id: 'pass',
      caption: (d) => `That change $\\Delta u = ${n(d.du)}$ is the nudge $f$ receives. So $y$ changes by $\\Delta y = ${n(d.dy)}$.`,
      log: (d) => [{ text: `Δu = ${n(d.du)}   Δy = ` }, { text: n(d.dy), hue: 'amber' }],
    },
    {
      id: 'slope-f',
      caption: (d) => `The slope of $f$ at $u = ${n(d.u)}$ is $f'(${n(d.u)}) = ${n(d.df, 3)}$: near there, $f$ multiplies small changes by ${n(d.df, 3)}.`,
      log: (d) => [{ text: "f′(u) = " }, { text: n(d.df, 3), hue: 'violet' }],
    },
    {
      id: 'chain-rule',
      caption: (d) =>
        `Chain rule: multiply the slopes along the chain, $\\frac{dy}{dx} = f'(u)\\,g'(x) = ${n(d.df, 3)} \\times ${n(d.dg, 3)} = ${n(d.dydx, 3)}$. The measured $\\Delta y / \\Delta x = ${n(d.ratio)}$ gets closer as $\\Delta x$ shrinks. Backpropagation does exactly this, layer by layer.`,
      log: (d) => [{ text: 'dy/dx = ' }, { text: n(d.dydx, 3), hue: 'green' }, { text: `   (Δy/Δx = ${n(d.ratio)})` }],
    },
  ],

  readouts: (d) => [
    { tex: "g'(x)", value: d.dg, hue: 'violet', digits: 3 },
    { tex: "f'(u)", value: d.df, hue: 'violet', digits: 3 },
    { tex: '\\frac{dy}{dx}', value: d.dydx, hue: 'green', digits: 3 },
    { tex: '\\Delta y / \\Delta x', value: d.ratio, hue: 'amber', digits: 3 },
  ],
  formula: (d) => `\\frac{dy}{dx} = f'(u)\\,g'(x) = ${n(d.df, 3)} \\times ${n(d.dg, 3)} = ${n(d.dydx, 3)}`,

  build(ctx) {
    const { el, step } = ctx

    // 1. The chain (lead), then both graphs.
    step('chain', 0)
    riseIn(ctx, el('chain'), 0, 0.45)
    for (const [i, k] of (['g', 'f'] as const).entries()) {
      fadeIn(ctx, el(`axes-${k}`), 0.4 + 0.1 * i, 0.4)
      riseIn(ctx, el(`title-${k}`), 0.4 + 0.1 * i, 0.3)
      drawIn(ctx, el(`curve-${k}`), 0.6 + 0.15 * i, 0.8, 'power1.inOut')
    }

    // 2. Forward pass: values flow left to right, each with its point.
    step('forward', 2.4)
    riseIn(ctx, el('x-val'), 2.4, 0.3)
    fadeIn(ctx, el('guide-g'), 2.6, 0.3)
    popIn(ctx, el('tan-g-point'), 2.7, 0.25)
    riseIn(ctx, el('u-val'), 3.0, 0.3)
    fadeIn(ctx, el('guide-f'), 3.2, 0.3)
    popIn(ctx, el('tan-f-point'), 3.3, 0.25)
    riseIn(ctx, el('y-val'), 3.6, 0.3)

    // 3. Nudge x.
    step('nudge', 4.8)
    nudgeBeat(ctx, 'g', 4.8)

    // 4. Its slope.
    step('slope-g', 6.6)
    slopeBeat(ctx, 'g', 6.6)

    // 5. The nudge passes on to f.
    step('pass', 8.4)
    nudgeBeat(ctx, 'f', 8.4)

    // 6. f's slope.
    step('slope-f', 10.2)
    slopeBeat(ctx, 'f', 10.2)

    // 7. Multiply.
    step('chain-rule', 12.0)
    riseIn(ctx, el('result'), 12.0, 0.4)

    holdUntil(ctx, 13.8)
  },
})
