import { activate, dim, drawIn, fadeIn, holdUntil, popIn, riseIn } from '~/engine/beats'
import { defineConcept } from '~/engine/types'
import { roundTo } from '~/utils/math'
import { derive, params, VIEW, type MLData } from './derive'
import Scene from './Scene.vue'

const n = (v: number, d = 2) => String(roundTo(v, d))

const closing = (d: MLData) => {
  const gap = d.logLMax - d.logL
  const where = gap < 0.005 ? `Your $\\mu = ${n(d.mu, 1)}$ is at the peak.` : `Your $\\mu = ${n(d.mu, 1)}$ scores ${n(gap)} below the peak.`
  return `${where} Maximising log-likelihood is the same as minimising $-\\log L$, and for a bell curve $-\\log L$ is the squared error plus a constant: MSE is maximum likelihood in disguise.`
}

export default defineConcept({
  params,
  presets: [
    { label: 'Too far left', values: { mu: 1.5, sigma: 1 } },
    { label: 'At the mean', values: { mu: 3.4, sigma: 1 } },
    { label: 'Narrow curve', values: { mu: 2.5, sigma: 0.5 } },
    { label: 'Wide curve', values: { mu: 2.5, sigma: 2 } },
  ],
  derive,
  viewBox: `0 0 ${VIEW.w} ${VIEW.h}`,
  scene: Scene,

  steps: [
    {
      id: 'data',
      caption: (d) => `Five measurements: ${d.xs.join(', ')}. Which model explains them best?`,
      log: (d) => [{ text: `data: ${d.xs.join(', ')}` }],
    },
    {
      id: 'model',
      caption: (d) => `Propose a model: a bell curve (normal distribution) centred at $\\mu = ${n(d.mu, 1)}$ with spread $\\sigma = ${n(d.sigma, 1)}$. It says which values are likely.`,
      log: (d) => [{ text: 'μ = ' }, { text: n(d.mu, 1), hue: 'amber' }, { text: `   σ = ${n(d.sigma, 1)}` }],
    },
    {
      id: 'heights',
      caption: () => 'The height of the curve above each point is how likely the model finds it. Points near the centre score high; points in the tails score low.',
      log: (d) => [{ text: 'p(xᵢ) = ' }, { text: d.dens.map((p) => n(p, 3)).join(', '), hue: 'violet' }],
    },
    {
      id: 'combine',
      caption: (d) => `For independent points, multiply: $L = ${d.dens.map((p) => n(p)).join(' \\times ')}$, a tiny number. Adding logs is easier: $\\log L = ${n(d.logL)}$.`,
      log: (d) => [{ text: 'log L = ' }, { text: n(d.logL), hue: 'green' }],
    },
    {
      id: 'sweep',
      caption: () => 'Now try every centre $\\mu$ and plot its log-likelihood. Each value of $\\mu$ is one candidate model.',
      log: () => [{ text: 'log L(μ) for μ in [0, 7]' }],
    },
    {
      id: 'peak',
      caption: (d) => `The curve peaks at $\\hat\\mu = ${n(d.muHat)}$: exactly the average of the data. That is the maximum-likelihood estimate, the model that makes the data most probable.`,
      log: (d) => [{ text: 'μ̂ = ' }, { text: n(d.muHat), hue: 'green' }, { text: `   log L = ${n(d.logLMax)}` }],
    },
    {
      id: 'loss',
      caption: (d) => closing(d),
      log: () => [{ text: '−log L ↔ squared error' }],
    },
  ],

  readouts: (d) => [
    { tex: '\\mu', value: d.mu, hue: 'amber', digits: 1 },
    { tex: '\\log L(\\mu)', value: d.logL, hue: 'green', digits: 2 },
    { tex: '\\hat\\mu', value: d.muHat, hue: 'green', digits: 2 },
    { tex: '\\log L(\\hat\\mu)', value: d.logLMax, hue: 'neutral', digits: 2 },
  ],
  formula: (d) => `\\log L(\\mu) = \\sum_i \\log \\mathcal{N}(x_i \\mid \\mu, \\sigma^2) = ${n(d.logL)}`,

  build(ctx) {
    const { d, el, step } = ctx
    const N = d.xs.length

    // 1. The measurements, on the number line.
    step('data', 0)
    fadeIn(ctx, el('axes-top'), 0, 0.45)
    for (let i = 0; i < N; i++) {
      popIn(ctx, el(`data-pt-${i}`), 0.2 + i * 0.07, 0.22)
      activate(ctx, el(`data-hit-${i}`), 0.6)
    }

    // 2. A candidate model.
    step('model', 1.8)
    fadeIn(ctx, el('mu-line'), 1.8, 0.3)
    riseIn(ctx, el('mu-label'), 1.8, 0.3)
    drawIn(ctx, el('bell'), 1.95, 0.8, 'power1.inOut')
    activate(ctx, el('bell-hit'), 2.75)

    // 3. Each point's height under the curve.
    step('heights', 3.8)
    for (let i = 0; i < N; i++) {
      const t = 3.8 + i * 0.1
      drawIn(ctx, el(`bar-${i}`), t, 0.35)
      riseIn(ctx, el(`bar-label-${i}`), t + 0.25, 0.25)
    }

    // 4. Combine: product, then the log.
    step('combine', 5.6)
    riseIn(ctx, el('product'), 5.6, 0.35)
    riseIn(ctx, el('log'), 6.0, 0.35)

    // 5. Sweep μ: the log-likelihood curve, and where this μ sits on it.
    step('sweep', 7.2)
    fadeIn(ctx, el('axes-log'), 7.2, 0.4)
    drawIn(ctx, el('log-curve'), 7.4, 0.9, 'power1.inOut')
    popIn(ctx, el('cur'), 8.2, 0.25)
    activate(ctx, el('log-hit'), 8.3)

    // 6. The peak, and the best curve on top.
    step('peak', 9.4)
    riseIn(ctx, el('peak'), 9.4, 0.35)
    drawIn(ctx, el('best-bell'), 9.6, 0.8, 'power1.inOut')

    // 7. Link to loss.
    step('loss', 11.2)
    for (let i = 0; i < N; i++) dim(ctx, el(`bar-label-${i}`), 11.2, 0.4)
    riseIn(ctx, el('nll'), 11.3, 0.35)

    holdUntil(ctx, 12.9)
  },
})
