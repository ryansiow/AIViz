import { activate, fadeIn, holdUntil, riseIn } from '~/engine/beats'
import { compact } from '~/engine/plot'
import { defineConcept } from '~/engine/types'
import { derive, params, VIEW, type SoftmaxData } from './derive'
import Scene from './Scene.vue'

const n = (v: number, d = 2) => String(Number(v.toFixed(d)))
const tempNote = (T: number) =>
  T === 1 ? 'With $T = 1$ the scores are unchanged.' : T < 1 ? `$T = ${n(T)} < 1$ stretches the gaps between scores.` : `$T = ${n(T)} > 1$ squeezes the gaps between scores.`

const spread = (d: SoftmaxData) => {
  const p = d.rows[d.top]!.p
  if (p > 0.9) return 'the model is almost certain'
  if (p > 0.5) return 'a clear favourite'
  return 'the choice is still open'
}

export default defineConcept({
  params,
  presets: [
    { label: 'Confident (T = 0.5)', values: { T: 0.5 } },
    { label: 'Creative (T = 2)', values: { T: 2 } },
    { label: 'Tied scores', values: { z0: 2, z1: 2, z2: 2, z3: 2, T: 1 } },
  ],
  derive,
  viewBox: `0 0 ${VIEW.w} ${VIEW.h}`,
  scene: Scene,

  steps: [
    {
      id: 'logits',
      caption: () => 'For “The capital of France is …”, the model gives each candidate token a raw score: its logit $z$.',
      log: (d) => [{ text: `z = [${d.rows.map((r) => n(r.z, 1)).join(', ')}]` }],
    },
    {
      id: 'temperature',
      caption: (d) => `Divide every score by the temperature $T$. ${tempNote(d.T)}`,
      log: (d) => [{ text: `z / T, T = ` }, { text: n(d.T), hue: 'amber' }, { text: `  → [${d.rows.map((r) => n(r.scaled)).join(', ')}]` }],
    },
    {
      id: 'exp',
      caption: () => 'Exponentiate: $e^{z/T}$ makes every score positive and widens the gaps.',
      log: (d) => [{ text: `e^(z/T) = [${d.rows.map((r) => compact(r.exp)).join(', ')}]` }],
    },
    {
      id: 'sum',
      caption: (d) => `Add them up: $\\sum_j e^{z_j/T} = ${compact(d.sum).replace('−', '-')}$.`,
      log: (d) => [{ text: 'Σ e^(z/T) = ' }, { text: compact(d.sum), hue: 'violet' }],
    },
    {
      id: 'normalise',
      caption: () => 'Divide each by the sum. The results are probabilities: all positive, adding up to 1.',
      log: (d) => [{ text: `p = [${d.rows.map((r) => r.p.toFixed(3)).join(', ')}]   Σ = ` }, { text: '1', hue: 'green' }],
    },
    {
      id: 'result',
      caption: (d) => {
        const r = d.rows[d.top]!
        return `$p(\\text{${r.token}}) = ${r.p.toFixed(2)}$: ${spread(d)}.`
      },
      log: (d) => [
        { text: `top: ${d.rows[d.top]!.token} ` },
        { text: `${(d.rows[d.top]!.p * 100).toFixed(1)}%`, hue: 'green' },
        { text: `   entropy ${d.entropy.toFixed(2)} bits` },
      ],
    },
  ],

  readouts: (d) => [
    { tex: 'T', value: d.T, hue: 'amber', digits: 2 },
    { tex: `p_{\\max}`, value: d.rows[d.top]!.p, hue: 'green' },
    { tex: '\\textstyle\\sum e^{z/T}', value: compact(d.sum), hue: 'violet' },
    { tex: 'H\\ (\\text{bits})', value: d.entropy, hue: 'neutral', digits: 2 },
  ],
  formula: (d) => {
    const r = d.rows[d.top]!
    return `p_{\\text{${r.token}}} = \\frac{e^{${n(r.scaled)}}}{${compact(d.sum).replace('−', '-')}} = ${r.p.toFixed(3)}`
  },

  build(ctx) {
    const { tl, d, el, step } = ctx
    const rows = d.rows
    // Rows enter top to bottom; the gap shrinks so the group reads as one wave.
    const stagger = (i: number) => [0, 0.07, 0.12, 0.16, 0.19][i] ?? i * 0.05

    step('logits', 0)
    rows.forEach((r, i) => {
      riseIn(ctx, el('token').slice(i, i + 1), stagger(i), 0.3)
      tl.fromTo(
        el(`scaled-bar-${i}`),
        { attr: { x: d.zeroX, width: 0 } },
        { attr: { x: r.rawBar.x, width: r.rawBar.w }, duration: 0.5, ease: 'power2.out' },
        0.15 + stagger(i),
      )
      fadeIn(ctx, el(`raw-val-${i}`), 0.5 + stagger(i), 0.25)
    })
    fadeIn(ctx, el('zero'), 0, 0.4)
    activate(ctx, rows.map((_, i) => el(`hit-${i}`)[0]!), 0.7)

    // Temperature: the same bars rescale in place (raw → z/T).
    step('temperature', 1.6)
    riseIn(ctx, el('head-scaled'), 1.6, 0.3)
    rows.forEach((r, i) => {
      tl.fromTo(
        el(`scaled-bar-${i}`),
        { attr: { x: r.rawBar.x, width: r.rawBar.w } },
        { attr: { x: r.scaledBar.x, width: r.scaledBar.w }, duration: 0.6, ease: 'power2.inOut', immediateRender: false },
        1.75,
      )
      tl.fromTo(el(`raw-val-${i}`), { opacity: 1 }, { opacity: 0, duration: 0.15, immediateRender: false }, 1.75)
      fadeIn(ctx, el(`scaled-val-${i}`), 2.25, 0.25)
    })

    step('exp', 3.2)
    fadeIn(ctx, el('arrow-1'), 3.2, 0.3)
    riseIn(ctx, el('head-exp'), 3.2, 0.3)
    rows.forEach((r, i) => {
      tl.fromTo(el(`exp-bar-${i}`), { attr: { width: 0 } }, { attr: { width: r.expBar.w }, duration: 0.55, ease: 'power2.out' }, 3.35 + stagger(i))
      fadeIn(ctx, el(`exp-val-${i}`), 3.75 + stagger(i), 0.25)
    })

    step('sum', 4.8)
    riseIn(ctx, el('sum-exp'), 4.8, 0.35, 6)

    step('normalise', 6.2)
    fadeIn(ctx, el('arrow-2'), 6.2, 0.3)
    riseIn(ctx, el('head-prob'), 6.2, 0.3)
    rows.forEach((r, i) => {
      tl.fromTo(el(`prob-bar-${i}`), { attr: { width: 0 } }, { attr: { width: r.probBar.w }, duration: 0.55, ease: 'power2.out' }, 6.35 + stagger(i))
      fadeIn(ctx, el(`prob-val-${i}`), 6.75 + stagger(i), 0.25)
    })
    riseIn(ctx, el('sum-prob'), 7.0, 0.3, 6)

    step('result', 8.0)
    fadeIn(ctx, el('top-row'), 8.0, 0.45)

    holdUntil(ctx, 9.4)
  },
})
