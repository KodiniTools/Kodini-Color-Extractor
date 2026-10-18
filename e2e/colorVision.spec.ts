import { test, expect } from '@playwright/test'

test.describe('Color blindness preview', () => {
  test('the generator flags red and green for deuteranopia', async ({ page }) => {
    await page.goto('/kodini-color-extractor/generator#p=d62728-2ca02c-1f77b4')
    await expect(page.locator('.swatch')).toHaveCount(3)

    await page.getByRole('button', { name: 'Farbsehschwäche simulieren' }).click()
    const dialog = page.getByRole('dialog', { name: 'Vorschau bei Farbsehschwäche' })
    await expect(dialog).toBeVisible()
    const deutan = dialog.getByTestId('vision-deuteranopia')
    await expect(deutan.getByTestId('vision-pair')).toHaveCount(1)
    await expect(deutan).toContainText('#D62728 / #2CA02C')

    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
  })

  test('the extractor opens the preview for the extracted colors', async ({ page }) => {
    await page.goto('/kodini-color-extractor/app')
    // A click before the thumbnail has loaded is ignored by the app.
    const sample = page.locator('.sample-thumbnail').first()
    await expect(sample).toHaveClass(/\bloaded\b/)
    await sample.click()
    await expect(page.locator('.color-primary').first()).toHaveText(/#[0-9a-fA-F]{6}/, {
      timeout: 10000,
    })

    await page.getByRole('button', { name: 'Farbsehschwäche simulieren' }).click()
    const dialog = page.getByRole('dialog', { name: 'Vorschau bei Farbsehschwäche' })
    await expect(dialog.getByTestId('vision-tritanopia')).toBeVisible()
    await dialog.getByRole('button', { name: 'Vorschau bei Farbsehschwäche schließen' }).click()
    await expect(dialog).toBeHidden()
  })
})
