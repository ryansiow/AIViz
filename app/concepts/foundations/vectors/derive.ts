import { fitPlane, len, scale, sideLabel, tipLabel, toSvg, type Plane, type Vec } from '~/engine/plane'
import type { ParamSchema, ParamValues } from '~/types/concept'

/**
 * Vectors: one list of numbers read two ways (a record on the left, an arrow
 * on the right), then length, tip-to-tail addition, scaling and normalising.
 */
export const params = {
  a: { kind: 'vector2', label: 'a', tex: '\\mathbf{a}', hue: 'blue', range: [-4, 4], default: [3, 2], nonZero: true },
  b: { kind: 'vector2', label: 'b', tex: '\\mathbf{b}', hue: 'rose', range: [-4, 4], default: [1, -1], nonZero: true },
  k: { kind: 'number', label: 'Scale factor', tex: 'k', hue: 'amber', min: -2, max: 2, step: 0.25, default: 2, digits: 2, hint: 'Negative flips the arrow.' },
} satisfies ParamSchema

export const VIEW = { w: 600, h: 400 }
/** The plane fills the right of the view; the list ("ledger") sits on the left. */
export const PLANE_BOX = { x: 186, y: 16, w: 398, h: 318 }
export const GRID_X0 = 172
export const LEDGER = { x: 18, top: 46, row: 52 }

export type ScaleKind = 'grow' | 'shrink' | 'same' | 'flip' | 'zero'

type Label = { x: number; y: number; anchor: 'start' | 'end' | 'middle' }
interface Leg { x1: number; y1: number; x2: number; y2: number; label: Label }

export interface VecData {
  a: Vec
  b: Vec
  k: number
  sum: Vec
  ka: Vec
  /** a / |a|. */
  unit: Vec
  len: number
  sumLen: number
  kaLen: number
  plane: Plane
  /** Grid line every `gridStep` units (wider when the scale is small). */
  gridStep: number
  /** Component legs: along x₁ from the origin, then along x₂ up to a's tip. */
  legs: { h: Leg | null; v: Leg | null; corner: string | null }
  lenLabel: Label
  bLabel: Label
  kaLabel: Label
  unitLabel: Label
  unitR: number
  origin: Vec
  scaleKind: ScaleKind
  sumZero: boolean
}

const r2 = (v: number) => Math.round(v * 100) / 100
const pt = (p: Vec): Vec => [r2(p[0]), r2(p[1])]

export function scaleKindOf(k: number): ScaleKind {
  if (k === 0) return 'zero'
  if (k < 0) return 'flip'
  if (k === 1) return 'same'
  return k > 1 ? 'grow' : 'shrink'
}

export function derive(p: ParamValues<typeof params>): VecData {
  const a = p.a
  const b = p.b
  const k = p.k
  const sum: Vec = [a[0] + b[0], a[1] + b[1]]
  const ka = scale(a, k)
  const n = len(a)
  const unit: Vec = n ? [a[0] / n, a[1] / n] : [0, 0]

  const plane = fitPlane([a, sum, ka, [1, 1], [-1, -1]], PLANE_BOX, { pad: 1 })
  const S = (v: Vec) => pt(toSvg(plane, v))
  const O = S([0, 0])
  const A = S(a)
  const C = S([a[0], 0]) // corner of the right triangle
  const SUM = S(sum)

  // Legs and their labels, on the outside of the triangle.
  const h: Leg | null = a[0]
    ? { x1: O[0], y1: O[1], x2: C[0], y2: C[1], label: { x: (O[0] + C[0]) / 2, y: a[1] >= 0 ? C[1] + 17 : C[1] - 8, anchor: 'middle' } }
    : null
  const v: Leg | null = a[1]
    ? { x1: C[0], y1: C[1], x2: A[0], y2: A[1], label: { x: a[0] >= 0 ? C[0] + 8 : C[0] - 8, y: (C[1] + A[1]) / 2 + 5, anchor: a[0] >= 0 ? 'start' : 'end' } }
    : null
  let corner: string | null = null
  if (h && v) {
    const s = 8
    const dx = Math.sign(O[0] - C[0]) * s
    const dy = Math.sign(A[1] - C[1]) * s
    corner = `M${C[0] + dx} ${C[1]} V${C[1] + dy} H${C[0]}`
  }

  // |a| beside the arrow, away from the triangle.
  const lenLabel = sideLabel(O, A, 12, C)
  // b's label beside its middle, outside the triangle origin → a → a + b.
  const G: Vec = [(O[0] + A[0] + SUM[0]) / 3, (O[1] + A[1] + SUM[1]) / 3]
  const bLabel = sideLabel(A, SUM, 12, G)
  // k·a: at its tip when it reaches past a (or points the other way), else beside it.
  const K = S(ka)
  const kaLabel = k > 1 || k < 0 ? tipLabel(O, K, 14) : sideLabel(O, K, 14, C)
  const U = S(unit)
  const unitLabel = sideLabel(O, U, 12, [2 * lenLabel.x - O[0], 2 * lenLabel.y - O[1]])

  return {
    a,
    b,
    k,
    sum,
    ka,
    unit,
    len: n,
    sumLen: len(sum),
    kaLen: Math.abs(k) * n,
    plane,
    gridStep: plane.unit < 14 ? 2 : 1,
    legs: { h, v, corner },
    lenLabel,
    bLabel,
    kaLabel,
    unitLabel,
    unitR: plane.unit,
    origin: O,
    scaleKind: scaleKindOf(k),
    sumZero: sum[0] === 0 && sum[1] === 0,
  }
}
