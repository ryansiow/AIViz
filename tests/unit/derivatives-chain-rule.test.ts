import { describe, expect, it } from 'vitest'
import { derive, extentOf, INNER, nudgeLabels, OUTER, PLOTS, type InnerId, type OuterId } from '~/concepts/foundations/derivatives-chain-rule/derive'

const defaults = { inner: 'linear', outer: 'square', x: 1, dx: 0.5 }

describe('derivatives-chain-rule derive', () => {
  it('default worked example: (2x + 1)² at x = 1', () => {
    const d = derive(defaults)
    expect([d.u, d.y]).toEqual([3, 9])
    expect([d.dg, d.df, d.dydx]).toEqual([2, 6, 12])
    // Nudge Δx = 0.5: u goes 3 → 4, y goes 9 → 16.
    expect(d.du).toBe(1)
    expect(d.dy).toBe(7)
    expect(d.ratio).toBe(14)
  })

  it('the chain rule matches a finite difference for every pair of functions', () => {
    for (const inner of Object.keys(INNER) as InnerId[])
      for (const outer of Object.keys(OUTER) as OuterId[])
        for (const x of [-1.7, -0.3, 0, 0.8, 1.6]) {
          const d = derive({ inner, outer, x, dx: 0.5 })
          const h = 1e-6
          const comp = (t: number) => OUTER[outer].f(INNER[inner].g(t))
          const fd = (comp(x + h) - comp(x - h)) / (2 * h)
          expect(d.dydx, `${inner}/${outer} at ${x}`).toBeCloseTo(fd, 5)
        }
  })

  it('Δy/Δx approaches dy/dx as the nudge shrinks', () => {
    const errs = [1, 0.5, 0.1, 0.05].map((dx) => {
      const d = derive({ ...defaults, dx })
      return Math.abs(d.ratio - d.dydx)
    })
    for (let i = 1; i < errs.length; i++) expect(errs[i]).toBeLessThan(errs[i - 1]!)
    expect(derive({ ...defaults, dx: 0.05 }).ratio).toBeCloseTo(12.2, 10)
  })

  it('presets: a sigmoid neuron, (x²)², a flat spot', () => {
    const neuron = derive({ inner: 'linear', outer: 'sigmoid', x: 0, dx: 0.5 })
    expect(neuron.u).toBe(1)
    expect(neuron.dydx).toBeCloseTo(2 * (Math.exp(-1) / (1 + Math.exp(-1)) ** 2), 12)
    expect(derive({ inner: 'square', outer: 'square', x: 1, dx: 0.5 }).dydx).toBe(4) // d/dx x⁴ = 4x³
    expect(Math.abs(derive({ inner: 'sine', outer: 'square', x: 1.6, dx: 0.3 }).dydx)).toBeLessThan(0.1)
  })

  it('keeps both points and the tangent inside their plots', () => {
    for (const inner of Object.keys(INNER) as InnerId[])
      for (const outer of Object.keys(OUTER) as OuterId[])
        for (const x of [-2, 0, 2])
          for (const dx of [0.05, 1]) {
            const d = derive({ inner, outer, x, dx })
            for (const k of ['g', 'f'] as const) {
              const box = PLOTS[k]
              for (const [px, py] of [d[k].P, d[k].Q]) {
                expect(px >= box.x0 - 0.01 && px <= box.x1 + 0.01, `${inner}/${outer} ${k} x`).toBe(true)
                expect(py >= box.y0 - 0.01 && py <= box.y1 + 0.01, `${inner}/${outer} ${k} y`).toBe(true)
              }
              expect(d[k].tangent).not.toBeNull()
            }
          }
  })

  it('places nudge labels on the side with room', () => {
    const box = { x0: 0, x1: 300 }
    // Short run near the right edge: the run label goes left.
    expect(nudgeLabels([280, 100], [290, 80], box).run.anchor).toBe('end')
    // Short run near the left edge: it goes right.
    expect(nudgeLabels([10, 100], [20, 80], box).run.anchor).toBe('start')
    // Long run: centred.
    expect(nudgeLabels([10, 100], [200, 50], box).run.anchor).toBe('middle')
    // A tiny rise puts its label past Q, above it when the rise goes up.
    const tiny = nudgeLabels([100, 100], [120, 98], box).rise
    expect(tiny.y).toBeLessThan(98)
  })

  it('pads the plotted range so curves never touch the frame', () => {
    const [lo, hi] = extentOf((x) => x * x, -2, 3)
    expect(lo).toBeLessThan(0)
    expect(hi).toBeGreaterThan(9)
  })
})
