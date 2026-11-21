import { activate, dim, fadeIn, fadeOut, holdUntil, popIn, riseIn, vectorIn } from '~/engine/beats'
import type { MatrixKind } from '~/engine/matrix'
import type { BuildContext } from '~/engine/types'
import { defineConcept } from '~/engine/types'
import { roundTo } from '~/utils/math'
import { derive, params, VIEW, type MatData } from './derive'
import Scene from './Scene.vue'

/** Number for LaTeX (ASCII minus). */
const n = (v: number, d = 2) => String(roundTo(v, d))
const vec = (v: [number, number]) => `(${n(v[0])}, ${n(v[1])})`
const factor = (v: number) => (v < 0 ? `(${n(v)})` : n(v))
const rowTerms = (d: MatData, r: 0 | 1) => `${factor(d.A[r][0])}\\cdot${factor(d.x[0])} + ${factor(d.A[r][1])}\\cdot${factor(d.x[1])}`
const bmatrix = (rows: number[][]) => `\\begin{bmatrix}${rows.map((r) => r.map((v) => n(v)).join(' & ')).join(' \\\\ ')}\\end{bmatrix}`

const kindText: Record<MatrixKind, (d: MatData) => string> = {
  identity: () => 'This is the identity matrix: every point stays where it is.',
  collapse: () => 'det $A = 0$: the whole plane is squashed onto a line (or a point). Different inputs land on the same output, so this cannot be undone.',
  rotation: (d) => `The grid turns by ${n(d.angle, 1)}° without stretching: a rotation. Areas are kept (det $A = 1$).`,
  reflection: () => 'The grid is mirrored without stretching: a reflection. det $A = -1$, so orientation flips.',
  stretch: (d) => `Each axis is stretched on its own: $x_1$ by ${n(d.A[0][0])}, $x_2$ by ${n(d.A[1][1])}. Areas scale by det $A = ${n(d.det)}$.`,
  shear: (d) => `Lines slide along one axis in proportion to the other: a shear. Areas are kept (det $A = ${n(d.det)}$).`,
  general: (d) =>
    `Stretch, shear and turn in one go: areas scale by $|\\det A| = ${n(Math.abs(d.det))}$${d.det < 0 ? ', and the negative det means it also flips the plane over' : ''}.`,
}

/** One row of A against x: highlight both, write the sum, fill the output cell. */
function rowBeat(ctx: BuildContext<MatData>, r: 0 | 1, at: number) {
  const { el } = ctx
  fadeIn(ctx, el(`A-row-${r}`), at, 0.25)
  riseIn(ctx, el(`work-${r + 1}`), at + 0.35, 0.35)
  popIn(ctx, el(`y-cell-${r}-0`), at + 0.75, 0.25)
  activate(ctx, el(`y-hit-${r}-0`), at + 0.8)
}

export default defineConcept({
  params,
  presets: [
    { label: 'Shear', values: { a11: 1, a12: 2, a21: 0, a22: 1, x: [3, 1] } },
    { label: 'Rotate 90°', values: { a11: 0, a12: -1, a21: 1, a22: 0, x: [3, 1] } },
    { label: 'Stretch', values: { a11: 2, a12: 0, a21: 0, a22: 0.5, x: [2, 2] } },
    { label: 'Collapse', values: { a11: 1, a12: 2, a21: 0.5, a22: 1, x: [1, 1] } },
  ],
  derive,
  viewBox: `0 0 ${VIEW.w} ${VIEW.h}`,
  scene: Scene,

  steps: [
    {
      id: 'matrix',
      caption: (d) => `A matrix is a grid of numbers. $A = ${bmatrix(d.A)}$ has 2 rows and 2 columns.`,
      log: (d) => [{ text: `A = [[${n(d.A[0][0])}, ${n(d.A[0][1])}], [${n(d.A[1][0])}, ${n(d.A[1][1])}]]`, hue: 'blue' }],
    },
    {
      id: 'vector',
      caption: (d) => `Multiply it by the vector $\\mathbf{x} = ${vec(d.x)}$, also drawn as an arrow on the right.`,
      log: (d) => [{ text: 'x = ' }, { text: vec(d.x), hue: 'rose' }],
    },
    {
      id: 'row-1',
      caption: (d) => `Row 1 of $A$ dotted with $\\mathbf{x}$: $${rowTerms(d, 0)} = ${n(d.y[0])}$. That is the first entry of $A\\mathbf{x}$.`,
      log: (d) => [{ text: '(Ax)₁ = row 1 · x = ' }, { text: n(d.y[0]), hue: 'green' }],
    },
    {
      id: 'row-2',
      caption: (d) => `Row 2: $${rowTerms(d, 1)} = ${n(d.y[1])}$. One dot product per row; a bigger matrix just has more rows.`,
      log: (d) => [{ text: '(Ax)₂ = row 2 · x = ' }, { text: n(d.y[1]), hue: 'green' }],
    },
    {
      id: 'result',
      caption: (d) =>
        d.zero.y
          ? '$A\\mathbf{x} = (0, 0)$: the matrix sends $\\mathbf{x}$ to the origin.'
          : `So $A\\mathbf{x} = ${vec(d.y)}$: the matrix moves the arrow $\\mathbf{x}$ to a new arrow.`,
      log: (d) => [{ text: 'Ax = ' }, { text: vec(d.y), hue: 'green' }],
    },
    {
      id: 'columns',
      caption: (d) =>
        `Another view: the columns of $A$ are where the axis arrows land. $(1, 0)$ goes to $\\mathbf{c}_1 = ${vec(d.cols[0])}$, $(0, 1)$ goes to $\\mathbf{c}_2 = ${vec(d.cols[1])}$, and the unit square becomes the shaded shape.`,
      log: (d) => [{ text: 'c₁ = ' }, { text: vec(d.cols[0]), hue: 'blue' }, { text: '   c₂ = ' }, { text: vec(d.cols[1]), hue: 'violet' }],
    },
    {
      id: 'combine',
      caption: (d) =>
        `$\\mathbf{x}$ says how much of each column to take: $${n(d.x[0])}\\,\\mathbf{c}_1 + ${factor(d.x[1])}\\,\\mathbf{c}_2 = ${vec(d.y)}$, exactly $A\\mathbf{x}$.`,
      log: (d) => [{ text: `${n(d.x[0])}·c₁ + ${n(d.x[1])}·c₂ = ` }, { text: vec(d.y), hue: 'green' }],
    },
    {
      id: 'transform',
      caption: (d) => `The same rule moves every point, so the whole grid moves with it. ${kindText[d.kind](d)}`,
      log: (d) => [{ text: `det A = ` }, { text: n(d.det), hue: 'violet' }, { text: `   ${d.kind}` }],
    },
  ],

  readouts: (d) => [
    { tex: '(A\\mathbf{x})_1', value: d.y[0], hue: 'green', digits: 2 },
    { tex: '(A\\mathbf{x})_2', value: d.y[1], hue: 'green', digits: 2 },
    { tex: '\\det A', value: d.det, hue: 'violet', digits: 2 },
    { tex: '\\text{effect}', value: d.kind, hue: 'neutral' },
  ],
  formula: (d) => `A\\mathbf{x} = ${bmatrix(d.A)}${bmatrix([[d.x[0]], [d.x[1]]])} = ${bmatrix([[d.y[0]], [d.y[1]]])}`,

  build(ctx) {
    const { el, step } = ctx
    const cells = (name: string, m: number, k: number) =>
      Array.from({ length: m * k }, (_, i) => el(`${name}-cell-${Math.floor(i / k)}-${i % k}`)[0]!).filter(Boolean)
    const hits = (name: string, m: number, k: number) =>
      Array.from({ length: m * k }, (_, i) => el(`${name}-hit-${Math.floor(i / k)}-${i % k}`)[0]!).filter(Boolean)

    // 1. The matrix: brackets, then the cells in reading order.
    step('matrix', 0)
    riseIn(ctx, el('A-label'), 0, 0.3)
    fadeIn(ctx, el('A-bracket'), 0.05, 0.35)
    cells('A', 2, 2).forEach((c, i) => popIn(ctx, [c], 0.2 + [0, 0.06, 0.1, 0.13][i]!, 0.22))
    activate(ctx, hits('A', 2, 2), 0.5)

    // 2. The vector, as a column and as an arrow.
    step('vector', 1.6)
    riseIn(ctx, el('x-label'), 1.6, 0.3)
    fadeIn(ctx, el('x-bracket'), 1.6, 0.35)
    cells('x', 2, 1).forEach((c, i) => popIn(ctx, [c], 1.75 + 0.06 * i, 0.22))
    activate(ctx, hits('x', 2, 1), 2.0)
    fadeIn(ctx, el('grid'), 1.8, 0.5)
    vectorIn(ctx, 'xv', 2.1)
    // The output column is an empty frame until its entries are computed.
    fadeIn(ctx, el('eq'), 2.6, 0.3)
    riseIn(ctx, el('y-label'), 2.6, 0.3)
    fadeIn(ctx, el('y-bracket'), 2.6, 0.35)

    // 3–4. One dot product per row.
    step('row-1', 3.8)
    fadeIn(ctx, el('x-col-0'), 3.8, 0.25)
    rowBeat(ctx, 0, 3.8)
    step('row-2', 5.6)
    fadeOut(ctx, el('A-row-0'), 5.6)
    rowBeat(ctx, 1, 5.7)

    // 5. The output arrow.
    step('result', 7.4)
    fadeOut(ctx, el('A-row-1'), 7.4)
    fadeOut(ctx, el('x-col-0'), 7.4)
    vectorIn(ctx, 'yv', 7.5)

    // 6. Columns: where (1, 0) and (0, 1) land, and the square they span.
    step('columns', 9.2)
    fadeIn(ctx, el('A-col-0'), 9.2, 0.25)
    fadeIn(ctx, el('A-col-1'), 9.2, 0.25)
    dim(ctx, el('xv'), 9.2, 0.3)
    fadeIn(ctx, el('square'), 9.3, 0.3)
    vectorIn(ctx, 'c1', 9.5)
    vectorIn(ctx, 'c2', 9.8)
    fadeIn(ctx, el('para'), 10.3, 0.4, 0.9)
    activate(ctx, el('para-hit'), 10.5)

    // 7. The column mix, tip to tail, landing on Ax.
    step('combine', 11.6)
    dim(ctx, el('c1'), 11.6, 0.35)
    dim(ctx, el('c2'), 11.6, 0.35)
    vectorIn(ctx, 'part1', 11.8)
    vectorIn(ctx, 'part2', 12.4)
    riseIn(ctx, el('mix'), 12.6, 0.35)

    // 8. The whole grid moves.
    step('transform', 14.0)
    fadeOut(ctx, el('A-col-0'), 14.0)
    fadeOut(ctx, el('A-col-1'), 14.0)
    fadeIn(ctx, el('moved'), 14.1, 0.7)
    riseIn(ctx, el('det'), 14.5, 0.35)

    holdUntil(ctx, 16.0)
  },
})
