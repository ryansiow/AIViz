import type { Page } from '@playwright/test'

/** Navigate and wait until Vue has hydrated (see app/plugins/hydrated.client.ts). */
export async function visit(page: Page, path: string) {
  const response = await page.goto(path)
  await page.locator('html[data-hydrated="true"]').waitFor({ state: 'attached' })
  return response
}

/** The Values card numbers, in display order. */
export async function readouts(page: Page): Promise<string[]> {
  return page.locator('.readouts dd').allTextContents()
}
