import { describe, expect, it, vi } from 'vitest'

// The registry imports concept modules (which import .vue files) lazily, so
// only its keys are needed here. Stub the dynamic imports.
vi.mock('~/concepts/foundations/dot-product', () => ({ default: {} }))
vi.mock('~/concepts/transformers-llms/softmax', () => ({ default: {} }))
vi.mock('~/concepts/optimisation/gradient-descent', () => ({ default: {} }))
vi.mock('~/concepts/optimisation/learning-rate', () => ({ default: {} }))
vi.mock('~/concepts/transformers-llms/temperature', () => ({ default: {} }))

const { conceptLoaders } = await import('~/concepts/registry')
const { curriculum } = await import('~/data/curriculum')

describe('concept registry', () => {
  const ready = curriculum.flatMap((ch) => ch.concepts.filter((c) => c.status === 'ready').map((c) => `${ch.slug}/${c.slug}`))
  const registered = Object.keys(conceptLoaders)

  it('has a module for every concept marked ready', () => {
    expect(registered.sort()).toEqual(ready.sort())
  })

  it('only registers concepts that exist in the curriculum', () => {
    const all = new Set(curriculum.flatMap((ch) => ch.concepts.map((c) => `${ch.slug}/${c.slug}`)))
    for (const key of registered) expect(all.has(key), key).toBe(true)
  })
})
