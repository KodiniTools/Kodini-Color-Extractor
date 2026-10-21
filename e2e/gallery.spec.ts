import { test, expect } from '@playwright/test'
import { fileURLToPath } from 'node:url'

const sample = (n: number) =>
  fileURLToPath(new URL(`../public/samples/sample-${n}.jpg`, import.meta.url))

test('the gallery tab collects uploaded images and opens one in the extractor', async ({
  page,
}) => {
  await page.goto('/kodini-color-extractor/app')
  await page.getByRole('link', { name: 'Galerie' }).click()
  await expect(page).toHaveURL(/\/app\/gallery$/)
  await expect(page.getByText('Noch keine Bilder in der Galerie')).toBeVisible()

  await page
    .locator('[data-testid="gallery-upload"] input[type="file"]')
    .setInputFiles([sample(1), sample(2)])
  await expect(page.locator('.gallery-item')).toHaveCount(2)
  await expect(page.locator('[data-testid="gallery-count"]')).toHaveText('2')

  await page.locator('.gallery-select').first().click()
  await expect(page).toHaveURL(/\/app$/)
  await expect(page.locator('.color-primary').first()).toHaveText(/#[0-9a-fA-F]{6}/, {
    timeout: 10000,
  })

  // The gallery keeps its images while switching tabs.
  await page.getByRole('link', { name: /Galerie/ }).click()
  await expect(page.locator('.gallery-item')).toHaveCount(2)
})

test('a handoff from the Bildergalerie lands in the gallery tab', async ({ page }) => {
  await page.goto('/kodini-color-extractor/')
  await page.evaluate(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 4
    canvas.height = 3
    const dataUrl = canvas.toDataURL('image/png')
    localStorage.setItem(
      'kodinitools-handoff',
      JSON.stringify({
        source: 'bildergalerie',
        timestamp: Date.now(),
        images: [{ name: 'Bergsee', dataUrl, width: 4, height: 3 }],
      })
    )
  })
  await page.goto('/kodini-color-extractor/app/gallery?handoff=kodinitools')
  await expect(page.getByText('1 Bild empfangen')).toBeVisible()
  await expect(page.getByText('von Bildergalerie')).toBeVisible()
  await page.getByRole('button', { name: 'Übernehmen' }).click()
  await expect(page.locator('.gallery-item')).toHaveCount(1)
  await expect(page.locator('.gallery-item-name')).toHaveText('Bergsee')
})
