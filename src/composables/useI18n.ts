import { ref, computed, triggerRef } from 'vue'
import { translations } from '../i18n/translations'

export type Locale = keyof typeof translations

/** Placeholder values for `{name}` in a translation. */
export type TranslationParams = Record<string, string | number>

/** Text lookup by key; keys can be built at runtime, so they stay strings. */
const tables: Record<Locale, Record<string, string>> = translations

function isLocale(lang: unknown): lang is Locale {
  return typeof lang === 'string' && Object.hasOwn(translations, lang)
}

// ─── SSI Navigation Synchronisation ───
// Die SSI-Nav (nav.html) steuert Sprachwechsel über:
//   localStorage key: 'locale' (default: 'de')
//   CustomEvent: 'language-changed' mit { detail: { lang: 'de'|'en' } }
//   document.documentElement.setAttribute('lang', lang)
//
// Sync-Mechanismen (dreifach-redundant):
//   1. CustomEvent 'language-changed' → direkter Update
//   2. MutationObserver auf <html lang="..."> → Fallback
//   3. storage Event → Tab-übergreifende Synchronisation

// ?lang=de|en (hreflang-Ziel) hat Vorrang; danach wie die SSI-Nav:
// localStorage.getItem('locale') || 'de'. Ein ?lang wird gespeichert, damit die
// SSI-Nav (liest 'locale' bei DOMContentLoaded) dieselbe Sprache zeigt.
export function getInitialLocale(search = globalThis.location?.search ?? ''): Locale {
  const fromUrl = new URLSearchParams(search).get('lang')
  if (isLocale(fromUrl)) {
    try {
      localStorage.setItem('locale', fromUrl)
    } catch {
      // Speicher gesperrt: Sprache gilt nur für diesen Aufruf
    }
    return fromUrl
  }
  const stored = localStorage.getItem('locale')
  if (isLocale(stored)) return stored
  return 'de'
}

const currentLocale = ref<Locale>(getInitialLocale())
// <html lang> sofort setzen: syncInitialLocale() und der MutationObserver lesen es
// und würden sonst das statische lang="de" aus index.html übernehmen.
document.documentElement.setAttribute('lang', currentLocale.value)

// Computed für aktuelle Übersetzungen – stärkt die reaktive Abhängigkeitskette
const currentTranslations = computed(() => tables[currentLocale.value] || tables.de)

function setLocale(lang: unknown) {
  if (isLocale(lang) && currentLocale.value !== lang) {
    currentLocale.value = lang
    triggerRef(currentLocale)
  }
}

// Sync 1: CustomEvent von SSI-Nav
window.addEventListener('language-changed', (e) => {
  const lang = (e as CustomEvent<{ lang?: string } | null>).detail?.lang
  setLocale(lang)
})

// Sync 2: MutationObserver auf <html lang> Attribut (Fallback)
if (typeof MutationObserver !== 'undefined') {
  const langObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.attributeName === 'lang') {
        const lang = document.documentElement.lang
        setLocale(lang)
      }
    }
  })

  function initLangObserver() {
    langObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['lang'],
    })
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLangObserver)
  } else {
    initLangObserver()
  }
}

// Sync 3: Tab-übergreifende Synchronisation via storage Event
window.addEventListener('storage', (e) => {
  if (e.key === 'locale' && e.newValue) {
    setLocale(e.newValue)
  }
})

// Initiale Synchronisation mit SSI-Nav (falls locale vor Vue-Mount gesetzt wurde)
function syncInitialLocale() {
  const stored = localStorage.getItem('locale')
  if (isLocale(stored) && currentLocale.value !== stored) {
    currentLocale.value = stored
  }
  const docLang = document.documentElement.lang
  if (isLocale(docLang) && currentLocale.value !== docLang) {
    currentLocale.value = docLang
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', syncInitialLocale)
} else {
  syncInitialLocale()
}

/**
 * Fills `{name}` placeholders from `params`. Placeholders without a value
 * stay as they are, so a missing parameter shows up instead of vanishing.
 */
export function interpolate(text: string, params?: TranslationParams): string {
  if (!params) return text
  return text.replace(/\{(\w+)\}/g, (match, name) =>
    Object.hasOwn(params, name) ? String(params[name]) : match
  )
}

/** Placeholder names in each translation, for checks that both languages agree. */
export function placeholders(locale: string): Record<string, string[]> {
  const table = isLocale(locale) ? tables[locale] : {}
  return Object.fromEntries(
    Object.entries(table).map(([key, text]) => [
      key,
      [...String(text).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort(),
    ])
  )
}

export function useI18n() {
  /** The text for `key` in the current language, German as fallback. */
  const t = (key: string, params?: TranslationParams): string => {
    return interpolate(currentTranslations.value[key] || tables.de[key] || key, params)
  }

  const locale = computed({
    get: () => currentLocale.value,
    set: (val: string) => {
      if (isLocale(val)) {
        currentLocale.value = val
        localStorage.setItem('locale', val)
        document.documentElement.setAttribute('lang', val)
        window.dispatchEvent(new CustomEvent('language-changed', { detail: { lang: val } }))
      }
    },
  })

  const availableLocales = Object.keys(translations) as Locale[]

  return { t, locale, availableLocales }
}
