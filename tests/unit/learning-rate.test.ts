import { describe, expect, it } from 'vitest'
import { derive, makeRun, PANEL, PANEL_X, VIEW } from '~/concepts/optimisation/learning-rate/derive'

const defaults = { eta1: 0.1, eta2: 0.7, eta3: 2.05, theta0: -2.5 }

describe('learning-rate derive', () => {
  it('runs the three default learning rates to three different outcomes', () => {
    const d = derive(defaults)
    expect(d.runs.map((r) => r.status)).toEqual(['slow', 'converged', 'diverged'])
    expect(d.grad0).toBe(-3.5)
  })

  it('matches the explainer table (12 updates from θ₀ = −2.5)', () => {
    const t = (eta: number) => makeRun(0, eta, -2.5).final.theta
    expect(t(0.05)).toBeCloseTo(-0.8913, 3)
    expect(t(0.5)).toBeCloseTo(0.9991, 3)
    expect(t(1.5)).toBeCloseTo(0.9991, 3)
  })

  it('multiplies the distance to the bottom by (1 − η) every step', () => {
    for (const eta of [0.1, 0.7, 1.3, 1.9]) {
      const r = makeRun(1, eta, -2.5)
      for (let k = 1; k < r.points.length; k++) {
        expect(r.points[k]!.theta - 1).toBeCloseTo((1 - eta) * (r.points[k - 1]!.theta - 1), 9)
      }
    }
  })

  it('separates the stable and unstable sides of η = 2', () => {
    expect(makeRun(0, 1.9, -2.5).status).toBe('oscillating')
    expect(makeRun(0, 2, -2.5).status).toBe('oscillating')
    expect(makeRun(0, 2.1, -2.5).status).toBe('diverged')
    expect(makeRun(0, 1, -2.5).status).toBe('converged')
  })

  it('stops drawing at the first point that leaves the chart', () => {
    const r = makeRun(2, 2.2, -2.5)
    const off = r.shown.findIndex((p) => p.offChart)
    expect(off).toBe(r.shown.length - 1)
    expect(r.points.length).toBeGreaterThan(r.shown.length)
  })

  it('keeps every panel and point inside the view, clear of the caption area', () => {
    const d = derive({ eta1: 0.01, eta2: 2.2, eta3: 2.2, theta0: 3 })
    expect(PANEL_X[2]! + PANEL.w).toBeLessThanOrEqual(VIEW.w)
    for (const r of d.runs) {
      for (const p of r.shown) {
        expect(p.x).toBeGreaterThanOrEqual(r.x0)
        expect(p.x).toBeLessThanOrEqual(r.x0 + PANEL.w)
        expect(p.y).toBeLessThanOrEqual(PANEL.plotBottom)
      }
      expect(r.firstArrow.x2).toBeLessThanOrEqual(r.x0 + PANEL.w)
    }
    expect(PANEL.plotBottom + 84).toBeLessThan(VIEW.h - 50)
  })

  it('starting at the minimum stays there for every η', () => {
    const d = derive({ ...defaults, eta3: 0.7, theta0: 1 })
    for (const r of d.runs) expect(r.distance).toBe(0)
  })
})
