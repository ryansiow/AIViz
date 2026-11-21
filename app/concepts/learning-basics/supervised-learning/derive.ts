import { frame, type Frame } from '~/engine/plot'
import type { ParamSchema, ParamValues } from '~/types/concept'
import { STUDY } from '../data'

/**
 * Supervised Learning: examples (hours studied, exam score), a first guess,
 * the learned line, then a prediction for an input the model has never seen.
 */
export const params = {
  query: { kind: 'number', label: 'New student: hours studied', tex: 'x_{\\text{new}}', hue: 'rose', min: 0, max: 12, step: 0.5, default: 4.5, digits: 1, hint: 'Try values outside 1 to 6 hours.' },
} satisfies ParamSchema

export const VIEW = { w: 600, h: 400 }
export const BOX = { x0: 58, x1: 400, y0: 44, y1: 296 }
export const TABLE = { x: 432, y: 58, row: 24 }
/** The untrained model's starting guess. */
export const GUESS = { w: 2, b: 60 }

export type Trust = 'inside' | 'near' | 'outside' | 'impossible'

export interface SupData {
  xs: number[]
  ys: number[]
  w: number
  b: number
  query: number
  pred: number
  f: Frame
  /** Line endpoints (SVG) for the guess and the learned model, across the plot. */
  guess: { x1: number; y1: number; x2: number; y2: number }
  line: { x1: number; y1: number; x2: number; y2: number }
  /** Prediction point and its guides (SVG). */
  q: { x: number; y: number }
  trust: Trust
}

const r2 = (v: number) => Math.round(v * 100) / 100

export function trustOf(query: number, pred: number, xs: number[]): Trust {
  if (pred > 100 || pred < 0) return 'impossible'
  const lo = Math.min(...xs)
  const hi = Math.max(...xs)
  if (query >= lo && query <= hi) return 'inside'
  return query >= lo - 1 && query <= hi + 1 ? 'near' : 'outside'
}

export function derive(p: ParamValues<typeof params>): SupData {
  const { w, b } = STUDY.best
  const pred = w * p.query + b
  const xMax = Math.max(8, Math.ceil(p.query + 1))
  const yMax = Math.max(100, Math.ceil((pred + 6) / 10) * 10)
  const f = frame(BOX, [0, xMax], [40, yMax], 6, 4)
  const seg = (m: number, c: number) => {
    // Clip y = m·x + c to the plot's y range.
    const [y0, y1] = f.sy.domain
    let xa = 0
    let xb = xMax
    const at = (x: number) => m * x + c
    if (m !== 0) {
      const xLo = (y0 - c) / m
      const xHi = (y1 - c) / m
      xa = Math.max(xa, Math.min(xLo, xHi))
      xb = Math.min(xb, Math.max(xLo, xHi))
    }
    return { x1: r2(f.sx(xa)), y1: r2(f.sy(at(xa))), x2: r2(f.sx(xb)), y2: r2(f.sy(at(xb))) }
  }
  return {
    xs: STUDY.x,
    ys: STUDY.y,
    w,
    b,
    query: p.query,
    pred,
    f,
    guess: seg(GUESS.w, GUESS.b),
    line: seg(w, b),
    q: { x: r2(f.sx(p.query)), y: r2(f.sy(pred)) },
    trust: trustOf(p.query, pred, STUDY.x),
  }
}
