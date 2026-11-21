import { expect, test, type Page } from '@playwright/test'
import { visit } from './helpers'

/** Every concept with an explainer in content/explain/. */
const EXPLAINED = [
  '/foundations/vectors',
  '/foundations/dot-product',
  '/foundations/cosine-similarity',
  '/foundations/matrix-multiplication',
  '/foundations/derivatives-chain-rule',
  '/learning-basics/supervised-learning',
  '/learning-basics/loss-function',
  '/learning-basics/maximum-likelihood',
  '/learning-basics/cross-entropy',
  '/learning-basics/overfitting',
  '/learning-basics/regularization',
  '/learning-basics/training-curve',
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
  await visit(page, '/neural-networks/perceptron?view=explain')
  await expect(page.locator('.explain .pending')).toContainText('hasn’t been written yet')
  await expect(page.getByRole('note')).toHaveCount(0)
})

test.describe('draft flag', () => {
  test('a draft explainer shows an "In draft" chip after the concept name', async ({ page }) => {
    await visit(page, '/transformers-llms/softmax')
    const crumbs = page.getByRole('navigation', { name: 'Breadcrumb' })
    await expect(crumbs.locator('.draft-chip')).toContainText('In draft')
    await expect(crumbs.locator('.draft-chip')).toHaveAttribute('title', 'Explainer is a first draft, not reviewed yet')
  })

  test('no chip for a planned concept without an explainer', async ({ page }) => {
    await visit(page, '/neural-networks/perceptron')
    await expect(page.locator('.draft-chip')).toHaveCount(0)
  })

  test("the sidebar marks items awaiting review with an amber dot", async ({ page }) => {
    await visit(page, '/foundations/dot-product')
    const sidebar = page.getByRole('navigation', { name: 'Curriculum' })
    const dot = (name: string | RegExp) => sidebar.getByRole('link', { name }).locator('.dot')

    // Ready but not reviewed: filled amber.
    await expect(dot('Vectors (in draft)')).toHaveClass(/\bready\b.*\bdraft\b/)
    const fill = await dot('Vectors (in draft)').evaluate((el) => getComputedStyle(el).backgroundColor)
    const amber = await page.evaluate(() => {
      const probe = document.createElement('span')
      probe.style.color = 'var(--c-amber)'
      document.body.append(probe)
      const c = getComputedStyle(probe).color
      probe.remove()
      return c
    })
    expect(fill).toBe(amber)

    // Planned without an explainer: unchanged. (The sidebar opens the current chapter.)
    // No planned concept has a draft explainer at the moment, so the amber-ring case
    // (planned + draft) has no real example; it returns when one is written ahead of its visualisation.
    await visit(page, '/neural-networks/perceptron')
    await expect(dot(/^Perceptron/)).toHaveClass(/\bplanned\b/)
    await expect(dot(/^Perceptron/)).not.toHaveClass(/\bdraft\b/)
  })
})

test('moving between explainers keeps the Explain view and loads the next one', async ({ page }) => {
  await visit(page, '/foundations/dot-product?view=explain')
  await page.getByRole('link', { name: /Next\s*Cosine Similarity/ }).click()
  await expect(page).toHaveURL('/foundations/cosine-similarity?view=explain')
  await expect(page.locator('.explain h1')).toHaveText('Cosine Similarity')
  await expect(prose(page)).toContainText('compares their direction only')
})

test('a new, unreviewed visualisation is flagged even when its explainer is reviewed', async ({ page }) => {
  // Temperature: visualisation unreviewed (and explainer draft) → the chip names both.
  await visit(page, '/transformers-llms/temperature')
  await expect(page.locator('.draft-chip')).toHaveAttribute('title', 'Visualisation and explainer not reviewed yet')
  // Softmax: visualisation reviewed, explainer draft → explainer only.
  await visit(page, '/transformers-llms/softmax')
  await expect(page.locator('.draft-chip')).toHaveAttribute('title', 'Explainer is a first draft, not reviewed yet')
})
