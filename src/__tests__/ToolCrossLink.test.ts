import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'

const Stub = { template: '<div />' }

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: Stub },
      { path: '/app', component: Stub },
      { path: '/generator', component: Stub },
    ],
  })
}

describe('ToolCrossLink', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.resetModules()
  })

  it('renders lead-in text and a router link to the given target', async () => {
    const { default: ToolCrossLink } = await import('../components/ToolCrossLink.vue')
    const router = makeRouter()
    await router.push('/')
    await router.isReady()

    const wrapper = mount(ToolCrossLink, {
      props: { to: '/generator', text: 'No image at hand?', linkText: 'Try the generator' },
      global: { plugins: [router] },
    })

    expect(wrapper.text()).toContain('No image at hand?')
    const link = wrapper.get('a')
    expect(link.text()).toContain('Try the generator')
    expect(link.attributes('href')).toBe('/generator')
  })

  it('navigates when the link is clicked', async () => {
    const { default: ToolCrossLink } = await import('../components/ToolCrossLink.vue')
    const router = makeRouter()
    await router.push('/generator')
    await router.isReady()

    const wrapper = mount(ToolCrossLink, {
      props: { to: '/app', text: 'Have an image?', linkText: 'Open extractor' },
      global: { plugins: [router] },
    })

    await wrapper.get('a').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/app')
  })
})

describe('cross link translations', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.resetModules()
  })

  it('provides all cross link keys in en and de', async () => {
    const { useI18n } = await import('../composables/useI18n')
    const { locale, t } = useI18n()
    const keys = [
      'crossLinkToGeneratorText',
      'crossLinkToGeneratorCta',
      'crossLinkToAppText',
      'crossLinkToAppCta',
      'navGenerator',
    ]
    for (const loc of ['en', 'de'] as const) {
      locale.value = loc
      for (const key of keys) {
        expect(t(key), `${loc}:${key}`).not.toBe(key)
      }
    }
  })
})
