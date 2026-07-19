import { watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from './useI18n'
import {
  SITE_URL,
  SITE_NAME,
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

// Keeps the document <head> in sync with the active route and UI language.
// Call once from the root component. Updates title, description, canonical,
// hreflang alternates, Open Graph / Twitter tags, robots directives and the
// route-specific JSON-LD (FAQPage).
export function useSeo() {
  const route = useRoute()
  const { t, locale } = useI18n()

  function apply() {
    const seo = routeSeo(route.name, t)
    const url = canonicalUrl(route.path)
    const lang = locale.value

    // Title (localized; overrides the router's static fallback)
    document.title = seo.title

    // Core meta
    upsertMeta('name', 'description', seo.description)
    upsertMeta('name', 'robots', seo.robots)

    // Canonical + language alternates (both locales share one URL, x-default -> home locale)
    upsertLink('canonical', url)
    upsertLink('alternate', url, 'de')
    upsertLink('alternate', url, 'en')
    upsertLink('alternate', url, 'x-default')

    // Open Graph
    upsertMeta('property', 'og:type', route.name === 'landing' ? 'website' : 'article')
    upsertMeta('property', 'og:site_name', SITE_NAME)
    upsertMeta('property', 'og:title', seo.title)
    upsertMeta('property', 'og:description', seo.description)
    upsertMeta('property', 'og:url', url)
    upsertMeta('property', 'og:image', OG_IMAGE)
    upsertMeta('property', 'og:locale', ogLocale(lang))
    upsertMeta('property', 'og:locale:alternate', ogLocale(lang === 'de' ? 'en' : 'de'))

    // Twitter Card
    upsertMeta('name', 'twitter:card', 'summary_large_image')
    upsertMeta('name', 'twitter:title', seo.title)
    upsertMeta('name', 'twitter:description', seo.description)
    upsertMeta('name', 'twitter:image', OG_IMAGE)

    // Route-specific structured data
    if (route.name === 'faq') {
      setJsonLd('faq', buildFaqJsonLd(t))
    } else {
      removeJsonLd('faq')
    }
  }

  // React to navigation and to language switches (SSI nav, toggle, other tabs).
  watch(() => route.fullPath, apply, { immediate: true })
  watch(locale, apply)

  // Expose for direct/manual re-application and unit testing.
  return { apply, SITE_URL }
}
