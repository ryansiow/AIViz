import { mse, polyFit, type PolyModel } from '~/engine/fit'
import { curvePath, frame, polylinePath, type Frame } from '~/engine/plot'
import type { ParamSchema, ParamValues } from '~/types/concept'
import { WAVE } from '../data'

/**
 * Overfitting: polynomials of rising degree fitted to 8 noisy training points,
 * checked on 8 held-out test points. Training error only falls; test error
 * falls, then rises once the curve starts fitting the noise.
 */
export const params = {
  degree: { kind: 'number', label: 'Polynomial degree', tex: 'd', hue: 'amber', min: 1, max: 7, step: 1, default: 7, digits: 0, hint: 'Higher degree = more flexible curve.' },
} satisfies ParamSchema

export const VIEW = { w: 600, h: 400 }
export const FIT = { x0: 50, x1: 330, y0: 66, y1: 296 }
export const SWEEP = { x0: 400, x1: 576, y0: 66, y1: 296 }
export const Y_DOMAIN: [number, number] = [-2, 2]
export const MAX_DEGREE = 7
/** Log-scale floor for errors (a perfect fit has MSE 0). */
export const LOG_FLOOR = -4

export type Verdict = 'underfit' | 'good' | 'best' | 'overfit'

export interface Residual { x: number; y1: number; y2: number }

export interface OFData {
  degree: number
  model: PolyModel
  train: { x: number[]; y: number[] }
  test: { x: number[]; y: number[] }
  trainMse: number
  testMse: number
  /** Errors for every degree 1..7. */
  sweep: { degree: number; train: number; test: number }[]
  bestDegree: number
  verdict: Verdict
  fit: Frame
  chart: Frame
  curve: string
  trainRes: Residual[]
  testRes: Residual[]
  lines: { train: string; test: string }
  cur: { x: number; train: number; test: number }
  best: { x: number; y: number }
}

const r2 = (v: number) => Math.round(v * 100) / 100
export const logErr = (v: number) => Math.max(LOG_FLOOR, Math.log10(Math.max(v, 1e-12)))

export function sweepErrors(trainSet = WAVE.train, testSet = WAVE.test) {
  return Array.from({ length: MAX_DEGREE }, (_, k) => {
    const m = polyFit(trainSet.x, trainSet.y, k + 1, 0, WAVE.range)
    return { degree: k + 1, train: mse(trainSet.x.map(m.predict), trainSet.y), test: mse(testSet.x.map(m.predict), testSet.y) }
  })
}

export function verdictOf(degree: number, testErr: number, bestDegree: number, bestTest: number): Verdict {
  if (degree === bestDegree) return 'best'
  if (testErr <= 3 * bestTest) return 'good'
  return degree < bestDegree ? 'underfit' : 'overfit'
}

export function derive(p: ParamValues<typeof params>): OFData {
  const degree = Math.round(Math.min(MAX_DEGREE, Math.max(1, p.degree)))
  const { train, test } = WAVE
  const model = polyFit(train.x, train.y, degree, 0, WAVE.range)
  const fit = frame(FIT, [-1.1, 1.1], Y_DOMAIN, 4, 4)
  const chart = frame(SWEEP, [0.5, MAX_DEGREE + 0.5], [LOG_FLOOR, 1], 7, 5)
  const clampY = (v: number) => Math.min(Y_DOMAIN[1], Math.max(Y_DOMAIN[0], v))
  const res = (xs: number[], ys: number[]): Residual[] =>
    xs.map((x, i) => ({ x: r2(fit.sx(x)), y1: r2(fit.sy(ys[i]!)), y2: r2(fit.sy(clampY(model.predict(x)))) }))
  const sweep = sweepErrors()
  const bestIdx = sweep.reduce((k, s, i) => (s.test < sweep[k]!.test ? i : k), 0)
  const bestDegree = bestIdx + 1
  const cur = sweep[degree - 1]!
  return {
    degree,
    model,
    train,
    test,
    trainMse: cur.train,
    testMse: cur.test,
    sweep,
    bestDegree,
    verdict: verdictOf(degree, cur.test, bestDegree, sweep[bestIdx]!.test),
    fit,
    chart,
    curve: curvePath(model.predict, fit.sx, fit.sy, 220),
    trainRes: res(train.x, train.y),
    testRes: res(test.x, test.y),
    lines: {
      train: polylinePath(sweep.map((s) => [s.degree, logErr(s.train)]), chart.sx, chart.sy),
      test: polylinePath(sweep.map((s) => [s.degree, logErr(s.test)]), chart.sx, chart.sy),
    },
    cur: { x: r2(chart.sx(degree)), train: r2(chart.sy(logErr(cur.train))), test: r2(chart.sy(logErr(cur.test))) },
    best: { x: r2(chart.sx(bestDegree)), y: r2(chart.sy(logErr(sweep[bestIdx]!.test))) },
  }
}
