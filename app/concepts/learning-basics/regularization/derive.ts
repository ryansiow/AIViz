import { mse, polyFit, type PolyModel } from '~/engine/fit'
import { curvePath, frame, polylinePath, type Frame } from '~/engine/plot'
import type { ParamSchema, ParamValues } from '~/types/concept'
import { WAVE } from '../data'
import { logErr } from '../overfitting/derive'

/**
 * Regularization (L2 / weight decay): the degree-7 curve that memorised the
 * training points, with a penalty λ·Σc² added to the loss. Weights shrink,
 * the curve calms down, test error drops; too much λ underfits again.
 */
export const DEGREE = 7
export const LOG_MIN = -7

export const params = {
  logLambda: {
    kind: 'number',
    label: 'Penalty strength (log₁₀ λ)',
    tex: '\\log_{10}\\lambda',
    hue: 'amber',
    min: LOG_MIN,
    max: 0,
    step: 0.25,
    default: -3,
    digits: 2,
    hint: 'Far left (−7) means no penalty at all.',
  },
} satisfies ParamSchema

export const VIEW = { w: 600, h: 400 }
export const FIT = { x0: 50, x1: 330, y0: 66, y1: 296 }
export const WEIGHTS = { x0: 404, x1: 576, y0: 66, y1: 148 }
export const SWEEP = { x0: 404, x1: 576, y0: 204, y1: 296 }
export const Y_DOMAIN: [number, number] = [-2, 2]

export type Verdict = 'none' | 'too-little' | 'good' | 'too-much'

export const lambdaOf = (logLambda: number) => (logLambda <= LOG_MIN ? 0 : 10 ** logLambda)

export interface Bar { x: number; y: number; h: number; w: number }

export interface RegData {
  logLambda: number
  lambda: number
  model: PolyModel
  plain: PolyModel
  trainMse: number
  testMse: number
  plainTrain: number
  plainTest: number
  /** Largest |weight| (constant term excluded), with and without the penalty. */
  maxW: number
  plainMaxW: number
  verdict: Verdict
  bestLog: number
  fit: Frame
  chart: Frame
  curve: string
  plainCurve: string
  bars: Bar[]
  plainBars: Bar[]
  lines: { train: string; test: string }
  cur: { x: number; train: number; test: number }
}

const r2 = (v: number) => Math.round(v * 100) / 100

export function errorsAt(lambda: number) {
  const m = polyFit(WAVE.train.x, WAVE.train.y, DEGREE, lambda, WAVE.range)
  return { model: m, train: mse(WAVE.train.x.map(m.predict), WAVE.train.y), test: mse(WAVE.test.x.map(m.predict), WAVE.test.y) }
}

export function derive(p: ParamValues<typeof params>): RegData {
  const logLambda = Math.min(0, Math.max(LOG_MIN, p.logLambda))
  const lambda = lambdaOf(logLambda)
  const cur = errorsAt(lambda)
  const plain = errorsAt(0)
  const weights = (m: PolyModel) => m.coef.slice(1)
  const plainMaxW = Math.max(...weights(plain.model).map(Math.abs))
  const maxW = Math.max(...weights(cur.model).map(Math.abs))

  // Weight bars, signed around a middle baseline; scale set by the unpenalised weights.
  const mid = (WEIGHTS.y0 + WEIGHTS.y1) / 2
  const half = (WEIGHTS.y1 - WEIGHTS.y0) / 2
  const slot = (WEIGHTS.x1 - WEIGHTS.x0) / DEGREE
  const barsOf = (m: PolyModel): Bar[] =>
    weights(m).map((c, k) => {
      const h = Math.max(1, (Math.abs(c) / plainMaxW) * half)
      return { x: r2(WEIGHTS.x0 + k * slot + slot * 0.2), w: r2(slot * 0.6), y: r2(c >= 0 ? mid - h : mid), h: r2(h) }
    })

  // Sweep over λ (log scale), and the best λ on the test points.
  const grid = Array.from({ length: (0 - LOG_MIN) * 4 + 1 }, (_, i) => LOG_MIN + i * 0.25)
  const sweep = grid.map((g) => ({ g, ...errorsAt(lambdaOf(g)) }))
  const best = sweep.reduce((a, s) => (s.test < a.test ? s : a), sweep[0]!)
  const fit = frame(FIT, [-1.1, 1.1], Y_DOMAIN, 4, 4)
  const chart = frame(SWEEP, [LOG_MIN, 0], [-3, 1], 4, 2)

  let verdict: Verdict
  if (lambda === 0) verdict = 'none'
  else if (cur.test <= 3 * best.test) verdict = 'good'
  else verdict = logLambda < best.g ? 'too-little' : 'too-much'

  return {
    logLambda,
    lambda,
    model: cur.model,
    plain: plain.model,
    trainMse: cur.train,
    testMse: cur.test,
    plainTrain: plain.train,
    plainTest: plain.test,
    maxW,
    plainMaxW,
    verdict,
    bestLog: best.g,
    fit,
    chart,
    curve: curvePath(cur.model.predict, fit.sx, fit.sy, 220),
    plainCurve: curvePath(plain.model.predict, fit.sx, fit.sy, 220),
    bars: barsOf(cur.model),
    plainBars: barsOf(plain.model),
    lines: {
      train: polylinePath(sweep.map((s) => [s.g, Math.max(-3, logErr(s.train))]), chart.sx, chart.sy),
      test: polylinePath(sweep.map((s) => [s.g, Math.max(-3, logErr(s.test))]), chart.sx, chart.sy),
    },
    cur: { x: r2(chart.sx(logLambda)), train: r2(chart.sy(Math.max(-3, logErr(cur.train)))), test: r2(chart.sy(Math.max(-3, logErr(cur.test)))) },
  }
}
