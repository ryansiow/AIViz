import { linear, type Scale } from '~/engine/plot'
import type { ParamSchema, ParamValues } from '~/types/concept'

export const LANDSCAPES = {
  bowl: {
    label: 'Bowl',
    f: (t: number) => 0.5 * (t - 1) ** 2 + 0.5,
    df: (t: number) => t - 1,
    y: [0, 10] as [number, number],
  },
  valleys: {
    label: 'Two valleys',
    f: (t: number) => 0.15 * t ** 4 - 0.8 * t ** 2 + 0.3 * t + 1.5,
    df: (t: number) => 0.6 * t ** 3 - 1.6 * t + 0.3,
    y: [-0.5, 8] as [number, number],
  },
} as const
export type LandscapeId = keyof typeof LANDSCAPES

export const params = {
  eta: { kind: 'number', label: 'Learning rate', tex: '\\eta', hue: 'amber', min: 0.01, max: 2.2, step: 0.01, default: 0.5, digits: 2, hint: 'Step size: how far each update moves.' },
  theta0: { kind: 'number', label: 'Starting point', tex: '\\theta_0', hue: 'blue', min: -3, max: 3, step: 0.1, default: -2.5, digits: 1 },
  landscape: {
    kind: 'select',
    label: 'Loss landscape',
    default: 'bowl',
    options: [{ value: 'bowl', label: 'Bowl' }, { value: 'valleys', label: 'Two valleys' }],
  },
} satisfies ParamSchema

export const VIEW = { w: 600, h: 400 }
export const PLOT = { left: 64, right: 576, top: 36, bottom: 300 }
export const X_DOMAIN: [number, number] = [-3.2, 3.2]
/** Number of updates shown. */
export const ITERATIONS = 12

/** `local`: settled (or settling) in a valley that is not the lowest one. */
export type Status = 'converged' | 'slow' | 'oscillating' | 'diverged' | 'local'

export interface GDPoint {
  k: number
  theta: number
  loss: number
  grad: number
  /** SVG position; clamped to the plot when the value is off the chart. */
  x: number
  y: number
  offChart: boolean
}

export interface GDData {
  eta: number
  landscape: LandscapeId
  points: GDPoint[]
  /** Points drawn: up to and including the first one that leaves the chart. */
  shown: GDPoint[]
  status: Status
  /** First update, spelled out: θ₁ = θ₀ − η·L′(θ₀). */
  first: { theta0: number; grad: number; delta: number; theta1: number }
  final: GDPoint
  sx: Scale
  sy: Scale
  /** Tangent at θ₀, as an SVG segment. */
  tangent: { x1: number; y1: number; x2: number; y2: number }
}

export function descend(f: (t: number) => number, df: (t: number) => number, theta0: number, eta: number, n = ITERATIONS) {
  const thetas = [theta0]
  for (let k = 0; k < n; k++) {
    const t = thetas[k]!
    const next = t - eta * df(t)
    thetas.push(next)
    if (!Number.isFinite(next) || Math.abs(next) > 1e6) break
  }
  return thetas
}

export function classify(thetas: number[], df: (t: number) => number): Status {
  const last = thetas[thetas.length - 1]!
  if (!Number.isFinite(last) || Math.abs(last) > 50) return 'diverged'
  const steps = thetas.slice(1).map((t, i) => t - thetas[i]!)
  const tail = steps.slice(-4)
  const growing = tail.length >= 2 && Math.abs(tail[tail.length - 1]!) > Math.abs(tail[0]!) * 1.05
  if (growing && Math.abs(tail[tail.length - 1]!) > 0.05) return 'diverged'
  if (Math.abs(df(last)) < 0.02) return 'converged'
  const flips = tail.slice(1).filter((s, i) => Math.sign(s) !== Math.sign(tail[i]!)).length
  if (flips >= 2) return 'oscillating'
  return 'slow'
}

export function derive(v: ParamValues<typeof params>): GDData {
  const L = LANDSCAPES[v.landscape as LandscapeId] ?? LANDSCAPES.bowl
  const sx = linear(X_DOMAIN, [PLOT.left, PLOT.right])
  const sy = linear(L.y, [PLOT.bottom, PLOT.top])
  const thetas = descend(L.f, L.df, v.theta0, v.eta)

  const points: GDPoint[] = thetas.map((theta, k) => {
    const loss = L.f(theta)
    const inX = theta >= X_DOMAIN[0] && theta <= X_DOMAIN[1]
    const inY = loss >= L.y[0] && loss <= L.y[1]
    const cx = Math.min(X_DOMAIN[1], Math.max(X_DOMAIN[0], Number.isFinite(theta) ? theta : Math.sign(theta) * 1e9))
    const cy = Math.min(L.y[1], Math.max(L.y[0], Number.isFinite(loss) ? loss : L.y[1]))
    return { k, theta, loss, grad: L.df(theta), x: sx(cx), y: sy(cy), offChart: !(inX && inY) }
  })

  const g0 = L.df(v.theta0)
  const delta = -v.eta * g0
  // Tangent line through (θ₀, L(θ₀)), ±0.5 in θ.
  const t0 = v.theta0
  const y0 = L.f(t0)
  const tangent = { x1: sx(t0 - 0.5), y1: sy(y0 - 0.5 * g0), x2: sx(t0 + 0.5), y2: sy(y0 + 0.5 * g0) }

  return {
    eta: v.eta,
    landscape: v.landscape as LandscapeId,
    points,
    shown: (() => {
      const off = points.findIndex((p) => p.offChart)
      return off === -1 ? points : points.slice(0, off + 1)
    })(),
    status: (() => {
      const s = classify(thetas, L.df)
      // Two valleys: the right-hand one (θ > 0) is the shallower, local minimum.
      const last = thetas[thetas.length - 1]!
      return v.landscape === 'valleys' && (s === 'converged' || s === 'slow') && last > 0.2 ? 'local' : s
    })(),
    first: { theta0: t0, grad: g0, delta, theta1: t0 + delta },
    final: points[points.length - 1]!,
    sx,
    sy,
    tangent,
  }
}
