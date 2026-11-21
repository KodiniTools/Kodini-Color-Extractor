// Build-time localization of the static <head> in index.html.
//
// The SPA serves one index.html (German) for every route; useSeo.ts fixes the
// head at runtime. Crawlers that do not run JavaScript would therefore see the
// German title on ?lang=en URLs. For every indexable route this module renders
// an English copy of the built index.html (e.g. faq.en.html) with English
// <html lang>, title, description, robots, canonical (?lang=en), hreflang
// alternates and Open Graph / Twitter tags. nginx serves the copy when the
// request carries ?lang=en (see the PR / README for the server snippet).
//
// Pure string functions without DOM access, so vite.config.ts can call them.

import { alternateUrls, canonicalUrl, ogLocale, routeSeo } from './seo'

type Translate = (key: string) => string

/** Routes that get a pre-rendered head. Mirrors src/router/index.ts. */
export const STATIC_ROUTES: readonly { name: string; path: string }[] = [
  { name: 'landing', path: '/' },
  { name: 'app', path: '/app' },
  { name: 'generator', path: '/generator' },
  { name: 'gallery', path: '/app/gallery' },
  { name: 'faq', path: '/faq' },
]

/**
 * File (relative to the build output) that holds the head for `path` in `lang`.
 * '/' -> 'index.en.html', '/faq' -> 'faq.en.html', '/app/gallery' -> 'app/gallery.en.html'.
 * The names match the nginx rule `try_files ${uri}index$lang.html $uri$lang.html`.
 */
export function staticHtmlFile(path: string, lang: string): string {
  const base = path === '/' ? 'index' : path.replace(/^\/+/, '').replace(/\/+$/, '')
  // Deutsch ist die URL ohne ?lang: nginx sucht dann `$uri.html` (map liefert "").
  return lang === 'de' ? `${base}.html` : `${base}.${lang}.html`
}

/** Escape a value for use inside a double-quoted HTML attribute or <title>. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Replace exactly one match; anything else means index.html changed shape and
// the build must fail instead of shipping a half-translated head.
function replaceOnce(html: string, pattern: RegExp, replacement: string, what: string): string {
  const matches = html.match(new RegExp(pattern.source, pattern.flags.replace('g', '') + 'g'))
  if (!matches || matches.length !== 1) {
    throw new Error(
      `staticHead: expected exactly one ${what} in index.html, found ${matches?.length ?? 0}`
    )
  }
  return html.replace(pattern, replacement)
}

function setMeta(html: string, attr: string, key: string, value: string): string {
  const pattern = new RegExp(`(<meta\\s+${attr}="${escapeRegExp(key)}"\\s+content=")[^"]*(")`)
  return replaceOnce(html, pattern, `$1${escapeHtml(value)}$2`, `<meta ${attr}="${key}">`)
}

/**
 * Render the head of `html` (the built German index.html) for one route and
 * language. Values come from the same i18n keys and URL helpers as useSeo.ts,
 * so the static head equals what the app sets at runtime.
 */
export function localizeHead(
  html: string,
  opts: { routeName: string; path: string; lang: string; t: Translate }
): string {
  const { routeName, path, lang, t } = opts
  const seo = routeSeo(routeName, t)
  const url = canonicalUrl(path, lang)

  let out = replaceOnce(
    html,
    /<html\s+lang="[^"]*"/,
    `<html lang="${escapeHtml(lang)}"`,
    '<html lang>'
  )
  out = replaceOnce(
    out,
    /<title>[^<]*<\/title>/,
    `<title>${escapeHtml(seo.title)}</title>`,
    '<title>'
  )
  out = setMeta(out, 'name', 'description', seo.description)
  out = setMeta(out, 'name', 'robots', seo.robots)

  out = setMeta(out, 'property', 'og:type', routeName === 'landing' ? 'website' : 'article')
  out = setMeta(out, 'property', 'og:title', seo.title)
  out = setMeta(out, 'property', 'og:description', seo.description)
  out = setMeta(out, 'property', 'og:url', url)
  out = setMeta(out, 'property', 'og:locale', ogLocale(lang))
  out = setMeta(out, 'property', 'og:locale:alternate', ogLocale(lang === 'de' ? 'en' : 'de'))
  out = setMeta(out, 'name', 'twitter:title', seo.title)
  out = setMeta(out, 'name', 'twitter:description', seo.description)

  // Canonical + hreflang: same markup useSeo's upsertLink() finds and updates,
  // so the app does not add duplicates after hydration.
  const links = [
    `<link rel="canonical" href="${escapeHtml(url)}" />`,
    ...alternateUrls(path).map(
      ({ hreflang, href }) =>
        `<link rel="alternate" hreflang="${escapeHtml(hreflang)}" href="${escapeHtml(href)}" />`
    ),
  ]
  if (/<link\s+rel="canonical"/.test(out)) {
    throw new Error('staticHead: index.html already has a canonical link')
  }
  return replaceOnce(out, /<\/head>/, `  ${links.join('\n    ')}\n  </head>`, '</head>')
}
