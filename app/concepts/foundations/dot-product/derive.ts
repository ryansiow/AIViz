import { angleOf, dot, len, pickFree, scale, tipLabel, toSvg, type Plane, type Rect, type Vec } from '~/engine/plane'
import type { ParamSchema, ParamValues } from '~/types/concept'

export const params = {
  w: { kind: 'vector2', label: 'w', tex: '\\mathbf{w}', hue: 'blue', range: [-4, 4], default: [3, 1], nonZero: true },
  x: { kind: 'vector2', label: 'x', tex: '\\mathbf{x}', hue: 'rose', range: [-4, 4], default: [1, 2], nonZero: true },
} satisfies ParamSchema

export const VIEW = { w: 600, h: 400 }
export const PLANE: Plane = { ox: 330, oy: 190, unit: 36 }
export const CARD = { w: 172, h: 74 }

export interface DotData {
  w: Vec
  x: Vec
  dot: number
  nw: number
  nx: number
  cos: number
  /** Angle between w and x, degrees, 0–180. */
  theta: number
  /** Projection of x onto w (a vector along w). */
  proj: Vec
  /** Signed length of the projection along w: |x| cos θ. */
  projLen: number
  sign: 'positive' | 'zero' | 'negative'
  plane: Plane
  /** Where the result card goes, chosen to avoid the vector labels. */
  card: Rect
}

const round = (v: number, d = 9) => Number(v.toFixed(d))

export function derive(p: ParamValues<typeof params>): DotData {
  const w = p.w
  const x = p.x
  const d = round(dot(w, x))
  const nw = len(w)
  const nx = len(x)
  const cos = nw && nx ? Math.max(-1, Math.min(1, d / (nw * nx))) : 0
  // atan2(|w × x|, w · x) is exact at 0° and 180°, where acos(cos) loses precision.
  const cross = w[0] * x[1] - w[1] * x[0]
  const theta = (Math.atan2(Math.abs(cross), d) * 180) / Math.PI
  const proj = nw ? scale(w, d / (nw * nw)) : ([0, 0] as Vec)
  const projLen = nw ? d / nw : 0

  // Keep the result card clear of the vector labels.
  const origin: Vec = [PLANE.ox, PLANE.oy]
  const labelBox = (v: Vec): Rect => {
    const l = tipLabel(origin, toSvg(PLANE, v), 14)
    const width = 112
    const x0 = l.anchor === 'start' ? l.x : l.anchor === 'end' ? l.x - width : l.x - width / 2
    return { x: x0, y: l.y - 18, w: width, h: 24 }
  }
  const tipBox = (v: Vec): Rect => {
    const [tx, ty] = toSvg(PLANE, v)
    return { x: tx - 8, y: ty - 8, w: 16, h: 16 }
  }
  const m = 16
  const card = pickFree(
    [
      { x: m, y: m, w: CARD.w, h: CARD.h },
      { x: VIEW.w - CARD.w - m, y: m, w: CARD.w, h: CARD.h },
      { x: m, y: VIEW.h - CARD.h - 70, w: CARD.w, h: CARD.h },
      { x: VIEW.w - CARD.w - m, y: VIEW.h - CARD.h - 70, w: CARD.w, h: CARD.h },
    ],
    [labelBox(w), labelBox(x), tipBox(w), tipBox(x)],
  )

  return {
    w,
    x,
    dot: d,
    nw,
    nx,
    cos,
    theta,
    proj,
    projLen,
    sign: d > 1e-9 ? 'positive' : d < -1e-9 ? 'negative' : 'zero',
    plane: PLANE,
    card,
  }
}

/** Angle of a vector in degrees, for the tracking overlay. */
export const heading = (v: Vec) => ((angleOf(v) * 180) / Math.PI + 360) % 360
