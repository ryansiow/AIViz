import { activate, dim, drawIn, fadeIn, holdUntil, popIn, riseIn } from '~/engine/beats'
import { defineConcept } from '~/engine/types'
import { roundTo } from '~/utils/math'
import { derive, GUESS, params, VIEW, type SupData, type Trust } from './derive'
import Scene from './Scene.vue'

const n = (v: number, d = 1) => String(roundTo(v, d))

const trustText: Record<Trust, (d: SupData) => string> = {
  inside: (d) => `${n(d.query)} hours lies inside the examples (1 to 6 hours), so the prediction is backed by nearby data.`,
  near: (d) => `${n(d.query)} hours is just outside the examples (1 to 6 hours). The line keeps going, but nothing checks it there.`,
  outside: (d) => `${n(d.query)} hours is far outside the examples. The model only learned a pattern between 1 and 6 hours; out here it is guessing.`,
  impossible: (d) => `A score of ${n(d.pred)} is impossible. The line keeps rising forever, but real scores stop at 100: the model never saw anything this far out.`,
}

export default defineConcept({
  params,
  presets: [
    { label: 'Inside the data (4.5 h)', values: { query: 4.5 } },
    { label: 'No study (0 h)', values: { query: 0 } },
    { label: 'Far outside (12 h)', values: { query: 12 } },
  ],
  derive,
  viewBox: `0 0 ${VIEW.w} ${VIEW.h}`,
  scene: Scene,

  steps: [
    {
      id: 'examples',
      caption: (d) => `Supervised learning starts with examples: inputs with the right answer attached. Here, ${d.xs.length} students' hours of study and their exam scores.`,
      log: (d) => [{ text: `${d.xs.length} examples (hours → score)` }],
    },
    {
      id: 'goal',
      caption: () => 'The goal: a function $f$ that turns an input (hours) into a good guess of its label (score), also for students it has never seen.',
      log: () => [{ text: 'find f: hours → score' }],
    },
    {
      id: 'guess',
      caption: () => `Choose a family of models, here straight lines $f(x) = w\\,x + b$. Before training, $w$ and $b$ are arbitrary: $f(x) = ${GUESS.w}x + ${GUESS.b}$ misses most points.`,
      log: () => [{ text: `guess: w = ${GUESS.w}, b = ${GUESS.b}`, hue: 'amber' }],
    },
    {
      id: 'learn',
      caption: (d) => `Training adjusts $w$ and $b$ until the line is as close to the examples as possible (the smallest loss). It ends at $w = ${d.w}$, $b = ${d.b}$.`,
      log: (d) => [{ text: 'learned: ' }, { text: `w = ${d.w}, b = ${d.b}`, hue: 'blue' }],
    },
    {
      id: 'rule',
      caption: (d) => `What was learned is a rule: score $\\approx ${d.w} \\times$ hours $+ ${d.b}$. Each extra hour adds about ${d.w} points.`,
      log: (d) => [{ text: `score ≈ ${d.w} × hours + ${d.b}` }],
    },
    {
      id: 'predict',
      caption: (d) => `A new student studied ${n(d.query)} hours. The model predicts $${d.w} \\times ${n(d.query)} + ${d.b} = ${n(d.pred)}$.`,
      log: (d) => [{ text: `f(${n(d.query)}) = ` }, { text: n(d.pred), hue: 'green' }],
    },
    {
      id: 'trust',
      caption: (d) => trustText[d.trust](d),
      log: (d) => [{ text: d.trust, hue: d.trust === 'inside' ? 'green' : d.trust === 'impossible' ? 'rose' : 'amber' }],
    },
  ],

  readouts: (d) => [
    { tex: 'w', value: d.w, hue: 'blue', digits: 0 },
    { tex: 'b', value: d.b, hue: 'blue', digits: 0 },
    { tex: 'x_{\\text{new}}', value: d.query, hue: 'rose', digits: 1 },
    { tex: 'f(x_{\\text{new}})', value: d.pred, hue: 'green', digits: 1 },
  ],
  formula: (d) => `f(x) = ${d.w}\\,x + ${d.b}`,

  build(ctx) {
    const { el, step } = ctx
    const n = ctx.d.xs.length

    // 1. Examples: the table and the chart fill in together, row by row.
    step('examples', 0)
    fadeIn(ctx, el('axes'), 0, 0.45)
    riseIn(ctx, el('table-head'), 0.1, 0.3)
    for (let i = 0; i < n; i++) {
      const t = 0.3 + i * 0.12
      riseIn(ctx, el(`row-${i}`), t, 0.3)
      popIn(ctx, el(`data-pt-${i}`), t + 0.05, 0.22)
      activate(ctx, el(`data-hit-${i}`), t + 0.2)
    }

    // 2. The goal.
    step('goal', 2.0)
    riseIn(ctx, el('goal'), 2.0, 0.35)

    // 3. A first, untrained guess.
    step('guess', 3.4)
    drawIn(ctx, el('guess'), 3.4, 0.7)
    activate(ctx, el('guess-hit'), 4.1)

    // 4. Training: the learned line replaces the guess.
    step('learn', 5.2)
    dim(ctx, el('guess'), 5.2, 0.2)
    drawIn(ctx, el('line'), 5.3, 0.8)
    activate(ctx, el('line-hit'), 6.1)

    // 5. The rule.
    step('rule', 7.0)
    riseIn(ctx, el('rule'), 7.0, 0.35)

    // 6. Predict: up from the new input to the line, across to the score.
    step('predict', 8.4)
    riseIn(ctx, el('q-x'), 8.4, 0.25)
    fadeIn(ctx, el('q-guide'), 8.5, 0.4) // dashed: fade, never draw
    popIn(ctx, el('q-pt'), 8.75, 0.25)
    riseIn(ctx, el('q-label'), 8.9, 0.3)
    riseIn(ctx, el('row-new'), 9.0, 0.3)
    activate(ctx, el('q-hit'), 9.0)

    // 7. How far to trust it.
    step('trust', 10.2)
    popIn(ctx, el('q-ring'), 10.2, 0.3)
    holdUntil(ctx, 11.8)
  },
})
