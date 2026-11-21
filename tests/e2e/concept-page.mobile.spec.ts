import { expect, test } from '@playwright/test'
import { visit } from './helpers'

/** A live concept page at phone width. */
for (const path of ['/foundations/dot-product', '/transformers-llms/softmax', '/optimisation/gradient-descent', '/transformers-llms/temperature', '/optimisation/learning-rate']) {
  test(`${path} works at phone width`, async ({ page }) => {
    await visit(page, path)
    await page.locator('svg.scene.ready').waitFor()

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow).toBeLessThanOrEqual(0)

    // The stage has real height and the diagram fits inside it.
    const stage = (await page.locator('.stage-box').boundingBox())!
    expect(stage.height).toBeGreaterThan(250)
    expect(stage.width).toBeLessThanOrEqual(page.viewportSize()!.width)

    await page.getByRole('button', { name: 'Next step' }).click()
    await expect(page.locator('.player .pill')).toHaveText(/^2 \//)

    // Inputs are reachable below the stage.
    await expect(page.getByRole('complementary', { name: 'Controls' })).toBeAttached()
  })
}

test('an explainer reads well at phone width', async ({ page }) => {
  await visit(page, '/transformers-llms/softmax?view=explain')
  await expect(page.locator('.explain .prose h2').first()).toBeVisible()
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow).toBeLessThanOrEqual(0)
  // Wide formulas and tables scroll inside their own box, never the page.
  for (const box of await page.locator('.explain .katex-display, .explain table').all()) {
    const b = (await box.boundingBox())!
    expect(b.x + b.width).toBeLessThanOrEqual(page.viewportSize()!.width)
  }
})

test('the "In draft" chip stays visible at phone width', async ({ page }) => {
  await visit(page, '/foundations/dot-product')
  await expect(page.locator('.draft-chip')).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('link')).toBeHidden()
})
