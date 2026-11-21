import { describe, expect, it } from 'vitest'
import { derive, expectedCounts, SAMPLES, verdictOf } from '~/concepts/transformers-llms/temperature/derive'

const at = (T: number, scenario: 'capital' | 'story' = 'capital') => derive({ T, scenario })

describe('temperature derive', () => {
  it('matches the Softmax worked example at T = 1', () => {
    const d = at(1)
    expect(d.rows.map((r) => Number(r.p.toFixed(3)))).toEqual([0.804, 0.133, 0.06, 0.003])
    expect(d.rows.every((r) => r.p === r.p1)).toBe(true)
    expect(d.verdict).toBe('model')
  })

  it('matches the explainer table at T = 0.5 and T = 2', () => {
    expect(at(0.5).rows.map((r) => Number(r.p.toFixed(3)))).toEqual([0.968, 0.026, 0.005, 0])
    expect(at(2).rows.map((r) => Number(r.p.toFixed(3)))).toEqual([0.574, 0.233, 0.156, 0.037])
  })

  it('keeps probabilities summing to 1 and never changes the order', () => {
    for (const T of [0.1, 0.3, 1, 1.7, 3]) {
      for (const sc of ['capital', 'story'] as const) {
        const d = at(T, sc)
        expect(d.rows.reduce((a, r) => a + r.p, 0)).toBeCloseTo(1, 12)
        const byZ = [...d.rows].sort((a, b) => b.z - a.z).map((r) => r.token)
        const byP = [...d.rows].sort((a, b) => b.p - a.p).map((r) => r.token)
        expect(byP).toEqual(byZ)
      }
    }
  })

  it('lowers entropy below T = 1 and raises it above, within 0..2 bits', () => {
    const e = [0.1, 0.5, 1, 2, 3].map((T) => at(T).entropy)
    for (let i = 1; i < e.length; i++) expect(e[i]!).toBeGreaterThan(e[i - 1]!)
    expect(e[0]!).toBeGreaterThanOrEqual(0)
    expect(e[4]!).toBeLessThanOrEqual(2)
  })

  it('scales the gap between the top two logits by 1/T', () => {
    const d = at(0.5)
    const [a, b] = [d.rows[d.top]!, d.rows[d.second]!]
    expect(a.scaled - b.scaled).toBeCloseTo((a.z - b.z) / 0.5, 12)
  })

  it('handles the smallest temperature without overflow', () => {
    const d = at(0.1)
    expect(d.rows.every((r) => Number.isFinite(r.p) && Number.isFinite(r.scaled))).toBe(true)
    expect(d.rows[0]!.count).toBe(SAMPLES)
    expect(d.verdict).toBe('near-greedy')
  })

  it('tells a different story for each preset', () => {
    expect(at(0.2).verdict).toBe('near-greedy')
    expect(at(2.5).verdict).toBe('spread')
    expect(at(1.5, 'story').verdict).toBe('near-uniform')
    expect(at(0.7, 'story').verdict).toBe('focused')
  })

  it('keeps geometry inside its columns', () => {
    for (const T of [0.1, 1, 3]) {
      for (const r of at(T).rows) {
        expect(r.probBar.w).toBeLessThanOrEqual(100)
        expect(Math.max(...r.dots, 0)).toBeLessThan(600)
      }
    }
  })
})

describe('expectedCounts', () => {
  it('always adds up to n', () => {
    expect(expectedCounts([0.804, 0.133, 0.06, 0.003], 20).reduce((a, b) => a + b, 0)).toBe(20)
    expect(expectedCounts([0.25, 0.25, 0.25, 0.25], 20)).toEqual([5, 5, 5, 5])
    expect(expectedCounts([1 / 3, 1 / 3, 1 / 3], 20).reduce((a, b) => a + b, 0)).toBe(20)
  })

  it('gives the largest remainders the leftover samples', () => {
    expect(expectedCounts([0.804, 0.133, 0.06, 0.003], 20)).toEqual([16, 3, 1, 0])
  })
})

describe('verdictOf', () => {
  it('calls T = 1 the model distribution, whatever the spread', () => {
    expect(verdictOf(1, 0.99, 0.1, 2)).toBe('model')
  })
})
