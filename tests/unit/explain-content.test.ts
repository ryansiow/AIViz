import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'
import { curriculum, findConcept } from '~/data/curriculum'
import { explainPath, parseExplainPath } from '~/utils/explain'

const ROOT = join(__dirname, '../../content/explain')
const HUES = ['blue', 'rose', 'violet', 'green', 'amber']

function files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? files(join(dir, e.name)) : e.name.endsWith('.md') ? [join(dir, e.name)] : [],
  )
}

const docs = files(ROOT).map((file) => {
  const rel = relative(ROOT, file).replace(/\.md$/, '')
  const [chapter, concept] = rel.split('/')
  const text = readFileSync(file, 'utf8')
  const front = /^---\n([\s\S]*?)\n---\n/.exec(text)?.[1] ?? ''
  const field = (k: string) => new RegExp(`^${k}:\\s*(.+)$`, 'm').exec(front)?.[1]?.trim()
  return { rel, chapter: chapter!, concept: concept!, text, body: text.slice(front.length + 8), field }
})

describe('explain paths', () => {
  it('round-trips chapter and concept slugs', () => {
    expect(explainPath('foundations', 'dot-product')).toBe('/explain/foundations/dot-product')
    expect(parseExplainPath('/explain/foundations/dot-product')).toEqual({ chapter: 'foundations', concept: 'dot-product' })
  })

  it('rejects paths outside the explain collection', () => {
    expect(parseExplainPath('/foundations/dot-product')).toBeNull()
    expect(parseExplainPath('/explain/foundations')).toBeNull()
    expect(parseExplainPath('/explain/a/b/c')).toBeNull()
  })
})

describe('explain content', () => {
  it('has at least one explainer', () => {
    expect(docs.length).toBeGreaterThan(0)
  })

  it('places every file at content/explain/<chapter>/<concept>.md for a real concept', () => {
    for (const d of docs) {
      expect(d.rel.split('/'), d.rel).toHaveLength(2)
      expect(findConcept(d.chapter, d.concept), d.rel).toBeDefined()
    }
  })

  it('gives every file front matter with the concept title and a boolean draft flag', () => {
    for (const d of docs) {
      expect(d.field('title'), d.rel).toBe(findConcept(d.chapter, d.concept)!.concept.title)
      expect(['true', 'false'], d.rel).toContain(d.field('draft'))
      const updated = d.field('updated')
      if (updated) expect(updated, d.rel).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })

  it('has an explainer for every ready concept', () => {
    const have = new Set(docs.map((d) => d.rel))
    for (const ch of curriculum) {
      for (const c of ch.concepts) {
        if (c.status === 'ready') expect(have.has(`${ch.slug}/${c.slug}`), `${ch.slug}/${c.slug}`).toBe(true)
      }
    }
  })

  it('uses only semantic hues for coloured terms', () => {
    for (const d of docs) {
      for (const m of d.body.matchAll(/:term\[[^\]]*\]\{hue="([a-z]+)"\}/g)) expect(HUES, d.rel).toContain(m[1])
    }
  })

  it('does not repeat the title as a heading (the page renders it)', () => {
    for (const d of docs) expect(d.body, d.rel).not.toMatch(/^# /m)
  })

  it('balances inline and display maths delimiters', () => {
    for (const d of docs) {
      const outside = d.body.replace(/\$\$[\s\S]*?\$\$/g, '')
      expect(outside.includes('$$'), `${d.rel}: unclosed $$`).toBe(false)
      for (const line of outside.split('\n')) {
        const n = (line.match(/(?<!\\)\$/g) ?? []).length
        expect(n % 2, `${d.rel}: odd $ in "${line}"`).toBe(0)
      }
    }
  })
})
