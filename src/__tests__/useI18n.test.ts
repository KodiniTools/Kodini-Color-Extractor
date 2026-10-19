import { describe, it, expect, beforeEach, vi } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const SRC = resolve(dirname(fileURLToPath(import.meta.url)), '..')

describe('useI18n', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.setAttribute('lang', '')
    vi.resetModules()
  })

  it('t() returns translations for known keys (not the key itself)', async () => {
    const { useI18n } = await import('../composables/useI18n')
    const { t } = useI18n()
    const requiredKeys = [
      'extractorPanelTitle',
      'subtitle',
      'genTitle',
      'formatLabel',
      'paletteTitle',
      'copiedToClipboard',
      'imagePasted',
      'noImageInClipboard',
      'clipboardError',
      'navHome',
      'navApp',
      'navFaq',
      'heroTitle',
      'faqTitle',
    ]
    for (const key of requiredKeys) {
      const result = t(key)
      expect(result, `Key "${key}" should return a translation`).not.toBe(key)
      expect(result.length).toBeGreaterThan(0)
    }
  })

  it('t() returns the key itself for unknown keys (fallback)', async () => {
    const { useI18n } = await import('../composables/useI18n')
    const { t } = useI18n()
    expect(t('nonExistentKey_xyz_12345')).toBe('nonExistentKey_xyz_12345')
  })

  it('availableLocales includes en and de', async () => {
    const { useI18n } = await import('../composables/useI18n')
    const { availableLocales } = useI18n()
    expect(availableLocales).toContain('en')
    expect(availableLocales).toContain('de')
  })

  it('locale switching changes translations', async () => {
    const { useI18n } = await import('../composables/useI18n')
    const { locale, t } = useI18n()

    locale.value = 'en'
    expect(t('navHome')).toBe('Home')

    locale.value = 'de'
    expect(t('navHome')).toBe('Start')
  })

  it('en locale has navApp = "Open App"', async () => {
    const { useI18n } = await import('../composables/useI18n')
    const { locale, t } = useI18n()
    locale.value = 'en'
    expect(t('navApp')).toBe('Open App')
  })

  it('de locale has navApp = "App öffnen"', async () => {
    const { useI18n } = await import('../composables/useI18n')
    const { locale, t } = useI18n()
    locale.value = 'de'
    expect(t('navApp')).toBe('App öffnen')
  })
})

describe('useI18n - placeholders', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.resetModules()
  })

  it('fills {name} placeholders from params', async () => {
    const { useI18n } = await import('../composables/useI18n')
    const { locale, t } = useI18n()
    locale.value = 'en'
    expect(t('genScopeColor', { n: 3 })).toBe('Color 3')
    expect(t('genResetField', { label: 'Hue' })).toBe('Reset Hue')
    locale.value = 'de'
    expect(t('genResetField', { label: 'Farbton' })).toBe('Farbton zurücksetzen')
  })

  it('keeps zero and leaves placeholders without a value visible', async () => {
    const { interpolate } = await import('../composables/useI18n')
    expect(interpolate('{n} colors', { n: 0 })).toBe('0 colors')
    expect(interpolate('{n} of {total}', { n: 1 })).toBe('1 of {total}')
    expect(interpolate('{n} and {n}', { n: 2 })).toBe('2 and 2')
    expect(interpolate('Saved {file}')).toBe('Saved {file}')
    // Only own keys count, not inherited ones like toString.
    expect(interpolate('{toString}', {})).toBe('{toString}')
  })

  it('uses the same placeholders in German and English', async () => {
    const { placeholders } = await import('../composables/useI18n')
    const en = placeholders('en')
    const de = placeholders('de')
    for (const key of Object.keys(en)) {
      if (key in de) expect(de[key], `placeholders of "${key}"`).toEqual(en[key])
    }
  })

  it('source code passes values to t() instead of replacing placeholders by hand', () => {
    const files = readdirSync(SRC, { recursive: true, encoding: 'utf8' }).filter(
      (f) => /\.(vue|js)$/.test(f) && !f.includes('__tests__')
    )
    const offenders = files.filter((f) =>
      /\.replace\(\s*['"`]\{\w+\}/.test(readFileSync(join(SRC, f), 'utf8'))
    )
    expect(offenders).toEqual([])
  })
})
