import { describe, expect, it } from 'vitest'
import { derive, descend, LANDSCAPES, params } from '~/concepts/optimisation/gradient-descent/derive'
import { defaultsOf } from '~/types/concept'

const base = defaultsOf(params)
const run = (eta: number, theta0 = -2.5, landscape: 'bowl' | 'valleys' = 'bowl') => derive({ eta, theta0, landscape })

describe('gradient descent', () => {
  it('applies θ ← θ − η·L′(θ)', () => {
    const { f, df } = LANDSCAPES.bowl
    const t = descend(f, df, -2.5, 0.5, 2)
    expect(t[1]).toBeCloseTo(-2.5 - 0.5 * (-2.5 - 1), 12) // −0.75
    expect(t[2]).toBeCloseTo(-0.75 - 0.5 * (-0.75 - 1), 12)
  })

  it('spells out the first update', () => {
    const d = derive(base)
    expect(d.first).toEqual({ theta0: -2.5, grad: -3.5, delta: 1.75, theta1: -0.75 })
  })

  it('has derivatives that match the loss functions', () => {
    for (const L of Object.values(LANDSCAPES)) {
      for (const t of [-2.7, -1, 0.3, 2.2]) {
        const h = 1e-6
        expect(L.df(t)).toBeCloseTo((L.f(t + h) - L.f(t - h)) / (2 * h), 5)
      }
    }
  })

  it('classifies the learning-rate presets', () => {
    expect(run(0.05).status).toBe('slow')
    expect(run(0.6).status).toBe('converged')
    expect(run(0.5).status).toBe('converged')
    expect(run(1.9).status).toBe('oscillating')
    expect(run(2.1).status).toBe('diverged')
  })

  it('reports a local minimum in the shallower valley', () => {
    expect(run(0.15, 2.5, 'valleys').status).toBe('local')
    expect(run(0.15, -2.5, 'valleys').status).toBe('converged')
  })

  it('converges to the bowl minimum at θ = 1', () => {
    expect(run(0.6).final.theta).toBeCloseTo(1, 3)
  })

  it('draws points only until the first one leaves the chart', () => {
    const d = run(2.1)
    const off = d.shown.findIndex((p) => p.offChart)
    expect(off).toBe(d.shown.length - 1)
    expect(d.points.length).toBeGreaterThan(d.shown.length)
    // On-chart runs show every point.
    expect(run(0.5).shown).toHaveLength(run(0.5).points.length)
  })
})
