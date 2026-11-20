import { expect, test } from '@playwright/test'
import { visit } from './helpers'

test.describe('navigation', () => {
  test('home lists every chapter and links to concepts', async ({ page }) => {
    await visit(page, '/')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Learn AI concepts')
    const main = page.getByRole('main')
    for (const title of ['Foundations', 'Learning Basics', 'Neural Networks', 'Optimisation', 'Transformers & LLMs', 'Generative Models']) {
      await expect(main.getByRole('link', { name: title, exact: false }).first()).toBeVisible()
    }
    await main.getByRole('link', { name: 'Dot Product' }).click()
    await expect(page).toHaveURL('/foundations/dot-product')
    await expect(page).toHaveTitle('Dot Product — AIViz')
  })

  test('chapter page lists its concepts in order', async ({ page }) => {
    await visit(page, '/optimisation')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Optimisation')
    const titles = await page.locator('.list .title').allTextContents()
    expect(titles.slice(0, 2)).toEqual(['Gradient Descent', 'Learning Rate'])
  })

  test('breadcrumb links back to the chapter', async ({ page }) => {
    await visit(page, '/foundations/dot-product')
    const crumbs = page.getByRole('navigation', { name: 'Breadcrumb' })
    await expect(crumbs).toContainText('Dot Product')
    await crumbs.getByRole('link', { name: 'Foundations' }).click()
    await expect(page).toHaveURL('/foundations')
  })

  test('Explain tab is in the URL and hides the controls panel', async ({ page }) => {
    await visit(page, '/foundations/dot-product')
    await expect(page.getByRole('complementary', { name: 'Controls' })).toBeVisible()

    await page.getByRole('tab', { name: 'Explain' }).click()
    await expect(page).toHaveURL('/foundations/dot-product?view=explain')
    await expect(page.getByRole('tab', { name: 'Explain' })).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByRole('complementary', { name: 'Controls' })).toHaveCount(0)
    await expect(page.getByRole('heading', { level: 1, name: 'Dot Product' })).toBeVisible()

    await page.getByRole('tab', { name: 'Visualize' }).click()
    await expect(page).toHaveURL('/foundations/dot-product')
    await expect(page.getByRole('complementary', { name: 'Controls' })).toBeVisible()
  })

  test('Explain view links to the next concept, staying in Explain', async ({ page }) => {
    await visit(page, '/foundations/dot-product?view=explain')
    await page.getByRole('navigation', { name: 'Concept navigation' }).getByRole('link', { name: /Next/ }).click()
    await expect(page).toHaveURL('/foundations/cosine-similarity?view=explain')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Cosine Similarity')
  })

  test('unknown routes return 404', async ({ page }) => {
    const concept = await page.goto('/foundations/not-a-concept')
    expect(concept?.status()).toBe(404)
    const chapter = await page.goto('/not-a-chapter')
    expect(chapter?.status()).toBe(404)
  })
})
