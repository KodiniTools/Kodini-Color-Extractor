import { test, expect } from '@playwright/test'

test('sends the image and its palette to the Collage Maker', async ({ page }) => {
  // The Collage Maker is another app on the same site; stand in for it.
  await page.route('**/collagemaker/editor**', (route) =>
    route.fulfill({ contentType: 'text/html', body: '<h1>Collage Maker</h1>' })
  )
  await page.goto('/kodini-color-extractor/app')
  const sample = page.locator('.sample-thumbnail').first()
  await expect(sample).toHaveClass(/\bloaded\b/)
  await sample.click()
  await expect(page.locator('.color-primary').first()).toHaveText(/#[0-9a-fA-F]{6}/, {
    timeout: 10000,
  })

  await page.getByRole('button', { name: 'An Collage Maker senden' }).click()
  await expect(page).toHaveURL(/\/collagemaker\/editor\?handoff=kodinitools$/)

  const payload = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('kodinitools-handoff') ?? 'null')
  )
  expect(payload.source).toBe('color-extractor')
  expect(payload.images).toHaveLength(2)
  for (const image of payload.images) {
    expect(image.dataUrl).toMatch(/^data:image\/jpeg;base64,/)
    expect(image.width).toBeGreaterThan(0)
  }

  // Coming back while the Collage Maker has not picked it up opens the app,
  // not the gallery with our own images.
  await page.goto('/kodini-color-extractor/app')
  await expect(page).toHaveURL(/\/app$/)

  // The palette counts as used.
  await expect(sample).toHaveClass(/\bloaded\b/)
  await sample.click()
  await page.getByRole('button', { name: 'Meine Paletten' }).click()
  await expect(page.getByTestId('library-recent').getByTestId('library-entry')).toHaveCount(1)
})
