import { activate, arcIn, drawIn, fadeIn, holdUntil, popIn, riseIn, vectorIn } from '~/engine/beats'
import { defineConcept } from '~/engine/types'
import { derive, params, VIEW, type DotData } from './derive'
import Scene from './Scene.vue'

/** Number for LaTeX: trimmed, ASCII minus. */
const n = (v: number, digits = 3) => String(Number(v.toFixed(digits)))
const vec = (v: [number, number]) => `(${n(v[0])}, ${n(v[1])})`
const factor = (v: number) => (v < 0 ? `(${n(v)})` : n(v))

const verdict: Record<DotData['sign'], string> = {
  positive: 'positive, so they point roughly the same way',
  zero: 'zero, so they are perpendicular',
  negative: 'negative, so they point in roughly opposite directions',
}

export default defineConcept({
  params,
  presets: [
    { label: 'Perpendicular', values: { w: [3, 1], x: [-1, 3] } },
    { label: 'Same direction', values: { w: [2, 1], x: [4, 2] } },
    { label: 'Opposite', values: { w: [3, 1], x: [-3, -1] } },
  ],
  derive,
  viewBox: `0 0 ${VIEW.w} ${VIEW.h}`,
  scene: Scene,

  steps: [
    {
      id: 'plane',
      caption: () => 'A 2D plane. Every vector is an arrow from the origin.',
      log: () => [{ text: 'plane ready · origin (0, 0)' }],
    },
    {
      id: 'w',
      caption: (d) => `Draw $\\mathbf{w} = ${vec(d.w)}$.`,
      log: (d) => [{ text: `w = ${vec(d.w)}   |w| = ` }, { text: d.nw.toFixed(3), hue: 'blue' }],
    },
    {
      id: 'x',
      caption: (d) => `Draw $\\mathbf{x} = ${vec(d.x)}$.`,
      log: (d) => [{ text: `x = ${vec(d.x)}   |x| = ` }, { text: d.nx.toFixed(3), hue: 'rose' }],
    },
    {
      id: 'angle',
      caption: (d) => `The angle between them is $\\theta = ${d.theta.toFixed(1)}^\\circ$, so $\\cos\\theta = ${d.cos.toFixed(3)}$.`,
      log: (d) => [
        { text: 'θ = ' }, { text: `${d.theta.toFixed(1)}°`, hue: 'violet' },
        { text: '   cos θ = ' }, { text: d.cos.toFixed(3), hue: 'violet' },
      ],
    },
    {
      id: 'projection',
      caption: (d) =>
        `Project $\\mathbf{x}$ onto $\\mathbf{w}$: its shadow along $\\mathbf{w}$ has length $\\lVert\\mathbf{x}\\rVert\\cos\\theta = ${n(d.projLen)}$.`,
      log: (d) => [{ text: `proj_w(x) = ${vec(d.proj)}   length ` }, { text: d.projLen.toFixed(3), hue: 'green' }],
    },
    {
      id: 'result',
      caption: (d) => `$\\mathbf{w}\\cdot\\mathbf{x} = ${n(d.dot)}$: ${verdict[d.sign]}.`,
      log: (d) => [
        { text: `w · x = ${factor(d.w[0])}·${factor(d.x[0])} + ${factor(d.w[1])}·${factor(d.x[1])} = ` },
        { text: n(d.dot), hue: 'green' },
      ],
    },
  ],

  readouts: (d) => [
    { tex: '\\mathbf{w}\\cdot\\mathbf{x}', value: d.dot, hue: 'green' },
    { tex: '\\cos\\theta', value: d.cos, hue: 'violet' },
    { tex: '\\lVert\\mathbf{w}\\rVert', value: d.nw, hue: 'blue' },
    { tex: '\\lVert\\mathbf{x}\\rVert', value: d.nx, hue: 'rose' },
  ],
  formula: (d) =>
    `\\lVert\\mathbf{w}\\rVert\\lVert\\mathbf{x}\\rVert\\cos\\theta = ${d.nw.toFixed(3)}\\times${d.nx.toFixed(3)}\\times${d.cos.toFixed(3)} = ${n(d.dot)}`,

  build(ctx) {
    const { el, step } = ctx

    step('plane', 0)
    fadeIn(ctx, el('grid'), 0, 0.5)

    step('w', 1.0)
    vectorIn(ctx, 'w', 1.0)

    step('x', 2.8)
    vectorIn(ctx, 'x', 2.8)

    step('angle', 4.6)
    arcIn(ctx, 'angle', 4.6)

    // Projection: the guide appears with the drop (cause), then the shadow
    // draws along w (effect), and the foot lands with it.
    step('projection', 6.2)
    fadeIn(ctx, el('guide'), 6.2, 0.4, 0.5)
    drawIn(ctx, el('proj-drop'), 6.2, 0.45, 'power1.inOut')
    drawIn(ctx, el('proj-seg'), 6.55, 0.5)
    popIn(ctx, el('proj-foot'), 6.95)
    riseIn(ctx, el('proj-label'), 6.9, 0.3)
    activate(ctx, el('proj-hit'), 7.05)

    step('result', 8.3)
    riseIn(ctx, el('result'), 8.3, 0.45, 6)
    riseIn(ctx, el('result-value'), 8.5, 0.3, 4)
    activate(ctx, el('result-hit'), 8.5)

    holdUntil(ctx, 9.8)
  },
})
