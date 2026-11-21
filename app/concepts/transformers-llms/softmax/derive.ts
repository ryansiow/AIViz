import type { ParamSchema, ParamValues } from '~/types/concept'

/** Next-token candidates for "The capital of France is …". */
export const TOKENS = ['Paris', 'Lyon', 'London', 'banana'] as const

const logit = (label: string, def: number) =>
  ({ kind: 'number', label: `Logit for “${label}”`, tex: `z_{\\text{${label}}}`, hue: 'blue', min: -4, max: 6, step: 0.1, default: def, digits: 1 }) as const

export const params = {
  z0: logit(TOKENS[0], 4.0),
  z1: logit(TOKENS[1], 2.2),
  z2: logit(TOKENS[2], 1.4),
  z3: logit(TOKENS[3], -1.5),
  T: { kind: 'number', label: 'Temperature', tex: 'T', hue: 'amber', min: 0.1, max: 3, step: 0.05, default: 1, digits: 2, hint: 'Below 1 sharpens, above 1 flattens.' },
} satisfies ParamSchema

export const VIEW = { w: 600, h: 400 }

/** Column layout (SVG units). */
export const COLS = {
  label: { right: 90 },
  scaled: { x: 104, w: 150 }, // z / T, zero in the middle
  exp: { x: 284, w: 140 }, //   e^(z/T), zero on the left
  prob: { x: 454, w: 120 }, //  probability, 0..1
}
export const ROWS = { top: 96, step: 54, bar: 22 }

export interface Bar { x: number; w: number }

export interface SoftmaxRow {
  token: string
  z: number
  scaled: number
  exp: number
  p: number
  y: number
  /** Logit bar before dividing by T (step 1) and after (step 2). */
  rawBar: Bar
  scaledBar: Bar
  expBar: Bar
  probBar: Bar
}

export interface SoftmaxData {
  T: number
  rows: SoftmaxRow[]
  sum: number
  top: number
  /** Shannon entropy in bits: 0 = certain, 2 = uniform over 4 tokens. */
  entropy: number
  /** x of zero in the logit column. */
  zeroX: number
}

export function softmax(z: number[], T: number) {
  const scaled = z.map((v) => v / T)
  const m = Math.max(...scaled)
  // Subtract the max before exponentiating: same result, no overflow.
  const shifted = scaled.map((v) => Math.exp(v - m))
  const total = shifted.reduce((a, b) => a + b, 0)
  return { scaled, p: shifted.map((v) => v / total) }
}

export function derive(v: ParamValues<typeof params>): SoftmaxData {
  const z = [v.z0, v.z1, v.z2, v.z3]
  const T = v.T
  const { scaled, p } = softmax(z, T)
  const exp = scaled.map(Math.exp)
  const sum = exp.reduce((a, b) => a + b, 0)
  const top = p.indexOf(Math.max(...p))
  const entropy = -p.reduce((acc, pi) => acc + (pi > 0 ? pi * Math.log2(pi) : 0), 0)

  // Logit column: shared scale for raw and scaled bars so the morph is honest.
  const half = COLS.scaled.w / 2 - 6
  const maxAbs = Math.max(1e-9, ...z.map(Math.abs), ...scaled.map(Math.abs))
  const zeroX = COLS.scaled.x + COLS.scaled.w / 2
  const signed = (val: number): Bar => {
    const w = (Math.abs(val) / maxAbs) * half
    return val >= 0 ? { x: zeroX, w } : { x: zeroX - w, w }
  }
  const maxExp = Math.max(...exp)

  const rows = z.map((zi, i) => ({
    token: TOKENS[i]!,
    z: zi,
    scaled: scaled[i]!,
    exp: exp[i]!,
    p: p[i]!,
    y: ROWS.top + i * ROWS.step,
    rawBar: signed(zi),
    scaledBar: signed(scaled[i]!),
    // Relative widths are exact even when e^(z/T) overflows to Infinity.
    expBar: { x: COLS.exp.x, w: Number.isFinite(maxExp) ? (exp[i]! / maxExp) * (COLS.exp.w - 40) : p[i]! / p[top]! * (COLS.exp.w - 40) },
    probBar: { x: COLS.prob.x, w: p[i]! * (COLS.prob.w - 40) },
  }))

  return { T, rows, sum, top, entropy, zeroX }
}
