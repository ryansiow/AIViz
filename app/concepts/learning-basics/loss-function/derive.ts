import { linearFit, mse } from '~/engine/fit'
import { frame, type Frame } from '~/engine/plot'
import type { ParamSchema, ParamValues } from '~/types/concept'
import { STUDY, STUDY_OUTLIER } from '../data'

/**
 * Loss Function (mean squared error): each gap between the line and a point is
 * an error; squared, it becomes an actual square; the average area is the loss.
 */
export const params = {
  w: { kind: 'number', label: 'Slope', tex: 'w', hue: 'blue', min: 0, max: 12, step: 0.5, default: 3, digits: 1 },
  b: { kind: 'number', label: 'Intercept', tex: 'b', hue: 'blue', min: 20, max: 70, step: 1, default: 55, digits: 0 },
  data: {
    kind: 'select',
    label: 'Data',
    default: 'clean',
    options: [
      { value: 'clean', label: 'Clean' },
      { value: 'outlier', label: 'One outlier' },
    ],
  },
} satisfies ParamSchema

export const VIEW = { w: 600, h: 400 }
export const BOX = { x0: 58, x1: 372, y0: 44, y1: 296 }
export const BARS = { x: 420, w: 160, y1: 132, y2: 196, h: 16 }
export const Y_DOMAIN: [number, number] = [40, 100]

export interface Residual {
  x: number
  y: number
  pred: number
  /** pred − y. */
  r: number
  sq: number
  /** Segment from the point to the line, and the square on it (SVG, clamped to the plot). */
  seg: { x: number; y1: number; y2: number }
  square: { x: number; y: number; s: number }
  label: { x: number; y: number }
}

type Seg = { x1: number; y1: number; x2: number; y2: number }

export interface LossData {
  w: number
  b: number
  data: 'clean' | 'outlier'
  res: Residual[]
  sumSq: number
  mse: number
  best: { w: number; b: number; mse: number }
  /** Index of the largest error. */
  worst: number
  f: Frame
  line: Seg
  bestLine: Seg
  bars: { mine: number; best: number }
}

const r2 = (v: number) => Math.round(v * 100) / 100
const clampY = (v: number) => Math.min(Y_DOMAIN[1], Math.max(Y_DOMAIN[0], v))

/** y = m·x + c across the plot, clipped to its y range. */
export function lineSeg(f: Frame, m: number, c: number): Seg {
  const [x0, x1] = f.sx.domain
  const [y0, y1] = f.sy.domain
  let xa = x0
  let xb = x1
  if (m !== 0) {
    const a = (y0 - c) / m
    const z = (y1 - c) / m
    xa = Math.max(xa, Math.min(a, z))
    xb = Math.min(xb, Math.max(a, z))
  }
  const at = (x: number) => clampY(m * x + c)
  return { x1: r2(f.sx(xa)), y1: r2(f.sy(at(xa))), x2: r2(f.sx(xb)), y2: r2(f.sy(at(xb))) }
}

export function derive(p: ParamValues<typeof params>): LossData {
  const data = p.data === 'outlier' ? 'outlier' : 'clean'
  const set = data === 'outlier' ? STUDY_OUTLIER : STUDY
  const f = frame(BOX, [0, 7], Y_DOMAIN, 7, 4)
  const preds = set.x.map((x) => p.w * x + p.b)
  const res: Residual[] = set.x.map((x, i) => {
    const y = set.y[i]!
    const pred = preds[i]!
    const a = f.sy(y)
    const z = f.sy(clampY(pred))
    const s = r2(Math.abs(z - a))
    return {
      x,
      y,
      pred,
      r: pred - y,
      sq: (pred - y) ** 2,
      seg: { x: r2(f.sx(x)), y1: r2(a), y2: r2(z) },
      square: { x: r2(f.sx(x)), y: r2(Math.min(a, z)), s },
      label: { x: r2(f.sx(x) - 6), y: r2((a + z) / 2 + 4) },
    }
  })
  const fit = linearFit(set.x, set.y)
  const bestMse = mse(set.x.map((x) => fit.w * x + fit.b), set.y)
  const loss = mse(preds, set.y)
  const worst = res.reduce((k, r, i) => (Math.abs(r.r) > Math.abs(res[k]!.r) ? i : k), 0)
  const scale = Math.max(loss, bestMse, 1e-9)
  return {
    w: p.w,
    b: p.b,
    data,
    res,
    sumSq: res.reduce((a, r) => a + r.sq, 0),
    mse: loss,
    best: { w: fit.w, b: fit.b, mse: bestMse },
    worst,
    f,
    line: lineSeg(f, p.w, p.b),
    bestLine: lineSeg(f, fit.w, fit.b),
    bars: { mine: r2((loss / scale) * BARS.w), best: r2((bestMse / scale) * BARS.w) },
  }
}
