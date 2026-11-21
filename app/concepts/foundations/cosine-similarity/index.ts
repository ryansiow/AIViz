import { activate, arcIn, drawIn, fadeIn, holdUntil, popIn, riseIn, vectorIn } from '~/engine/beats'
import { defineConcept } from '~/engine/types'
import { roundTo } from '~/utils/math'
import { derive, params, VIEW, type CosData, type Verdict } from './derive'
import Scene from './Scene.vue'

/** Number for LaTeX (ASCII minus). */
const n = (v: number, d = 2) => String(roundTo(v, d))
const vec = (v: [number, number]) => `(${n(v[0])}, ${n(v[1])})`
const factor = (v: number) => (v < 0 ? `(${n(v)})` : n(v))

const verdictText: Record<Verdict, string> = {
  same: 'the same direction, whatever the lengths',
  similar: 'pointing in a similar direction',
  weak: 'only weakly aligned',
  perpendicular: 'perpendicular: no shared direction at all',
  'weak-opposite': 'leaning slightly against each other',
  opposing: 'pointing mostly in opposite directions',
  opposite: 'exactly opposite directions',
}

const stretchNote = (d: CosData) =>
  d.k === 1
    ? 'With $k = 1$ nothing changes; try another stretch.'
    : `Stretch $\\mathbf{b}$ by $k = ${n(d.k)}$: same direction, but the dot product becomes ${n(d.dotK)}. Length leaks into the score.`

export default defineConcept({
  params,
  presets: [
    { label: 'Same direction', values: { a: [3, 1], b: [6, 2], k: 2 } },
    { label: 'Perpendicular', values: { a: [3, 1], b: [-1, 3], k: 2 } },
    { label: 'Opposite', values: { a: [3, 1], b: [-3, -1], k: 0.5 } },
    { label: 'Short but aligned', values: { a: [4, 4], b: [1, 1], k: 3 } },
  ],
  derive,
  viewBox: `0 0 ${VIEW.w} ${VIEW.h}`,
  scene: Scene,

  steps: [
    {
      id: 'vectors',
      caption: (d) => `Two vectors, $\\mathbf{a} = ${vec(d.a)}$ and $\\mathbf{b} = ${vec(d.b)}$. How similar are their directions?`,
      log: (d) => [{ text: 'a = ' }, { text: vec(d.a), hue: 'blue' }, { text: '   b = ' }, { text: vec(d.b), hue: 'rose' }],
    },
    {
      id: 'dot',
      caption: (d) =>
        `Their dot product: $${factor(d.a[0])}\\cdot${factor(d.b[0])} + ${factor(d.a[1])}\\cdot${factor(d.b[1])} = ${n(d.dot)}$. It mixes two things: how aligned they are, and how long they are.`,
      log: (d) => [{ text: 'a · b = ' }, { text: n(d.dot) }],
    },
    {
      id: 'stretch',
      caption: (d) => stretchNote(d),
      log: (d) => [{ text: `a · (${n(d.k)}b) = ` }, { text: n(d.dotK), hue: 'amber' }],
    },
    {
      id: 'normalise',
      caption: (d) =>
        `Divide each vector by its length (${n(d.na)} and ${n(d.nb)}). Both land on the unit circle, and $${n(d.k)}\\mathbf{b}$ lands exactly where $\\mathbf{b}$ does.`,
      log: (d) => [{ text: `â = (${n(d.ua[0], 3)}, ${n(d.ua[1], 3)})   b̂ = (${n(d.ub[0], 3)}, ${n(d.ub[1], 3)})` }],
    },
    {
      id: 'angle',
      caption: (d) => `Only the angle between them is left: $\\theta = ${d.theta.toFixed(1)}^\\circ$.`,
      log: (d) => [{ text: 'θ = ' }, { text: `${d.theta.toFixed(1)}°`, hue: 'violet' }],
    },
    {
      id: 'cosine',
      caption: (d) =>
        `Dot the unit vectors: $\\hat{\\mathbf{a}}\\cdot\\hat{\\mathbf{b}} = \\frac{${n(d.dot)}}{${n(d.na)} \\times ${n(d.nb)}} = ${n(d.cos, 3)} = \\cos\\theta$. It is the length of $\\hat{\\mathbf{b}}$'s shadow on $\\hat{\\mathbf{a}}$.`,
      log: (d) => [{ text: 'cos θ = ' }, { text: n(d.cos, 3), hue: 'green' }],
    },
    {
      id: 'result',
      caption: (d) => `Cosine similarity ${n(d.cos, 3)}: ${verdictText[d.verdict]}. Change $k$ and it stays ${n(d.cos, 3)}.`,
      log: (d) => [{ text: `${d.verdict.replace('-', ' ')} ` }, { text: n(d.cos, 3), hue: d.cos < 0 ? 'rose' : 'green' }],
    },
  ],

  readouts: (d) => [
    { tex: '\\cos\\theta', value: d.cos, hue: 'green', digits: 3 },
    { tex: '\\mathbf{a}\\cdot\\mathbf{b}', value: d.dot, hue: 'neutral', digits: 2 },
    { tex: '\\mathbf{a}\\cdot(k\\,\\mathbf{b})', value: d.dotK, hue: 'amber', digits: 2 },
    { tex: '\\theta', value: `${d.theta.toFixed(1)}°`, hue: 'violet' },
  ],
  formula: (d) =>
    `\\cos\\theta = \\frac{\\mathbf{a}\\cdot\\mathbf{b}}{\\lVert\\mathbf{a}\\rVert\\,\\lVert\\mathbf{b}\\rVert} = \\frac{${n(d.dot)}}{${n(d.na, 3)}\\times${n(d.nb, 3)}} = ${n(d.cos, 3)}`,

  build(ctx) {
    const { el, step } = ctx

    // 1. The vectors as given.
    step('vectors', 0)
    fadeIn(ctx, el('grid'), 0, 0.5)
    vectorIn(ctx, 'a', 0.3)
    vectorIn(ctx, 'b', 0.8)

    // 2. The dot product.
    step('dot', 2.4)
    riseIn(ctx, el('dot-1'), 2.4, 0.4)

    // 3. Stretch b: the band grows along b, then its dot product.
    step('stretch', 4.0)
    vectorIn(ctx, 'kb', 4.0)
    riseIn(ctx, el('dot-2'), 4.6, 0.35)

    // 4. Normalise: the circle (lead), then both unit vectors land on it.
    step('normalise', 6.0)
    fadeIn(ctx, el('circle-axes'), 6.0, 0.4)
    drawIn(ctx, el('circle'), 6.0, 0.8, 'power1.inOut')
    vectorIn(ctx, 'ua', 6.6)
    vectorIn(ctx, 'ub', 6.9)
    popIn(ctx, el('kb-ring'), 7.7, 0.25)

    // 5. The angle.
    step('angle', 8.8)
    arcIn(ctx, 'angle', 8.8)

    // 6. The cosine: the drop (cause), then the shadow along â (effect).
    step('cosine', 10.2)
    drawIn(ctx, el('shadow-drop'), 10.2, 0.4, 'power1.inOut')
    drawIn(ctx, el('shadow-seg'), 10.55, 0.5)
    popIn(ctx, el('shadow-foot'), 10.95)
    riseIn(ctx, el('shadow-label'), 10.9, 0.3)
    riseIn(ctx, el('cos-text'), 11.1, 0.35)
    activate(ctx, el('shadow-hit'), 11.0)

    // 7. Where it sits between −1 and 1.
    step('result', 12.4)
    fadeIn(ctx, el('gauge'), 12.4, 0.4)
    drawIn(ctx, el('gauge-fill'), 12.6, 0.5)
    popIn(ctx, el('gauge-dot'), 13.0, 0.25)
    activate(ctx, el('gauge-hit'), 12.8)

    holdUntil(ctx, 14.4)
  },
})
