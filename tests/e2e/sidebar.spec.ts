import { expect, test } from '@playwright/test'
import { visit } from './helpers'

test.describe('curriculum sidebar (desktop)', () => {
  test('opens the current chapter and marks the current concept', async ({ page }) => {
    await visit(page, '/optimisation/learning-rate')
    const nav = page.getByRole('navigation', { name: 'Curriculum' })
    await expect(nav.getByRole('link', { name: 'Learning Rate' })).toHaveAttribute('aria-current', 'page')
    await expect(nav.getByRole('button', { name: 'Optimisation' })).toHaveAttribute('aria-expanded', 'true')
    await expect(nav.getByRole('button', { name: 'Foundations' })).toHaveAttribute('aria-expanded', 'false')
  })

  test('chapters collapse and expand', async ({ page }) => {
    await visit(page, '/foundations/vectors')
    const nav = page.getByRole('navigation', { name: 'Curriculum' })
    const head = nav.getByRole('button', { name: 'Foundations' })
    await head.click()
    await expect(head).toHaveAttribute('aria-expanded', 'false')
    await expect(nav.getByRole('link', { name: 'Dot Product' })).toBeHidden()
    await head.click()
    await expect(nav.getByRole('link', { name: 'Dot Product' })).toBeVisible()
  })

  test('search filters concepts across chapters', async ({ page }) => {
    await visit(page, '/')
    const nav = page.getByRole('navigation', { name: 'Curriculum' })
    await nav.getByRole('searchbox', { name: 'Search concepts' }).fill('gradient')
    // Visible labels (link names may also carry "(explainer in draft)" for screen readers).
    await expect(nav.locator('.concept .label')).toHaveText([
      'Vanishing & Exploding Gradients',
      'Gradient Descent',
      'Stochastic Gradient Descent',
    ])
    await nav.getByRole('searchbox').fill('zzz')
    await expect(nav).toContainText('No concepts match')
  })

  test('hiding the sidebar is remembered', async ({ page }) => {
    await visit(page, '/')
    const nav = page.getByRole('navigation', { name: 'Curriculum' })
    await expect(nav).toBeVisible()
    await page.getByRole('button', { name: 'Hide curriculum' }).click()
    await expect(nav).toBeHidden()
    await visit(page, '/foundations')
    await expect(page.getByRole('navigation', { name: 'Curriculum' })).toBeHidden()
    await page.getByRole('button', { name: 'Show curriculum' }).click()
    await expect(page.getByRole('navigation', { name: 'Curriculum' })).toBeVisible()
  })
})
