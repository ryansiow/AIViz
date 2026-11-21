import { dim, drawIn, fadeIn, holdUntil, riseIn, vectorIn } from '~/engine/beats'
import { defineConcept } from '~/engine/types'
import { roundTo } from '~/utils/math'
import { derive, params, VIEW, type ScaleKind, type VecData } from './derive'
import Scene from './Scene.vue'

/** Number for LaTeX (ASCII minus). */
const n = (v: number, d = 2) => String(roundTo(v, d))
const vec = (v: [number, number], d = 2) => `(${n(v[0], d)}, ${n(v[1], d)})`
const sq = (v: number) => (v < 0 ? `(${n(v)})^2` : `${n(v)}^2`)

const scaleText: Record<ScaleKind, (d: VecData) => string> = {
  grow: (d) => `same direction, ${d.k === 2 ? 'twice' : `${n(d.k)} times`} as long (${n(d.kaLen)}).`,
  shrink: (d) => `same direction, shorter: ${n(d.k)} of the length (${n(d.kaLen)}).`,
  same: () => 'multiplying by 1 changes nothing.',
  flip: (d) => `the arrow flips to point the opposite way${d.k === -1 ? '' : `, and its length is multiplied by ${n(Math.abs(d.k))} (${n(d.kaLen)})`}.`,
  zero: () => 'every entry becomes 0: the zero vector, which has no direction and no arrow.',
}

export default defineConcept({
  params,
  presets: [
    { label: 'Length 5: (3, 4)', values: { a: [3, 4], b: [1, -1], k: 2 } },
    { label: 'Flip (k = −1)', values: { a: [3, 2], b: [-2, 1], k: -1 } },
    { label: 'Halve (k = 0.5)', values: { a: [4, 2], b: [-1, 2], k: 0.5 } },
    { label: 'Cancel out', values: { a: [3, 2], b: [-3, -2], k: 2 } },
  ],
  derive,
  viewBox: `0 0 ${VIEW.w} ${VIEW.h}`,
  scene: Scene,

  steps: [
    {
      id: 'list',
      caption: (d) => `A vector is a list of numbers. $\\mathbf{a} = ${vec(d.a)}$ has two entries, and each position always means the same thing.`,
      log: (d) => [{ text: 'a = ' }, { text: vec(d.a), hue: 'blue' }],
    },
    {
      id: 'moves',
      caption: (d) => `Read it as a move on a grid: ${n(d.a[0])} along $x_1$, then ${n(d.a[1])} along $x_2$.`,
      log: (d) => [{ text: `${n(d.a[0])} along x₁, ${n(d.a[1])} along x₂` }],
    },
    {
      id: 'arrow',
      caption: (d) => `The same list as an arrow, from the origin to the point ${vec(d.a)}. It has a direction and a length; only the move matters, not where it starts.`,
      log: () => [{ text: 'arrow from (0, 0)' }],
    },
    {
      id: 'length',
      caption: (d) =>
        `Its length (norm), by Pythagoras: $\\lVert\\mathbf{a}\\rVert = \\sqrt{${sq(d.a[0])} + ${sq(d.a[1])}} = ${n(d.len)}$.`,
      log: (d) => [{ text: '|a| = ' }, { text: n(d.len), hue: 'blue' }],
    },
    {
      id: 'add',
      caption: (d) => `Add $\\mathbf{b} = ${vec(d.b)}$: put its tail at the tip of $\\mathbf{a}$ ("tip to tail").`,
      log: (d) => [{ text: 'b = ' }, { text: vec(d.b), hue: 'rose' }],
    },
    {
      id: 'sum',
      caption: (d) =>
        d.sumZero
          ? `$\\mathbf{a} + \\mathbf{b} = (0, 0)$: $\\mathbf{b}$ walks straight back to the origin, so they cancel out.`
          : `$\\mathbf{a} + \\mathbf{b} = ${vec(d.sum)}$: add entry by entry. The new arrow goes straight from the origin to where the chain ends.`,
      log: (d) => [{ text: 'a + b = ' }, { text: vec(d.sum), hue: 'green' }],
    },
    {
      id: 'scale',
      caption: (d) => `Scale by $k = ${n(d.k)}$: multiply every entry, $${n(d.k)}\\,\\mathbf{a} = ${vec(d.ka)}$: ${scaleText[d.scaleKind](d)}`,
      log: (d) => [{ text: `${n(d.k)}·a = ` }, { text: vec(d.ka), hue: 'amber' }],
    },
    {
      id: 'unit',
      caption: (d) =>
        `Divide $\\mathbf{a}$ by its own length ${n(d.len)}: $\\hat{\\mathbf{a}} = ${vec(d.unit)}$ has length 1 and keeps only the direction. This is normalising.`,
      log: (d) => [{ text: 'â = a / |a| = ' }, { text: vec(d.unit), hue: 'violet' }],
    },
  ],

  readouts: (d) => [
    { tex: '\\lVert\\mathbf{a}\\rVert', value: d.len, hue: 'blue', digits: 3 },
    { tex: '\\mathbf{a} + \\mathbf{b}', value: vec(d.sum).replace(/-/g, '−'), hue: 'green' },
    { tex: 'k\\,\\mathbf{a}', value: vec(d.ka).replace(/-/g, '−'), hue: 'amber' },
    { tex: '\\hat{\\mathbf{a}}', value: vec(d.unit).replace(/-/g, '−'), hue: 'violet' },
  ],
  formula: (d) => `\\lVert\\mathbf{a}\\rVert = \\sqrt{${sq(d.a[0])} + ${sq(d.a[1])}} = ${n(d.len, 3)}`,

  build(ctx) {
    const { d, el, step } = ctx

    // 1. The list.
    step('list', 0)
    riseIn(ctx, el('row-a'), 0.05, 0.4)

    // 2. Two moves: along x₁, then along x₂.
    step('moves', 1.4)
    fadeIn(ctx, el('grid'), 1.4, 0.5)
    let t = 1.7
    if (d.legs.h) {
      drawIn(ctx, el('leg-h'), t, 0.5, 'power1.inOut')
      riseIn(ctx, el('leg-h-label'), t + 0.35, 0.3)
      t += 0.55
    }
    if (d.legs.v) {
      drawIn(ctx, el('leg-v'), t, 0.45, 'power1.inOut')
      riseIn(ctx, el('leg-v-label'), t + 0.3, 0.3)
    }
    riseIn(ctx, el('row-a-sub'), 2.4, 0.3)

    // 3. The arrow.
    step('arrow', 3.6)
    vectorIn(ctx, 'a', 3.6)

    // 4. Length: the right angle (cause), then the number.
    step('length', 5.4)
    fadeIn(ctx, el('corner'), 5.4, 0.3)
    riseIn(ctx, el('len-label'), 5.6, 0.35)
    riseIn(ctx, el('row-len'), 5.75, 0.35)

    // 5. Tip to tail. The triangle steps back.
    step('add', 7.2)
    dim(ctx, el('legs'), 7.2, 0.2)
    dim(ctx, el('len-label'), 7.2, 0.3)
    vectorIn(ctx, 'b', 7.4)

    // 6. The sum.
    step('sum', 9.2)
    if (!d.sumZero) vectorIn(ctx, 'sum', 9.2)
    riseIn(ctx, el('row-sum'), 9.6, 0.35)

    // 7. Scaling: the addition steps back.
    step('scale', 11.2)
    dim(ctx, el('b'), 11.2, 0.25)
    if (!d.sumZero) dim(ctx, el('sum'), 11.2, 0.25)
    if (d.k !== 0) vectorIn(ctx, 'ka', 11.4)
    riseIn(ctx, el('row-ka'), 11.8, 0.35)

    // 8. Normalise: the unit circle, then the unit vector on it.
    step('unit', 13.2)
    if (d.k !== 0) dim(ctx, el('ka'), 13.2, 0.35)
    fadeIn(ctx, el('unit-circle'), 13.2, 0.4, 0.6)
    vectorIn(ctx, 'unit', 13.5)
    riseIn(ctx, el('row-unit'), 13.9, 0.35)

    holdUntil(ctx, 15.2)
  },
})
