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
    const point = page.locator('.color-indicator').first()
    // Mouse events only land inside the viewport.
    await point.scrollIntoViewIfNeeded()
    const start = await point.boundingBox()
    const image = await page.locator('.preview-image').boundingBox()
    if (!start || !image) throw new Error('color point or image not visible')
    const pointX = async () => (await point.boundingBox())?.x ?? NaN

    // Drag the point to the top-left of the image. Moves are applied on the
    // next animation frame, so wait for the point to follow before releasing.
    await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2)
    await page.mouse.down()
    await page.mouse.move(image.x + 20, Math.max(image.y, 0) + 20, { steps: 8 })
    await expect.poll(pointX).toBeLessThan(start.x - 50)
    await page.mouse.up()
    const dragged = await pointX()

    await page.keyboard.press('Control+z')
    await expect.poll(pointX).toBeCloseTo(start.x, 0)
    await page.keyboard.press('Control+y')
    await expect.poll(pointX).toBeCloseTo(dragged, 0)
  })
})
