import { describe, expect, it } from 'vitest'
import { defaultsOf, hueSoftVar, hueVar, type ParamSchema } from '~/types/concept'

describe('defaultsOf', () => {
  const schema = {
    w: { kind: 'vector2', label: 'w', range: [-4, 4], default: [3, 1] },
    t: { kind: 'number', label: 'T', min: 0, max: 2, default: 1 },
    mode: { kind: 'select', label: 'Mode', default: 'a', options: [{ value: 'a', label: 'A' }] },
    on: { kind: 'toggle', label: 'On', default: false },
  } satisfies ParamSchema

  it('returns the default of every param', () => {
    expect(defaultsOf(schema)).toEqual({ w: [3, 1], t: 1, mode: 'a', on: false })
  })

  it('copies arrays so editing values never mutates the schema', () => {
    const values = defaultsOf(schema)
    values.w[0] = 99
    expect(schema.w.default).toEqual([3, 1])
  })
})

describe('hue helpers', () => {
  it('maps hues to token variables', () => {
    expect(hueVar('blue')).toBe('var(--c-blue)')
    expect(hueSoftVar('rose')).toBe('var(--c-rose-soft)')
  })
  it('falls back to neutral text colours', () => {
    expect(hueVar(undefined)).toBe('var(--text)')
    expect(hueVar('neutral')).toBe('var(--text)')
    expect(hueSoftVar(undefined)).toBe('var(--surface-2)')
  })
})
