import { test, expect, type Page } from '@playwright/test'

// Resolve the <input type="range"> inside the slider group carrying a label.
function sliderByLabel(page: Page, label: string) {
  return page.locator('.slider-group', { hasText: label }).locator('input[type="range"]').first()
}

// Read the first extracted color as [r, g, b] from its displayed HEX value
// (the format selector defaults to "hex", so .color-primary shows "#RRGGBB").
async function firstColorRgb(page: Page): Promise<[number, number, number]> {
  const text = (await page.locator('.color-primary').first().textContent())?.trim() ?? ''
  const m = text.match(/#([0-9a-fA-F]{6})/)
  if (!m) throw new Error(`unexpected color text: "${text}"`)
  const hex = m[1]
  return [
    parseInt(hex.slice(0, 2), 16),
    parseInt(hex.slice(2, 4), 16),
    parseInt(hex.slice(4, 6), 16),
  ]
}

test.describe('Image effect filters', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/kodini-color-extractor/app')
    await page.locator('.sample-thumbnail').first().click()
    await expect(page.locator('.preview-image')).toBeVisible({ timeout: 10000 })
    // Colors are extracted in a worker; wait until the first HEX value is populated
    await expect(page.locator('.color-primary').first()).toHaveText(/#[0-9a-fA-F]{6}/, {
      timeout: 10000,
    })
  })

  test('grayscale slider desaturates the extracted colors', async ({ page }) => {
    const [r0, g0, b0] = await firstColorRgb(page)
    // A colorful sample: the first swatch should not already be neutral gray
    const initialSpread = Math.max(r0, g0, b0) - Math.min(r0, g0, b0)
    expect(initialSpread).toBeGreaterThan(10)

    // Push grayscale to 100%
    const slider = sliderByLabel(page, 'Graustufen')
    await slider.fill('100')

    // Preview reflects the filter immediately
    const style = await page.locator('.preview-image').getAttribute('style')
    expect(style).toContain('grayscale(100%)')

    // The sampled palette (read from the filtered canvas) becomes neutral gray
    await expect
      .poll(async () => {
        const [r, g, b] = await firstColorRgb(page)
        return Math.max(r, g, b) - Math.min(r, g, b)
      })
      .toBeLessThanOrEqual(2)
  })

  test('blur slider feeds into the preview filter chain', async ({ page }) => {
    const slider = sliderByLabel(page, 'Weichzeichnen')
    await slider.fill('5')
    const style = await page.locator('.preview-image').getAttribute('style')
    expect(style).toContain('blur(5px)')
  })

  test('reset-all clears the effect filters', async ({ page }) => {
    await sliderByLabel(page, 'Graustufen').fill('80')
    await sliderByLabel(page, 'Weichzeichnen').fill('4')

    // The "reset all" button in the panel header
    await page.locator('.reset-all-btn').click()

    const style = await page.locator('.preview-image').getAttribute('style')
    expect(style).toContain('grayscale(0%)')
    expect(style).toContain('blur(0px)')
  })

  test('before/after preview reflects the effect filters', async ({ page }) => {
    await sliderByLabel(page, 'Graustufen').fill('76')
    await sliderByLabel(page, 'Weichzeichnen').fill('4')

    // Open the before/after comparison modal (eye icon in the panel header)
    await page.locator('.preview-btn').click()
    const afterImg = page.locator('.after-image img')
    await expect(afterImg).toBeVisible()

    const style = await afterImg.getAttribute('style')
    expect(style).toContain('grayscale(76%)')
    expect(style).toContain('blur(4px)')

    // With adjustments active, the "Vorher = Nachher" hint must be gone
    await expect(page.locator('.no-adjustments-hint')).toHaveCount(0)
  })
})
