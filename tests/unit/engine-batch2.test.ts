import { describe, expect, it } from 'vitest'
import { classify2, column, det2, gridLayout, inverse2, matVec, type Mat2 } from '~/engine/matrix'
import { fitPlane, sideLabel, toSvg, type Vec } from '~/engine/plane'
import { clipSegment, linear, tangentSegment } from '~/engine/plot'

/** Phase 6 Batch 2 primitives: fitPlane, sideLabel, clipSegment, tangentSegment, matrix helpers. */

describe('fitPlane', () => {
  const box = { x: 100, y: 20, w: 400, h: 300 }
  const inside = (p: Vec, plane: ReturnType<typeof fitPlane>) => {
    const [x, y] = toSvg(plane, p)
    return x >= box.x && x <= box.x + box.w && y >= box.y && y <= box.y + box.h
  }

  it('keeps every point and the origin inside the box', () => {
    for (const pts of [[[3, 2], [6, 4]], [[-8, 8], [8, -8]], [[0.5, 0.25]], [[12, -1]]] as Vec[][]) {
      const plane = fitPlane(pts, box)
      for (const p of [...pts, [0, 0] as Vec]) expect(inside(p, plane), JSON.stringify(p)).toBe(true)
    }
  })

  it('snaps the scale to one of the allowed units', () => {
    const plane = fitPlane([[3, 2]], box, { units: [50, 30, 10] })
    expect([50, 30, 10]).toContain(plane.unit)
  })

  it('uses a smaller scale for larger content', () => {
    expect(fitPlane([[10, 10]], box).unit).toBeLessThan(fitPlane([[2, 2]], box).unit)
  })

  it('ignores non-finite points', () => {
    const plane = fitPlane([[2, 1], [Infinity, NaN]], box)
    expect(Number.isFinite(plane.ox) && Number.isFinite(plane.unit)).toBe(true)
  })
})

describe('sideLabel', () => {
  it('sits beside the middle of a segment, on the side away from a given point', () => {
    const l = sideLabel([0, 0], [100, 0], 10, [50, 50])
    expect(l.x).toBeCloseTo(50)
    expect(l.y).toBeLessThan(0 + 6) // above the line (away from the point below)
    const r = sideLabel([0, 0], [100, 0], 10, [50, -50])
    expect(r.y).toBeGreaterThan(5)
  })

  it('anchors the text away from a vertical segment', () => {
    expect(sideLabel([0, 0], [0, 100], 10, [-20, 50]).anchor).toBe('start')
    expect(sideLabel([0, 0], [0, 100], 10, [20, 50]).anchor).toBe('end')
  })
})

describe('clipSegment', () => {
  const box = { x0: 0, x1: 10, y0: 0, y1: 10 }
  it('clips a segment crossing the box to its edges', () => {
    expect(clipSegment([-5, 5], [15, 5], box)).toEqual({ x1: 0, y1: 5, x2: 10, y2: 5 })
  })
  it('keeps a segment that is already inside', () => {
    expect(clipSegment([2, 2], [3, 4], box)).toEqual({ x1: 2, y1: 2, x2: 3, y2: 4 })
  })
  it('returns null for a segment outside', () => {
    expect(clipSegment([-5, -5], [-1, 20], box)).toBeNull()
  })
})

describe('tangentSegment', () => {
  const sx = linear([-2, 2], [0, 200])
  const sy = linear([0, 4], [200, 0])
  it('passes through the point with the given slope, clipped to the plot', () => {
    // y = x², tangent at x = 1: y = 2x − 1.
    const t = tangentSegment(1, 1, 2, sx, sy)!
    expect(t).not.toBeNull()
    const slopePx = (t.y2 - t.y1) / (t.x2 - t.x1)
    // SVG slope = maths slope × (y px per unit / x px per unit), sign flipped.
    expect(slopePx).toBeCloseTo(-2 * (50 / 50), 6)
    // The point (1, 1) lies on the segment.
    const [px, py] = [sx(1), sy(1)]
    expect((py - t.y1) / (px - t.x1)).toBeCloseTo(slopePx, 6)
    for (const v of [t.x1, t.x2]) expect(v >= 0 && v <= 200).toBe(true)
    for (const v of [t.y1, t.y2]) expect(v >= 0 && v <= 200).toBe(true)
  })
  it('handles a flat tangent', () => {
    const t = tangentSegment(0, 2, 0, sx, sy)!
    expect(t.y1).toBeCloseTo(t.y2)
    expect(Math.min(t.x1, t.x2)).toBeCloseTo(0)
    expect(Math.max(t.x1, t.x2)).toBeCloseTo(200)
  })
})

describe('matrix helpers', () => {
  const shear: Mat2 = [[1, 2], [0, 1]]
  it('multiplies a matrix by a vector, one dot product per row', () => {
    expect(matVec(shear, [3, 1])).toEqual([5, 1])
  })
  it('reads columns, determinant and inverse', () => {
    expect(column(shear, 1)).toEqual([2, 1])
    expect(det2(shear)).toBe(1)
    const inv = inverse2(shear)!
    expect(matVec(inv, matVec(shear, [3, 1]))).toEqual([3, 1])
    expect(inverse2([[1, 2], [0.5, 1]])).toBeNull()
  })
  it('classifies what a matrix does', () => {
    expect(classify2([[1, 0], [0, 1]])).toBe('identity')
    expect(classify2(shear)).toBe('shear')
    expect(classify2([[0, -1], [1, 0]])).toBe('rotation')
    expect(classify2([[-1, 0], [0, 1]])).toBe('reflection')
    expect(classify2([[2, 0], [0, 0.5]])).toBe('stretch')
    expect(classify2([[1, 2], [0.5, 1]])).toBe('collapse')
    expect(classify2([[2, 1], [1, 3]])).toBe('general')
  })
  it('lays out cells, highlights and brackets', () => {
    const g = gridLayout(2, 3, 10, 20, 40, 4)
    expect(g.cells).toHaveLength(6)
    expect(g.w).toBe(3 * 40 + 2 * 4)
    expect(g.h).toBe(2 * 40 + 4)
    const last = g.cells[5]!
    expect([last.r, last.c, last.x, last.y]).toEqual([1, 2, 10 + 2 * 44, 20 + 44])
    expect(g.rows).toHaveLength(2)
    expect(g.cols).toHaveLength(3)
    // Row highlight covers its cells.
    expect(g.rows[1]!.x).toBeLessThan(g.cells[3]!.x)
    expect(g.rows[1]!.x + g.rows[1]!.w).toBeGreaterThan(last.x + last.w)
    expect(g.bracket.left.startsWith('M')).toBe(true)
  })
})
