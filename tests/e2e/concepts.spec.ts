import { expect, test, type Page } from '@playwright/test'
import { visit } from './helpers'

/** Phase 4: Softmax and Gradient Descent, plus a smoke test for every ready concept. */

const goToStep = (page: Page, i: number) => page.evaluate((s) => (window as any).__aiviz.goToStep(s), i)
const caption = (page: Page) => page.locator('.caption')

async function open(page: Page, path: string) {
  await visit(page, path)
  await page.locator('svg.scene.ready').waitFor()
}

test.describe('every ready concept', () => {
  for (const path of ['/foundations/dot-product', '/transformers-llms/softmax', '/optimisation/gradient-descent']) {
    test(`${path} plays through every step without errors`, async ({ page }) => {
      const errors: string[] = []
      page.on('pageerror', (e) => errors.push(String(e)))
      page.on('console', (m) => {
        if (m.type() === 'error' || (m.type() === 'warning' && m.text().includes('[player]'))) errors.push(m.text())
      })
      await open(page, path)
      const total = Number((await page.locator('.player .pill').textContent())!.split('/')[1])
      for (let i = 0; i < total; i++) {
        await goToStep(page, i)
        await expect(page.locator('.player .pill')).toHaveText(`${i + 1} / ${total}`)
        await expect(caption(page)).not.toBeEmpty()
      }
      await expect(page.locator('.log-body .line')).toHaveCount(total)
      expect(errors).toEqual([])
    })
  }
})

test.describe('softmax', () => {
  test('worked example: Paris gets 80.4%', async ({ page }) => {
    await open(page, '/transformers-llms/softmax')
    await goToStep(page, 5)
    await expect(caption(page)).toContainText('Paris')
    await expect(page.locator('[data-el="prob-val-0"]')).toHaveText('80.4%')
    await expect(page.locator('[data-el="exp-val-0"]')).toHaveText('54.6')
    await expect(page.locator('[data-el="top-row"]')).toHaveCSS('opacity', '1')
  })

  test('temperature step rescales the logit bars in place', async ({ page }) => {
    await open(page, '/transformers-llms/softmax')
    await page.getByRole('button', { name: 'Creative (T = 2)' }).click()
    await goToStep(page, 0)
    const bar = page.locator('[data-el="scaled-bar-0"]')
    const before = Number(await bar.getAttribute('width'))
    await goToStep(page, 1)
    await expect(caption(page)).toContainText('squeezes')
    await expect(page.locator('[data-el="scaled-val-0"]')).toHaveText('2.00')
    expect(Number(await bar.getAttribute('width'))).toBeCloseTo(before / 2, 1)
  })

  test('presets: low temperature sharpens, tied scores are uniform', async ({ page }) => {
    await open(page, '/transformers-llms/softmax')
    await goToStep(page, 5)
    await page.getByRole('button', { name: 'Confident (T = 0.5)' }).click()
    await expect(page.locator('[data-el="prob-val-0"]')).toHaveText('96.8%')
    await expect(caption(page)).toContainText('almost certain')
    await page.getByRole('button', { name: 'Tied scores' }).click()
    for (let i = 0; i < 4; i++) await expect(page.locator(`[data-el="prob-val-${i}"]`)).toHaveText('25.0%')
  })
})

test.describe('gradient descent', () => {
  test('default run converges to the bowl minimum', async ({ page }) => {
    await open(page, '/optimisation/gradient-descent')
    await goToStep(page, 3)
    await expect(caption(page)).toContainText('= -0.75') // θ₁ worked out
    await goToStep(page, 5)
    await expect(caption(page)).toContainText('bottom of a valley')
    await expect(page.locator('.log-body .line').last()).toContainText('converged')
  })

  test('learning-rate presets tell three different stories', async ({ page }) => {
    await open(page, '/optimisation/gradient-descent')
    await goToStep(page, 5)

    await page.getByRole('button', { name: 'Too small', exact: true }).click()
    await expect(caption(page)).toContainText('progress is slow')

    await page.getByRole('button', { name: 'Too large', exact: true }).click()
    await expect(caption(page)).toContainText('too large')
    await expect(page.locator('[data-el="off-label"]')).toContainText('off the chart')
    await expect(page.locator('[data-el="off-label"]')).toHaveCSS('opacity', '1')

    await page.getByRole('button', { name: 'Wrong valley', exact: true }).click()
    await expect(caption(page)).toContainText('local minimum')
  })

  test('changing the learning rate keeps the step and redraws the path', async ({ page }) => {
    await open(page, '/optimisation/gradient-descent')
    await goToStep(page, 4)
    const slider = page.getByRole('slider', { name: /Learning rate/ })
    await slider.focus()
    for (let i = 0; i < 10; i++) await page.keyboard.press('ArrowLeft') // 0.50 → 0.40
    await expect(page.locator('.player .pill')).toHaveText('5 / 6')
    await expect(page.locator('.readouts dd').first()).toHaveText('0.40')
    await expect(page.locator('[data-el="pt-5"]')).toHaveCSS('opacity', '1')
  })
})
