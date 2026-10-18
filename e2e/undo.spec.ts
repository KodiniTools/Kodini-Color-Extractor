import { test, expect, type Page } from '@playwright/test'

function sliderByLabel(page: Page, label: string) {
  return page.locator('.slider-group', { hasText: label }).locator('input[type="range"]').first()
}

test.describe('Extractor undo/redo', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/kodini-color-extractor/app')
    // A click before the thumbnail has loaded is ignored by the app.
    const sample = page.locator('.sample-thumbnail').first()
    await expect(sample).toHaveClass(/\bloaded\b/)
    await sample.click()
    await expect(page.locator('.color-primary').first()).toHaveText(/#[0-9a-fA-F]{6}/, {
      timeout: 10000,
    })
  })

  test('buttons undo and redo an image adjustment', async ({ page }) => {
    const undo = page.getByTestId('extractor-undo')
    const redo = page.getByTestId('extractor-redo')
    await expect(undo).toBeDisabled()
    await expect(redo).toBeDisabled()

    const slider = sliderByLabel(page, 'Graustufen')
    await slider.fill('100')
    await expect(page.locator('.preview-image')).toHaveAttribute('style', /grayscale\(100%\)/)

    await undo.click()
    await expect(slider).toHaveValue('0')
    await expect(page.locator('.preview-image')).toHaveAttribute('style', /grayscale\(0%\)/)
    await expect(redo).toBeEnabled()

    await redo.click()
    await expect(slider).toHaveValue('100')
    await expect(redo).toBeDisabled()
  })

  test('Ctrl+Z puts a dragged color point back', async ({ page }) => {
    const first = page.locator('.color-primary').first()
    const before = await first.textContent()
    const point = page.locator('.color-indicator').first()
    const box = await point.boundingBox()
    if (!box) throw new Error('color point not visible')
    const image = await page.locator('.preview-image').boundingBox()
    if (!image) throw new Error('image not visible')

    // Drag the point to the far corner of the image, a different color.
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.down()
    const targets = [
      [image.x + 5, image.y + 5],
      [image.x + image.width - 5, image.y + image.height - 5],
    ]
    let moved = false
    for (const [x, y] of targets) {
      await page.mouse.move(x, y, { steps: 8 })
      if ((await first.textContent()) !== before) {
        moved = true
        break
      }
    }
    await page.mouse.up()
    expect(moved).toBe(true)
    const after = await first.textContent()

    await page.keyboard.press('Control+z')
    await expect(first).toHaveText(before ?? '')
    await page.keyboard.press('Control+y')
    await expect(first).toHaveText(after ?? '')
  })
})
