// Central SEO configuration and DOM helpers.
//
// The app is a client-rendered Vue SPA served under the kodinitools.com custom
// domain at the /kodini-color-extractor/ base path. index.html ships sensible
// static defaults (Open Graph, Twitter, JSON-LD) for crawlers and social
// scrapers; useSeo.js then keeps the <head> in sync with the active route and
// UI language at runtime.

// Absolute canonical origin + base path (no trailing slash).
export const SITE_URL = 'https://kodinitools.com/kodini-color-extractor'

// Absolute URL of the social sharing image (1200x630).
export const OG_IMAGE = `${SITE_URL}/og-image.png`

export const SITE_NAME = 'Kodini Color Extractor'

// Map an OG/HTML locale from the app's short language code.
export function ogLocale(lang) {
  return lang === 'de' ? 'de_DE' : 'en_US'
}

// Build the absolute canonical URL for a router path ('/', '/app', '/faq', ...).
export function canonicalUrl(path) {
  if (!path || path === '/') return `${SITE_URL}/`
  return SITE_URL + path
}

// Per-route SEO metadata. Titles/descriptions are i18n keys resolved via t().
// `robots` follows the values indexable crawlers expect; internal, state-driven
// views (gallery/handoff) are excluded from the index.
const ROUTE_SEO = {
  landing: { titleKey: 'metaTitleHome', descKey: 'metaDescHome', robots: 'index, follow' },
  app: { titleKey: 'metaTitleApp', descKey: 'metaDescApp', robots: 'index, follow' },
  gallery: { titleKey: 'metaTitleApp', descKey: 'metaDescApp', robots: 'noindex, follow' },
  faq: { titleKey: 'metaTitleFaq', descKey: 'metaDescFaq', robots: 'index, follow' },
}

// Resolve the localized SEO fields for a route name.
export function routeSeo(routeName, t) {
  const cfg = ROUTE_SEO[routeName] || ROUTE_SEO.landing
  return {
    title: t(cfg.titleKey),
    description: t(cfg.descKey),
    robots: cfg.robots,
  }
}

// Create or update a <meta> tag identified by its name/property attribute.
export function upsertMeta(attr, key, content) {
  if (typeof document === 'undefined') return
  let el = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

// Create or update a <link rel="..."> tag (canonical, alternate, ...).
// `hreflang` lets multiple alternate links coexist under the same rel.
export function upsertLink(rel, href, hreflang) {
  if (typeof document === 'undefined') return
  const selector = hreflang
    ? `link[rel="${rel}"][hreflang="${hreflang}"]`
    : `link[rel="${rel}"]:not([hreflang])`
  let el = document.head.querySelector(selector)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    if (hreflang) el.setAttribute('hreflang', hreflang)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

// Inject or replace a JSON-LD <script> block, tagged so it can be updated
// or removed on later navigations.
export function setJsonLd(id, data) {
  if (typeof document === 'undefined') return
  const domId = `jsonld-${id}`
  let el = document.getElementById(domId)
  if (!el) {
    el = document.createElement('script')
    el.type = 'application/ld+json'
    el.id = domId
    document.head.appendChild(el)
  }
  el.textContent = JSON.stringify(data)
}

// Remove a previously injected JSON-LD block (e.g. when leaving the FAQ page).
export function removeJsonLd(id) {
  if (typeof document === 'undefined') return
  const el = document.getElementById(`jsonld-${id}`)
  if (el) el.remove()
}

// Build a schema.org FAQPage graph from the localized FAQ content so search
// engines can surface rich results. Mirrors the 8 items rendered in FaqPage.vue.
export function buildFaqJsonLd(t, faqCount = 8) {
  const mainEntity = []
  for (let i = 1; i <= faqCount; i++) {
    mainEntity.push({
      '@type': 'Question',
      name: t(`faq${i}Question`),
      acceptedAnswer: {
        '@type': 'Answer',
        text: t(`faq${i}Answer`),
      },
    })
  }
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity,
  }
}
