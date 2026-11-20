import { expect, test } from '@playwright/test'
import { visit } from './helpers'

test.describe('curriculum drawer (phone)', () => {
  test('starts closed and has no horizontal scroll', async ({ page }) => {
    await visit(page, '/foundations/dot-product')
    await expect(page.getByRole('navigation', { name: 'Curriculum' })).toBeHidden()
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow).toBeLessThanOrEqual(0)
  })

  test('opens, searches, and closes after navigating', async ({ page }) => {
    await visit(page, '/foundations/dot-product')
    await page.getByRole('button', { name: 'Show curriculum' }).click()
    const nav = page.getByRole('navigation', { name: 'Curriculum' })
    await expect(nav).toBeVisible()

    await nav.getByRole('searchbox', { name: 'Search concepts' }).fill('soft')
    await nav.getByRole('link', { name: 'Softmax' }).click()
    await expect(page).toHaveURL('/transformers-llms/softmax')
    await expect(nav).toBeHidden()
  })

  test('closes with Escape and with the backdrop', async ({ page }) => {
    await visit(page, '/')
    const nav = page.getByRole('navigation', { name: 'Curriculum' })

    await page.getByRole('button', { name: 'Show curriculum' }).click()
    await expect(nav).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(nav).toBeHidden()

    await page.getByRole('button', { name: 'Show curriculum' }).click()
    await expect(nav).toBeVisible()
    await page.locator('.backdrop').click({ position: { x: 360, y: 400 } })
    await expect(nav).toBeHidden()
  })
})
