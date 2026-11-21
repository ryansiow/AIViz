import { activate, drawIn, fadeIn, holdUntil, popIn, riseIn } from '~/engine/beats'
import type { BuildContext } from '~/engine/types'
import { defineConcept } from '~/engine/types'
import { roundTo } from '~/utils/math'
import { derive, params, VIEW, type LRData, type Run } from './derive'
import Scene from './Scene.vue'

/** Number for LaTeX (ASCII minus). */
const n = (v: number, d = 2) => (Number.isFinite(v) ? String(roundTo(v, d)) : '\\infty')
const big = (v: number) => (!Number.isFinite(v) ? '∞' : Math.abs(v) >= 1000 ? v.toExponential(1) : n(v))
const updates = (r: Run) => r.points.length - 1

const runText: Record<Run['status'], (r: Run, i: number) => string> = {
  slow: (r) => `Small steps: each one keeps ${Math.round(Math.abs(r.factor) * 100)}% of the remaining distance. After ${updates(r)} updates it is still ${n(r.distance)} from the bottom.`,
  converged: (r) => `It closes in fast and settles at the bottom: after ${updates(r)} updates the distance is ${n(r.distance, 3)}.`,
  oscillating: (r) =>
    Math.abs(r.factor) >= 0.999
      ? 'Each step jumps exactly across the valley and back: it bounces between the same two points forever and never closes in.'
      : 'Each step overshoots to the other side of the valley, so it zig-zags. It still closes in, slowly.',
  diverged: () => 'Each overshoot lands further away than the last: the loss climbs and the run blows up.',
  local: () => 'It settles in a valley.',
}
const runCaption = (d: LRData, i: number) => {
  const r = d.runs[i]!
  return `$\\eta_${i + 1} = ${n(r.eta)}$: ${runText[r.status](r, i)}`
}

/** One run's iterates, as quick hops that speed up. Returns the end time. */
function hops(ctx: BuildContext<LRData>, i: number, from: number, at: number): number {
  const r = ctx.d.runs[i]!
  let t = at
  for (let k = from; k < r.shown.length; k++) {
    const hop = Math.max(0.09, 0.26 * 0.85 ** (k - from))
    drawIn(ctx, ctx.el(`seg-${i}-${k}`), t, hop, 'power1.out')
    popIn(ctx, ctx.el(`pt-${i}-${k}`), t + hop * 0.8, 0.14)
    activate(ctx, ctx.el(`hit-${i}-${k}`), t + hop)
    t += hop + 0.03
  }
  return Math.max(t, at + 0.6)
}

export default defineConcept({
  params,
  presets: [
    { label: 'Small · right · large', values: { eta1: 0.1, eta2: 0.7, eta3: 2.05, theta0: -2.5 } },
    { label: 'Around 1', values: { eta1: 0.5, eta2: 1, eta3: 1.5, theta0: -2.5 } },
    { label: 'The edge at 2', values: { eta1: 1.9, eta2: 2, eta3: 2.1, theta0: -2.5 } },
  ],
  derive,
  viewBox: `0 0 ${VIEW.w} ${VIEW.h}`,
  scene: Scene,

  steps: [
    {
      id: 'bowl',
      caption: () => 'Three copies of the same loss, $L(\\theta) = \\tfrac12(\\theta - 1)^2 + \\tfrac12$, lowest at $\\theta = 1$. Only the learning rate $\\eta$ differs.',
      log: (d) => [{ text: 'η = ' }, { text: d.runs.map((r) => n(r.eta)).join(', '), hue: 'amber' }],
    },
    {
      id: 'start',
      caption: (d) => `All three start at $\\theta_0 = ${n(d.theta0)}$, where the slope is $L'(\\theta_0) = ${n(d.grad0)}$.`,
      log: (d) => [{ text: `θ₀ = ${n(d.theta0)}   L′(θ₀) = ` }, { text: n(d.grad0), hue: 'violet' }],
    },
    {
      id: 'first',
      caption: (d) =>
        `First update: $\\theta_1 = \\theta_0 - \\eta\\,L'(\\theta_0)$. Same slope everywhere, so the step size is just $\\eta$ times ${n(Math.abs(d.grad0))}: ${d.runs.map((r) => n(Math.abs(r.eta * d.grad0))).join(', ')}.`,
      log: (d) => [{ text: 'steps: ' }, { text: d.runs.map((r) => n(Math.abs(r.eta * d.grad0))).join(', '), hue: 'amber' }],
    },
    { id: 'run-1', caption: (d) => runCaption(d, 0), log: (d) => [{ text: `η₁: θ${updates(d.runs[0]!)} = ${big(d.runs[0]!.final.theta)}` }] },
    { id: 'run-2', caption: (d) => runCaption(d, 1), log: (d) => [{ text: `η₂: θ${updates(d.runs[1]!)} = ${big(d.runs[1]!.final.theta)}` }] },
    { id: 'run-3', caption: (d) => runCaption(d, 2), log: (d) => [{ text: `η₃: θ${updates(d.runs[2]!)} = ${big(d.runs[2]!.final.theta)}` }] },
    {
      id: 'factor',
      caption: (d) =>
        `Why: here $L'(\\theta) = \\theta - 1$, so each update multiplies the distance to the bottom by $(1 - \\eta)$: ${d.runs.map((r) => n(r.factor)).join(', ')}. Size below 1 shrinks it; above 1 grows it; negative flips sides.`,
      log: (d) => [{ text: '× (1 − η) = ' }, { text: d.runs.map((r) => n(r.factor)).join(', '), hue: 'violet' }],
    },
    {
      id: 'result',
      caption: () =>
        `This bowl converges for $0 < \\eta < 2$. Too small wastes steps; near 2 it zig-zags; beyond 2 it diverges. A steeper bowl lowers that limit.`,
      log: (d) => d.runs.flatMap((r, i) => [
        { text: `${i ? '   ' : ''}η=${n(r.eta)} ` },
        { text: r.status, hue: r.status === 'converged' ? 'green' : r.status === 'diverged' ? 'rose' : 'amber' },
      ]),
    },
  ],

  readouts: (d) =>
    d.runs.map((r, i) => ({
      tex: `|\\theta_{${updates(r)}} - 1|\\ (\\eta_${i + 1})`,
      value: Number.isFinite(r.distance) ? (r.distance >= 1000 ? big(r.distance) : r.distance) : '∞',
      hue: r.status === 'converged' ? 'green' : r.status === 'diverged' ? 'rose' : 'amber',
      digits: 3,
    })),
  formula: () => `\\theta_{k+1} - 1 = (1 - \\eta)\\,(\\theta_k - 1)`,

  build(ctx) {
    const { d, el, step } = ctx
    const runs = d.runs
    const each = (f: (i: number) => void) => runs.forEach((_, i) => f(i))

    // 1. Three identical bowls: decoration fades, the curves are the lead.
    step('bowl', 0)
    each((i) => {
      riseIn(ctx, el(`head-${i}`), 0.05 * i, 0.3)
      fadeIn(ctx, el(`axes-${i}`), 0.05 * i, 0.4)
      drawIn(ctx, el(`curve-${i}`), 0.15 + 0.08 * i, 0.8, 'power1.inOut')
    })

    // 2. Same start in every panel.
    step('start', 1.6)
    each((i) => {
      popIn(ctx, el(`pt-${i}-0`), 1.6 + 0.05 * i, 0.25)
      activate(ctx, el(`hit-${i}-0`), 1.7)
    })

    // 3. First update: the step arrows (cause), then θ₁ lands (effect).
    step('first', 2.7)
    each((i) => {
      riseIn(ctx, el(`arrow-${i}`), 2.7 + 0.06 * i, 0.35)
      if (runs[i]!.shown[1]) {
        drawIn(ctx, el(`seg-${i}-1`), 3.1 + 0.06 * i, 0.3)
        popIn(ctx, el(`pt-${i}-1`), 3.35 + 0.06 * i)
        activate(ctx, el(`hit-${i}-1`), 3.4)
      }
    })

    // 4–6. Each run in turn.
    let t = 4.6
    for (let i = 0; i < 3; i++) {
      step(`run-${i + 1}`, t)
      t = hops(ctx, i, 2, t + 0.1) + 0.6
    }

    // 7. The factor that explains all three.
    step('factor', t)
    each((i) => riseIn(ctx, el(`factor-${i}`), t + 0.08 * i, 0.3))
    t += 1.2

    // 8. Verdicts.
    step('result', t)
    each((i) => {
      popIn(ctx, el(`ring-${i}`), t + 0.08 * i, 0.25)
      riseIn(ctx, el(`status-${i}`), t + 0.1 + 0.08 * i, 0.3)
    })

    holdUntil(ctx, t + 1.8)
  },
})

