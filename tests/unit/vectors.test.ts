import { describe, expect, it } from 'vitest'
import { derive, PLANE_BOX, scaleKindOf } from '~/concepts/foundations/vectors/derive'
import { toSvg, type Vec } from '~/engine/plane'

const defaults = { a: [3, 2] as Vec, b: [1, -1] as Vec, k: 2 }

describe('vectors derive', () => {
  it('matches the explainer: (3, 2) + (1, −1) = (4, 1), 2·(3, 2) = (6, 4)', () => {
    const d = derive(defaults)
    expect(d.sum).toEqual([4, 1])
    expect(d.ka).toEqual([6, 4])
    expect(d.len).toBeCloseTo(Math.sqrt(13), 12)
    expect(d.kaLen).toBeCloseTo(2 * Math.sqrt(13), 12)
    expect(d.scaleKind).toBe('grow')
  })

  it('normalises to a unit vector in the same direction', () => {
    const d = derive(defaults)
    expect(Math.hypot(...d.unit)).toBeCloseTo(1, 12)
    expect(d.unit[0] / d.unit[1]).toBeCloseTo(3 / 2, 12)
    expect(d.unit.map((v) => Number(v.toFixed(2)))).toEqual([0.83, 0.55])
  })

  it('has length 5 for (3, 4) (the 3-4-5 triangle)', () => {
    expect(derive({ ...defaults, a: [3, 4] }).len).toBe(5)
  })

  it('cancels out when b = −a', () => {
    const d = derive({ ...defaults, b: [-3, -2] })
    expect(d.sumZero).toBe(true)
    expect(d.sum).toEqual([0, 0])
  })

  it('names what scaling does', () => {
    expect([2, 0.5, 1, -1, 0].map(scaleKindOf)).toEqual(['grow', 'shrink', 'same', 'flip', 'zero'])
  })

  it('draws only the legs a vector has, with a right angle when it has both', () => {
    expect(derive(defaults).legs.corner).not.toBeNull()
    const flat = derive({ ...defaults, a: [3, 0] })
    expect(flat.legs.v).toBeNull()
    expect(flat.legs.corner).toBeNull()
    expect(derive({ ...defaults, a: [0, -2] }).legs.h).toBeNull()
  })

  it('keeps every drawn point inside the plane area, for extreme inputs', () => {
    for (const p of [defaults, { a: [-4, -4] as Vec, b: [-4, -4] as Vec, k: 2 }, { a: [4, -4] as Vec, b: [4, 4] as Vec, k: -2 }, { a: [1, 0] as Vec, b: [0, 1] as Vec, k: 0.25 }]) {
      const d = derive(p)
      for (const v of [d.a, d.sum, d.ka, d.unit, [0, 0] as Vec]) {
        const [x, y] = toSvg(d.plane, v)
        expect(x >= PLANE_BOX.x && x <= PLANE_BOX.x + PLANE_BOX.w, `${p.a} ${v} x`).toBe(true)
        expect(y >= PLANE_BOX.y && y <= PLANE_BOX.y + PLANE_BOX.h, `${p.a} ${v} y`).toBe(true)
      }
    }
  })
})
