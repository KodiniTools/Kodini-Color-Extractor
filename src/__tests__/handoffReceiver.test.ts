import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { MAX_AGE_MS, STORAGE_KEY, checkHandoff, consumeHandoff } from '../lib/core/handoff'
import { useI18n } from '../composables/useI18n'
import { useHandoffStore } from '../stores/handoff'
import HandoffReceiver from '../components/features/HandoffReceiver.vue'

const JPEG = 'data:image/jpeg;base64,AAAA'

function payload(count = 2, overrides: Record<string, unknown> = {}) {
  return {
    source: 'bildergalerie',
    timestamp: Date.now(),
    images: Array.from({ length: count }, (_, i) => ({
      name: `Bild ${i + 1}`,
      dataUrl: JPEG,
      width: 100,
      height: 50,
    })),
    ...overrides,
  }
}

function store(value: unknown) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
}

function mountReceiver(lang: 'de' | 'en' = 'de') {
  useI18n().locale.value = lang
  return mount(HandoffReceiver)
}

beforeEach(() => {
  localStorage.clear()
  setActivePinia(createPinia())
  window.history.replaceState({}, '', '/kodini-color-extractor/app/gallery?handoff=kodinitools')
})

describe('handoff protocol (receiver)', () => {
  it('accepts a fresh payload and consumes it once', () => {
    store(payload())
    expect(checkHandoff()?.images).toHaveLength(2)
    expect(consumeHandoff()?.images).toHaveLength(2)
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    expect(consumeHandoff()).toBeNull()
  })

  it('ignores expired payloads and payloads without timestamp', () => {
    store(payload(1, { timestamp: Date.now() - MAX_AGE_MS - 1000 }))
    expect(checkHandoff()).toBeNull()

    store(payload(1, { timestamp: undefined }))
    expect(checkHandoff()).toBeNull()
  })

  it('still imports an expired payload once the banner is shown', () => {
    store(payload(1, { timestamp: Date.now() - MAX_AGE_MS - 1000 }))
    expect(consumeHandoff()?.images).toHaveLength(1)
  })

  it('only keeps entries with a raster image data URL', () => {
    store(
      payload(1, {
        images: [
          { name: 'ok', dataUrl: JPEG, width: 1, height: 1 },
          { name: 'script', dataUrl: 'javascript:alert(1)', width: 1, height: 1 },
          { name: 'svg', dataUrl: 'data:image/svg+xml;base64,AAAA', width: 1, height: 1 },
          { dataUrl: JPEG },
          null,
        ],
      })
    )
    expect(checkHandoff()?.images.map((img) => img.name)).toEqual(['ok'])

    store(payload(1, { images: [{ name: 'x', dataUrl: 'nope' }] }))
    expect(checkHandoff()).toBeNull()
  })
})

describe('HandoffReceiver', () => {
  it('shows nothing without a handoff', () => {
    expect(mountReceiver().find('.handoff-banner').exists()).toBe(false)
  })

  it('names the Bildergalerie as source and pluralises (DE/EN)', async () => {
    store(payload(1))
    let w = mountReceiver('de')
    await w.vm.$nextTick()
    expect(w.text()).toContain('1 Bild empfangen')
    expect(w.text()).toContain('von Bildergalerie')

    store(payload(3))
    w = mountReceiver('en')
    await w.vm.$nextTick()
    expect(w.text()).toContain('3 images received')
    expect(w.text()).toContain('from Bildergalerie')
  })

  it('accept emits the images, removes the handoff and the URL parameter', async () => {
    store(payload(2))
    const w = mountReceiver()
    await w.vm.$nextTick()
    await w.find('.handoff-btn-accept').trigger('click')

    const [[images]] = w.emitted('accept') as [[{ name: string }[]]]
    expect(images.map((img) => img.name)).toEqual(['Bild 1', 'Bild 2'])
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    expect(window.location.search).toBe('')
    expect(w.find('.handoff-banner').exists()).toBe(false)
  })

  it('dismiss rejects the images without emitting them', async () => {
    store(payload(2))
    const w = mountReceiver()
    await w.vm.$nextTick()
    await w.find('.handoff-btn-dismiss').trigger('click')

    expect(w.emitted('accept')).toBeUndefined()
    expect(w.emitted('dismiss')).toHaveLength(1)
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    expect(w.find('.handoff-banner').exists()).toBe(false)
  })
})

describe('GalleryView', () => {
  it('lists all accepted images and confirms the count', async () => {
    const { default: GalleryView } = await import('../views/GalleryView.vue')
    const { useToast } = await import('../composables/useToast')
    useI18n().locale.value = 'de'
    store(payload(3))

    const w = mount(GalleryView, {
      global: { stubs: { 'router-link': true, ToastContainer: true } },
    })
    await w.vm.$nextTick()
    await w.find('.handoff-btn-accept').trigger('click')

    expect(useHandoffStore().images).toHaveLength(3)
    expect(w.findAll('.gallery-item')).toHaveLength(3)
    expect(useToast().toasts.value.at(-1)?.message).toBe('3 Bilder in die Galerie übernommen')
  })
})
