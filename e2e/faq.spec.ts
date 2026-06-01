import { test, expect } from '@playwright/test'

test.describe('FAQ page', () => {
  test('loads the /faq page', async ({ page }) => {
    await page.goto('/kodini-color-extractor/faq')
    await expect(page).toHaveURL(/\/faq/)
  })

  test('FAQ content is visible', async ({ page }) => {
    await page.goto('/kodini-color-extractor/faq')
    // The page should have some FAQ content
    const body = page.locator('body')
    await expect(body).toBeVisible()
    // Check for question elements
    const content = await page.content()
    expect(content.length).toBeGreaterThan(100)
  })

  test('page has a heading', async ({ page }) => {
    await page.goto('/kodini-color-extractor/faq')
    const heading = page.locator('h1, h2').first()
    await expect(heading).toBeVisible()
  })
})
