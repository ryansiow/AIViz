import { describe, expect, it } from 'vitest'
import { CIRCLE, derive, GAUGE, verdictOf } from '~/concepts/foundations/cosine-similarity/derive'
import type { Vec } from '~/engine/plane'

const defaults = { a: [3, 1] as Vec, b: [1, 2] as Vec, k: 2 }

describe('cosine-similarity derive', () => {
  it('default: (3, 1) and (1, 2) are 45° apart, cos θ = 1/√2', () => {
    const d = derive(defaults)
    expect(d.dot).toBe(5)
    expect(d.cos).toBeCloseTo(Math.SQRT1_2, 12)
    expect(d.theta).toBeCloseTo(45, 10)
    expect(d.verdict).toBe('similar')
  })

  it('matches the explainer: (3, 1) and (6, 2) have cosine 1 and dot product 20', () => {
    const d = derive({ ...defaults, b: [6, 2] })
    expect(d.dot).toBe(20)
    expect(d.cos).toBe(1)
    expect(d.theta).toBe(0)
    expect(d.verdict).toBe('same')
  })

  it('stretching b scales the dot product but not the cosine', () => {
    for (const k of [0.25, 1, 2, 3]) {
      const d = derive({ ...defaults, k })
      expect(d.dotK).toBeCloseTo(k * d.dot, 12)
      expect(d.cos).toBeCloseTo(derive(defaults).cos, 12)
    }
  })

  it('is 0 for perpendicular vectors and −1 for opposite ones (exact angles)', () => {
    const perp = derive({ ...defaults, b: [-1, 3] })
    expect(perp.cos).toBe(0)
    expect(perp.theta).toBe(90)
    expect(perp.shadow.visible).toBe(false)
    const opp = derive({ ...defaults, b: [-3, -1] })
    expect(opp.cos).toBe(-1)
    expect(opp.theta).toBe(180)
    expect(opp.verdict).toBe('opposite')
  })

  it("b̂'s shadow on â has length cos θ (in circle units)", () => {
    const d = derive(defaults)
    const len = Math.hypot(d.shadow.foot[0] - CIRCLE.ox, d.shadow.foot[1] - CIRCLE.oy) / CIRCLE.unit
    expect(len).toBeCloseTo(d.cos, 2)
  })

  it('places the gauge marker between −1 and 1', () => {
    expect(derive({ ...defaults, b: [-3, -1] }).gauge.pos).toBe(GAUGE.x0)
    expect(derive({ ...defaults, b: [6, 2] }).gauge.pos).toBe(GAUGE.x1)
  })

  it('reads the number in words', () => {
    expect([1, 0.7, 0.2, 0, -0.2, -0.7, -1].map(verdictOf)).toEqual(['same', 'similar', 'weak', 'perpendicular', 'weak-opposite', 'opposing', 'opposite'])
  })
})
