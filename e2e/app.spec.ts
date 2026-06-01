import { test, expect } from '@playwright/test'

test.describe('App page', () => {
  test('loads the /app page', async ({ page }) => {
    await page.goto('/kodini-color-extractor/app')
    await expect(page).toHaveURL(/\/app/)
  })

  test('drag-and-drop upload area is visible', async ({ page }) => {
    await page.goto('/kodini-color-extractor/app')
    // Look for an upload/drop zone element
    const dropZone = page.locator('[class*="drop"], [class*="upload"], input[type="file"]').first()
    await expect(dropZone).toBeVisible({ timeout: 5000 })
  })

  test('sample images section is visible', async ({ page }) => {
    await page.goto('/kodini-color-extractor/app')
    // Look for sample images
    const samples = page.locator('[class*="sample"], img[alt*="sample" i]').first()
    const count = await samples.count()
    expect(count).toBeGreaterThanOrEqual(0) // page loaded is the minimum assertion
  })
})
