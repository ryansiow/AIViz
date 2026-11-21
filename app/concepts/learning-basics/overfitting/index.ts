import { activate, drawIn, fadeIn, holdUntil, popIn, riseIn } from '~/engine/beats'
import { defineConcept } from '~/engine/types'
import { derive, params, VIEW, type OFData, type Verdict } from './derive'
import Scene from './Scene.vue'

const err = (x: number) => (x < 0.0001 ? '0.0000' : x < 0.1 ? x.toFixed(4) : x.toFixed(2))

const verdictText: Record<Verdict, (d: OFData) => string> = {
  best: (d) => `Degree ${d.degree} has the lowest test error (${err(d.testMse)}): flexible enough for the pattern, not for the noise.`,
  good: (d) => `Degree ${d.degree} is close to the best (degree ${d.bestDegree}): test error ${err(d.testMse)}.`,
  underfit: (d) => `Underfitting: degree ${d.degree} is too stiff to follow the pattern, so both errors stay high. Degree ${d.bestDegree} does best on new data.`,
  overfit: (d) =>
    `Overfitting: degree ${d.degree} ${d.trainMse < 1e-4 ? 'memorises every training point' : 'chases the noise'}, and new points pay for it (test error ${err(d.testMse)}). Degree ${d.bestDegree} does best on new data.`,
}

export default defineConcept({
  params,
  presets: [
    { label: 'Too simple (1)', values: { degree: 1 } },
    { label: 'Just right (3)', values: { degree: 3 } },
    { label: 'Memorised (7)', values: { degree: 7 } },
  ],
  derive,
  viewBox: `0 0 ${VIEW.w} ${VIEW.h}`,
  scene: Scene,

  steps: [
    {
      id: 'train',
      caption: (d) => `${d.train.x.length} training points: a smooth pattern plus some noise.`,
      log: (d) => [{ text: `${d.train.x.length} training points`, hue: 'blue' }],
    },
    {
      id: 'fit',
      caption: (d) => `Fit a polynomial of degree ${d.degree}: a curve with ${d.degree + 1} numbers to tune, chosen to make the training error as small as possible.`,
      log: (d) => [{ text: 'degree ' }, { text: String(d.degree), hue: 'amber' }],
    },
    {
      id: 'train-error',
      caption: (d) =>
        d.trainMse < 1e-4
          ? `On the training points the error is ${err(d.trainMse)}: with ${d.degree + 1} numbers for ${d.train.x.length} points, the curve passes through every one.`
          : `Training error: ${err(d.trainMse)}, the average squared gap to the training points.`,
      log: (d) => [{ text: 'training error ' }, { text: err(d.trainMse), hue: 'blue' }],
    },
    {
      id: 'test',
      caption: (d) => `Now ${d.test.x.length} new points from the same pattern, which the model never saw.`,
      log: (d) => [{ text: `${d.test.x.length} test points`, hue: 'rose' }],
    },
    {
      id: 'test-error',
      caption: (d) => `Test error: ${err(d.testMse)}${d.testMse > 5 * d.trainMse && d.testMse > 0.05 ? ', far above the training error. Doing well on the examples did not carry over' : ''}.`,
      log: (d) => [{ text: 'test error ' }, { text: err(d.testMse), hue: 'rose' }],
    },
    {
      id: 'sweep',
      caption: () => 'Repeat for every degree. Training error keeps falling as the curve gets more flexible; test error falls, then climbs.',
      log: (d) => [{ text: d.sweep.map((s) => `${s.degree}:${err(s.test)}`).join(' ') }],
    },
    {
      id: 'verdict',
      caption: (d) => verdictText[d.verdict](d),
      log: (d) => [{ text: d.verdict, hue: d.verdict === 'best' || d.verdict === 'good' ? 'green' : 'rose' }],
    },
  ],

  readouts: (d) => [
    { tex: 'd', value: d.degree, hue: 'amber', digits: 0 },
    { tex: '\\text{train MSE}', value: err(d.trainMse), hue: 'blue' },
    { tex: '\\text{test MSE}', value: err(d.testMse), hue: 'rose' },
    { tex: 'd_{\\text{best}}', value: d.bestDegree, hue: 'green', digits: 0 },
  ],
  formula: (d) => `f(x) = c_0 + c_1 x + \\dots + c_{${d.degree}} x^{${d.degree}}`,

  build(ctx) {
    const { d, el, step } = ctx
    const N = d.train.x.length

    step('train', 0)
    fadeIn(ctx, el('axes'), 0, 0.45)
    for (let i = 0; i < N; i++) {
      popIn(ctx, el(`train-pt-${i}`), 0.2 + i * 0.05, 0.22)
      activate(ctx, el(`train-hit-${i}`), 0.6)
    }

    step('fit', 1.6)
    drawIn(ctx, el('curve'), 1.6, 0.9, 'power1.inOut')
    activate(ctx, el('curve-hit'), 2.5)

    step('train-error', 3.4)
    fadeIn(ctx, el('train-res'), 3.4, 0.35)
    riseIn(ctx, el('train-err'), 3.6, 0.3)

    step('test', 4.8)
    for (let i = 0; i < N; i++) {
      popIn(ctx, el(`test-pt-${i}`), 4.8 + i * 0.05, 0.22)
      activate(ctx, el(`test-hit-${i}`), 5.2)
    }

    step('test-error', 6.2)
    fadeIn(ctx, el('test-res'), 6.2, 0.35)
    riseIn(ctx, el('test-err'), 6.4, 0.3)

    step('sweep', 7.6)
    fadeIn(ctx, el('chart'), 7.6, 0.4)
    riseIn(ctx, el('legend'), 7.7, 0.3)
    drawIn(ctx, el('line-train'), 7.9, 0.8, 'power1.inOut')
    drawIn(ctx, el('line-test'), 8.3, 0.8, 'power1.inOut')
    fadeIn(ctx, el('cur'), 9.0, 0.3)
    activate(ctx, el('sweep-hit'), 9.1)

    step('verdict', 10.2)
    popIn(ctx, el('best'), 10.2, 0.3)

    holdUntil(ctx, 11.8)
  },
})
