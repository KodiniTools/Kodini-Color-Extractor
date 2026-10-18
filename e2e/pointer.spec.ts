import { test, expect, type Page } from '@playwright/test'

// Pen input through the Chrome DevTools Protocol: it arrives as Pointer
// Events with pointerType 'pen', which the old mouse/touch handlers ignored.
async function pen(
  page: Page,
  type: 'mousePressed' | 'mouseMoved' | 'mouseReleased',
  x: number,
  y: number
) {
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Input.dispatchMouseEvent', {
    type,
    x,
    y,
    button: 'left',
    buttons: type === 'mouseReleased' ? 0 : 1,
    clickCount: 1,
    pointerType: 'pen',
  })
  await cdp.detach()
}

test.describe('Pointer input on the image', () => {
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

  test('a pen drags a color point', async ({ page }) => {
    const point = page.locator('.color-indicator').first()
    await point.scrollIntoViewIfNeeded()
    const start = (await point.boundingBox())!
    const image = (await page.locator('.preview-image').boundingBox())!
    const pointX = async () => (await point.boundingBox())?.x ?? NaN

    await pen(page, 'mousePressed', start.x + 16, start.y + 16)
    for (let i = 1; i <= 6; i++) {
      const t = i / 6
      await pen(
        page,
        'mouseMoved',
        start.x + 16 + (image.x + 20 - start.x - 16) * t,
        start.y + 16 + (Math.max(image.y, 0) + 20 - start.y - 16) * t
      )
    }
    await expect.poll(pointX).toBeLessThan(start.x - 50)
    await pen(page, 'mouseReleased', image.x + 20, Math.max(image.y, 0) + 20)

    // The finished drag is one undo step.
    await page.keyboard.press('Control+z')
    await expect.poll(pointX).toBeCloseTo(start.x, 0)
  })

  test('dragging moves the before/after divider and keeps the preview open', async ({ page }) => {
    await page.locator('.edit-panel .preview-btn').click()
    const container = page.locator('.comparison-container')
    await expect(container).toBeVisible()
    const box = (await container.boundingBox())!
    const line = page.locator('.slider-line')
    await expect(line).toHaveAttribute('style', /left: 50%/)

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.down()
    // Moving past the edge keeps the divider in range.
    await page.mouse.move(box.x - 40, box.y + box.height / 2, { steps: 5 })
    await page.mouse.up()
    await expect(line).toHaveAttribute('style', /left: 0%/)
    // Releasing over the backdrop must not close the preview.
    await page.waitForTimeout(300)
    await expect(container).toBeVisible()

    await page.mouse.move(box.x + box.width * 0.75, box.y + box.height / 2)
    await page.mouse.down()
    await page.mouse.up()
    await expect(line).toHaveAttribute('style', /left: 7[45](\.\d+)?%/)
  })
})
