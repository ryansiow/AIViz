import { describe, expect, it } from 'vitest'
import { derive, params, softmax } from '~/concepts/transformers-llms/softmax/derive'
import { defaultsOf } from '~/types/concept'

const base = defaultsOf(params)
const sum = (a: number[]) => a.reduce((x, y) => x + y, 0)

describe('softmax', () => {
  it('matches the worked example', () => {
    const d = derive(base)
    expect(d.rows.map((r) => r.exp.toFixed(3))).toEqual(['54.598', '9.025', '4.055', '0.223'])
    expect(d.sum).toBeCloseTo(67.9, 1)
    expect(d.rows[0]!.p).toBeCloseTo(54.598 / 67.901, 3)
    expect(d.top).toBe(0)
  })

  it('always gives probabilities that add up to 1', () => {
    for (const T of [0.1, 0.5, 1, 2, 3]) {
      expect(sum(derive({ ...base, T }).rows.map((r) => r.p))).toBeCloseTo(1, 12)
    }
  })

  it('sharpens below T = 1 and flattens above', () => {
    const cold = derive({ ...base, T: 0.5 })
    const hot = derive({ ...base, T: 2 })
    const normal = derive(base)
    expect(cold.rows[0]!.p).toBeGreaterThan(normal.rows[0]!.p)
    expect(hot.rows[0]!.p).toBeLessThan(normal.rows[0]!.p)
    expect(cold.entropy).toBeLessThan(normal.entropy)
    expect(hot.entropy).toBeGreaterThan(normal.entropy)
  })

  it('is uniform for tied scores: 25% each and entropy 2 bits', () => {
    const d = derive({ z0: 2, z1: 2, z2: 2, z3: 2, T: 1 })
    d.rows.forEach((r) => expect(r.p).toBeCloseTo(0.25, 12))
    expect(d.entropy).toBeCloseTo(2, 12)
  })

  it('stays finite at extreme settings (max subtraction)', () => {
    const { p } = softmax([6, 6, -4, -4], 0.1) // z/T up to 60
    p.forEach((v) => expect(Number.isFinite(v)).toBe(true))
    expect(p[0]).toBeCloseTo(0.5, 12)
    const d = derive({ z0: 6, z1: -4, z2: -4, z3: -4, T: 0.1 })
    d.rows.forEach((r) => expect(Number.isFinite(r.expBar.w)).toBe(true))
  })

  it('keeps the bar geometry honest', () => {
    const d = derive(base)
    // Negative logits grow left from zero; the widest bar is the largest |value|.
    const banana = d.rows[3]!
    expect(banana.rawBar.x + banana.rawBar.w).toBeCloseTo(d.zeroX, 9)
    expect(d.rows[0]!.expBar.w).toBeGreaterThan(d.rows[1]!.expBar.w)
    // T = 1 leaves the logit bars unchanged.
    expect(d.rows[0]!.scaledBar).toEqual(d.rows[0]!.rawBar)
  })
})
