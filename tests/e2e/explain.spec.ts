import { expect, test, type Page } from '@playwright/test'
import { visit } from './helpers'

/** Every concept with an explainer in content/explain/. */
const EXPLAINED = [
  '/foundations/vectors',
  '/foundations/dot-product',
  '/foundations/cosine-similarity',
  '/foundations/matrix-multiplication',
  '/learning-basics/loss-function',
  '/optimisation/gradient-descent',
  '/optimisation/learning-rate',
  '/transformers-llms/softmax',
  '/transformers-llms/temperature',
]

const prose = (page: Page) => page.locator('.explain .prose')

test.describe('explainers', () => {
  for (const path of EXPLAINED) {
    test(`${path} renders its explainer without errors`, async ({ page }) => {
      const errors: string[] = []
      page.on('pageerror', (e) => errors.push(String(e)))
      page.on('console', (m) => {
        if (m.type() === 'error') errors.push(m.text())
      })
      await visit(page, `${path}?view=explain`)
      await expect(prose(page).locator('h2').first()).toBeVisible()
      await expect(prose(page).locator('.katex').first()).toBeAttached()
      await expect(prose(page).locator('.katex-error')).toHaveCount(0)
      await expect(page.locator('.explain .pending')).toHaveCount(0)
      expect(errors).toEqual([])
    })
  }
})

test('Dot Product explainer: hint at the top, reveals open on click and keyboard', async ({ page }) => {
  await visit(page, '/foundations/dot-product?view=explain')
  await expect(page.getByRole('note')).toContainText('Some phrases are hidden')

  const hidden = prose(page).getByRole('button', { name: 'Hidden answer. Press to reveal.' })
  const before = await hidden.count()
  expect(before).toBeGreaterThan(2)

  const first = prose(page).locator('.reveal').first()
  await first.click()
  await expect(first).toHaveClass(/\bon\b/)
  await expect(first).toContainText('5')

  await hidden.first().focus()
  await page.keyboard.press('Enter')
  await expect(hidden).toHaveCount(before - 2)
})

test('display maths sits in a formula card', async ({ page }) => {
  await visit(page, '/foundations/dot-product?view=explain')
  const card = prose(page).locator('.katex-display').first()
  await expect(card).toBeVisible()
  expect(await card.evaluate((el) => getComputedStyle(el).display)).toBe('block')
})

test('a concept without an explainer shows its summary and a note', async ({ page }) => {
  await visit(page, '/foundations/derivatives-chain-rule?view=explain')
  await expect(page.locator('.explain .pending')).toContainText('hasn’t been written yet')
  await expect(page.getByRole('note')).toHaveCount(0)
})

test.describe('draft flag', () => {
  test('a draft explainer shows an "In draft" chip after the concept name', async ({ page }) => {
    await visit(page, '/foundations/dot-product')
    const crumbs = page.getByRole('navigation', { name: 'Breadcrumb' })
    await expect(crumbs.locator('.draft-chip')).toHaveText('In draft')
  })

  test('no chip for a concept without an explainer', async ({ page }) => {
    await visit(page, '/foundations/derivatives-chain-rule')
    await expect(page.locator('.draft-chip')).toHaveCount(0)
  })

  test('the sidebar marks draft explainers with an amber dot', async ({ page }) => {
    await visit(page, '/foundations/dot-product')
    const sidebar = page.getByRole('navigation', { name: 'Curriculum' })
    const dot = (name: string) => sidebar.getByRole('link', { name }).locator('.dot')

    // Ready + draft: filled amber. Planned + draft: amber ring. No explainer: unchanged.
    await expect(dot('Dot Product (explainer in draft)')).toHaveClass(/\bready\b.*\bdraft\b/)
    await expect(dot('Vectors (explainer in draft)')).toHaveClass(/\bplanned\b.*\bdraft\b/)
    await expect(dot('Derivatives & Chain Rule')).not.toHaveClass(/\bdraft\b/)

    const fill = await dot('Dot Product (explainer in draft)').evaluate((el) => getComputedStyle(el).backgroundColor)
    const amber = await page.evaluate(() => {
      const probe = document.createElement('span')
      probe.style.color = 'var(--c-amber)'
      document.body.append(probe)
      const c = getComputedStyle(probe).color
      probe.remove()
      return c
    })
    expect(fill).toBe(amber)
  })
})

test('moving between explainers keeps the Explain view and loads the next one', async ({ page }) => {
  await visit(page, '/foundations/dot-product?view=explain')
  await page.getByRole('link', { name: /Next\s*Cosine Similarity/ }).click()
  await expect(page).toHaveURL('/foundations/cosine-similarity?view=explain')
  await expect(page.locator('.explain h1')).toHaveText('Cosine Similarity')
  await expect(prose(page)).toContainText('compares their direction only')
})
