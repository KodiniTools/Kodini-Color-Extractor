import { test, expect, type CDPSession, type Page } from '@playwright/test'

const sessions = new WeakMap<Page, CDPSession>()

// Send real touch input through the Chrome DevTools Protocol. Unlike a
// synthetic TouchEvent this goes through the browser's input pipeline, so it
// produces Pointer Events and respects touch-action, as on a phone.
async function dispatchTouch(
  page: Page,
  selector: string,
  type: 'touchStart' | 'touchMove' | 'touchEnd',
  points: Array<{ x: number; y: number }>
) {
  const box = await page.locator(selector).boundingBox()
  if (!box) throw new Error(`element not visible: ${selector}`)
  // One session per page: the browser tracks the active touches per session.
  let cdp = sessions.get(page)
  if (!cdp) {
    cdp = await page.context().newCDPSession(page)
    sessions.set(page, cdp)
  }
  await cdp.send('Input.dispatchTouchEvent', {
    type,
    touchPoints: points.map((p, id) => ({ x: box.x + p.x, y: box.y + p.y, id })),
  })
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
  test.use({ hasTouch: true })

  test.beforeEach(async ({ page }) => {
    await page.goto('/kodini-color-extractor/app')
    // Load the first available sample image
    const firstSample = page.locator('.sample-thumbnail').first()
    // A click before the thumbnail has loaded is ignored by the app.
    await expect(firstSample).toHaveClass(/\bloaded\b/)
    await firstSample.click()
    await expect(page.locator('.preview-image')).toBeVisible({ timeout: 10000 })
  })

  test('two-finger pinch gesture zooms the image in', async ({ page }) => {
    expect(await readScale(page)).toBeCloseTo(1, 1)

    const box = (await page.locator('.image-container').boundingBox())!
    const cx = box.width / 2
    const cy = box.height / 2

    // Fingers start close together, then move apart -> zoom in
    await dispatchTouch(page, '.image-container', 'touchStart', [
      { x: cx - 20, y: cy },
      { x: cx + 20, y: cy },
    ])
    await dispatchTouch(page, '.image-container', 'touchMove', [
      { x: cx - 120, y: cy },
      { x: cx + 120, y: cy },
    ])
    await dispatchTouch(page, '.image-container', 'touchEnd', [])

    // Distance grew ~6x, so zoom should have increased noticeably above 100%
    await expect.poll(() => readScale(page)).toBeGreaterThan(1.2)
  })

  test('single-finger drag pans the zoomed image', async ({ page }) => {
    const box = (await page.locator('.image-container').boundingBox())!
    const cx = box.width / 2
    const cy = box.height / 2

    // First zoom in via pinch so panning becomes possible
    await dispatchTouch(page, '.image-container', 'touchStart', [
      { x: cx - 20, y: cy },
      { x: cx + 20, y: cy },
    ])
    await dispatchTouch(page, '.image-container', 'touchMove', [
      { x: cx - 200, y: cy },
      { x: cx + 200, y: cy },
    ])
    await dispatchTouch(page, '.image-container', 'touchEnd', [])

    await expect.poll(() => readScale(page)).toBeGreaterThan(1.5)
    const before = await readTranslate(page)

    // Now drag a single finger to pan
    await dispatchTouch(page, '.image-container', 'touchStart', [{ x: cx, y: cy }])
    await dispatchTouch(page, '.image-container', 'touchMove', [{ x: cx - 80, y: cy - 60 }])
    await dispatchTouch(page, '.image-container', 'touchEnd', [])

    // Pan offset must have changed on at least one axis
    await expect
      .poll(async () => {
        const after = await readTranslate(page)
        return after.x !== before.x || after.y !== before.y
      })
      .toBe(true)
  })

  test('a finger drags a color point', async ({ page }) => {
    const point = page.locator('.color-indicator').first()
    await point.scrollIntoViewIfNeeded()
    const start = (await point.boundingBox())!
    const box = (await page.locator('.image-container').boundingBox())!
    const from = { x: start.x - box.x + 16, y: start.y - box.y + 16 }

    await dispatchTouch(page, '.image-container', 'touchStart', [from])
    await dispatchTouch(page, '.image-container', 'touchMove', [{ x: 30, y: 30 }])
    await expect.poll(async () => (await point.boundingBox())?.x ?? NaN).toBeLessThan(start.x - 50)
    await dispatchTouch(page, '.image-container', 'touchEnd', [])
    await expect(page.locator('.pixel-zoom')).toBeHidden()
  })
})
