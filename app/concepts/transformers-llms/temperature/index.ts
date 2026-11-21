import { activate, fadeIn, holdUntil, riseIn } from '~/engine/beats'
import { defineConcept } from '~/engine/types'
import { roundTo } from '~/utils/math'
import { derive, params, SAMPLES, VIEW, type TempData, type Verdict } from './derive'
import Scene from './Scene.vue'

/** Number for captions (ASCII minus inside LaTeX). */
const n = (v: number, d = 2) => String(roundTo(v, d))
const pct = (p: number) => (p < 0.001 ? 'under 0.1%' : `${(p * 100).toFixed(p < 0.1 ? 1 : 0)}%`)
const topRow = (d: TempData) => d.rows[d.top]!
const tok = (s: string) => `\\text{${s}}`

const gapNote = (d: TempData) => {
  const a = d.rows[d.top]!
  const b = d.rows[d.second]!
  const raw = a.z - b.z
  const scaled = a.scaled - b.scaled
  if (Math.abs(d.T - 1) < 1e-9) return `With $T = 1$ nothing changes: the gap between “${a.token}” and “${b.token}” stays ${n(raw)}.`
  return `The gap between “${a.token}” and “${b.token}” goes from ${n(raw)} to ${n(scaled)}: ${d.T < 1 ? 'stretched' : 'squeezed'} by $1/T = ${n(1 / d.T)}$.`
}

const verdictText: Record<Verdict, (d: TempData) => string> = {
  'near-greedy': (d) => `At $T = ${n(d.T)}$ “${topRow(d).token}” gets ${pct(topRow(d).p)}: sampling is almost the same as always picking the top token (greedy).`,
  focused: (d) => `At $T = ${n(d.T)}$ the favourite “${topRow(d).token}” rises from ${pct(topRow(d).p1)} to ${pct(topRow(d).p)}. Focused, but alternatives remain.`,
  model: (d) => `At $T = 1$ you sample from the model's own distribution: “${topRow(d).token}” ${pct(topRow(d).p)}.`,
  spread: (d) => `At $T = ${n(d.T)}$ the favourite drops from ${pct(topRow(d).p1)} to ${pct(topRow(d).p)}, and unlikely tokens get a real chance. More variety, more risk.`,
  'near-uniform': (d) => `At $T = ${n(d.T)}$ every token is close to equally likely: the model's preferences are almost washed out.`,
}

export default defineConcept({
  params,
  presets: [
    { label: 'Greedy-ish (T = 0.2)', values: { T: 0.2, scenario: 'capital' } },
    { label: 'Model (T = 1)', values: { T: 1, scenario: 'capital' } },
    { label: 'Hot (T = 2.5)', values: { T: 2.5, scenario: 'capital' } },
    { label: 'Open-ended prompt', values: { T: 1.5, scenario: 'story' } },
  ],
  derive,
  viewBox: `0 0 ${VIEW.w} ${VIEW.h}`,
  scene: Scene,

  steps: [
    {
      id: 'logits',
      caption: (d) => `For “${d.prompt}”, the model scores each candidate token: its logit $z$. These scores are fixed; temperature only reshapes what comes next.`,
      log: (d) => [{ text: `z = [${d.rows.map((r) => n(r.z, 1)).join(', ')}]` }],
    },
    {
      id: 'baseline',
      caption: (d) => `At $T = 1$, softmax gives the model's own probabilities (the outlines). “${topRow(d).token}” gets ${pct(topRow(d).p1)}.`,
      log: (d) => [{ text: `p(T=1) = [${d.rows.map((r) => r.p1.toFixed(3)).join(', ')}]` }],
    },
    {
      id: 'divide',
      caption: (d) => `Now divide every score by $T = ${n(d.T)}$. ${gapNote(d)}`,
      log: (d) => [{ text: 'z / T, T = ' }, { text: n(d.T), hue: 'amber' }, { text: `  → [${d.rows.map((r) => n(r.scaled)).join(', ')}]` }],
    },
    {
      id: 'reshape',
      caption: (d) =>
        `Softmax of the new scores. Bigger gaps hand more probability to the leader; smaller gaps share it out: $p(${tok(topRow(d).token)})$ is now ${pct(topRow(d).p)}.`,
      log: (d) => [{ text: 'p(T) = ' }, { text: `[${d.rows.map((r) => r.p.toFixed(3)).join(', ')}]`, hue: 'green' }],
    },
    {
      id: 'spread',
      caption: (d) =>
        `Spread, measured as entropy: ${n(d.entropy)} bits (it was ${n(d.entropy1)} at $T = 1$). 0 means the same token every time; ${Math.log2(d.rows.length)} means all ${d.rows.length} are equally likely.`,
      log: (d) => [{ text: 'H = ' }, { text: `${n(d.entropy)} bits`, hue: 'violet' }, { text: `   (T=1: ${n(d.entropy1)})` }],
    },
    {
      id: 'sample',
      caption: (d) =>
        `Sample ${SAMPLES} next tokens at this temperature and you would expect about: ${d.rows
          .filter((r) => r.count > 0)
          .map((r) => `${r.token} ${r.count}`)
          .join(', ')}.`,
      log: (d) => [{ text: `${SAMPLES} samples ≈ ${d.rows.map((r) => `${r.token} ${r.count}`).join(', ')}` }],
    },
    {
      id: 'result',
      caption: (d) => verdictText[d.verdict](d),
      log: (d) => [{ text: `top: ${topRow(d).token} ` }, { text: pct(topRow(d).p), hue: 'green' }, { text: `   ${d.verdict}` }],
    },
  ],

  readouts: (d) => [
    { tex: 'T', value: d.T, hue: 'amber', digits: 2 },
    { tex: 'p_{\\max}', value: topRow(d).p, hue: 'green', digits: 3 },
    { tex: 'p_{\\max}\\ (T = 1)', value: topRow(d).p1, hue: 'neutral', digits: 3 },
    { tex: 'H\\ (\\text{bits})', value: d.entropy, hue: 'violet', digits: 2 },
  ],
  formula: (d) => {
    const r = topRow(d)
    return `p_{${tok(r.token)}} = \\frac{e^{${n(r.z, 1)}/${n(d.T)}}}{\\sum_j e^{z_j/${n(d.T)}}} = ${r.p.toFixed(3)}`
  },

  build(ctx) {
    const { tl, d, el, step } = ctx
    const rows = d.rows
    const stagger = (i: number) => [0, 0.07, 0.12, 0.16][i] ?? i * 0.04

    // 1. Logits: the fixed raw scores.
    step('logits', 0)
    riseIn(ctx, el('prompt'), 0, 0.35)
    fadeIn(ctx, el('zero'), 0.1, 0.4)
    riseIn(ctx, el('head-scaled'), 0.1, 0.3)
    rows.forEach((r, i) => {
      riseIn(ctx, el('token').slice(i, i + 1), 0.2 + stagger(i), 0.3)
      tl.fromTo(
        el(`scaled-bar-${i}`),
        { attr: { x: d.zeroX, width: 0 } },
        { attr: { x: r.rawBar.x, width: r.rawBar.w }, duration: 0.5, ease: 'power2.out' },
        0.35 + stagger(i),
      )
      fadeIn(ctx, el(`raw-val-${i}`), 0.7 + stagger(i), 0.25)
    })
    activate(ctx, rows.map((_, i) => el(`hit-${i}`)[0]!), 0.9)

    // 2. Baseline: the model's own distribution, as outlines.
    step('baseline', 1.8)
    riseIn(ctx, el('head-prob'), 1.8, 0.3)
    rows.forEach((r, i) => {
      tl.fromTo(el(`ghost-${i}`), { attr: { width: 0 } }, { attr: { width: Math.max(r.ghostBar.w, 1) }, duration: 0.5, ease: 'power2.out' }, 1.95 + stagger(i))
      fadeIn(ctx, el(`ghost-val-${i}`), 2.3 + stagger(i), 0.25)
    })

    // 3. Divide by T: the logit bars rescale in place.
    step('divide', 3.3)
    rows.forEach((r, i) => {
      tl.fromTo(
        el(`scaled-bar-${i}`),
        { attr: { x: r.rawBar.x, width: r.rawBar.w } },
        { attr: { x: r.scaledBar.x, width: r.scaledBar.w }, duration: 0.7, ease: 'power2.inOut', immediateRender: false },
        3.45,
      )
      tl.fromTo(el(`raw-val-${i}`), { opacity: 1 }, { opacity: 0, duration: 0.15, immediateRender: false }, 3.45)
      fadeIn(ctx, el(`scaled-val-${i}`), 4.05, 0.25)
    })

    // 4. Reshape: probabilities grow or shrink from the T = 1 outline.
    step('reshape', 5.0)
    rows.forEach((r, i) => {
      tl.fromTo(el(`prob-bar-${i}`), { attr: { width: r.ghostBar.w } }, { attr: { width: r.probBar.w }, duration: 0.7, ease: 'power2.inOut' }, 5.15)
      // Different property from the width tween, so it may render its start state (hidden) at build time.
      tl.fromTo(el(`prob-bar-${i}`), { opacity: 0 }, { opacity: 1, duration: 0.2 }, 5.15)
      tl.fromTo(el(`ghost-val-${i}`), { opacity: 1 }, { opacity: 0, duration: 0.15, immediateRender: false }, 5.15)
      fadeIn(ctx, el(`prob-val-${i}`), 5.75, 0.25)
    })

    // 5. Spread: the entropy meter moves from its T = 1 mark to the new value.
    step('spread', 6.8)
    fadeIn(ctx, el('meter'), 6.8, 0.35)
    tl.fromTo(
      el('meter-fill'),
      { attr: { width: Math.max(d.meter.fill1, 10) }, opacity: 0 },
      { attr: { width: Math.max(d.meter.fill, 10) }, opacity: 1, duration: 0.8, ease: 'power2.inOut' },
      7.05,
    )
    riseIn(ctx, el('meter-val'), 7.7, 0.3)
    activate(ctx, el('hit-meter'), 7.1)

    // 6. Samples: dots land row by row, quickly, so the counts read as one gesture.
    step('sample', 8.8)
    riseIn(ctx, el('head-samples'), 8.8, 0.3)
    let t = 9.0
    rows.forEach((_, i) => {
      const dots = el(`dot-${i}`)
      if (!dots.length) return
      tl.fromTo(
        dots,
        { opacity: 0, scale: 0.4, transformOrigin: '50% 50%' },
        { opacity: 1, scale: 1, duration: 0.18, ease: 'power2.out', stagger: Math.min(0.03, 0.5 / dots.length) },
        t,
      )
      t += 0.25
    })

    // 7. Result: only now is the winner highlighted.
    step('result', Math.max(t, 10.0) + 0.4)
    fadeIn(ctx, el('top-row'), Math.max(t, 10.0) + 0.4, 0.45)

    holdUntil(ctx, Math.max(t, 10.0) + 1.9)
  },
})
