import { classify2, column, det2, inverse2, matVec, type Mat2, type MatrixKind } from '~/engine/matrix'
import { fitPlane, toSvg, type Plane, type Vec } from '~/engine/plane'
import { clipSegment, type Segment } from '~/engine/plot'
import type { ParamSchema, ParamValues } from '~/types/concept'

/**
 * Matrix × vector, two ways: one dot product per row (left, the grids), and
 * a mix of the matrix's columns that moves the whole plane (right).
 */
const entry = (r: 1 | 2, c: 1 | 2, def: number) =>
  ({ kind: 'number', label: `A row ${r}, column ${c}`, tex: `A_{${r}${c}}`, hue: 'blue', min: -3, max: 3, step: 0.5, default: def, control: 'field' }) as const

export const params = {
  a11: entry(1, 1, 1),
  a12: entry(1, 2, 2),
  a21: entry(2, 1, 0),
  a22: entry(2, 2, 1),
  x: { kind: 'vector2', label: 'x', tex: '\\mathbf{x}', hue: 'rose', range: [-3, 3], default: [3, 1] },
} satisfies ParamSchema

export const VIEW = { w: 600, h: 400 }
export const CELL = 40
export const GAP = 5
export const GRIDS = { A: { x: 26, y: 100 }, x: { x: 144, y: 100 }, y: { x: 234, y: 100 }, eq: { x: 212, y: 150 } }
export const WORK = { x: 18, y1: 230, y2: 256, y3: 296, y4: 322 }
export const PLANE_BOX = { x: 304, y: 18, w: 282, h: 314 }
export const GRID_X0 = 292

export interface MatData {
  A: Mat2
  x: Vec
  y: Vec
  det: number
  kind: MatrixKind
  /** Rotation angle in degrees, for kind 'rotation'. */
  angle: number
  cols: [Vec, Vec]
  /** x₁·c₁ and x₂·c₂: the column mix that lands on y. */
  parts: [Vec, Vec]
  plane: Plane
  gridStep: number
  /** The plane's grid lines after A has moved them (SVG, clipped to the view). */
  moved: { seg: Segment; axis: boolean }[]
  /** Unit square and its image (SVG polygons). */
  square: string
  para: string
  /** Zero vectors have no arrow. */
  zero: { x: boolean; y: boolean; part1: boolean; part2: boolean; c1: boolean; c2: boolean }
}

const r2 = (v: number) => Math.round(v * 100) / 100
const isZero = (v: Vec) => Math.abs(v[0]) < 1e-9 && Math.abs(v[1]) < 1e-9

export function derive(p: ParamValues<typeof params>): MatData {
  const A: Mat2 = [
    [p.a11, p.a12],
    [p.a21, p.a22],
  ]
  const x = p.x
  const y = matVec(A, x)
  const det = det2(A)
  const kind = classify2(A)
  const c1 = column(A, 0)
  const c2 = column(A, 1)
  const parts: [Vec, Vec] = [
    [x[0] * c1[0], x[0] * c1[1]],
    [x[1] * c2[0], x[1] * c2[1]],
  ]

  const plane = fitPlane([x, y, c1, c2, [c1[0] + c2[0], c1[1] + c2[1]], parts[0], [1, 1]], PLANE_BOX, { pad: 1 })
  const S = (v: Vec): Vec => {
    const [sx, sy] = toSvg(plane, v)
    return [r2(sx), r2(sy)]
  }
  const poly = (pts: Vec[]) => pts.map((q) => S(q).join(',')).join(' ')

  // Moved grid lines: images of the lines x₁ = i and x₂ = j. Enough of them
  // to cover the view: the box corners' preimages bound i and j.
  const box = { x0: GRID_X0, x1: VIEW.w, y0: 0, y1: VIEW.h }
  const inv = inverse2(A)
  let N = 6
  if (inv) {
    const corners: Vec[] = [
      [box.x0, box.y0],
      [box.x1, box.y0],
      [box.x0, box.y1],
      [box.x1, box.y1],
    ].map(([cx, cy]) => matVec(inv, [(cx! - plane.ox) / plane.unit, (plane.oy - cy!) / plane.unit]))
    N = Math.min(40, Math.ceil(Math.max(...corners.flatMap((c) => c.map(Math.abs)))) + 1)
  }
  const moved: MatData['moved'] = []
  for (let i = -N; i <= N; i++) {
    for (const [from, to] of [
      [matVec(A, [i, -N]), matVec(A, [i, N])],
      [matVec(A, [-N, i]), matVec(A, [N, i])],
    ] as [Vec, Vec][]) {
      const seg = clipSegment(toSvg(plane, from), toSvg(plane, to), box)
      if (seg && Math.hypot(seg.x2 - seg.x1, seg.y2 - seg.y1) > 0.5)
        moved.push({ seg: { x1: r2(seg.x1), y1: r2(seg.y1), x2: r2(seg.x2), y2: r2(seg.y2) }, axis: i === 0 })
    }
  }

  const angle = (Math.atan2(A[1][0], A[0][0]) * 180) / Math.PI

  return {
    A,
    x,
    y,
    det,
    kind,
    angle,
    cols: [c1, c2],
    parts,
    plane,
    gridStep: plane.unit < 14 ? 2 : 1,
    moved,
    square: poly([[0, 0], [1, 0], [1, 1], [0, 1]]),
    para: poly([[0, 0], c1, [c1[0] + c2[0], c1[1] + c2[1]], c2]),
    zero: { x: isZero(x), y: isZero(y), part1: isZero(parts[0]), part2: isZero(parts[1]), c1: isZero(c1), c2: isZero(c2) },
  }
}
