import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'

const Stub = { template: '<div />' }
const BLOG_URL = 'https://kodinitools.com/blog/farbextraktor-farbpalette/'

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: Stub },
      { path: '/app', component: Stub },
      { path: '/app/gallery', component: Stub },
      { path: '/generator', component: Stub },
      { path: '/faq', component: Stub },
    ],
  })
}

async function mountNav() {
  const { default: LandingNav } = await import('../components/LandingNav.vue')
  setActivePinia(createPinia())
  const router = makeRouter()
  await router.push('/')
  await router.isReady()
  return mount(LandingNav, { global: { plugins: [router] } })
}

describe('LandingNav', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.resetModules()
  })

  it('renders the internal links followed by the external blog link', async () => {
    const wrapper = await mountNav()
    const hrefs = wrapper.findAll('a.nav-link').map((a) => a.attributes('href'))
    expect(hrefs).toEqual(['/', '/app', '/app/gallery', '/generator', '/faq', BLOG_URL])
  })

  it('opens the blog link in a new tab with a safe rel attribute', async () => {
    const wrapper = await mountNav()
    const blog = wrapper.get(`a[href="${BLOG_URL}"]`)
    expect(blog.attributes('target')).toBe('_blank')
    expect(blog.attributes('rel')).toBe('noopener noreferrer')
    expect(blog.text()).toBe('Blog')
  })

  it('keeps internal links as router links (no target attribute)', async () => {
    const wrapper = await mountNav()
    const internal = wrapper.findAll('a.nav-link').filter((a) => a.attributes('href') !== BLOG_URL)
    expect(internal).toHaveLength(5)
    for (const link of internal) {
      expect(link.attributes('target')).toBeUndefined()
    }
  })
})

describe('LandingNav gallery tab', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.resetModules()
  })

  it('shows the gallery tab with the number of collected images', async () => {
    const wrapper = await mountNav()
    const tab = wrapper.get('a[href="/app/gallery"]')
    expect(tab.text()).toBe('Galerie')
    expect(wrapper.find('[data-testid="gallery-count"]').exists()).toBe(false)

    const { useHandoffStore } = await import('../stores/handoff')
    useHandoffStore().addImages([
      { name: 'a', dataUrl: 'data:image/png;base64,AA', width: 1, height: 1 },
      { name: 'b', dataUrl: 'data:image/png;base64,AA', width: 1, height: 1 },
    ])
    await wrapper.vm.$nextTick()
    expect(wrapper.get('[data-testid="gallery-count"]').text()).toBe('2')
  })
})

describe('navBlog translations', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.resetModules()
  })

  it('exists in both locales', async () => {
    const { useI18n } = await import('../composables/useI18n')
    const { locale, t } = useI18n()
    locale.value = 'en'
    expect(t('navBlog')).toBe('Blog')
    locale.value = 'de'
    expect(t('navBlog')).toBe('Blog')
  })
})
