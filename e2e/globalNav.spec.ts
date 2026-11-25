import { test, expect, type Page } from '@playwright/test'

// Etappe 2: kodini-header-stage2.css färbt die globale SSI-Navigation.
// Lokal gibt es kein SSI, deshalb ersetzt der Test den Include durch eine
// minimale Nachbildung mit den Klassen des echten Partials.
const MOCK_NAV = `<nav class="global-nav sticky" style="position:sticky;top:0">
  <div class="global-nav-links is-open"><a href="#">Tools</a></div>
  <button class="global-nav-lang-btn active">DE</button>
  <button class="global-nav-lang-btn">EN</button>
  <button class="global-nav-theme-toggle">T</button>
</nav>`

const TRANSPARENT = 'rgba(0, 0, 0, 0)'

async function withMockNav(page: Page, theme: 'light' | 'dark') {
  await page.addInitScript((t) => localStorage.setItem('theme', t), theme)
  await page.route('**/kodini-color-extractor/**', async (route) => {
    if (route.request().resourceType() !== 'document') return route.continue()
    const response = await route.fetch()
    const html = (await response.text()).replace(
      '<!--#include virtual="/partials/nav.html" -->',
      MOCK_NAV
    )
    await route.fulfill({ response, body: html })
  })
}

const bg = (page: Page, selector: string) =>
  page.locator(selector).evaluate((el) => getComputedStyle(el).backgroundColor)

for (const theme of ['light', 'dark'] as const) {
  test(`globale Navigation trägt die Etappe-2-Farben (${theme})`, async ({ page }) => {
    await withMockNav(page, theme)
    await page.goto('/kodini-color-extractor/')
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme)

    // Flächen setzen sich gegen die Durchsichtig-Regeln für Partials durch.
    expect(await bg(page, 'nav.global-nav')).not.toBe(TRANSPARENT)
    expect(await bg(page, '.global-nav-links.is-open')).not.toBe(TRANSPARENT)
    expect(await bg(page, '.global-nav-theme-toggle')).not.toBe(TRANSPARENT)

    // Aktive Sprache: dunkelgold mit weisser Schrift.
    const active = page.locator('.global-nav-lang-btn.active')
    await expect(active).toHaveCSS('background-color', 'rgb(143, 99, 32)')
    await expect(active).toHaveCSS('color', 'rgb(255, 255, 255)')

    // Die sticky Leiste liegt im Fluss: kein zusätzlicher Abstand über #app.
    await expect(page.locator('#app')).toHaveCSS('padding-top', '0px')
  })
}

test('Werkzeugnavigation markiert die aktuelle Seite', async ({ page }) => {
  await page.goto('/kodini-color-extractor/faq')
  const current = page.locator('.landing-nav [aria-current="page"]')
  await expect(current).toHaveCount(1)
  await expect(current).toHaveAttribute('href', /\/faq$/)
  const shadow = await current.evaluate((el) => getComputedStyle(el).boxShadow)
  expect(shadow).toContain('inset')
})
