import { describe, expect, it } from 'vitest'
import { derive, GRID_X0, VIEW } from '~/concepts/foundations/matrix-multiplication/derive'
import type { Vec } from '~/engine/plane'

const defaults = { a11: 1, a12: 2, a21: 0, a22: 1, x: [3, 1] as Vec }

describe('matrix-multiplication derive', () => {
  it('matches the explainer: [[1, 2], [0, 1]] · (3, 1) = (5, 1), a shear', () => {
    const d = derive(defaults)
    expect(d.y).toEqual([5, 1])
    expect(d.det).toBe(1)
    expect(d.kind).toBe('shear')
    expect(d.cols).toEqual([[1, 0], [2, 1]])
  })

  it('the column mix x₁·c₁ + x₂·c₂ lands exactly on Ax', () => {
    for (const p of [defaults, { a11: -1.5, a12: 2.5, a21: 3, a22: -0.5, x: [-2, 3] as Vec }, { a11: 0, a12: -1, a21: 1, a22: 0, x: [3, 1] as Vec }]) {
      const d = derive(p)
      expect(d.parts[0][0] + d.parts[1][0]).toBeCloseTo(d.y[0], 12)
      expect(d.parts[0][1] + d.parts[1][1]).toBeCloseTo(d.y[1], 12)
    }
  })

  it('presets tell different stories', () => {
    expect(derive({ a11: 0, a12: -1, a21: 1, a22: 0, x: [3, 1] }).kind).toBe('rotation')
    expect(derive({ a11: 0, a12: -1, a21: 1, a22: 0, x: [3, 1] }).angle).toBe(90)
    expect(derive({ a11: 2, a12: 0, a21: 0, a22: 0.5, x: [2, 2] }).kind).toBe('stretch')
    const flat = derive({ a11: 1, a12: 2, a21: 0.5, a22: 1, x: [1, 1] })
    expect(flat.kind).toBe('collapse')
    expect(flat.det).toBe(0)
    // Everything lands on one line: Ax is a multiple of column 1.
    expect(flat.y[0] * flat.cols[0][1] - flat.y[1] * flat.cols[0][0]).toBeCloseTo(0, 12)
  })

  it('flags zero vectors, which get no arrow', () => {
    const d = derive({ a11: 0, a12: 0, a21: 0, a22: 0, x: [0, 0] })
    expect(d.zero).toEqual({ x: true, y: true, part1: true, part2: true, c1: true, c2: true })
    expect(d.moved).toEqual([])
  })

  it('keeps the moved grid lines inside the plane area', () => {
    for (const p of [defaults, { a11: 3, a12: -3, a21: 0.5, a22: 2, x: [-3, 3] as Vec }]) {
      const d = derive(p)
      expect(d.moved.length).toBeGreaterThan(4)
      for (const { seg } of d.moved) {
        for (const x of [seg.x1, seg.x2]) expect(x >= GRID_X0 - 0.01 && x <= VIEW.w + 0.01).toBe(true)
        for (const y of [seg.y1, seg.y2]) expect(y >= -0.01 && y <= VIEW.h + 0.01).toBe(true)
      }
    }
  })
})
