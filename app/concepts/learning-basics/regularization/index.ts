import { activate, dim, drawIn, fadeIn, holdUntil, popIn, riseIn } from '~/engine/beats'
import { defineConcept } from '~/engine/types'
import { roundTo } from '~/utils/math'
import { derive, params, VIEW, type RegData, type Verdict } from './derive'
import Scene from './Scene.vue'

const n = (v: number, d = 2) => String(roundTo(v, d))
const err = (x: number) => (x < 0.0001 ? '0.0000' : x < 0.1 ? x.toFixed(4) : x.toFixed(2))
const lam = (d: RegData) => (d.lambda === 0 ? '0' : d.lambda >= 0.01 ? n(d.lambda, 3) : `10^{${n(d.logLambda)}}`)

const verdictText: Record<Verdict, (d: RegData) => string> = {
  none: () => 'With $\\lambda = 0$ there is no penalty at all: this is plain least squares, and it overfits.',
  'too-little': (d) => `$\\lambda = ${lam(d)}$ is too weak: the curve still chases the noise. Around $\\lambda = 10^{${n(d.bestLog)}}$ does best on the test points.`,
  good: (d) => `$\\lambda = ${lam(d)}$ is in the sweet spot: training error rose a little (${err(d.trainMse)}), but test error fell from ${err(d.plainTest)} to ${err(d.testMse)}.`,
  'too-much': (d) => `$\\lambda = ${lam(d)}$ is too strong: the weights are squeezed so hard the curve flattens and underfits. Around $\\lambda = 10^{${n(d.bestLog)}}$ does best.`,
}

export default defineConcept({
  params,
  presets: [
    { label: 'No penalty', values: { logLambda: -7 } },
    { label: 'Light (λ = 10⁻⁵)', values: { logLambda: -5 } },
    { label: 'Sweet spot (λ = 10⁻³)', values: { logLambda: -3 } },
    { label: 'Too strong (λ = 1)', values: { logLambda: 0 } },
  ],
  derive,
  viewBox: `0 0 ${VIEW.w} ${VIEW.h}`,
  scene: Scene,

  steps: [
    {
      id: 'overfit',
      caption: (d) => `The degree-7 curve from Overfitting: it passes through every training point but misses the new test points (test error ${err(d.plainTest)}).`,
      log: (d) => [{ text: `no penalty: test error ${err(d.plainTest)}`, hue: 'rose' }],
    },
    {
      id: 'weights',
      caption: (d) => `Its weights are large (the biggest is ${n(d.plainMaxW, 1)}), pulling hard against each other to hit every noisy point exactly.`,
      log: (d) => [{ text: `max |c| = ${n(d.plainMaxW, 1)}` }],
    },
    {
      id: 'penalty',
      caption: (d) => `Regularization changes the loss: add $\\lambda \\sum c_k^2$, a cost for large weights. Here $\\lambda = ${lam(d)}$.`,
      log: (d) => [{ text: 'λ = ' }, { text: d.lambda === 0 ? '0' : d.lambda.toExponential(1), hue: 'amber' }],
    },
    {
      id: 'shrink',
      caption: (d) =>
        d.lambda === 0
          ? 'With no penalty, nothing changes.'
          : `Minimising the new loss shrinks the weights: the biggest is now ${n(d.maxW)} instead of ${n(d.plainMaxW, 1)}. This is why L2 regularization is also called weight decay.`,
      log: (d) => [{ text: 'max |c| = ' }, { text: n(d.maxW), hue: 'blue' }],
    },
    {
      id: 'smooth',
      caption: () => 'Smaller weights mean a calmer curve: it follows the pattern instead of every bump of noise.',
      log: () => [{ text: 'new curve' }],
    },
    {
      id: 'errors',
      caption: (d) => `Training error ${d.trainMse > d.plainTrain ? 'rises' : 'stays'} (${err(d.plainTrain)} → ${err(d.trainMse)}); test error goes ${err(d.plainTest)} → ${err(d.testMse)}. The model fits the examples a little worse and new data ${d.testMse < d.plainTest ? 'much better' : 'no better'}.`,
      log: (d) => [{ text: 'test error ' }, { text: `${err(d.plainTest)} → ${err(d.testMse)}`, hue: 'rose' }],
    },
    {
      id: 'sweep',
      caption: () => 'Across every $\\lambda$: too little and the curve still overfits; too much and it is squeezed flat. Test error is lowest in between.',
      log: (d) => [{ text: `best λ ≈ 10^${n(d.bestLog)}` }],
    },
    {
      id: 'verdict',
      caption: (d) => verdictText[d.verdict](d),
      log: (d) => [{ text: d.verdict.replace('-', ' '), hue: d.verdict === 'good' ? 'green' : 'rose' }],
    },
  ],

  readouts: (d) => [
    { tex: '\\lambda', value: d.lambda === 0 ? '0' : d.lambda.toExponential(1).replace('-', '−'), hue: 'amber' },
    { tex: '\\max |c_k|', value: d.maxW, hue: 'blue', digits: 2 },
    { tex: '\\text{train MSE}', value: err(d.trainMse), hue: 'blue' },
    { tex: '\\text{test MSE}', value: err(d.testMse), hue: 'rose' },
  ],
  formula: () => `L = \\frac{1}{N}\\sum_i (\\hat y_i - y_i)^2 + \\lambda \\sum_{k \\ge 1} c_k^2`,

  build(ctx) {
    const { d, el, step, tl } = ctx
    const N = 8

    // 1. The overfitted curve and both point sets.
    step('overfit', 0)
    fadeIn(ctx, el('axes'), 0, 0.4)
    for (let i = 0; i < N; i++) {
      popIn(ctx, el(`train-pt-${i}`), 0.15 + i * 0.04, 0.2)
      popIn(ctx, el(`test-pt-${i}`), 0.45 + i * 0.04, 0.2)
      activate(ctx, el(`train-hit-${i}`), 0.6)
      activate(ctx, el(`test-hit-${i}`), 0.9)
    }
    drawIn(ctx, el('plain-curve'), 0.9, 0.8, 'power1.inOut')
    riseIn(ctx, el('train-err'), 1.4, 0.3)
    riseIn(ctx, el('test-err'), 1.5, 0.3)

    // 2. Its weights (outlines).
    step('weights', 2.8)
    fadeIn(ctx, el('weights-frame'), 2.8, 0.3)
    for (let k = 0; k < 7; k++) fadeIn(ctx, el(`pbar-${k}`), 2.95 + k * 0.05, 0.3)

    // 3. The penalty term.
    step('penalty', 4.4)
    riseIn(ctx, el('penalty'), 4.4, 0.35)
    riseIn(ctx, el('lambda'), 4.6, 0.3)

    // 4. Weights shrink from the outlines to their new size.
    step('shrink', 5.8)
    d.bars.forEach((b, k) => {
      const p = d.plainBars[k]!
      tl.fromTo(el(`bar-${k}`), { attr: { y: p.y, height: p.h } }, { attr: { y: b.y, height: b.h }, duration: 0.7, ease: 'power2.inOut' }, 5.9)
      tl.fromTo(el(`bar-${k}`), { opacity: 0 }, { opacity: 0.85, duration: 0.2 }, 5.9)
      activate(ctx, el(`bar-hit-${k}`), 6.0)
    })

    // 5. The calmer curve.
    step('smooth', 7.4)
    dim(ctx, el('plain-curve'), 7.4, 0.35)
    drawIn(ctx, el('curve'), 7.5, 0.9, 'power1.inOut')
    activate(ctx, el('curve-hit'), 8.4)

    // 6. What happened to the errors.
    step('errors', 9.2)
    riseIn(ctx, el('train-err-new'), 9.2, 0.3)
    riseIn(ctx, el('test-err-new'), 9.4, 0.3)

    // 7. Every λ.
    step('sweep', 10.6)
    fadeIn(ctx, el('chart'), 10.6, 0.4)
    riseIn(ctx, el('legend'), 10.7, 0.3)
    drawIn(ctx, el('line-train'), 10.9, 0.8, 'power1.inOut')
    drawIn(ctx, el('line-test'), 11.2, 0.8, 'power1.inOut')

    // 8. Where this λ sits.
    step('verdict', 12.6)
    fadeIn(ctx, el('cur'), 12.6, 0.3)

    holdUntil(ctx, 14.2)
  },
})
