/**
 * Geometry helpers for a 2D coordinate plane drawn in SVG.
 * Maths space has y pointing up; SVG has y pointing down.
 */

export interface Plane {
  /** SVG x of the origin. */
  ox: number
  /** SVG y of the origin. */
  oy: number
  /** SVG units per maths unit. */
  unit: number
}

export type Vec = [number, number]

export const toSvg = (p: Plane, v: Vec): Vec => [p.ox + v[0] * p.unit, p.oy - v[1] * p.unit]

export const len = (v: Vec) => Math.hypot(v[0], v[1])
export const dot = (a: Vec, b: Vec) => a[0] * b[0] + a[1] * b[1]
export const scale = (v: Vec, k: number): Vec => [v[0] * k, v[1] * k]

/** Angle of a vector in maths space, radians, (-π, π]. */
export const angleOf = (v: Vec) => Math.atan2(v[1], v[0])

/** Signed smallest rotation from a to b, radians, (-π, π]. Positive = counter-clockwise. */
export function signedAngle(a: Vec, b: Vec): number {
  let d = angleOf(b) - angleOf(a)
  while (d <= -Math.PI) d += 2 * Math.PI
  while (d > Math.PI) d -= 2 * Math.PI
  return d
}

/**
 * Arc at the origin from the direction of `a` to the direction of `b`
 * (the smaller angle). Returns the SVG path and a point for the label.
 */
export function angleArc(p: Plane, a: Vec, b: Vec, radius: number, labelGap = 14) {
  const start = angleOf(a)
  const delta = signedAngle(a, b)
  const end = start + delta
  const at = (ang: number, r: number): Vec => [p.ox + r * Math.cos(ang), p.oy - r * Math.sin(ang)]
  const [x1, y1] = at(start, radius)
  const [x2, y2] = at(end, radius)
  // SVG y is flipped, so counter-clockwise in maths space is sweep-flag 0.
  const sweep = delta >= 0 ? 0 : 1
  const d = `M${x1.toFixed(2)} ${y1.toFixed(2)} A${radius} ${radius} 0 0 ${sweep} ${x2.toFixed(2)} ${y2.toFixed(2)}`
  const label = at(start + delta / 2, radius + labelGap)
  return { d, label, delta }
}

/** Arrowhead polygon points for a line ending at `tip`, coming from `from` (SVG coords). */
export function arrowHead(from: Vec, tip: Vec, size = 9, spread = Math.PI / 7): string {
  const ang = Math.atan2(tip[1] - from[1], tip[0] - from[0])
  const left: Vec = [tip[0] - size * Math.cos(ang - spread), tip[1] - size * Math.sin(ang - spread)]
  const right: Vec = [tip[0] - size * Math.cos(ang + spread), tip[1] - size * Math.sin(ang + spread)]
  return [tip, left, right].map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' ')
}

/** Where to anchor a label just beyond a vector's tip, and which way the text runs. */
export function tipLabel(from: Vec, tip: Vec, gap = 12): { x: number; y: number; anchor: 'start' | 'end' | 'middle' } {
  const dx = tip[0] - from[0]
  const dy = tip[1] - from[1]
  const l = Math.hypot(dx, dy) || 1
  const x = tip[0] + (dx / l) * gap
  const y = tip[1] + (dy / l) * gap + 5 // +5 ≈ half a cap height, so text centres on the tip line
  const anchor = Math.abs(dx / l) < 0.35 ? 'middle' : dx > 0 ? 'start' : 'end'
  return { x, y, anchor }
}

export interface Rect { x: number; y: number; w: number; h: number }

export const overlaps = (a: Rect, b: Rect) =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h

/** First candidate rect that overlaps none of the obstacles (or the first, if all collide). */
export function pickFree(candidates: Rect[], obstacles: Rect[]): Rect {
  return candidates.find((c) => !obstacles.some((o) => overlaps(c, o))) ?? candidates[0]!
}

/** Format a number for display in maths: unicode minus, parentheses when negative in products. */
export function fmt(v: number, digits = 3): string {
  const r = Number(v.toFixed(digits))
  const s = String(Math.abs(r))
  return r < 0 ? `−${s}` : s
}
export const fmtFactor = (v: number) => (v < 0 ? `(${fmt(v)})` : fmt(v))

/**
 * A plane whose scale and origin fit every point inside `box` (SVG units).
 * The extent is rounded out to whole maths units plus `pad`, and the scale
 * snaps to one of `units`, so the view only changes in visible steps.
 */
export function fitPlane(points: Vec[], box: Rect, opts: { pad?: number; units?: number[] } = {}): Plane {
  const pad = opts.pad ?? 1
  const units = opts.units ?? [48, 40, 36, 32, 28, 24, 20, 16, 13, 10, 8, 6, 5, 4]
  const pts = points.filter((p) => Number.isFinite(p[0]) && Number.isFinite(p[1]))
  const xs = [0, ...pts.map((p) => p[0])]
  const ys = [0, ...pts.map((p) => p[1])]
  const minX = Math.floor(Math.min(...xs) + 1e-9) - pad
  const maxX = Math.ceil(Math.max(...xs) - 1e-9) + pad
  const minY = Math.floor(Math.min(...ys) + 1e-9) - pad
  const maxY = Math.ceil(Math.max(...ys) - 1e-9) + pad
  const fit = Math.min(box.w / (maxX - minX), box.h / (maxY - minY))
  const unit = units.find((u) => u <= fit) ?? Math.max(1, Math.floor(fit))
  return {
    ox: Math.round(box.x + box.w / 2 - ((minX + maxX) / 2) * unit),
    oy: Math.round(box.y + box.h / 2 + ((minY + maxY) / 2) * unit),
    unit,
  }
}

/**
 * Label beside the middle of a segment (SVG coords), offset along its normal.
 * The normal points away from `away` when given (e.g. the centre of a triangle).
 */
export function sideLabel(from: Vec, to: Vec, gap = 12, away?: Vec): { x: number; y: number; anchor: 'start' | 'end' | 'middle' } {
  const mx = (from[0] + to[0]) / 2
  const my = (from[1] + to[1]) / 2
  const dx = to[0] - from[0]
  const dy = to[1] - from[1]
  const l = Math.hypot(dx, dy) || 1
  let nx = dy / l
  let ny = -dx / l
  if (away && (mx - away[0]) * nx + (my - away[1]) * ny < 0) {
    nx = -nx
    ny = -ny
  }
  const anchor = Math.abs(nx) < 0.35 ? 'middle' : nx > 0 ? 'start' : 'end'
  return { x: mx + nx * gap, y: my + ny * gap + 5 + (ny > 0.35 ? 4 : 0), anchor }
}
