import { mean, normalPdf } from '~/engine/fit'
import { curvePath, frame, type Frame } from '~/engine/plot'
import type { ParamSchema, ParamValues } from '~/types/concept'

/**
 * Maximum Likelihood: a bell curve (mean μ, spread σ) as a model of five
 * measurements. Each point's height under the curve is its likelihood; their
 * product (or the sum of logs) scores μ, and the best μ is the data's mean.
 */
export const DATA = [2.1, 2.9, 3.4, 3.8, 4.8]

export const params = {
  mu: { kind: 'number', label: 'Centre of the curve', tex: '\\mu', hue: 'amber', min: 0, max: 7, step: 0.1, default: 2.5, digits: 1 },
  sigma: { kind: 'number', label: 'Spread of the curve', tex: '\\sigma', hue: 'amber', min: 0.5, max: 2, step: 0.1, default: 1, digits: 1 },
} satisfies ParamSchema

export const VIEW = { w: 600, h: 400 }
export const X_DOMAIN: [number, number] = [0, 7]
export const TOP = { x0: 60, x1: 560, y0: 70, y1: 192 }
export const BOTTOM = { x0: 60, x1: 560, y0: 242, y1: 318 }
/** How far below the peak the log-likelihood chart reaches. */
export const LOG_SPAN = 24

export interface MLData {
  mu: number
  sigma: number
  xs: number[]
  /** Density of each point under the curve. */
  dens: number[]
  likelihood: number
  logL: number
  muHat: number
  logLMax: number
  top: Frame
  bottom: Frame
  bell: string
  bestBell: string
  logCurve: string
  /** Current μ and the peak on the log-likelihood chart (SVG). */
  cur: { x: number; y: number; off: boolean }
  peak: { x: number; y: number }
  bars: { x: number; y0: number; y1: number }[]
}

const r2 = (v: number) => Math.round(v * 100) / 100

export const logLikelihood = (xs: number[], mu: number, sigma: number) => xs.reduce((a, x) => a + Math.log(normalPdf(x, mu, sigma)), 0)

export function derive(p: ParamValues<typeof params>): MLData {
  const { mu, sigma } = p
  const xs = DATA
  const dens = xs.map((x) => normalPdf(x, mu, sigma))
  const muHat = mean(xs)
  const logL = logLikelihood(xs, mu, sigma)
  const logLMax = logLikelihood(xs, muHat, sigma)
  const top = frame(TOP, X_DOMAIN, [0, 0.85], 7, 4)
  const hi = Math.ceil(logLMax + 1)
  const bottom = frame(BOTTOM, X_DOMAIN, [hi - LOG_SPAN, hi], 7, 3)
  const curY = Math.max(logL, hi - LOG_SPAN)
  return {
    mu,
    sigma,
    xs,
    dens,
    likelihood: dens.reduce((a, b) => a * b, 1),
    logL,
    muHat,
    logLMax,
    top,
    bottom,
    bell: curvePath((x) => normalPdf(x, mu, sigma), top.sx, top.sy, 160),
    bestBell: curvePath((x) => normalPdf(x, muHat, sigma), top.sx, top.sy, 160),
    logCurve: curvePath((m) => logLikelihood(xs, m, sigma), bottom.sx, bottom.sy, 160),
    cur: { x: r2(bottom.sx(mu)), y: r2(bottom.sy(curY)), off: logL < hi - LOG_SPAN },
    peak: { x: r2(bottom.sx(muHat)), y: r2(bottom.sy(logLMax)) },
    bars: xs.map((x, i) => ({ x: r2(top.sx(x)), y0: r2(top.sy(0)), y1: r2(top.sy(Math.min(dens[i]!, 0.85))) })),
  }
}
