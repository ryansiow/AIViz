import { expect, test, type Page } from '@playwright/test'
import { readouts, visit } from './helpers'

/** Phase 3: the animation engine, driven through the Dot Product concept. */

type Hook = { seek(p: number): void; goToStep(i: number): void; progress(): number; step(): number; playing(): boolean }
const hook = <T>(page: Page, fn: (h: Hook) => T) =>
  page.evaluate(`(${fn.toString()})(window.__aiviz)`) as Promise<T>

const pill = (page: Page) => page.locator('.player .pill')
const playBtn = (page: Page) => page.getByRole('button', { name: 'Play', exact: true })
const pauseBtn = (page: Page) => page.getByRole('button', { name: 'Pause', exact: true })
const caption = (page: Page) => page.locator('.caption')
const logLines = (page: Page) => page.locator('.log-body .line')
const stepOf = (page: Page) => hook(page, (h) => h.step())

async function open(page: Page) {
  await visit(page, '/foundations/dot-product')
  await page.locator('svg.scene.ready').waitFor()
}

test('starts on step 1 with the plane drawn', async ({ page }) => {
  await open(page)
  await expect(pill(page)).toHaveText('1 / 6')
  await expect(caption(page)).toContainText('A 2D plane')
  await expect(logLines(page)).toHaveCount(1)
  await expect(page.locator('[data-el="grid"]')).toHaveCSS('opacity', '1')
  await expect(page.locator('[data-el="w-label"]')).toHaveCSS('opacity', '0')
})

test('Next plays one step and stops at its end', async ({ page }) => {
  await open(page)
  await page.getByRole('button', { name: 'Next step' }).click()
  await expect(pill(page)).toHaveText('2 / 6')
  await expect(playBtn(page)).toBeVisible() // stopped again
  await expect(page.locator('[data-el="w-label"]')).toHaveCSS('opacity', '1')
  await expect(page.locator('[data-el="x-label"]')).toHaveCSS('opacity', '0')
  await expect(logLines(page)).toHaveCount(2)
  await expect(logLines(page).last()).toContainText('w = (3, 1)')
})

test('Previous jumps back to the finished previous step', async ({ page }) => {
  await open(page)
  await hook(page, (h) => h.goToStep(3))
  await expect(pill(page)).toHaveText('4 / 6')
  await page.getByRole('button', { name: 'Previous step' }).click()
  await expect(pill(page)).toHaveText('3 / 6')
  await expect(page.locator('[data-el="x-label"]')).toHaveCSS('opacity', '1')
  await expect(page.locator('[data-el="angle-label"]')).toHaveCSS('opacity', '0')
})

test('Play runs to the end, then Play restarts from the beginning', async ({ page }) => {
  await open(page)
  await hook(page, (h) => h.seek(0.9))
  await playBtn(page).click()
  await expect(pauseBtn(page)).toBeVisible()
  await expect(pill(page)).toHaveText('6 / 6')
  await expect(playBtn(page)).toBeVisible({ timeout: 5000 })
  expect(await hook(page, (h) => h.progress())).toBe(1)

  await playBtn(page).click()
  await expect.poll(() => hook(page, (h) => h.progress())).toBeLessThan(0.5)
  await pauseBtn(page).click()
})

test('seeking and step markers move the timeline', async ({ page }) => {
  await open(page)
  await hook(page, (h) => h.seek(0.5))
  expect(await stepOf(page)).toBe(3) // angle step
  await expect(caption(page)).toContainText('45.0')

  await page.getByRole('button', { name: /Go to step 5/ }).click()
  await expect(pill(page)).toHaveText('5 / 6')
  await expect(page.locator('[data-el="proj-label"]')).toHaveCSS('opacity', '1')
})

test('changing inputs rebuilds the scene and keeps the current step', async ({ page }) => {
  await open(page)
  await hook(page, (h) => h.goToStep(5))
  await expect(caption(page)).toContainText('positive')

  await page.getByRole('button', { name: 'Opposite' }).click()
  await expect(pill(page)).toHaveText('6 / 6')
  await expect(caption(page)).toContainText('negative')
  await expect(page.locator('[data-el="result-value"]')).toHaveText('= −10')
  await expect(page.locator('[data-el="x-label"]')).toContainText('(−3, −1)')
  await expect(page.locator('[data-el="result-value"]')).toHaveCSS('opacity', '1')
  await expect(logLines(page).last()).toContainText('= -10')
  expect((await readouts(page))[0]).toBe('-10.000')
})

test('dragging a vector on the pad moves it in the scene', async ({ page }) => {
  await open(page)
  await hook(page, (h) => h.goToStep(2))
  const handle = page.getByRole('slider', { name: /^x = / })
  await handle.focus()
  await page.keyboard.press('ArrowLeft')
  await page.keyboard.press('ArrowLeft')
  await expect(page.locator('[data-el="x-label"]')).toContainText('(−1, 2)')
  expect(await stepOf(page)).toBe(2)
})

test('keyboard: Space plays and pauses, arrows step', async ({ page }) => {
  await open(page)
  await page.locator('.stage-box').click({ position: { x: 5, y: 5 } })
  await page.keyboard.press('ArrowRight')
  await expect(pill(page)).toHaveText('2 / 6')
  // → plays step 2's animation; wait for it to stop before testing Space.
  await expect.poll(() => hook(page, (h) => h.playing())).toBe(false)
  await page.keyboard.press('Space')
  await expect.poll(() => hook(page, (h) => h.playing())).toBe(true)
  await page.keyboard.press('Space')
  await expect.poll(() => hook(page, (h) => h.playing())).toBe(false)
  await page.keyboard.press('ArrowLeft')
  expect(await stepOf(page)).toBeLessThanOrEqual(1)
})

test('hover tracking only works on elements already drawn', async ({ page }) => {
  await open(page)
  const meta = page.locator('.trk-meta')
  const wHit = page.locator('[data-el="w-hit"]')
  // Near w's tip: clear of the projection, which overlaps w's first half.
  const nearTip = async () => {
    const b = (await wHit.boundingBox())!
    return { x: b.x + b.width * 0.9, y: b.y + b.height * 0.1 }
  }

  // Step 1: w (and the projection under it) are not drawn, so nothing tracks.
  let p = await nearTip()
  await page.mouse.move(p.x, p.y)
  await page.waitForTimeout(200)
  await expect(meta).not.toHaveClass(/show/)
  const center = (await wHit.boundingBox())!
  await page.mouse.move(center.x + center.width / 2, center.y + center.height / 2)
  await page.waitForTimeout(200)
  await expect(meta).not.toHaveClass(/show/)

  await hook(page, (h) => h.goToStep(5))
  await page.mouse.move(5, 5)
  p = await nearTip()
  await page.mouse.move(p.x, p.y)
  await expect(meta).toHaveClass(/show/)
  await expect(meta).toContainText('TRK-01')
  await expect(meta).toContainText('3.162')
})

test('switching to Explain and back keeps the step', async ({ page }) => {
  await open(page)
  await hook(page, (h) => h.goToStep(3))
  await page.getByRole('tab', { name: 'Explain' }).click()
  await page.getByRole('tab', { name: 'Visualize' }).click()
  await expect(pill(page)).toHaveText('4 / 6')
  await expect(page.locator('[data-el="angle-label"]')).toHaveCSS('opacity', '1')
})

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })

  test('Next jumps straight to the finished step without animating', async ({ page }) => {
    await open(page)
    await page.getByRole('button', { name: 'Next step' }).click()
    // No tween: the finished state is there on the very next frame.
    expect(await stepOf(page)).toBe(1)
    expect(await hook(page, (h) => h.playing())).toBe(false)
    await expect(page.locator('[data-el="w-label"]')).toHaveCSS('opacity', '1')
  })
})

test('concepts without a visualisation keep the placeholder and a disabled player', async ({ page }) => {
  await visit(page, '/neural-networks/perceptron')
  await expect(page.getByText('Visualization coming soon')).toBeVisible()
  await expect(playBtn(page)).toBeDisabled()
})
