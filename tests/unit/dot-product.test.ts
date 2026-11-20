import { describe, expect, it } from 'vitest'
import { derive, params } from '~/concepts/foundations/dot-product/derive'
import { defaultsOf } from '~/types/concept'

const run = (w: [number, number], x: [number, number]) => derive({ w, x })

describe('dot product derive', () => {
  it('matches the worked example w = (3, 1), x = (1, 2)', () => {
    const d = derive(defaultsOf(params))
    expect(d.dot).toBe(5)
    expect(d.nw).toBeCloseTo(Math.sqrt(10), 9)
    expect(d.nx).toBeCloseTo(Math.sqrt(5), 9)
    expect(d.cos).toBeCloseTo(1 / Math.SQRT2, 9)
    expect(d.theta).toBeCloseTo(45, 9)
    expect(d.proj[0]).toBeCloseTo(1.5, 9)
    expect(d.proj[1]).toBeCloseTo(0.5, 9)
    expect(d.projLen).toBeCloseTo(5 / Math.sqrt(10), 9)
    expect(d.sign).toBe('positive')
  })

  it('agrees with |w||x|cos θ', () => {
    for (const [w, x] of [[[2, -1], [-3, 4]], [[-4, -4], [1, 3]], [[0, 2], [4, 0]]] as [[number, number], [number, number]][]) {
      const d = run(w, x)
      expect(d.nw * d.nx * d.cos).toBeCloseTo(d.dot, 9)
    }
  })

  it('is zero for perpendicular vectors, with θ = 90°', () => {
    const d = run([3, 1], [-1, 3])
    expect(d.dot).toBe(0)
    expect(d.sign).toBe('zero')
    expect(d.theta).toBeCloseTo(90, 9)
    expect(d.proj).toEqual([0, 0])
  })

  it('is negative for opposite vectors, with θ = 180°', () => {
    const d = run([3, 1], [-3, -1])
    expect(d.dot).toBe(-10)
    expect(d.sign).toBe('negative')
    expect(d.theta).toBeCloseTo(180, 6)
  })

  it('keeps cos θ within [-1, 1] despite rounding', () => {
    const d = run([2, 1], [4, 2])
    expect(d.cos).toBeLessThanOrEqual(1)
    expect(d.theta).toBeCloseTo(0, 6)
  })

  it('moves the result card away from labels in the top-left', () => {
    expect(run([3, 1], [1, 2]).card.x).toBe(16)
    expect(run([-4, 4], [-3, 3]).card.x).toBeGreaterThan(16)
  })
})
