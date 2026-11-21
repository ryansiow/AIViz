import { curvePath, linear, ticks, type Scale } from '~/engine/plot'
import type { ParamSchema, ParamValues } from '~/types/concept'
import { classify, descend, LANDSCAPES, type Status } from '../gradient-descent/derive'

/**
 * Learning Rate: the Gradient Descent bowl, three times, with three step sizes.
 * Same loss and start, so the only difference between the panels is η.
 * The bowl L(θ) = ½(θ − 1)² + ½ has L′(θ) = θ − 1, so every update multiplies
 * the distance to the bottom by (1 − η): stable for 0 < η < 2.
 */
export const BOWL = LANDSCAPES.bowl
export const MIN_THETA = 1

const eta = (i: 1 | 2 | 3, where: string, def: number) =>
  ({ kind: 'number', label: `Learning rate, ${where} panel`, tex: `\\eta_${i}`, hue: 'amber', min: 0.01, max: 2.2, step: 0.01, default: def, digits: 2 }) as const

export const params = {
  eta1: eta(1, 'left', 0.1),
  eta2: eta(2, 'middle', 0.7),
  eta3: eta(3, 'right', 2.05),
  theta0: { kind: 'number', label: 'Starting point', tex: '\\theta_0', hue: 'blue', min: -3, max: 3, step: 0.1, default: -2.5, digits: 1 },
} satisfies ParamSchema

export const VIEW = { w: 600, h: 400 }
/** Shared θ and loss ranges: symmetric around the minimum at θ = 1. */
export const X_DOMAIN: [number, number] = [-3, 5]
export const Y_DOMAIN: [number, number] = [0, 9]
export const PANEL = { y: 44, w: 180, gap: 12, plotTop: 72, plotBottom: 252, pad: 12 }
export const PANEL_X = [0, 1, 2].map((i) => 12 + i * (PANEL.w + PANEL.gap))

export interface LRPoint {
  k: number
  theta: number
  loss: number
  grad: number
  x: number
  y: number
  offChart: boolean
}

export interface Run {
  eta: number
  /** Distance multiplier per step: θₖ₊₁ − 1 = (1 − η)(θₖ − 1). */
  factor: number
  points: LRPoint[]
  /** Up to and including the first point that leaves the chart. */
  shown: LRPoint[]
  status: Status
  final: LRPoint
  /** |θ_final − 1|. */
  distance: number
  /** Panel geometry. */
  x0: number
  sx: Scale
  sy: Scale
  curve: string
  /** First step along the θ axis: from θ₀ to θ₁ (clamped to the panel). */
  firstArrow: { x1: number; x2: number; y: number; clipped: boolean }
}

export interface LRData {
  theta0: number
  grad0: number
  loss0: number
  runs: Run[]
  xTicks: number[]
}

/** One gradient descent run drawn into panel `i`. */
export function makeRun(i: number, etaValue: number, theta0: number): Run {
  const x0 = PANEL_X[i]!
  const sx = linear(X_DOMAIN, [x0 + PANEL.pad, x0 + PANEL.w - PANEL.pad])
  const sy = linear(Y_DOMAIN, [PANEL.plotBottom, PANEL.plotTop])
  const thetas = descend(BOWL.f, BOWL.df, theta0, etaValue)

  const points: LRPoint[] = thetas.map((theta, k) => {
    const loss = BOWL.f(theta)
    const inX = theta >= X_DOMAIN[0] && theta <= X_DOMAIN[1]
    const inY = loss >= Y_DOMAIN[0] && loss <= Y_DOMAIN[1]
    const cx = Math.min(X_DOMAIN[1], Math.max(X_DOMAIN[0], Number.isFinite(theta) ? theta : Math.sign(theta) * 1e9))
    const cy = Math.min(Y_DOMAIN[1], Math.max(Y_DOMAIN[0], Number.isFinite(loss) ? loss : Y_DOMAIN[1]))
    // Rounded so server and browser render identical attributes (hydration).
    const r3 = (v: number) => Math.round(v * 1000) / 1000
    return { k, theta, loss, grad: BOWL.df(theta), x: r3(sx(cx)), y: r3(sy(cy)), offChart: !(inX && inY) }
  })
  const off = points.findIndex((p) => p.offChart)
  const shown = off === -1 ? points : points.slice(0, off + 1)
  const final = points[points.length - 1]!

  const t1 = thetas[1] ?? theta0
  const clampX = (t: number) => Math.min(X_DOMAIN[1], Math.max(X_DOMAIN[0], t))

  return {
    eta: etaValue,
    factor: 1 - etaValue,
    points,
    shown,
    status: classify(thetas, BOWL.df),
    final,
    distance: Math.abs(final.theta - MIN_THETA),
    x0,
    sx,
    sy,
    curve: curvePath(BOWL.f, sx, sy, 120),
    firstArrow: { x1: sx(theta0), x2: sx(clampX(t1)), y: PANEL.plotBottom + 30, clipped: t1 !== clampX(t1) },
  }
}

export function derive(v: ParamValues<typeof params>): LRData {
  return {
    theta0: v.theta0,
    grad0: BOWL.df(v.theta0),
    loss0: BOWL.f(v.theta0),
    runs: [v.eta1, v.eta2, v.eta3].map((e, i) => makeRun(i, e, v.theta0)),
    xTicks: ticks(X_DOMAIN[0], X_DOMAIN[1], 4),
  }
}

