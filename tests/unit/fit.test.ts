import { describe, expect, it } from 'vitest'
import { linearFit, mean, mse, normalPdf, polyFit, solve } from '~/engine/fit'
import { frame, polylinePath } from '~/engine/plot'

describe('fit helpers', () => {
  it('solves a linear system', () => {
    const x = solve([[2, 1], [1, 3]], [3, 5])
    expect(x[0]).toBeCloseTo(0.8, 12)
    expect(x[1]).toBeCloseTo(1.4, 12)
    expect(() => solve([[1, 2], [2, 4]], [1, 2])).toThrow()
  })

  it('fits a line by least squares', () => {
    expect(linearFit([1, 2, 3], [3, 5, 7])).toEqual({ w: 2, b: 1 })
    expect(linearFit([2, 2, 2], [1, 2, 3])).toEqual({ w: 0, b: 2 })
  })

  it('computes mean squared error', () => {
    expect(mse([1, 2, 3], [1, 2, 3])).toBe(0)
    expect(mse([0, 0], [3, 1])).toBe(5)
    expect(mean([1, 2, 3, 6])).toBe(3)
  })

  it('polyFit interpolates n points with degree n − 1, and recovers an exact polynomial', () => {
    const xs = [-1, -0.3, 0.4, 1]
    const ys = [2, -1, 0.5, 3]
    const m = polyFit(xs, ys, 3, 0, [-1, 1])
    xs.forEach((x, i) => expect(m.predict(x)).toBeCloseTo(ys[i]!, 9))
    const q = polyFit([0, 1, 2, 3, 4], [1, 2, 5, 10, 17], 2) // y = x² + 1
    expect(q.predict(5)).toBeCloseTo(26, 9)
  })

  it('a ridge penalty shrinks the weights and raises training error', () => {
    const xs = [-1, -0.5, 0, 0.5, 1]
    const ys = [1, -1, 0.5, -0.5, 1]
    const free = polyFit(xs, ys, 4, 0, [-1, 1])
    const tame = polyFit(xs, ys, 4, 0.1, [-1, 1])
    const size = (c: number[]) => c.slice(1).reduce((a, v) => a + v * v, 0)
    expect(size(tame.coef)).toBeLessThan(size(free.coef))
    expect(mse(xs.map(tame.predict), ys)).toBeGreaterThan(mse(xs.map(free.predict), ys))
  })

  it('normal density peaks at the mean and integrates to 1', () => {
    expect(normalPdf(0, 0, 1)).toBeCloseTo(1 / Math.sqrt(2 * Math.PI), 12)
    let area = 0
    for (let x = -8; x <= 8; x += 0.01) area += normalPdf(x, 0.5, 1.3) * 0.01
    expect(area).toBeCloseTo(1, 3)
  })

  it('frame and polylinePath map data into a box', () => {
    const f = frame({ x0: 10, x1: 110, y0: 0, y1: 50 }, [0, 10], [0, 5])
    expect(f.sx(0)).toBe(10)
    expect(f.sy(5)).toBe(0)
    expect(polylinePath([[0, 0], [10, 5]], f.sx, f.sy)).toBe('M10.00 50.00L110.00 0.00')
  })
})
