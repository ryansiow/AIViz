import { activate, drawIn, fadeIn, holdUntil, popIn, riseIn } from '~/engine/beats'
import { defineConcept } from '~/engine/types'
import { derive, params, VIEW, type GDData } from './derive'
import Scene from './Scene.vue'

/** Number for LaTeX (ASCII minus, 2 decimals, trimmed). */
const n = (v: number, d = 2) => (Number.isFinite(v) ? String(Number(v.toFixed(d))) : '\\infty')
const paren = (v: number) => (v < 0 ? `(${n(v)})` : n(v))
const updates = (d: GDData) => d.points.length - 1

const verdict: Record<GDData['status'], (d: GDData) => string> = {
  converged: (d) => `After ${updates(d)} updates $\\theta \\approx ${n(d.final.theta)}$: the bottom of a valley, where the slope is almost zero.`,
  slow: (d) => `After ${updates(d)} updates it is still heading downhill: with $\\eta = ${n(d.eta)}$ each step is small, so progress is slow.`,
  oscillating: (d) => `The steps overshoot and bounce across the valley: $\\eta = ${n(d.eta)}$ is close to too large.`,
  diverged: (d) => `Each step overshoots further and the loss blows up: $\\eta = ${n(d.eta)}$ is too large.`,
  local: (d) =>
    `It settles at $\\theta \\approx ${n(d.final.theta)}$, the bottom of the shallower valley: a local minimum. The lowest point is in the other valley, but every step here goes downhill, so it never gets there.`,
}

export default defineConcept({
  params,
  presets: [
    { label: 'Too small', values: { eta: 0.05, theta0: -2.5, landscape: 'bowl' } },
    { label: 'Just right', values: { eta: 0.6, theta0: -2.5, landscape: 'bowl' } },
    { label: 'Too large', values: { eta: 2.1, theta0: -2.5, landscape: 'bowl' } },
    { label: 'Wrong valley', values: { eta: 0.15, theta0: 2.5, landscape: 'valleys' } },
  ],
  derive,
  viewBox: `0 0 ${VIEW.w} ${VIEW.h}`,
  scene: Scene,

  steps: [
    {
      id: 'curve',
      caption: () => 'The loss $L(\\theta)$ says how wrong a model with parameter $\\theta$ is. Training looks for its lowest point.',
      log: (d) => [{ text: `landscape: ${d.landscape}` }],
    },
    {
      id: 'start',
      caption: (d) => `Start at $\\theta_0 = ${n(d.first.theta0)}$, where $L = ${n(d.points[0]!.loss)}$.`,
      log: (d) => [{ text: `θ₀ = ${n(d.first.theta0)}   L = ` }, { text: n(d.points[0]!.loss), hue: 'blue' }],
    },
    {
      id: 'gradient',
      caption: (d) =>
        `The slope there is $L'(\\theta_0) = ${n(d.first.grad)}$. ${d.first.grad < 0 ? 'Negative slope: downhill is to the right.' : d.first.grad > 0 ? 'Positive slope: downhill is to the left.' : 'Zero slope: already flat.'}`,
      log: (d) => [{ text: "L′(θ₀) = " }, { text: n(d.first.grad), hue: 'violet' }],
    },
    {
      id: 'step',
      caption: (d) =>
        `Step against the slope: $\\theta_1 = \\theta_0 - \\eta\\,L'(\\theta_0) = ${n(d.first.theta0)} - ${n(d.eta)}\\times${paren(d.first.grad)} = ${n(d.first.theta1)}$.`,
      log: (d) => [{ text: `θ₁ = θ₀ − η·L′ = ` }, { text: n(d.first.theta1), hue: 'amber' }],
    },
    {
      id: 'descend',
      caption: () => 'Repeat from each new point: measure the slope, step against it.',
      log: (d) => [{ text: `θ = [${d.points.slice(2, 7).map((p) => n(p.theta)).join(', ')}${d.points.length > 7 ? ', …' : ''}]` }],
    },
    {
      id: 'result',
      caption: (d) => verdict[d.status](d),
      log: (d) => [
        { text: `θ${updates(d)} = ${n(d.final.theta, 3)}   L = ${n(d.final.loss, 3)}   ` },
        { text: d.status, hue: d.status === 'converged' ? 'green' : d.status === 'diverged' ? 'rose' : 'amber' },
      ],
    },
  ],

  readouts: (d) => [
    { tex: '\\eta', value: d.eta, hue: 'amber', digits: 2 },
    { tex: `\\theta_{${updates(d)}}`, value: Number.isFinite(d.final.theta) ? d.final.theta : '∞', hue: 'green' },
    { tex: `L(\\theta_{${updates(d)}})`, value: Number.isFinite(d.final.loss) ? d.final.loss : '∞', hue: 'green' },
    { tex: `|L'(\\theta_{${updates(d)}})|`, value: Number.isFinite(d.final.grad) ? Math.abs(d.final.grad) : '∞', hue: 'violet' },
  ],
  formula: (d) => `\\theta_1 = ${n(d.first.theta0)} - ${n(d.eta)}\\times${paren(d.first.grad)} = ${n(d.first.theta1)}`,

  build(ctx) {
    const { d, el, step } = ctx

    step('curve', 0)
    fadeIn(ctx, el('axes'), 0, 0.4)
    drawIn(ctx, el('curve'), 0.15, 0.9, 'power1.inOut')

    step('start', 1.5)
    popIn(ctx, el('pt-0'), 1.5, 0.25)
    drawIn(ctx, el('drop'), 1.6, 0.35)
    riseIn(ctx, el('start-label'), 1.8, 0.3)
    activate(ctx, el('hit-0'), 1.75)

    step('gradient', 2.9)
    drawIn(ctx, el('tangent-line'), 2.9, 0.5, 'power1.inOut')
    riseIn(ctx, el('tangent-label'), 3.25, 0.3)

    // Cause → effect: the step arrow shoots along θ, then the point lands on the curve.
    step('step', 4.3)
    riseIn(ctx, el('step-arrow'), 4.3, 0.35)
    if (d.shown[1]) {
      drawIn(ctx, el('seg-1'), 4.65, 0.3)
      popIn(ctx, el('pt-1'), 4.9)
      activate(ctx, el('hit-1'), 5.0)
    }

    // The rest of the iterates: quick hops that speed up, so the run reads as one motion.
    step('descend', 6.0)
    let t = 6.0
    for (let k = 2; k < d.shown.length; k++) {
      const hop = Math.max(0.1, 0.28 * 0.86 ** (k - 2))
      drawIn(ctx, el(`seg-${k}`), t, hop, 'power1.out')
      popIn(ctx, el(`pt-${k}`), t + hop * 0.8, 0.15)
      activate(ctx, el(`hit-${k}`), t + hop)
      t += hop + 0.04
    }
    const done = Math.max(t, 6.6)

    step('result', done + 0.5)
    popIn(ctx, el('final-ring'), done + 0.5, 0.3)
    const offLabel = el('off-label')
    if (offLabel.length) riseIn(ctx, offLabel, done + 0.7, 0.3)

    holdUntil(ctx, done + 1.9)
  },
})
