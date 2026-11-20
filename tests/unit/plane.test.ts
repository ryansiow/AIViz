import { describe, expect, it } from 'vitest'
import { angleArc, arrowHead, fmt, fmtFactor, overlaps, pickFree, signedAngle, tipLabel, toSvg, type Plane } from '~/engine/plane'

const P: Plane = { ox: 100, oy: 100, unit: 10 }
const close = (a: number, b: number) => expect(a).toBeCloseTo(b, 6)

describe('toSvg', () => {
  it('flips y and scales by the unit', () => {
    expect(toSvg(P, [0, 0])).toEqual([100, 100])
    expect(toSvg(P, [2, 3])).toEqual([120, 70])
    expect(toSvg(P, [-1, -1])).toEqual([90, 110])
  })
})

describe('signedAngle', () => {
  it('is positive counter-clockwise and negative clockwise', () => {
    close(signedAngle([1, 0], [0, 1]), Math.PI / 2)
    close(signedAngle([0, 1], [1, 0]), -Math.PI / 2)
  })
  it('takes the short way round across ±180°', () => {
    // From 170° to -170° is +20°, not -340°.
    const a: [number, number] = [Math.cos((170 * Math.PI) / 180), Math.sin((170 * Math.PI) / 180)]
    const b: [number, number] = [Math.cos((-170 * Math.PI) / 180), Math.sin((-170 * Math.PI) / 180)]
    close(signedAngle(a, b), (20 * Math.PI) / 180)
  })
})

describe('angleArc', () => {
  it('draws counter-clockwise arcs with sweep 0 (y is flipped in SVG)', () => {
    const arc = angleArc(P, [1, 0], [0, 1], 20)
    expect(arc.d).toBe('M120.00 100.00 A20 20 0 0 0 100.00 80.00')
    close(arc.delta, Math.PI / 2)
  })
  it('draws clockwise arcs with sweep 1', () => {
    expect(angleArc(P, [0, 1], [1, 0], 20).d).toContain(' 0 0 1 ')
  })
  it('puts the label on the bisector, outside the arc', () => {
    const { label } = angleArc(P, [1, 0], [0, 1], 20, 10)
    close(label[0], 100 + 30 * Math.SQRT1_2)
    close(label[1], 100 - 30 * Math.SQRT1_2)
  })
})

describe('arrowHead', () => {
  it('starts at the tip and is symmetric about the line', () => {
    const pts = arrowHead([0, 0], [10, 0], 5).split(' ').map((p) => p.split(',').map(Number))
    expect(pts[0]).toEqual([10, 0])
    close(pts[1]![1]!, -pts[2]![1]!)
    expect(pts[1]![0]).toBeLessThan(10)
  })
})

describe('tipLabel', () => {
  it('anchors start to the right, end to the left, middle when near vertical', () => {
    expect(tipLabel([0, 0], [10, 0]).anchor).toBe('start')
    expect(tipLabel([0, 0], [-10, 0]).anchor).toBe('end')
    expect(tipLabel([0, 0], [0.5, -10]).anchor).toBe('middle')
  })
})

describe('pickFree', () => {
  const a = { x: 0, y: 0, w: 10, h: 10 }
  const b = { x: 20, y: 0, w: 10, h: 10 }
  it('detects overlap, not touching edges', () => {
    expect(overlaps(a, { x: 5, y: 5, w: 10, h: 10 })).toBe(true)
    expect(overlaps(a, { x: 10, y: 0, w: 5, h: 5 })).toBe(false)
  })
  it('returns the first candidate clear of every obstacle', () => {
    expect(pickFree([a, b], [{ x: 2, y: 2, w: 2, h: 2 }])).toBe(b)
  })
  it('falls back to the first candidate when none is clear', () => {
    expect(pickFree([a, b], [{ x: 0, y: 0, w: 40, h: 40 }])).toBe(a)
  })
})

describe('number formatting for diagrams', () => {
  it('uses a real minus sign and trims trailing zeros', () => {
    expect(fmt(-3)).toBe('−3')
    expect(fmt(1.5)).toBe('1.5')
    expect(fmt(2 / 3)).toBe('0.667')
  })
  it('wraps negative factors in parentheses', () => {
    expect(fmtFactor(-1)).toBe('(−1)')
    expect(fmtFactor(2)).toBe('2')
  })
})
