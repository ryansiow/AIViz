import { describe, expect, it } from 'vitest'
import { compact, curvePath, linear, ticks } from '~/engine/plot'

describe('linear', () => {
  it('maps the domain onto the range, including inverted ranges', () => {
    const s = linear([0, 10], [100, 0])
    expect(s(0)).toBe(100)
    expect(s(5)).toBe(50)
    expect(s(10)).toBe(0)
    expect(s.domain).toEqual([0, 10])
  })
})

describe('ticks', () => {
  it('uses the smallest 1/2/5 step at least (max − min) / count', () => {
    expect(ticks(0, 10, 5)).toEqual([0, 2, 4, 6, 8, 10])
    expect(ticks(-3.2, 3.2, 6)).toEqual([-2, 0, 2]) // spacing 1.07 → step 2
    expect(ticks(-0.5, 8, 4)).toEqual([0, 5]) // spacing 2.1 → step 5
    expect(ticks(0, 1, 4)).toEqual([0, 0.5, 1])
  })
})

describe('compact', () => {
  it('keeps 3 significant digits and a real minus', () => {
    expect(compact(54.598)).toBe('54.6')
    expect(compact(-1.5)).toBe('−1.5')
    expect(compact(0.2231)).toBe('0.223')
  })
  it('switches to scientific notation for huge and tiny values', () => {
    expect(compact(1.14e26)).toBe('1.1e26')
    expect(compact(0.00012)).toBe('1.2e−4')
  })
  it('handles infinity', () => {
    expect(compact(Infinity)).toBe('∞')
  })
})

describe('curvePath', () => {
  const sx = linear([-2, 2], [0, 400])
  const sy = linear([0, 1], [100, 0])

  it('draws one continuous path when the curve stays inside', () => {
    const d = curvePath(() => 0.5, sx, sy, 4)
    expect(d.match(/M/g)).toHaveLength(1)
    expect(d).toBe('M0.00 50.00L100.00 50.00L200.00 50.00L300.00 50.00L400.00 50.00')
  })

  it('stops exactly at the edge and resumes where the curve comes back', () => {
    // y = x²: inside [0, 1] only for |x| ≤ 1.
    const d = curvePath((x) => x * x, sx, sy, 8)
    expect(d.match(/M/g)).toHaveLength(1) // starts at the left crossing, not at x = -2
    expect(d.startsWith('M100.00 0.00')).toBe(true) // x = -1, y = 1 (top edge)
    expect(d.endsWith('L300.00 0.00')).toBe(true) // x = 1, y = 1
    // never drawn flattened along the top edge outside |x| ≤ 1
    expect(d).not.toContain('L0.00 0.00')
  })

  it('splits into separate pieces when the curve leaves and re-enters', () => {
    // y = cos(πx)·0.75 + 0.5 dips below 0 around x = ±1.
    const d = curvePath((x) => Math.cos(Math.PI * x) * 0.75 + 0.5, sx, sy, 80)
    expect((d.match(/M/g) ?? []).length).toBeGreaterThan(1)
  })
})
