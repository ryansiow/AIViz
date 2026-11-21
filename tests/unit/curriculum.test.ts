import { describe, expect, it } from 'vitest'
import { curriculum, findChapter, findConcept, totalConcepts } from '~/data/curriculum'

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

describe('curriculum data', () => {
  it('has URL-safe, unique chapter slugs', () => {
    const slugs = curriculum.map((c) => c.slug)
    slugs.forEach((s) => expect(s).toMatch(slugPattern))
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('has URL-safe concept slugs, unique within each chapter', () => {
    for (const chapter of curriculum) {
      const slugs = chapter.concepts.map((c) => c.slug)
      slugs.forEach((s) => expect(s).toMatch(slugPattern))
      expect(new Set(slugs).size, chapter.slug).toBe(slugs.length)
    }
  })

  it('gives every chapter and concept a title and summary', () => {
    for (const chapter of curriculum) {
      expect(chapter.title.length).toBeGreaterThan(0)
      expect(chapter.concepts.length).toBeGreaterThan(0)
      for (const concept of chapter.concepts) {
        expect(concept.title.length, concept.slug).toBeGreaterThan(0)
        expect(concept.summary.length, concept.slug).toBeGreaterThan(0)
      }
    }
  })

  it('counts concepts', () => {
    expect(totalConcepts).toBe(curriculum.reduce((n, c) => n + c.concepts.length, 0))
  })
})

describe('lookups', () => {
  it('finds chapters by slug', () => {
    expect(findChapter('foundations')?.title).toBe('Foundations')
    expect(findChapter('nope')).toBeUndefined()
  })

  it('finds a concept with its neighbours', () => {
    const found = findConcept('foundations', 'dot-product')
    expect(found?.concept.title).toBe('Dot Product')
    expect(found?.index).toBe(1)
    expect(found?.prev?.slug).toBe('vectors')
    expect(found?.next?.slug).toBe('cosine-similarity')
  })

  it('has no previous concept at the start of a chapter', () => {
    expect(findConcept('foundations', 'vectors')?.prev).toBeUndefined()
  })

  it('returns undefined for unknown concepts or a concept in the wrong chapter', () => {
    expect(findConcept('foundations', 'nope')).toBeUndefined()
    expect(findConcept('optimisation', 'dot-product')).toBeUndefined()
  })
})

describe('review and format flags', () => {
  const all = curriculum.flatMap((ch) => ch.concepts)

  it('only marks ready concepts as reviewed', () => {
    for (const c of all) if (c.reviewed) expect(c.status, c.slug).toBe('ready')
  })

  it('keeps the three concepts merged before Phase 6 reviewed', () => {
    for (const [ch, co] of [['foundations', 'dot-product'], ['transformers-llms', 'softmax'], ['optimisation', 'gradient-descent']] as const) {
      expect(findConcept(ch, co)!.concept.reviewed, co).toBe(true)
    }
  })

  it('marks the text-first concepts', () => {
    const text = all.filter((c) => c.format === 'text').map((c) => c.slug).sort()
    expect(text).toEqual(['context-window', 'elbo', 'hyperparameter-tuning', 'llm-training-pipeline', 'universal-approximation'])
  })
})
