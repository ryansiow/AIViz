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
