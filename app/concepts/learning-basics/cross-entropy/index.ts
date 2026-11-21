import { activate, dim, drawIn, fadeIn, holdUntil, popIn, riseIn } from '~/engine/beats'
import { defineConcept } from '~/engine/types'
import { roundTo } from '~/utils/math'
import { derive, params, VIEW, type CEData, type Verdict } from './derive'
import Scene from './Scene.vue'

const n = (v: number, d = 2) => String(roundTo(v, d))
const pr = (p: number) => (p < 0.001 ? n(p, 5) : n(p, 3))
const right = (d: CEData) => d.tokens[d.answer]!

const verdictText: Record<Verdict, (d: CEData) => string> = {
  'confident-right': (d) => `Confident and right: loss ${n(d.loss)}, close to the perfect 0. Training would push $p$ the last bit towards 1.`,
  'leaning-right': (d) => `Right, but not sure: loss ${n(d.loss)}. Better than a random guess (${n(d.uniform)}), with room to grow more confident.`,
  unsure: (d) => `Unsure: loss ${n(d.loss)}, near a random guess (${n(d.uniform)}). The model has not really committed to “${right(d)}”.`,
  wrong: (d) => `Wrong: the model put only ${n(d.pc * 100, 1)}% on “${right(d)}”, so the loss is ${n(d.loss)}, well above a random guess.`,
  'confident-wrong': (d) => `Confident and wrong: only ${n(d.pc * 100, 2)}% on “${right(d)}” gives a loss of ${n(d.loss)}. As $p \\to 0$ the loss grows without limit, so confident mistakes are punished hardest.`,
}

export default defineConcept({
  params,
  presets: [
    { label: 'Right & confident', values: { answer: '0', T: 1 } },
    { label: 'Wrong & confident', values: { answer: '3', T: 1 } },
    { label: 'Unsure (T = 3)', values: { answer: '0', T: 3 } },
    { label: 'Plausible but wrong', values: { answer: '1', T: 1 } },
  ],
  derive,
  viewBox: `0 0 ${VIEW.w} ${VIEW.h}`,
  scene: Scene,

  steps: [
    {
      id: 'probs',
      caption: (d) => `A language model's probabilities for the next token after “${d.prompt}”${d.T === 1 ? '' : ` (at temperature ${n(d.T)})`}.`,
      log: (d) => [{ text: `p = [${d.p.map((q) => n(q, 3)).join(', ')}]` }],
    },
    {
      id: 'answer',
      caption: (d) => `In the training text, the next token really was “${right(d)}”.`,
      log: (d) => [{ text: 'right answer: ' }, { text: right(d), hue: 'green' }],
    },
    {
      id: 'pick',
      caption: (d) => `Cross-entropy ignores every other token and looks at one number: the probability on the right answer, $p = ${pr(d.pc)}$.`,
      log: (d) => [{ text: 'p(right) = ' }, { text: pr(d.pc), hue: 'green' }],
    },
    {
      id: 'curve',
      caption: () => 'The loss is $-\\log p$: 0 when $p = 1$, and it rises steeply as $p$ falls towards 0.',
      log: () => [{ text: 'L = −log p' }],
    },
    {
      id: 'loss',
      caption: (d) => `Here: $L = -\\log ${pr(d.pc)} = ${n(d.loss)}$.`,
      log: (d) => [{ text: 'L = ' }, { text: n(d.loss, 3), hue: 'rose' }],
    },
    {
      id: 'result',
      caption: (d) => verdictText[d.verdict](d),
      log: (d) => [{ text: d.verdict.replace('-', ' '), hue: d.verdict === 'confident-right' ? 'green' : 'rose' }],
    },
  ],

  readouts: (d) => [
    { tex: 'p_{\\text{right}}', value: d.pc, hue: 'green', digits: 3 },
    { tex: 'L = -\\log p', value: d.loss, hue: 'rose', digits: 3 },
    { tex: '\\log 4\\ (\\text{guess})', value: d.uniform, hue: 'neutral', digits: 3 },
    { tex: 'T', value: d.T, hue: 'amber', digits: 2 },
  ],
  formula: (d) => `L_{\\text{CE}} = -\\log p_{\\text{${right(d)}}} = -\\log ${pr(d.pc)} = ${n(d.loss, 3)}`,

  build(ctx) {
    const { d, el, step } = ctx
    const N = d.tokens.length

    // 1. The model's probabilities.
    step('probs', 0)
    riseIn(ctx, el('prompt'), 0, 0.35)
    for (let i = 0; i < N; i++) {
      const t = 0.2 + [0, 0.07, 0.12, 0.16][i]!
      riseIn(ctx, el(`row-${i}`), t, 0.3)
      ctx.tl.fromTo(el(`bar-${i}`), { attr: { width: 0 } }, { attr: { width: Math.max(d.bars[i]!, 1) }, duration: 0.5, ease: 'power2.out' }, t + 0.1)
      activate(ctx, el(`hit-${i}`), t + 0.3)
    }

    // 2. The right answer.
    step('answer', 1.8)
    popIn(ctx, el('answer-box'), 1.8, 0.3)
    fadeIn(ctx, el('answer-mark'), 1.9, 0.3)
    riseIn(ctx, el('answer-tag'), 2.0, 0.3)

    // 3. Only its probability matters: the others step back; p lands on the loss chart's axis.
    step('pick', 3.2)
    for (let i = 0; i < N; i++) if (i !== d.answer) dim(ctx, el(`row-${i}`), 3.2, 0.3)
    fadeIn(ctx, el('axes'), 3.3, 0.4)
    popIn(ctx, el('p-dot'), 3.7, 0.25)

    // 4. The −log curve.
    step('curve', 4.8)
    drawIn(ctx, el('curve'), 4.8, 0.9, 'power1.inOut')

    // 5. Up from p to the curve, across to the loss.
    step('loss', 6.4)
    fadeIn(ctx, el('guide'), 6.4, 0.35)
    popIn(ctx, el('loss-pt'), 6.6, 0.25)
    riseIn(ctx, el('loss-label'), 6.75, 0.3)
    activate(ctx, el('loss-hit'), 6.8)

    // 6. Compared with a random guess.
    step('result', 8.0)
    fadeIn(ctx, el('uniform'), 8.0, 0.4)
    riseIn(ctx, el('uniform-label'), 8.1, 0.3)

    holdUntil(ctx, 9.6)
  },
})
