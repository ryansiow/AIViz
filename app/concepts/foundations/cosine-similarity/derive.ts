import { dot, fitPlane, len, scale, sideLabel, tipLabel, toSvg, type Plane, type Vec } from '~/engine/plane'
import type { ParamSchema, ParamValues } from '~/types/concept'

/**
 * Cosine Similarity: the dot product grows with length; dividing both
 * lengths out leaves only the angle. Left: the vectors as given (and b
 * stretched by k). Right: both normalised onto the unit circle.
 */
export const params = {
  a: { kind: 'vector2', label: 'a', tex: '\\mathbf{a}', hue: 'blue', range: [-4, 4], default: [3, 1], nonZero: true },
  b: { kind: 'vector2', label: 'b', tex: '\\mathbf{b}', hue: 'rose', range: [-4, 4], default: [1, 2], nonZero: true },
  k: { kind: 'number', label: 'Stretch b by', tex: 'k', hue: 'amber', min: 0.25, max: 3, step: 0.25, default: 2, digits: 2, hint: 'Changes the length of b, not its direction.' },
} satisfies ParamSchema

export const VIEW = { w: 600, h: 400 }
export const LEFT = { gridY: 62, divider: 304, box: { x: 18, y: 74, w: 272, h: 262 } }
export const TEXT = { x: 16, y1: 26, y2: 48, rx: 320 }
export const CIRCLE: Plane = { ox: 452, oy: 182, unit: 100 }
export const GAUGE = { x0: 340, x1: 564, y: 322 }

export type Verdict = 'same' | 'similar' | 'weak' | 'perpendicular' | 'weak-opposite' | 'opposing' | 'opposite'

type Label = { x: number; y: number; anchor: 'start' | 'end' | 'middle' }

export interface CosData {
  a: Vec
  b: Vec
  k: number
  kb: Vec
  dot: number
  /** a · (k b) = k (a · b). */
  dotK: number
  na: number
  nb: number
  cos: number
  /** Angle between a and b, degrees, 0–180. */
  theta: number
  /** a / |a| and b / |b|. */
  ua: Vec
  ub: Vec
  plane: Plane
  gridStep: number
  kbLabel: Label
  circle: Plane
  /** b̂'s shadow on â: foot point (SVG) and the label beside it. */
  shadow: { foot: Vec; tip: Vec; label: Label; visible: boolean }
  gauge: { zero: number; pos: number }
  verdict: Verdict
}

const r2 = (v: number) => Math.round(v * 100) / 100

export function verdictOf(cos: number): Verdict {
  if (cos >= 0.999) return 'same'
  if (cos >= 0.5) return 'similar'
  if (cos > 0.05) return 'weak'
  if (cos >= -0.05) return 'perpendicular'
  if (cos > -0.5) return 'weak-opposite'
  if (cos > -0.999) return 'opposing'
  return 'opposite'
}

export function derive(p: ParamValues<typeof params>): CosData {
  const { a, b, k } = p
  const kb = scale(b, k)
  const d = dot(a, b)
  const na = len(a)
  const nb = len(b)
  // One square root of the product (not two) keeps parallel vectors at exactly ±1.
  const cos = Math.max(-1, Math.min(1, d / Math.sqrt(dot(a, a) * dot(b, b))))
  // atan2(|a × b|, a · b) is exact at 0° and 180°.
  const cross = a[0] * b[1] - a[1] * b[0]
  const theta = (Math.atan2(Math.abs(cross), d) * 180) / Math.PI
  const ua: Vec = [a[0] / na, a[1] / na]
  const ub: Vec = [b[0] / nb, b[1] / nb]

  const plane = fitPlane([a, b, kb], LEFT.box, { pad: 1 })
  const O = toSvg(plane, [0, 0])
  const K = toSvg(plane, kb)
  const kbLabel = k > 1 ? tipLabel(O, K, 14) : sideLabel(O, K, 14, toSvg(plane, a))

  const S = (v: Vec): Vec => {
    const [x, y] = toSvg(CIRCLE, v)
    return [r2(x), r2(y)]
  }
  const foot = S(scale(ua, cos))
  const tip = S(ub)
  const CO: Vec = [CIRCLE.ox, CIRCLE.oy]
  const shadowLabel = Math.abs(cos) > 0.02 ? sideLabel(CO, foot, 14, tip) : { x: CO[0], y: CO[1] + 22, anchor: 'middle' as const }

  return {
    a,
    b,
    k,
    kb,
    dot: d,
    dotK: k * d,
    na,
    nb,
    cos,
    theta,
    ua,
    ub,
    plane,
    gridStep: plane.unit < 14 ? 2 : 1,
    kbLabel,
    circle: CIRCLE,
    shadow: { foot, tip, label: shadowLabel, visible: Math.abs(cos) > 0.02 },
    gauge: {
      zero: (GAUGE.x0 + GAUGE.x1) / 2,
      pos: r2(GAUGE.x0 + ((cos + 1) / 2) * (GAUGE.x1 - GAUGE.x0)),
    },
    verdict: verdictOf(cos),
  }
}
