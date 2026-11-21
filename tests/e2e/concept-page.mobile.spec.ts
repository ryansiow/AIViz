import { expect, test } from '@playwright/test'
import { visit } from './helpers'

/** A live concept page at phone width. */
for (const path of ['/foundations/dot-product', '/transformers-llms/softmax', '/optimisation/gradient-descent']) {
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
