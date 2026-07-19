import { test, expect, type Page } from '@playwright/test'

// Dispatch a real multi-touch TouchEvent on an element so we can exercise
// the touch pan / pinch-zoom handlers in useCanvasPan.js.
async function dispatchTouch(
  page: Page,
  selector: string,
  type: 'touchstart' | 'touchmove' | 'touchend',
  points: Array<{ x: number; y: number }>
) {
  await page.evaluate(
    ({ selector, type, points }) => {
      const el = document.querySelector(selector) as HTMLElement
      if (!el) throw new Error(`element not found: ${selector}`)
      const rect = el.getBoundingClientRect()
      const touches = points.map(
        (p, i) =>
          new Touch({
            identifier: i,
            target: el,
            clientX: rect.left + p.x,
            clientY: rect.top + p.y,
          })
      )
      const event = new TouchEvent(type, {
        bubbles: true,
        cancelable: true,
        touches: type === 'touchend' ? [] : touches,
        targetTouches: type === 'touchend' ? [] : touches,
        changedTouches: touches,
      })
      el.dispatchEvent(event)
    },
    { selector, type, points }
  )
}

// Read the numeric scale() factor from the preview image's inline transform.
async function readScale(page: Page): Promise<number> {
  const style = await page.locator('.preview-image').getAttribute('style')
  const match = style?.match(/scale\(([-\d.]+)\)/)
  return match ? parseFloat(match[1]) : 1
}

// Read the translate() offsets from the preview image's inline transform.
async function readTranslate(page: Page): Promise<{ x: number; y: number }> {
  const style = await page.locator('.preview-image').getAttribute('style')
  const match = style?.match(/translate\(([-\d.]+)px,\s*([-\d.]+)px\)/)
  return match ? { x: parseFloat(match[1]), y: parseFloat(match[2]) } : { x: 0, y: 0 }
}

test.describe('Touch gestures on the image canvas', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/kodini-color-extractor/app')
    // Load the first available sample image
    const firstSample = page.locator('.sample-thumbnail').first()
    await firstSample.click()
    await expect(page.locator('.preview-image')).toBeVisible({ timeout: 10000 })
  })

  test('two-finger pinch gesture zooms the image in', async ({ page }) => {
    expect(await readScale(page)).toBeCloseTo(1, 1)

    const box = (await page.locator('.image-container').boundingBox())!
    const cx = box.width / 2
    const cy = box.height / 2

    // Fingers start close together, then move apart -> zoom in
    await dispatchTouch(page, '.image-container', 'touchstart', [
      { x: cx - 20, y: cy },
      { x: cx + 20, y: cy },
    ])
    await dispatchTouch(page, '.image-container', 'touchmove', [
      { x: cx - 120, y: cy },
      { x: cx + 120, y: cy },
    ])
    await dispatchTouch(page, '.image-container', 'touchend', [])

    // Distance grew ~6x, so zoom should have increased noticeably above 100%
    expect(await readScale(page)).toBeGreaterThan(1.2)
  })

  test('single-finger drag pans the zoomed image', async ({ page }) => {
    const box = (await page.locator('.image-container').boundingBox())!
    const cx = box.width / 2
    const cy = box.height / 2

    // First zoom in via pinch so panning becomes possible
    await dispatchTouch(page, '.image-container', 'touchstart', [
      { x: cx - 20, y: cy },
      { x: cx + 20, y: cy },
    ])
    await dispatchTouch(page, '.image-container', 'touchmove', [
      { x: cx - 200, y: cy },
      { x: cx + 200, y: cy },
    ])
    await dispatchTouch(page, '.image-container', 'touchend', [])

    expect(await readScale(page)).toBeGreaterThan(1.5)
    const before = await readTranslate(page)

    // Now drag a single finger to pan
    await dispatchTouch(page, '.image-container', 'touchstart', [{ x: cx, y: cy }])
    await dispatchTouch(page, '.image-container', 'touchmove', [{ x: cx - 80, y: cy - 60 }])
    await dispatchTouch(page, '.image-container', 'touchend', [])

    const after = await readTranslate(page)
    // Pan offset must have changed on at least one axis
    expect(after.x !== before.x || after.y !== before.y).toBeTruthy()
  })
})
