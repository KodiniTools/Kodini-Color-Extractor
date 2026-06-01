import { describe, it, expect, beforeEach, vi } from 'vitest'

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
      'title', 'subtitle', 'uploadText', 'formatLabel', 'paletteTitle',
      'copiedToClipboard', 'imagePasted', 'noImageInClipboard', 'clipboardError',
      'navHome', 'navApp', 'navFaq', 'heroTitle', 'faqTitle',
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
