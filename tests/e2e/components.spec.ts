import { expect, test, type Page } from '@playwright/test'
import { readouts, visit } from './helpers'

/** Tests the Phase 2 building blocks in the dev-only playground. */

const inputs = (page: Page) => page.getByRole('complementary', { name: 'Controls' })
const field = (page: Page, name: string) => inputs(page).getByRole('spinbutton', { name })

test.beforeEach(async ({ page }) => {
  await visit(page, '/dev/components')
})

test('starts at the defaults with correct derived values', async ({ page }) => {
  await expect(field(page, 'w first component')).toHaveValue('3')
  await expect(field(page, 'x second component')).toHaveValue('2')
  // w = (3, 1), x = (1, 2): w·x = 5, cos θ = 5 / (√10 · √5) ≈ 0.707
  expect(await readouts(page)).toEqual(['5.000', '0.707', '3.162', '2.236'])
})

test('presets set values and show which preset is active', async ({ page }) => {
  await page.getByRole('button', { name: 'Perpendicular' }).click()
  await expect(page.getByRole('button', { name: 'Perpendicular' })).toHaveAttribute('aria-pressed', 'true')
  expect((await readouts(page))[0]).toBe('0.000')

  await page.getByRole('button', { name: 'Reset' }).click()
  await expect(page.getByRole('button', { name: 'Perpendicular' })).toHaveAttribute('aria-pressed', 'false')
  expect((await readouts(page))[0]).toBe('5.000')
})

test('typing a value commits on Enter and clamps to the range', async ({ page }) => {
  const x1 = field(page, 'x first component')
  await x1.fill('2')
  await x1.press('Enter')
  expect((await readouts(page))[0]).toBe('8.000') // 3·2 + 1·2

  await x1.fill('99')
  await x1.press('Enter')
  await expect(x1).toHaveValue('4') // range is [-4, 4]
})

test('arrow keys step a field', async ({ page }) => {
  const w2 = field(page, 'w second component')
  await w2.press('ArrowUp')
  await expect(w2).toHaveValue('2')
  await w2.press('ArrowDown')
  await w2.press('ArrowDown')
  await expect(w2).toHaveValue('0')
})

test('the zero vector is rejected and the field reverts', async ({ page }) => {
  const w1 = field(page, 'w first component')
  const w2 = field(page, 'w second component')
  await w1.fill('0')
  await w1.press('Enter')
  await w2.fill('0')
  await w2.press('Enter')
  await expect(page.getByRole('alert')).toHaveText('w can’t be the zero vector.')
  await expect(w2).toHaveValue('1')
})

test('dragging a pad handle moves the vector', async ({ page }) => {
  const handle = page.getByRole('slider', { name: /^w = / })
  const box = (await handle.boundingBox())!
  const cx = box.x + box.width / 2
  const cy = box.y + box.height / 2
  await page.mouse.move(cx, cy)
  await page.mouse.down()
  await page.mouse.move(cx - 60, cy - 20, { steps: 6 })
  await page.mouse.up()

  const w1 = Number(await field(page, 'w first component').inputValue())
  const w2 = Number(await field(page, 'w second component').inputValue())
  expect(w1).toBeLessThan(3)
  expect(w2).toBeGreaterThan(1)
  await expect(handle).toHaveAccessibleName(`w = (${w1}, ${w2})`)
})

test('pad handles move with the arrow keys', async ({ page }) => {
  const handle = page.getByRole('slider', { name: /^x = / })
  await handle.focus()
  await page.keyboard.press('ArrowRight')
  await expect(field(page, 'x first component')).toHaveValue('2')
  await page.keyboard.press('ArrowUp')
  await expect(field(page, 'x second component')).toHaveValue('3')
})

test('slider, segmented control and switch update their values', async ({ page }) => {
  const dump = page.locator('.dump')
  const slider = page.getByRole('slider', { name: /Temperature/ })
  await slider.focus()
  await page.keyboard.press('ArrowRight')
  await expect(dump).toContainText('"temperature": 1.05')

  await page.getByRole('radio', { name: 'tanh' }).click()
  await expect(page.getByRole('radio', { name: 'tanh' })).toHaveAttribute('aria-checked', 'true')
  await page.keyboard.press('ArrowRight')
  await expect(page.getByRole('radio', { name: 'ReLU' })).toHaveAttribute('aria-checked', 'true')

  await page.getByRole('switch', { name: 'Show grid' }).click()
  await expect(dump).toContainText('"showGrid": false')
})

test('hovering a diagram element shows the tracking overlay', async ({ page }) => {
  const meta = page.locator('.trk-meta')
  await expect(meta).not.toHaveClass(/show/)
  await page.locator('.stage-demo g').first().hover()
  await expect(meta).toHaveClass(/show/)
  await expect(meta).toContainText('TRK-01')
  await expect(meta).toContainText('(3,1)')
  await page.mouse.move(5, 5)
  await expect(meta).not.toHaveClass(/show/)
})

test('hidden phrases reveal on click and keyboard', async ({ page }) => {
  const phrases = page.getByRole('button', { name: 'Hidden answer. Press to reveal.' })
  await expect(phrases).toHaveCount(2)
  await phrases.first().click()
  await expect(page.getByText('point roughly the same way')).toBeVisible()
  await expect(phrases).toHaveCount(1)
  await phrases.first().focus()
  await page.keyboard.press('Enter')
  await expect(phrases).toHaveCount(0)
})

test('matrix grid highlights rows; the tangent line follows its point', async ({ page }) => {
  await expect(page.locator('[data-el="pg-A-cell-0-2"]')).toHaveText('−0.5')
  await expect(page.locator('[data-el="pg-A-row-0"]')).toHaveCSS('opacity', '1')
  await page.getByRole('radio', { name: 'Row 2' }).click()
  await expect(page.locator('[data-el="pg-A-row-0"]')).toHaveCSS('opacity', '0')
  await expect(page.locator('[data-el="pg-A-row-1"]')).toHaveCSS('opacity', '1')

  await expect(page.locator('[data-el="pg-tan-label"]')).toHaveText('slope 2.0')
  const slider = page.getByRole('slider', { name: /Tangent at x/ })
  await slider.focus()
  await page.keyboard.press('End')
  await expect(page.locator('[data-el="pg-tan-label"]')).toHaveText('slope 4.0')
})

test('chart primitives: axes with ticks, scatter points, a loss curve', async ({ page }) => {
  await expect(page.locator('[data-el="pg-pts-pt-0"]')).toBeAttached()
  await expect(page.locator('[data-el="pg-pts-pt-5"]')).toHaveClass(/hollow/)
  await expect(page.locator('[data-el="pg-axes"] .tick').first()).toHaveText('0')
  await expect(page.locator('[data-el="pg-loss"]')).toHaveAttribute('d', /^M/)
})
