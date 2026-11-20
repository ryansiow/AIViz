import { expect, test } from '@playwright/test'
import { visit } from './helpers'

const bg = (page: import('@playwright/test').Page) =>
  page.evaluate(() => getComputedStyle(document.body).backgroundColor)

const LIGHT_BG = 'rgb(255, 255, 255)'
const DARK_BG = 'rgb(13, 15, 18)'

test.describe('theme', () => {
  test('follows the OS setting until the user picks one', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    await visit(page, '/')
    expect(await bg(page)).toBe(DARK_BG)
    await expect(page.locator('html')).not.toHaveAttribute('data-theme', /.+/)

    await page.emulateMedia({ colorScheme: 'light' })
    expect(await bg(page)).toBe(LIGHT_BG)
  })

  test('toggle switches theme and is remembered across reloads', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    await visit(page, '/')
    expect(await bg(page)).toBe(LIGHT_BG)

    await page.getByRole('button', { name: 'Toggle dark mode' }).click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    expect(await bg(page)).toBe(DARK_BG)

    await visit(page, '/foundations')
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    expect(await bg(page)).toBe(DARK_BG)
  })

  test('an explicit choice overrides the OS setting', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    await visit(page, '/')
    await page.getByRole('button', { name: 'Toggle dark mode' }).click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
    expect(await bg(page)).toBe(LIGHT_BG)
  })
})
