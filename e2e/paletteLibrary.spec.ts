import { test, expect, type Page } from '@playwright/test'

async function generatorHexes(page: Page) {
  const labels = await page.locator('.swatch-hex').allTextContents()
  return labels.map((text) => text.match(/#[0-9a-fA-F]{6}/)?.[0].toUpperCase())
}

function openLibrary(page: Page) {
  return page.getByRole('button', { name: 'Meine Paletten' }).click()
}

test.describe('My palettes', () => {
  test('a downloaded palette is listed, kept as favorite across reloads and reopens', async ({
    page,
  }) => {
    const colors = ['#264653', '#2A9D8F', '#E9C46A', '#F4A261']
    await page.goto('/kodini-color-extractor/generator#p=264653-2a9d8f-e9c46a-f4a261')
    await expect(page.locator('.swatch')).toHaveCount(4)

    const download = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Herunterladen' }).click()
    await download

    await openLibrary(page)
    const dialog = page.getByRole('dialog', { name: 'Meine Paletten' })
    const recent = dialog.getByTestId('library-recent')
    await expect(recent.getByTestId('library-entry')).toHaveCount(1)
    await expect(recent.locator('.library-strip')).toHaveAttribute('title', colors.join(', '))

    await recent.getByRole('button', { name: 'Als Favorit markieren' }).click()
    await expect(dialog.getByTestId('library-favorites').getByTestId('library-entry')).toHaveCount(
      1
    )
    await expect(dialog.getByTestId('library-save-current')).toBeDisabled()

    // Saved in the browser: still there after a reload with a new palette.
    await page.reload()
    await expect(page.locator('.swatch')).toHaveCount(5)
    expect(await generatorHexes(page)).not.toEqual(colors)
    await openLibrary(page)
    const favorites = dialog.getByTestId('library-favorites')
    await expect(favorites.getByTestId('library-entry')).toHaveCount(1)

    await favorites.getByRole('button', { name: 'Im Generator öffnen' }).click()
    await expect(dialog).toBeHidden()
    await expect(page.locator('.swatch')).toHaveCount(4)
    expect(await generatorHexes(page)).toEqual(colors)
  })

  test('the extractor records the palette it hands to the generator', async ({ page }) => {
    await page.goto('/kodini-color-extractor/app')
    const sample = page.locator('.sample-thumbnail').first()
    await expect(sample).toHaveClass(/\bloaded\b/)
    await sample.click()
    await expect(page.locator('.color-primary').first()).toHaveText(/#[0-9a-fA-F]{6}/, {
      timeout: 10000,
    })

    await page.getByRole('button', { name: 'Im Generator bearbeiten' }).click()
    await expect(page).toHaveURL(/\/generator$/)

    await openLibrary(page)
    const entry = page.getByTestId('library-recent').getByTestId('library-entry')
    await expect(entry).toHaveCount(1)
    await expect(entry).toContainText('Aus Bild')
  })
})
