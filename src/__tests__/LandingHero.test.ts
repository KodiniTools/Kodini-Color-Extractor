import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createPinia } from 'pinia'

const Stub = { template: '<div />' }

async function mountLanding() {
  const { default: LandingPage } = await import('../views/LandingPage.vue')
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: Stub },
      { path: '/app', component: Stub },
      { path: '/generator', component: Stub },
      { path: '/faq', component: Stub },
    ],
  })
  await router.push('/')
  await router.isReady()
  return mount(LandingPage, { global: { plugins: [router, createPinia()] } })
}

describe('LandingPage hero image', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.resetModules()
  })

  it('renders the hero image inside the hero, after the headline and CTAs', async () => {
    const wrapper = await mountLanding()
    const hero = wrapper.find('section.hero')
    const img = hero.find('img.hero-image')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toMatch(/landingpage-colorextractor\.webp$/)

    const html = hero.html()
    expect(html.indexOf('hero-actions')).toBeLessThan(html.indexOf('hero-image'))
  })

  it('reserves space and loads eagerly as the above-the-fold image', async () => {
    const img = (await mountLanding()).find('img.hero-image')
    expect(img.attributes('width')).toBe('1200')
    expect(img.attributes('height')).toBe('908')
    expect(img.attributes('loading')).toBeUndefined()
    expect(img.attributes('fetchpriority')).toBe('high')
  })

  it('has a translated, non-empty alt text', async () => {
    const alt = (await mountLanding()).find('img.hero-image').attributes('alt')
    expect(alt).toBeTruthy()
    expect(alt).not.toBe('heroImageAlt')
  })
})

describe('LandingPage zweifarbiger Titel', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.resetModules()
  })

  it('teilt den Titel in Gold- und Blau-Teil, der Text bleibt der ganze Titel', async () => {
    const { translations } = await import('../i18n/translations')
    const wrapper = await mountLanding()
    const title = wrapper.find('h1.hero-title')
    const lead = title.find('.hero-title-lead').text()
    const rest = title.find('.hero-title-rest').text()
    const lang = document.documentElement.lang === 'en' ? 'en' : 'de'
    expect(lead).toBe(translations[lang].heroTitleLead)
    expect(rest).toBe(translations[lang].heroTitleRest)
    expect(title.element.textContent?.replace(/\s+/g, ' ').trim()).toBe(
      translations[lang].heroTitle
    )
  })

  it.each(['de', 'en'] as const)('Lead + Rest ergeben den Titel (%s)', async (lang) => {
    const { translations } = await import('../i18n/translations')
    const t = translations[lang]
    expect(`${t.heroTitleLead} ${t.heroTitleRest}`).toBe(t.heroTitle)
  })
})
