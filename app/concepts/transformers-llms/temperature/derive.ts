import type { ParamSchema, ParamValues } from '~/types/concept'
import { softmax } from '../softmax/derive'

/**
 * Temperature reuses Softmax's maths. Two prompts tell two stories: a factual
 * one with a single right answer, and an open one with many good next words.
 */
export const SCENARIOS = {
  capital: {
    label: 'Factual',
    prompt: 'The capital of France is …',
    tokens: ['Paris', 'Lyon', 'London', 'banana'],
    z: [4.0, 2.2, 1.4, -1.5],
  },
  story: {
    label: 'Open-ended',
    prompt: 'The old house was …',
    tokens: ['quiet', 'dark', 'empty', 'haunted'],
    z: [2.2, 2.0, 1.7, 1.2],
  },
} as const
export type ScenarioId = keyof typeof SCENARIOS

export const params = {
  T: {
    kind: 'number',
    label: 'Temperature',
    tex: 'T',
    hue: 'amber',
    min: 0.1,
    max: 3,
    step: 0.05,
    default: 0.5,
    digits: 2,
    hint: 'Below 1 sharpens, above 1 flattens.',
  },
  scenario: {
    kind: 'select',
    label: 'Prompt',
    default: 'capital',
    options: [
      { value: 'capital', label: SCENARIOS.capital.label },
      { value: 'story', label: SCENARIOS.story.label },
    ],
  },
} satisfies ParamSchema

export const VIEW = { w: 600, h: 400 }
export const COLS = {
  label: { right: 90 },
  scaled: { x: 104, w: 150 }, // z / T, zero in the middle
  prob: { x: 284, w: 140, bar: 100 }, // probability, bar width for p = 1
  samples: { x: 452, gap: 7, r: 2.8 }, // 20 dots per row at most
}
export const ROWS = { top: 96, step: 50, bar: 20 }
export const METER = { x: 104, w: 320, y: 302, h: 10 }
export const SAMPLES = 20

export interface Bar { x: number; w: number }
export interface TempRow {
  token: string
  z: number
  scaled: number
  /** Probability at temperature T. */
  p: number
  /** Probability at T = 1 (the model's own distribution). */
  p1: number
  /** Expected count out of SAMPLES draws (largest remainder, so counts add up). */
  count: number
  y: number
  rawBar: Bar
  scaledBar: Bar
  probBar: Bar
  ghostBar: Bar
  /** x of each sample dot. */
  dots: number[]
}
export type Verdict = 'near-greedy' | 'focused' | 'model' | 'spread' | 'near-uniform'
export interface TempData {
  T: number
  scenario: ScenarioId
  prompt: string
  rows: TempRow[]
  /** Index of the most likely token (the same at every T). */
  top: number
  /** Runner-up, for the gap story. */
  second: number
  /** Entropy in bits at T and at T = 1. Max is log2(4) = 2. */
  entropy: number
  entropy1: number
  meter: { fill: number; fill1: number }
  zeroX: number
  verdict: Verdict
}

/**
 * SVG geometry rounded to 1/1000 of a unit. exp/log can differ in the last bit
 * between Node (server render) and the browser, which Vue reports as a
 * hydration mismatch on the attribute.
 */
const r3 = (v: number) => Math.round(v * 1000) / 1000

const entropyBits = (p: number[]) => -p.reduce((acc, q) => acc + (q > 0 ? q * Math.log2(q) : 0), 0)

/** Rounds n·p to whole counts that still add up to n (largest remainder). */
export function expectedCounts(p: number[], n: number): number[] {
  const raw = p.map((q) => q * n)
  const counts = raw.map(Math.floor)
  let left = n - counts.reduce((a, b) => a + b, 0)
  const order = raw.map((r, i) => [r - Math.floor(r), i] as const).sort((a, b) => b[0] - a[0] || a[1] - b[1])
  for (const [, i] of order) {
    if (left <= 0) break
    counts[i]! += 1
    left--
  }
  return counts
}

export function verdictOf(T: number, pTop: number, entropy: number, maxEntropy: number): Verdict {
  if (Math.abs(T - 1) < 1e-9) return 'model'
  if (pTop > 0.95) return 'near-greedy'
  if (entropy > 0.95 * maxEntropy) return 'near-uniform'
  return T < 1 ? 'focused' : 'spread'
}

export function derive(v: ParamValues<typeof params>): TempData {
  const sc = SCENARIOS[v.scenario as ScenarioId] ?? SCENARIOS.capital
  const z = [...sc.z]
  const T = v.T
  const { scaled, p } = softmax(z, T)
  const { p: p1 } = softmax(z, 1)
  const counts = expectedCounts(p, SAMPLES)

  const order = p.map((q, i) => i).sort((a, b) => p[b]! - p[a]! || a - b)
  const top = order[0]!
  const second = order[1]!
  const entropy = entropyBits(p)
  const entropy1 = entropyBits(p1)
  const maxEntropy = Math.log2(z.length)

  // One scale for raw and scaled bars, so the morph between them is honest.
  const half = COLS.scaled.w / 2 - 6
  const maxAbs = Math.max(1e-9, ...z.map(Math.abs), ...scaled.map(Math.abs))
  const zeroX = COLS.scaled.x + COLS.scaled.w / 2
  const signed = (val: number): Bar => {
    const w = (Math.abs(val) / maxAbs) * half
    return val >= 0 ? { x: zeroX, w: r3(w) } : { x: r3(zeroX - w), w: r3(w) }
  }

  const rows: TempRow[] = z.map((zi, i) => ({
    token: sc.tokens[i]!,
    z: zi,
    scaled: scaled[i]!,
    p: p[i]!,
    p1: p1[i]!,
    count: counts[i]!,
    y: ROWS.top + i * ROWS.step,
    rawBar: signed(zi),
    scaledBar: signed(scaled[i]!),
    probBar: { x: COLS.prob.x, w: r3(p[i]! * COLS.prob.bar) },
    ghostBar: { x: COLS.prob.x, w: r3(p1[i]! * COLS.prob.bar) },
    dots: Array.from({ length: counts[i]! }, (_, k) => COLS.samples.x + k * COLS.samples.gap),
  }))

  return {
    T,
    scenario: v.scenario as ScenarioId,
    prompt: sc.prompt,
    rows,
    top,
    second,
    entropy,
    entropy1,
    meter: { fill: r3((entropy / maxEntropy) * METER.w), fill1: r3((entropy1 / maxEntropy) * METER.w) },
    zeroX,
    verdict: verdictOf(T, p[top]!, entropy, maxEntropy),
  }
}
