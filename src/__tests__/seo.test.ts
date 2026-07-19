import { describe, it, expect, beforeEach } from 'vitest'
import {
  SITE_URL,
  OG_IMAGE,
  ogLocale,
  canonicalUrl,
  routeSeo,
  upsertMeta,
  upsertLink,
  setJsonLd,
  removeJsonLd,
  buildFaqJsonLd,
} from '../lib/core/seo'

// Minimal translator stub: echoes the key so we can assert wiring.
const t = (key: string) => `T:${key}`

describe('seo helpers', () => {
  beforeEach(() => {
    document.head.innerHTML = ''
  })

  it('canonicalUrl builds absolute URLs with a trailing slash for home', () => {
    expect(canonicalUrl('/')).toBe(`${SITE_URL}/`)
    expect(canonicalUrl('')).toBe(`${SITE_URL}/`)
    expect(canonicalUrl('/app')).toBe(`${SITE_URL}/app`)
    expect(canonicalUrl('/faq')).toBe(`${SITE_URL}/faq`)
  })

  it('ogLocale maps app language codes to OG locales', () => {
    expect(ogLocale('de')).toBe('de_DE')
    expect(ogLocale('en')).toBe('en_US')
  })

  it('routeSeo resolves localized fields and robots per route', () => {
    const home = routeSeo('landing', t)
    expect(home.title).toBe('T:metaTitleHome')
    expect(home.description).toBe('T:metaDescHome')
    expect(home.robots).toBe('index, follow')

    const faq = routeSeo('faq', t)
    expect(faq.title).toBe('T:metaTitleFaq')
    expect(faq.robots).toBe('index, follow')

    // Internal, state-driven view must not be indexed
    expect(routeSeo('gallery', t).robots).toBe('noindex, follow')

    // Unknown route falls back to home config
    expect(routeSeo('does-not-exist', t).title).toBe('T:metaTitleHome')
  })

  it('upsertMeta creates a tag once and updates it in place', () => {
    upsertMeta('name', 'description', 'first')
    upsertMeta('name', 'description', 'second')
    const tags = document.head.querySelectorAll('meta[name="description"]')
    expect(tags.length).toBe(1)
    expect(tags[0].getAttribute('content')).toBe('second')
  })

  it('upsertMeta distinguishes name vs property attributes', () => {
    upsertMeta('name', 'twitter:title', 'tw')
    upsertMeta('property', 'og:title', 'og')
    expect(document.head.querySelector('meta[name="twitter:title"]')?.getAttribute('content')).toBe(
      'tw'
    )
    expect(document.head.querySelector('meta[property="og:title"]')?.getAttribute('content')).toBe(
      'og'
    )
  })

  it('upsertLink keeps one canonical but allows multiple hreflang alternates', () => {
    upsertLink('canonical', `${SITE_URL}/`)
    upsertLink('canonical', `${SITE_URL}/faq`)
    expect(document.head.querySelectorAll('link[rel="canonical"]').length).toBe(1)
    expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
      `${SITE_URL}/faq`
    )

    upsertLink('alternate', `${SITE_URL}/`, 'de')
    upsertLink('alternate', `${SITE_URL}/`, 'en')
    upsertLink('alternate', `${SITE_URL}/`, 'x-default')
    expect(document.head.querySelectorAll('link[rel="alternate"]').length).toBe(3)
  })

  it('setJsonLd creates/updates and removeJsonLd removes a tagged block', () => {
    setJsonLd('faq', { a: 1 })
    let el = document.getElementById('jsonld-faq')
    expect(el).toBeTruthy()
    expect(JSON.parse(el!.textContent!)).toEqual({ a: 1 })

    setJsonLd('faq', { a: 2 })
    expect(document.querySelectorAll('#jsonld-faq').length).toBe(1)
    expect(JSON.parse(document.getElementById('jsonld-faq')!.textContent!)).toEqual({ a: 2 })

    removeJsonLd('faq')
    expect(document.getElementById('jsonld-faq')).toBeNull()
  })

  it('buildFaqJsonLd produces a valid FAQPage graph with all questions', () => {
    const data = buildFaqJsonLd(t, 8) as {
      '@type': string
      mainEntity: Array<{ '@type': string; name: string; acceptedAnswer: { text: string } }>
    }
    expect(data['@type']).toBe('FAQPage')
    expect(data.mainEntity.length).toBe(8)
    expect(data.mainEntity[0]['@type']).toBe('Question')
    expect(data.mainEntity[0].name).toBe('T:faq1Question')
    expect(data.mainEntity[0].acceptedAnswer.text).toBe('T:faq1Answer')
  })

  it('exposes an absolute OG image under the site URL', () => {
    expect(OG_IMAGE.startsWith(SITE_URL)).toBe(true)
    expect(OG_IMAGE.endsWith('.png')).toBe(true)
  })
})
