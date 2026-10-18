import { describe, it, expect, afterEach, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { encodePaletteHash, decodePaletteHash } from '../lib/core/paletteLink'
import { displayHex } from '../lib/core/colorGenerator'

describe('paletteLink - encode / decode', () => {
  it('encodes colors as a compact, lowercase hash', () => {
    expect(encodePaletteHash(['#264653', '#2A9D8F', 'E9C46A'])).toBe('p=264653-2a9d8f-e9c46a')
  })

  it('round-trips to uppercase #RRGGBB', () => {
    const hexes = ['#264653', '#2A9D8F', '#E9C46A']
    expect(decodePaletteHash(`#${encodePaletteHash(hexes)}`)).toEqual(hexes)
  })

  it('skips invalid colors instead of rejecting the link', () => {
    expect(encodePaletteHash(['#12345', 'zzzzzz', '#abcdef'])).toBe('p=abcdef')
    expect(decodePaletteHash('#p=abcdef-xyz-12-ABCDEF')).toEqual(['#ABCDEF', '#ABCDEF'])
  })

  it('returns empty values for missing or empty palettes', () => {
    expect(encodePaletteHash([])).toBe('')
    expect(decodePaletteHash('')).toEqual([])
    expect(decodePaletteHash('#other=1')).toEqual([])
    expect(decodePaletteHash('#p=')).toEqual([])
  })

  it('caps hand-edited links at 20 colors', () => {
    const many = Array.from({ length: 25 }, () => 'aabbcc').join('-')
    expect(decodePaletteHash(`#p=${many}`)).toHaveLength(20)
  })
})

describe('useColorGenerator - palette links', () => {
  afterEach(() => {
    window.history.replaceState(null, '', '/')
    vi.resetModules()
  })

  async function mountGenerator() {
    const { useColorGenerator } = await import('../composables/useColorGenerator')
    let api!: ReturnType<typeof useColorGenerator>
    const Host = defineComponent({
      setup() {
        api = useColorGenerator()
        return () => h('div')
      },
    })
    const wrapper = mount(Host)
    await nextTick()
    return { api, wrapper }
  }

  it('opens a link with its colors locked and clears the hash', async () => {
    window.history.replaceState(null, '', '/generator#p=264653-2a9d8f-e9c46a-f4a261')
    const { api, wrapper } = await mountGenerator()
    expect(api.count.value).toBe(4)
    expect(api.palette.value.map(displayHex)).toEqual(['#264653', '#2A9D8F', '#E9C46A', '#F4A261'])
    expect(api.palette.value.every((c) => c.locked)).toBe(true)
    expect(window.location.hash).toBe('')
    expect(window.location.pathname).toBe('/generator')
    wrapper.unmount()
  })

  it('fills up to the minimum palette size with fresh, unlocked colors', async () => {
    window.history.replaceState(null, '', '/generator#p=ff0000')
    const { api, wrapper } = await mountGenerator()
    expect(api.count.value).toBe(3)
    expect(api.palette.value).toHaveLength(3)
    expect(displayHex(api.palette.value[0])).toBe('#FF0000')
    expect(api.palette.value.map((c) => c.locked)).toEqual([true, false, false])
    wrapper.unmount()
  })

  it('keeps the first 8 colors of a longer palette', async () => {
    const hexes = Array.from({ length: 12 }, (_, i) => (i * 16).toString(16).padStart(6, '0'))
    window.history.replaceState(null, '', `/generator#p=${hexes.join('-')}`)
    const { api, wrapper } = await mountGenerator()
    expect(api.count.value).toBe(8)
    expect(api.palette.value.map(displayHex)).toEqual(
      hexes.slice(0, 8).map((x) => `#${x.toUpperCase()}`)
    )
    wrapper.unmount()
  })

  it('generates a random palette when there is no link', async () => {
    const { api, wrapper } = await mountGenerator()
    expect(api.palette.value).toHaveLength(5)
    expect(api.palette.value.every((c) => !c.locked)).toBe(true)
    wrapper.unmount()
  })

  it('copies a link that reopens the displayed colors', async () => {
    window.history.replaceState(null, '', '/generator#p=264653-2a9d8f-e9c46a')
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } })
    const { api, wrapper } = await mountGenerator()
    await api.copyLink()
    expect(writeText).toHaveBeenCalledWith(
      `${window.location.origin}/generator#p=264653-2a9d8f-e9c46a`
    )
    vi.unstubAllGlobals()
    wrapper.unmount()
  })
})
