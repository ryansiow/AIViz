import { activate, dim, drawIn, fadeIn, holdUntil, popIn, riseIn } from '~/engine/beats'
import { defineConcept } from '~/engine/types'
import { roundTo } from '~/utils/math'
import { derive, params, VIEW, type LossData } from './derive'
import Scene from './Scene.vue'

const n = (v: number, d = 2) => String(roundTo(v, d))

const verdict = (d: LossData) => {
  const ratio = d.mse / d.best.mse
  if (ratio < 1.0005) return `Your line is the best possible: MSE ${n(d.mse)}. No other straight line gets a smaller average square.`
  return `Your line's MSE is ${n(d.mse)}, about ${n(ratio, 1)} times the best possible ${n(d.best.mse)}. Training is the search for the line with the smallest loss.`
}

export default defineConcept({
  params,
  presets: [
    { label: 'Best fit', values: { w: 6, b: 46, data: 'clean' } },
    { label: 'Too flat', values: { w: 0, b: 67, data: 'clean' } },
    { label: 'Too steep', values: { w: 10, b: 32, data: 'clean' } },
    { label: 'One outlier', values: { w: 6, b: 46, data: 'outlier' } },
  ],
  derive,
  viewBox: `0 0 ${VIEW.w} ${VIEW.h}`,
  scene: Scene,

  steps: [
    {
      id: 'setup',
      caption: (d) => `A model's guess: the line score $= ${n(d.w)} \\times$ hours $+ ${n(d.b)}$, against the real scores. How wrong is it, in one number?`,
      log: (d) => [{ text: 'line: ' }, { text: `w = ${n(d.w)}, b = ${n(d.b)}`, hue: 'blue' }],
    },
    {
      id: 'errors',
      caption: (d) => `Each vertical gap is an error: prediction minus truth. Here they range from ${n(Math.min(...d.res.map((r) => r.r)))} to ${n(Math.max(...d.res.map((r) => r.r)))}. Positive and negative errors would cancel if simply added.`,
      log: (d) => [{ text: 'errors: ' }, { text: d.res.map((r) => n(r.r)).join(', '), hue: 'rose' }],
    },
    {
      id: 'square',
      caption: () => 'Square each error. Every square is positive, and its area grows fast: double the error, four times the area.',
      log: (d) => [{ text: 'squares: ' }, { text: d.res.map((r) => n(r.sq)).join(', '), hue: 'rose' }],
    },
    {
      id: 'average',
      caption: (d) => `Average the squares: $L = \\frac{1}{${d.res.length}}\\sum (\\hat y_i - y_i)^2 = ${n(d.sumSq)} / ${d.res.length} = ${n(d.mse)}$. That one number is the mean squared error.`,
      log: (d) => [{ text: 'MSE = ' }, { text: n(d.mse), hue: 'rose' }],
    },
    {
      id: 'biggest',
      caption: (d) => {
        const r = d.res[d.worst]!
        const e = Math.abs(r.r)
        return `The biggest miss, ${n(e)}, costs ${n(r.sq)}: ${n(r.sq / d.sumSq * 100, 0)}% of the total on its own. Squaring punishes big misses far more than small ones.`
      },
      log: (d) => [{ text: `worst: ${n(Math.abs(d.res[d.worst]!.r))}² = ` }, { text: n(d.res[d.worst]!.sq), hue: 'rose' }],
    },
    {
      id: 'best',
      caption: (d) =>
        d.data === 'outlier'
          ? `The best line for this data (score $= ${n(d.best.w)} \\times$ hours $+ ${n(d.best.b)}$) has MSE ${n(d.best.mse)}. One unusual student pulls it towards them.`
          : `The best line for this data, score $= ${n(d.best.w)} \\times$ hours $+ ${n(d.best.b)}$, has MSE ${n(d.best.mse)}: the lowest any line can reach.`,
      log: (d) => [{ text: 'best MSE = ' }, { text: n(d.best.mse), hue: 'green' }],
    },
    {
      id: 'result',
      caption: (d) => verdict(d),
      log: (d) => [{ text: `MSE ${n(d.mse)} vs best ${n(d.best.mse)}` }],
    },
  ],

  readouts: (d) => [
    { tex: 'L_{\\text{MSE}}', value: d.mse, hue: 'rose', digits: 2 },
    { tex: 'L_{\\text{best}}', value: d.best.mse, hue: 'green', digits: 2 },
    { tex: 'w', value: d.w, hue: 'blue', digits: 1 },
    { tex: 'b', value: d.b, hue: 'blue', digits: 0 },
  ],
  formula: (d) => `L = \\frac{1}{N}\\sum_{i}(\\hat y_i - y_i)^2 = \\frac{${n(d.sumSq)}}{${d.res.length}} = ${n(d.mse)}`,

  build(ctx) {
    const { d, el, step } = ctx
    const N = d.res.length

    // 1. Points, then the model's line.
    step('setup', 0)
    fadeIn(ctx, el('axes'), 0, 0.45)
    for (let i = 0; i < N; i++) {
      popIn(ctx, el(`data-pt-${i}`), 0.2 + i * 0.06, 0.22)
      activate(ctx, el(`data-hit-${i}`), 0.5)
    }
    drawIn(ctx, el('line'), 0.7, 0.7)
    activate(ctx, el('line-hit'), 1.4)

    // 2. Errors: gaps from each point to the line, left to right.
    step('errors', 2.4)
    for (let i = 0; i < N; i++) {
      const t = 2.4 + i * 0.1
      drawIn(ctx, el(`err-${i}`), t, 0.3)
      riseIn(ctx, el(`err-label-${i}`), t + 0.2, 0.25)
    }

    // 3. Squares grow out of the gaps.
    step('square', 4.2)
    for (let i = 0; i < N; i++) popIn(ctx, el(`sq-${i}`), 4.2 + i * 0.08, 0.3)

    // 4. Average: the sum, then the bar.
    step('average', 5.8)
    riseIn(ctx, el('bars-title'), 5.8, 0.3)
    riseIn(ctx, el('sum'), 5.95, 0.3)
    ctx.tl.fromTo(el('bar-mine'), { attr: { width: 0 } }, { attr: { width: Math.max(d.bars.mine, 1) }, duration: 0.6, ease: 'power2.out' }, 6.2)
    riseIn(ctx, el('bar-mine-label'), 6.6, 0.3)

    // 5. The biggest square.
    step('biggest', 7.8)
    for (let i = 0; i < N; i++) if (i !== d.worst) dim(ctx, el(`sq-${i}`), 7.8, 0.35)
    popIn(ctx, el('worst-ring'), 7.9, 0.25)
    riseIn(ctx, el('worst-label'), 8.05, 0.3)

    // 6. The best line, for comparison.
    step('best', 9.4)
    drawIn(ctx, el('best'), 9.4, 0.7)
    activate(ctx, el('best-hit'), 10.1)
    ctx.tl.fromTo(el('bar-best'), { attr: { width: 0 } }, { attr: { width: Math.max(d.bars.best, 1) }, duration: 0.6, ease: 'power2.out' }, 9.8)
    riseIn(ctx, el('bar-best-label'), 10.2, 0.3)

    // 7. Verdict.
    step('result', 11.4)
    holdUntil(ctx, 13.0)
  },
})
