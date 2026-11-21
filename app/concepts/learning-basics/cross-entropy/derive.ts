import { curvePath, frame, type Frame } from '~/engine/plot'
import type { ParamSchema, ParamValues } from '~/types/concept'
import { softmax } from '../../transformers-llms/softmax/derive'
import { SCENARIOS } from '../../transformers-llms/temperature/derive'

/**
 * Cross-Entropy Loss: the model's next-token probabilities (Softmax's
 * "capital of France" example), the right answer, and −log p of it.
 */
const SC = SCENARIOS.capital
export const TOKENS = SC.tokens
export const LOGITS = SC.z

export const params = {
  answer: {
    kind: 'select',
    label: 'Right answer',
    default: '0',
    options: TOKENS.map((t, i) => ({ value: String(i), label: t })),
  },
  T: { kind: 'number', label: 'Temperature', tex: 'T', hue: 'amber', min: 0.25, max: 3, step: 0.05, default: 1, digits: 2, hint: 'Changes how confident the model is.' },
} satisfies ParamSchema

export const VIEW = { w: 600, h: 400 }
export const BARS = { label: 96, x: 108, w: 170, top: 96, step: 52, h: 22 }
export const PLOT = { x0: 372, x1: 572, y0: 64, y1: 292 }
export const Y_MAX = 7

export type Verdict = 'confident-right' | 'leaning-right' | 'unsure' | 'wrong' | 'confident-wrong'

export interface CEData {
  answer: number
  T: number
  prompt: string
  tokens: readonly string[]
  p: number[]
  /** Probability on the right answer, and its loss. */
  pc: number
  loss: number
  /** The loss of a uniform guess, log 4. */
  uniform: number
  /** Index of the model's top token. */
  top: number
  bars: number[]
  f: Frame
  curve: string
  pt: { x: number; y: number; clipped: boolean }
  verdict: Verdict
}

const r2 = (v: number) => Math.round(v * 100) / 100

export function verdictOf(pc: number, isTop: boolean): Verdict {
  if (pc >= 0.7) return 'confident-right'
  if (isTop) return pc >= 0.4 ? 'leaning-right' : 'unsure'
  if (pc >= 0.15) return 'unsure'
  return pc < 0.02 ? 'confident-wrong' : 'wrong'
}

export function derive(v: ParamValues<typeof params>): CEData {
  const answer = Math.min(TOKENS.length - 1, Math.max(0, Number(v.answer) || 0))
  const { p } = softmax([...LOGITS], v.T)
  const pc = p[answer]!
  const loss = -Math.log(pc)
  const top = p.indexOf(Math.max(...p))
  const f = frame(PLOT, [0, 1], [0, Y_MAX], 5, 7)
  return {
    answer,
    T: v.T,
    prompt: SC.prompt,
    tokens: TOKENS,
    p,
    pc,
    loss,
    uniform: Math.log(TOKENS.length),
    top,
    bars: p.map((q) => r2(q * BARS.w)),
    f,
    curve: curvePath((x) => -Math.log(x), f.sx, f.sy, 400),
    pt: { x: r2(f.sx(pc)), y: r2(f.sy(Math.min(loss, Y_MAX))), clipped: loss > Y_MAX },
    verdict: verdictOf(pc, top === answer),
  }
}
