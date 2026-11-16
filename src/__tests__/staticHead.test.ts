/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { translations } from '../i18n/translations'
import { SITE_URL } from '../lib/core/seo'
import { STATIC_ROUTES, escapeHtml, localizeHead, staticHtmlFile } from '../lib/core/staticHead'
import router from '../router'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const indexHtml = readFileSync(join(ROOT, 'index.html'), 'utf8')
const en: Record<string, string> = translations.en
const t = (key: string) => en[key] ?? key

function parse(html: string): Document {
  return new DOMParser().parseFromString(html, 'text/html')
}

function meta(doc: Document, attr: string, key: string): string | null {
  return doc.head.querySelector(`meta[${attr}="${key}"]`)?.getAttribute('content') ?? null
}

describe('staticHtmlFile', () => {
  it('maps routes to the file names the nginx rule looks up', () => {
    expect(staticHtmlFile('/', 'en')).toBe('index.en.html')
    expect(staticHtmlFile('/faq', 'en')).toBe('faq.en.html')
    expect(staticHtmlFile('/app/gallery', 'en')).toBe('app/gallery.en.html')
  })
})

describe('STATIC_ROUTES', () => {
  it('covers every route of the router', () => {
    const routes = router.getRoutes().map((r) => ({ name: String(r.name), path: r.path }))
    expect([...STATIC_ROUTES].sort((a, b) => a.path.localeCompare(b.path))).toEqual(
      routes.sort((a, b) => a.path.localeCompare(b.path))
    )
  })
})

describe('localizeHead', () => {
  it('renders the English head for the FAQ route', () => {
    const doc = parse(localizeHead(indexHtml, { routeName: 'faq', path: '/faq', lang: 'en', t }))
    const url = `${SITE_URL}/faq?lang=en`

    expect(doc.documentElement.getAttribute('lang')).toBe('en')
    expect(doc.title).toBe(en.metaTitleFaq)
    expect(meta(doc, 'name', 'description')).toBe(en.metaDescFaq)
    expect(meta(doc, 'name', 'robots')).toBe('index, follow')
    expect(meta(doc, 'property', 'og:title')).toBe(en.metaTitleFaq)
    expect(meta(doc, 'property', 'og:description')).toBe(en.metaDescFaq)
    expect(meta(doc, 'property', 'og:url')).toBe(url)
    expect(meta(doc, 'property', 'og:locale')).toBe('en_US')
    expect(meta(doc, 'property', 'og:locale:alternate')).toBe('de_DE')
    expect(meta(doc, 'name', 'twitter:title')).toBe(en.metaTitleFaq)
    expect(meta(doc, 'name', 'twitter:description')).toBe(en.metaDescFaq)

    const canonical = doc.head.querySelectorAll('link[rel="canonical"]')
    expect(canonical).toHaveLength(1)
    expect(canonical[0].getAttribute('href')).toBe(url)
    const alternates = [...doc.head.querySelectorAll('link[rel="alternate"]')].map((l) => [
      l.getAttribute('hreflang'),
      l.getAttribute('href'),
    ])
    expect(alternates).toEqual([
      ['de', `${SITE_URL}/faq`],
      ['en', url],
      ['x-default', `${SITE_URL}/faq`],
    ])
  })

  it('uses the home URL with trailing slash and og:type website on the landing page', () => {
    const doc = parse(localizeHead(indexHtml, { routeName: 'landing', path: '/', lang: 'en', t }))
    expect(doc.title).toBe(en.metaTitleHome)
    expect(doc.head.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
      `${SITE_URL}/?lang=en`
    )
    expect(meta(doc, 'property', 'og:type')).toBe('website')
  })

  it('keeps the gallery out of the index', () => {
    const doc = parse(
      localizeHead(indexHtml, { routeName: 'gallery', path: '/app/gallery', lang: 'en', t })
    )
    expect(meta(doc, 'name', 'robots')).toBe('noindex, follow')
  })

  it('leaves the body (SSI includes, app mount) untouched', () => {
    const out = localizeHead(indexHtml, { routeName: 'app', path: '/app', lang: 'en', t })
    const body = (html: string) => html.slice(html.indexOf('<body>'))
    expect(body(out)).toBe(body(indexHtml))
    expect(out).toContain('<!--#include virtual="/partials/nav.html" -->')
  })

  it('escapes translated values', () => {
    const out = localizeHead(indexHtml, {
      routeName: 'faq',
      path: '/faq',
      lang: 'en',
      t: () => 'A "quoted" <b> & more',
    })
    expect(out).toContain('<title>A &quot;quoted&quot; &lt;b&gt; &amp; more</title>')
    expect(parse(out).title).toBe('A "quoted" <b> & more')
    expect(escapeHtml('<&">')).toBe('&lt;&amp;&quot;&gt;')
  })

  it('fails loudly when index.html no longer has an expected tag', () => {
    const broken = indexHtml.replace(/<meta\s+name="robots"[^>]*>/, '')
    expect(() => localizeHead(broken, { routeName: 'faq', path: '/faq', lang: 'en', t })).toThrow(
      /robots/
    )
  })
})
