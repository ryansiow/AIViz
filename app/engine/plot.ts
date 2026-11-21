/** Small plotting helpers: linear scales, sampled curves, number formatting. */

export type Scale = ((v: number) => number) & { domain: [number, number]; range: [number, number] }

/** Maps [d0, d1] linearly onto [r0, r1]. */
export function linear(domain: [number, number], range: [number, number]): Scale {
  const [d0, d1] = domain
  const [r0, r1] = range
  const k = d1 === d0 ? 0 : (r1 - r0) / (d1 - d0)
  const s = ((v: number) => r0 + (v - d0) * k) as Scale
  s.domain = domain
  s.range = range
  return s
}

/** "Nice" tick values (1, 2, 5 × 10ⁿ steps) covering [min, max]. */
export function ticks(min: number, max: number, count = 5): number[] {
  if (!(max > min)) return [min]
  const raw = (max - min) / count
  const mag = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 5, 10].map((m) => m * mag).find((s) => s >= raw)!
  const out: number[] = []
  for (let v = Math.ceil(min / step) * step; v <= max + step * 1e-9; v += step) out.push(Number(v.toFixed(10)))
  return out
}

/**
 * SVG path for y = f(x), sampled at n points. Where the curve leaves
 * [yMin, yMax] it ends exactly at the edge and resumes where it comes back,
 * so it is never drawn flattened along the border.
 */
export function curvePath(f: (x: number) => number, sx: Scale, sy: Scale, n = 200): string {
  const [x0, x1] = sx.domain
  const lo = Math.min(...sy.domain)
  const hi = Math.max(...sy.domain)
  const inside = (y: number) => Number.isFinite(y) && y >= lo && y <= hi
  const pt = (x: number, y: number) => `${sx(x).toFixed(2)} ${sy(y).toFixed(2)}`
  let d = ''
  let pen = false // true while drawing inside the plot
  let px = x0
  let py = f(x0)
  if (inside(py)) {
    d += `M${pt(px, py)}`
    pen = true
  }
  for (let i = 1; i <= n; i++) {
    const x = x0 + ((x1 - x0) * i) / n
    const y = f(x)
    const a = inside(py)
    const b = inside(y)
    if (a !== b && Number.isFinite(y) && Number.isFinite(py)) {
      // Crossing an edge: end (or restart) exactly at the crossing point.
      const edge = (a ? y : py) > hi ? hi : lo
      const cx = px + ((x - px) * (edge - py)) / (y - py)
      d += `${a ? 'L' : 'M'}${pt(cx, edge)}`
      pen = !a
    }
    if (b) {
      d += `${pen ? 'L' : 'M'}${pt(x, y)}`
      pen = true
    } else {
      pen = false
    }
    px = x
    py = y
  }
  return d
}

/**
 * Compact number for labels: up to 3 significant digits, scientific notation
 * for very large or tiny values (e.g. 1.2e26), unicode minus.
 */
export function compact(v: number): string {
  if (!Number.isFinite(v)) return v > 0 ? '∞' : v < 0 ? '−∞' : '—'
  const a = Math.abs(v)
  let s: string
  if (a !== 0 && (a >= 1e5 || a < 1e-3)) {
    const [m, e] = v.toExponential(1).split('e')
    s = `${m}e${Number(e)}`
  } else {
    s = String(Number(v.toPrecision(3)))
  }
  return s.replace('-', '−')
}

export interface Segment { x1: number; y1: number; x2: number; y2: number }

/**
 * Clips the segment p→q to a box with Liang–Barsky. Returns null when the
 * segment lies completely outside.
 */
export function clipSegment(p: [number, number], q: [number, number], box: { x0: number; x1: number; y0: number; y1: number }): Segment | null {
  const dx = q[0] - p[0]
  const dy = q[1] - p[1]
  let t0 = 0
  let t1 = 1
  const checks: [number, number][] = [
    [-dx, p[0] - box.x0],
    [dx, box.x1 - p[0]],
    [-dy, p[1] - box.y0],
    [dy, box.y1 - p[1]],
  ]
  for (const [pp, qq] of checks) {
    if (pp === 0) {
      if (qq < 0) return null
      continue
    }
    const r = qq / pp
    if (pp < 0) t0 = Math.max(t0, r)
    else t1 = Math.min(t1, r)
    if (t0 > t1) return null
  }
  return { x1: p[0] + t0 * dx, y1: p[1] + t0 * dy, x2: p[0] + t1 * dx, y2: p[1] + t1 * dy }
}

/**
 * The tangent line to a curve at (x, y) with the given slope, in SVG
 * coordinates: `halfLength` px either side of the point, clipped to the plot.
 */
export function tangentSegment(x: number, y: number, slope: number, sx: Scale, sy: Scale, halfLength = 1e4): Segment | null {
  const px = sx(x)
  const py = sy(y)
  // Direction of one maths unit along x, in SVG units.
  const dx = sx(x + 1) - px
  const dy = sy(y + slope) - py
  const l = Math.hypot(dx, dy)
  if (!Number.isFinite(l) || l === 0) return null
  const ux = (dx / l) * halfLength
  const uy = (dy / l) * halfLength
  const [x0, x1] = [Math.min(...sx.range), Math.max(...sx.range)]
  const [y0, y1] = [Math.min(...sy.range), Math.max(...sy.range)]
  return clipSegment([px - ux, py - uy], [px + ux, py + uy], { x0, x1, y0, y1 })
}

export interface Frame {
  box: { x0: number; x1: number; y0: number; y1: number }
  sx: Scale
  sy: Scale
  xTicks: number[]
  yTicks: number[]
}

/** Scales and ticks for a chart drawn in `box` (SVG), y pointing up. */
export function frame(
  box: { x0: number; x1: number; y0: number; y1: number },
  xDomain: [number, number],
  yDomain: [number, number],
  xCount = 5,
  yCount = 4,
): Frame {
  return {
    box,
    sx: linear(xDomain, [box.x0, box.x1]),
    sy: linear(yDomain, [box.y1, box.y0]),
    xTicks: ticks(xDomain[0], xDomain[1], xCount),
    yTicks: ticks(yDomain[0], yDomain[1], yCount),
  }
}

/** SVG path through data points (a loss curve, a sampled function), coordinates rounded to 0.01. */
export function polylinePath(points: [number, number][], sx: Scale, sy: Scale): string {
  return points.map(([x, y], i) => `${i ? 'L' : 'M'}${sx(x).toFixed(2)} ${sy(y).toFixed(2)}`).join('')
}
