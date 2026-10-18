import { test, expect, type Page } from '@playwright/test'

// The HEX values of all generator swatches, in order.
async function generatorHexes(page: Page) {
  const labels = await page.locator('.swatch-hex').allTextContents()
  return labels.map((text) => text.match(/#[0-9a-fA-F]{6}/)?.[0].toUpperCase())
}

test.describe('Palette links', () => {
  test('the extractor hands its palette to the generator, locked', async ({ page }) => {
    await page.goto('/kodini-color-extractor/app')
    // A click before the thumbnail has loaded is ignored by the app.
    const sample = page.locator('.sample-thumbnail').first()
    await expect(sample).toHaveClass(/\bloaded\b/)
    await sample.click()
    await expect(page.locator('.color-primary').first()).toHaveText(/#[0-9a-fA-F]{6}/, {
      timeout: 10000,
    })
    const extracted = (await page.locator('.color-primary').allTextContents()).map((t) =>
      t.trim().toUpperCase()
    )

    await page.getByRole('button', { name: 'Im Generator bearbeiten' }).click()

    await expect(page).toHaveURL(/\/generator$/)
    await expect(page.locator('.swatch')).toHaveCount(extracted.length)
    expect(await generatorHexes(page)).toEqual(extracted)
    await expect(page.locator('.swatch-action.is-active')).toHaveCount(extracted.length)
  })

  test('a shared link opens the generator with those colors', async ({ page }) => {
    await page.goto('/kodini-color-extractor/generator#p=264653-2a9d8f-e9c46a-f4a261')
    await expect(page.locator('.swatch')).toHaveCount(4)
    expect(await generatorHexes(page)).toEqual(['#264653', '#2A9D8F', '#E9C46A', '#F4A261'])
    await expect(page).toHaveURL(/\/generator$/)
  })
})
