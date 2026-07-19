import { test, expect, type Page } from '@playwright/test'

const attr = (page: Page, selector: string, name: string) =>
  page.locator(selector).first().getAttribute(name)

test.describe('SEO head management', () => {
  test('landing page exposes localized meta, canonical and OG tags', async ({ page }) => {
    await page.goto('/kodini-color-extractor/')

    await expect(page).toHaveTitle(/Kodini Color Extractor/)

    const desc = await attr(page, 'meta[name="description"]', 'content')
    expect(desc && desc.length).toBeGreaterThan(50)

    const canonical = await attr(page, 'link[rel="canonical"]', 'href')
    expect(canonical).toBe('https://kodinitools.github.io/kodini-color-extractor/')

    expect(await attr(page, 'meta[property="og:url"]', 'content')).toBe(
      'https://kodinitools.github.io/kodini-color-extractor/'
    )
    expect(await attr(page, 'meta[property="og:image"]', 'content')).toContain('/og-image.png')
    expect(await attr(page, 'meta[name="twitter:card"]', 'content')).toBe('summary_large_image')
    expect(await attr(page, 'meta[name="robots"]', 'content')).toBe('index, follow')

    // hreflang alternates present
    expect(await page.locator('link[rel="alternate"]').count()).toBeGreaterThanOrEqual(3)
  })

  test('navigating updates canonical and title per route', async ({ page }) => {
    await page.goto('/kodini-color-extractor/')
    await page.goto('/kodini-color-extractor/faq')

    await expect(page).toHaveTitle(/FAQ/)
    expect(await attr(page, 'link[rel="canonical"]', 'href')).toBe(
      'https://kodinitools.github.io/kodini-color-extractor/faq'
    )
  })

  test('FAQ page injects FAQPage JSON-LD structured data', async ({ page }) => {
    await page.goto('/kodini-color-extractor/faq')

    const jsonld = await page.locator('#jsonld-faq').textContent()
    expect(jsonld).toBeTruthy()
    const data = JSON.parse(jsonld!)
    expect(data['@type']).toBe('FAQPage')
    expect(Array.isArray(data.mainEntity)).toBe(true)
    expect(data.mainEntity.length).toBe(8)
    expect(data.mainEntity[0]['@type']).toBe('Question')
    expect(data.mainEntity[0].acceptedAnswer['@type']).toBe('Answer')
  })

  test('the static WebApplication JSON-LD is present', async ({ page }) => {
    await page.goto('/kodini-color-extractor/')
    const scripts = await page.locator('script[type="application/ld+json"]').allTextContents()
    const hasWebApp = scripts.some((s) => s.includes('"WebApplication"'))
    expect(hasWebApp).toBe(true)
  })

  test('internal gallery view is marked noindex', async ({ page }) => {
    await page.goto('/kodini-color-extractor/app/gallery')
    // Router may redirect on handoff data; without it we land on the gallery
    if (page.url().includes('/app/gallery')) {
      expect(await attr(page, 'meta[name="robots"]', 'content')).toBe('noindex, follow')
    }
  })
})
