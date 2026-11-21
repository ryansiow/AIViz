import { frame, polylinePath, type Frame } from '~/engine/plot'
import type { ParamSchema, ParamValues } from '~/types/concept'

/**
 * Training Curve: training and validation loss after every epoch, for four
 * typical runs. The curves are synthetic (smooth shapes plus fixed noise),
 * shaped like real runs so each one teaches its diagnosis.
 */
export const EPOCHS = 60

/** Deterministic noise in [−1, 1] (a hash of the epoch), so server and browser agree. */
const noise = (e: number, seed: number) => {
  const s = Math.sin(e * 12.9898 + seed * 78.233) * 43758.5453
  return 2 * (s - Math.floor(s)) - 1
}

export const SCENARIOS = {
  healthy: {
    label: 'Healthy',
    train: (e: number) => 0.12 + 2.0 * Math.exp(-e / 9),
    val: (e: number) => 0.22 + 1.95 * Math.exp(-e / 10),
  },
  overfitting: {
    label: 'Overfitting',
    train: (e: number) => 0.03 + 2.1 * Math.exp(-e / 7),
    val: (e: number) => 0.42 + 1.75 * Math.exp(-e / 7) + 0.0005 * Math.max(0, e - 15) ** 2,
  },
  underfitting: {
    label: 'Underfitting',
    train: (e: number) => 1.05 + 1.0 * Math.exp(-e / 12),
    val: (e: number) => 1.12 + 1.0 * Math.exp(-e / 12),
  },
  unstable: {
    label: 'Unstable',
    // A first drop, then bouncing: the steps are too big to settle (learning rate too high).
    train: (e: number) => 1.15 + 0.9 * Math.exp(-e / 3) + 0.28 * Math.sin(1.3 * e) + 0.15 * Math.sin(0.37 * e + 1),
    val: (e: number) => 1.3 + 0.85 * Math.exp(-e / 3) + 0.28 * Math.sin(1.3 * e + 0.4) + 0.15 * Math.sin(0.37 * e + 1.2),
  },
} as const
export type ScenarioId = keyof typeof SCENARIOS

export const params = {
  scenario: {
    kind: 'select',
    label: 'Training run',
    default: 'overfitting',
    options: (Object.keys(SCENARIOS) as ScenarioId[]).map((k) => ({ value: k, label: SCENARIOS[k].label })),
  },
  epoch: { kind: 'number', label: 'Look at epoch', tex: '\\text{epoch}', hue: 'amber', min: 0, max: EPOCHS, step: 1, default: 45, digits: 0 },
} satisfies ParamSchema

export const VIEW = { w: 600, h: 400 }
export const BOX = { x0: 60, x1: 560, y0: 54, y1: 296 }

export interface TCData {
  scenario: ScenarioId
  epoch: number
  train: number[]
  val: number[]
  bestEpoch: number
  bestVal: number
  f: Frame
  paths: { train: string; val: string; gap: string }
  best: { x: number; y: number }
  cur: { x: number; train: number; val: number }
}

const r2 = (v: number) => Math.round(v * 100) / 100
const r3 = (v: number) => Math.round(v * 1000) / 1000

export function curvesOf(id: ScenarioId) {
  const sc = SCENARIOS[id]
  const es = Array.from({ length: EPOCHS + 1 }, (_, e) => e)
  return {
    train: es.map((e) => r3(Math.max(0.01, sc.train(e) + 0.025 * noise(e, 1)))),
    val: es.map((e) => r3(Math.max(0.01, sc.val(e) + 0.045 * noise(e, 2)))),
  }
}

export function derive(p: ParamValues<typeof params>): TCData {
  const scenario = (p.scenario in SCENARIOS ? p.scenario : 'overfitting') as ScenarioId
  const epoch = Math.round(Math.min(EPOCHS, Math.max(0, p.epoch)))
  const { train, val } = curvesOf(scenario)
  const bestEpoch = val.reduce((k, v, i) => (v < val[k]! ? i : k), 0)
  const f = frame(BOX, [0, EPOCHS], [0, 2.4], 6, 4)
  const pts = (ys: number[]) => ys.map((y, e) => [e, y] as [number, number])
  const trainPath = polylinePath(pts(train), f.sx, f.sy)
  const valBack = polylinePath(pts(val).reverse(), f.sx, f.sy).replace(/^M/, 'L')
  return {
    scenario,
    epoch,
    train,
    val,
    bestEpoch,
    bestVal: val[bestEpoch]!,
    f,
    paths: { train: trainPath, val: polylinePath(pts(val), f.sx, f.sy), gap: `${trainPath}${valBack}Z` },
    best: { x: r2(f.sx(bestEpoch)), y: r2(f.sy(val[bestEpoch]!)) },
    cur: { x: r2(f.sx(epoch)), train: r2(f.sy(train[epoch]!)), val: r2(f.sy(val[epoch]!)) },
  }
}
