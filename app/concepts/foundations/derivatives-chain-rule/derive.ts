import { curvePath, linear, tangentSegment, ticks, type Scale, type Segment } from '~/engine/plot'
import type { ParamSchema, ParamValues } from '~/types/concept'

/**
 * Derivatives & Chain Rule: x → g → u → f → y. A small nudge Δx is
 * multiplied by g′(x) on the way to u, then by f′(u) on the way to y, so
 * dy/dx = f′(u) · g′(x). Left plot: u = g(x). Right plot: y = f(u).
 */
const sigmoid = (u: number) => 1 / (1 + Math.exp(-u))

export const INNER = {
  linear: { label: '2x + 1', tex: '2x + 1', g: (x: number) => 2 * x + 1, dg: (_x: number) => 2 },
  square: { label: 'x²', tex: 'x^2', g: (x: number) => x * x, dg: (x: number) => 2 * x },
  sine: { label: 'sin x', tex: '\\sin x', g: Math.sin, dg: Math.cos },
} as const
export const OUTER = {
  square: { label: 'u²', tex: 'u^2', f: (u: number) => u * u, df: (u: number) => 2 * u },
  sigmoid: { label: 'σ(u)', tex: '\\sigma(u)', f: sigmoid, df: (u: number) => sigmoid(u) * (1 - sigmoid(u)) },
  sine: { label: 'sin u', tex: '\\sin u', f: Math.sin, df: Math.cos },
} as const
export type InnerId = keyof typeof INNER
export type OuterId = keyof typeof OUTER

export const params = {
  inner: {
    kind: 'select',
    label: 'Inner function g',
    default: 'linear',
    options: (Object.keys(INNER) as InnerId[]).map((k) => ({ value: k, label: INNER[k].label })),
  },
  outer: {
    kind: 'select',
    label: 'Outer function f',
    default: 'square',
    options: (Object.keys(OUTER) as OuterId[]).map((k) => ({ value: k, label: OUTER[k].label })),
  },
  x: { kind: 'number', label: 'Input', tex: 'x', hue: 'blue', min: -2, max: 2, step: 0.1, default: 1, digits: 1 },
  dx: { kind: 'number', label: 'Nudge', tex: '\\Delta x', hue: 'amber', min: 0.05, max: 1, step: 0.05, default: 0.5, digits: 2, hint: 'Shrink it: Δy/Δx approaches dy/dx.' },
} satisfies ParamSchema

export const VIEW = { w: 600, h: 400 }
export const X_DOMAIN: [number, number] = [-2, 3]
export const PLOTS = {
  g: { x0: 46, x1: 284, y0: 120, y1: 312 },
  f: { x0: 342, x1: 580, y0: 120, y1: 312 },
}
export const CHAIN = { y: 28, h: 34, w: 80, xs: [16, 176, 336] as const, result: 434 }

type Label = { x: number; y: number; anchor: 'start' | 'end' | 'middle' }

export interface Side {
  sx: Scale
  sy: Scale
  curve: string
  xTicks: number[]
  yTicks: number[]
  /** The current point and the nudged one (SVG), and the triangle's corner. */
  P: [number, number]
  Q: [number, number]
  corner: [number, number]
  tangent: Segment | null
  runLabel: Label
  riseLabel: Label
  /** Guides from P to the two axes. */
  guide: string
}

export interface ChainData {
  inner: InnerId
  outer: OuterId
  x: number
  dx: number
  u: number
  y: number
  /** Nudge as it passes through: Δu = g(x + Δx) − g(x), Δy = f(u + Δu) − f(u). */
  du: number
  dy: number
  /** Local slopes. */
  dg: number
  df: number
  /** Chain rule: dy/dx = f′(u) · g′(x). */
  dydx: number
  /** The measured ratio Δy/Δx, which approaches dydx as Δx → 0. */
  ratio: number
  g: Side
  f: Side
}

const r2 = (v: number) => Math.round(v * 100) / 100

/** [min, max] of fn over [a, b], sampled, padded by 8% so curves never touch the frame. */
export function extentOf(fn: (v: number) => number, a: number, b: number, n = 240): [number, number] {
  let lo = Infinity
  let hi = -Infinity
  for (let i = 0; i <= n; i++) {
    const v = fn(a + ((b - a) * i) / n)
    if (v < lo) lo = v
    if (v > hi) hi = v
  }
  const pad = Math.max(hi - lo, 1e-6) * 0.08
  return [lo - pad, hi + pad]
}

/** Room a nudge label needs ("Δu = −0.03" in 12px mono). */
const LABEL_W = 78

/**
 * Labels for the nudge triangle P → corner → Q (SVG). The run label sits under
 * (or over) the run, centred when the run is long enough, else beside it where
 * there is room. The rise label sits beside the rise, or past Q when the rise
 * is too short to hold it.
 */
export function nudgeLabels(P: [number, number], Q: [number, number], box: { x0: number; x1: number }): { run: Label; rise: Label } {
  const up = Q[1] <= P[1]
  const lo = Math.min(P[0], Q[0])
  const hi = Math.max(P[0], Q[0])
  const roomLeft = lo - box.x0
  const roomRight = box.x1 - hi
  const runY = up ? P[1] + 16 : P[1] - 8
  let run: Label
  if (hi - lo > LABEL_W) run = { x: (lo + hi) / 2, y: runY, anchor: 'middle' }
  else {
    // Prefer the side away from Q, so the label does not sit on the triangle.
    const awayIsLeft = Q[0] >= P[0]
    const left = awayIsLeft ? roomLeft >= LABEL_W || roomLeft >= roomRight : !(roomRight >= LABEL_W || roomRight >= roomLeft)
    run = left ? { x: lo - 4, y: runY, anchor: 'end' } : { x: hi + 4, y: runY, anchor: 'start' }
  }
  const qRight = box.x1 - Q[0]
  const qLeft = Q[0] - box.x0
  let rise: Label
  if (Math.abs(Q[1] - P[1]) >= 18) {
    // Beside the rise, outside the triangle when there is room.
    const outsideIsRight = Q[0] >= P[0]
    const right = outsideIsRight ? qRight >= LABEL_W || qRight >= qLeft : !(qLeft >= LABEL_W || qLeft >= qRight)
    const y = (P[1] + Q[1]) / 2 + 4
    rise = right ? { x: Q[0] + 6, y, anchor: 'start' } : { x: Q[0] - 6, y, anchor: 'end' }
  } else {
    // Too short to hold a label: put it past Q, on the far side from the run label.
    const right = qRight >= LABEL_W || qRight >= qLeft
    rise = { x: right ? Q[0] + 2 : Q[0] - 2, y: up ? Q[1] - 9 : Q[1] + 17, anchor: right ? 'start' : 'end' }
  }
  return { run, rise }
}

function side(
  fn: (v: number) => number,
  dfn: (v: number) => number,
  domain: [number, number],
  range: [number, number],
  box: { x0: number; x1: number; y0: number; y1: number },
  at: number,
  nudge: number,
): Side {
  const sx = linear(domain, [box.x0, box.x1])
  const sy = linear(range, [box.y1, box.y0])
  const v0 = fn(at)
  const v1 = fn(at + nudge)
  const P: [number, number] = [r2(sx(at)), r2(sy(v0))]
  const Q: [number, number] = [r2(sx(at + nudge)), r2(sy(v1))]
  const corner: [number, number] = [Q[0], P[1]]
  const labels = nudgeLabels(P, Q, box)
  const t = tangentSegment(at, v0, dfn(at), sx, sy)
  return {
    sx,
    sy,
    curve: curvePath(fn, sx, sy, 160),
    xTicks: ticks(domain[0], domain[1], 4),
    yTicks: ticks(range[0], range[1], 4),
    P,
    Q,
    corner,
    tangent: t && { x1: r2(t.x1), y1: r2(t.y1), x2: r2(t.x2), y2: r2(t.y2) },
    runLabel: labels.run,
    riseLabel: labels.rise,
    guide: `M${P[0]} ${P[1]} V${box.y1} M${P[0]} ${P[1]} H${box.x0}`,
  }
}

export function derive(p: ParamValues<typeof params>): ChainData {
  const inner = (p.inner in INNER ? p.inner : 'linear') as InnerId
  const outer = (p.outer in OUTER ? p.outer : 'square') as OuterId
  const { g, dg } = INNER[inner]
  const { f, df } = OUTER[outer]
  const x = p.x
  const dx = p.dx

  const u = g(x)
  const du = g(x + dx) - u
  const y = f(u)
  const dy = f(u + du) - y

  // The u axis is shared: it is the left plot's output and the right plot's input.
  const uDomain = extentOf(g, X_DOMAIN[0], X_DOMAIN[1])
  const yRange = extentOf(f, uDomain[0], uDomain[1])

  return {
    inner,
    outer,
    x,
    dx,
    u,
    y,
    du,
    dy,
    dg: dg(x),
    df: df(u),
    dydx: df(u) * dg(x),
    ratio: dy / dx,
    g: side(g, dg, X_DOMAIN, uDomain, PLOTS.g, x, dx),
    f: side(f, df, uDomain, yRange, PLOTS.f, u, du),
  }
}
