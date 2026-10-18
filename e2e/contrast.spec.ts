import { test, expect } from '@playwright/test'

test.describe('Contrast check', () => {
  test('the generator shows every pairing of its palette', async ({ page }) => {
    await page.goto('/kodini-color-extractor/generator#p=264653-2a9d8f-e9c46a-f4a261')
    await expect(page.locator('.swatch')).toHaveCount(4)

    await page.getByRole('button', { name: 'Kontrast prüfen' }).click()
    const dialog = page.getByRole('dialog', { name: 'Kontrast-Check (WCAG)' })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByTestId('contrast-cell')).toHaveCount(12)
    await expect(dialog.getByTestId('contrast-suggestion')).toHaveCount(4)
    await expect(dialog.getByTestId('contrast-pair').first()).toContainText('#264653 / #E9C46A')

    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
  })

  test('the extractor checks the extracted colors', async ({ page }) => {
    await page.goto('/kodini-color-extractor/app')
    await page.locator('.sample-thumbnail').first().click()
    await expect(page.locator('.color-primary').first()).toHaveText(/#[0-9a-fA-F]{6}/, {
      timeout: 10000,
    })
    const count = await page.locator('.color-primary').count()

    await page.getByRole('button', { name: 'Kontrast prüfen' }).click()
    const dialog = page.getByRole('dialog', { name: 'Kontrast-Check (WCAG)' })
    await expect(dialog.getByTestId('contrast-suggestion')).toHaveCount(count)
    await dialog.getByRole('button', { name: 'Kontrast-Check schließen' }).click()
    await expect(dialog).toBeHidden()
  })
})
