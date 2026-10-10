import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'

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
  return mount(LandingPage, { global: { plugins: [router] } })
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
