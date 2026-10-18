import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import {
  MAX_RECENT,
  addEntry,
  createMemoryStorage,
  findEntry,
  normalizeColors,
  removeEntry,
  sanitizeEntries,
  toggleFavorite,
} from '../lib/core/paletteLibrary'
import { usePaletteLibrary, resetPaletteLibrary } from '../composables/usePaletteLibrary'
import PaletteLibraryDialog from '../components/PaletteLibraryDialog.vue'

type Entry = ReturnType<typeof addEntry>[number]

const add = (list: Entry[], hexes: string[], now: number, favorite = false) =>
  addEntry(list, hexes, { source: 'generator', now, favorite })

describe('paletteLibrary - list logic', () => {
  it('normalizes colors and drops invalid ones', () => {
    expect(normalizeColors(['ff0000', '#00ff00', 'nope', ' #0000Ff '])).toEqual([
      '#FF0000',
      '#00FF00',
      '#0000FF',
    ])
  })

  it('ignores a palette without valid colors', () => {
    expect(add([], ['nope'], 1)).toEqual([])
  })

  it('keeps one entry per palette and moves a reused one to the top', () => {
    let list = add([], ['#111111', '#222222'], 1)
    list = add(list, ['#333333'], 2)
    list = add(list, ['#111111', '#222222'], 3)
    expect(list).toHaveLength(2)
    expect(list[0].colors).toEqual(['#111111', '#222222'])
    expect(list[0].updatedAt).toBe(3)
  })

  it('treats a different color order as a different palette', () => {
    let list = add([], ['#111111', '#222222'], 1)
    list = add(list, ['#222222', '#111111'], 2)
    expect(list).toHaveLength(2)
  })

  it('lists favorites first and keeps the mark when a favorite is used again', () => {
    let list = add([], ['#111111'], 1, true)
    list = add(list, ['#222222'], 2)
    expect(list.map((e) => e.colors[0])).toEqual(['#111111', '#222222'])
    list = add(list, ['#111111'], 3)
    expect(list[0].favorite).toBe(true)
  })

  it('caps recent palettes but never drops favorites', () => {
    let list = add([], ['#000000'], 0, true)
    for (let i = 1; i <= MAX_RECENT + 5; i++) {
      list = add(list, [`#${i.toString(16).padStart(6, '0')}`], i)
    }
    expect(list.filter((e) => !e.favorite)).toHaveLength(MAX_RECENT)
    expect(findEntry(list, ['#000000'])?.favorite).toBe(true)
    // The oldest recent ones dropped off.
    expect(findEntry(list, ['#000001'])).toBeUndefined()
  })

  it('toggles and removes by id', () => {
    let list = add([], ['#111111'], 1)
    const id = list[0].id
    list = toggleFavorite(list, id)
    expect(list[0].favorite).toBe(true)
    list = removeEntry(list, id)
    expect(list).toEqual([])
  })

  it('sanitizes stored data', () => {
    const data = [
      { id: 'a', colors: ['#abcdef'], source: 'extractor', favorite: true, updatedAt: 5 },
      { id: 'b', colors: ['bad'], source: 'generator', favorite: false, updatedAt: 1 },
      { colors: ['#123456'] },
      null,
      { id: 'c', colors: ['#123456'], source: 'other', favorite: 'yes' },
    ]
    expect(sanitizeEntries(data)).toEqual([
      { id: 'a', colors: ['#ABCDEF'], source: 'extractor', favorite: true, updatedAt: 5 },
      { id: 'c', colors: ['#123456'], source: 'generator', favorite: false, updatedAt: 0 },
    ])
    expect(sanitizeEntries('garbage')).toEqual([])
  })
})

describe('usePaletteLibrary', () => {
  beforeEach(() => resetPaletteLibrary(createMemoryStorage()))

  it('records, favors and removes palettes', async () => {
    const lib = usePaletteLibrary()
    await lib.record(['#111111', '#222222'], 'extractor')
    await lib.saveFavorite(['#333333'], 'generator')
    expect(lib.favorites.value.map((e) => e.colors)).toEqual([['#333333']])
    expect(lib.recent.value[0].source).toBe('extractor')
    expect(lib.isFavorite(['#333333'])).toBe(true)

    await lib.remove(lib.favorites.value[0].id)
    expect(lib.entries.value).toHaveLength(1)
  })

  it('reloads what was saved', async () => {
    const storage = createMemoryStorage()
    resetPaletteLibrary(storage)
    await usePaletteLibrary().saveFavorite(['#444444'], 'generator')

    resetPaletteLibrary(storage)
    const lib = usePaletteLibrary()
    await lib.ready()
    expect(lib.favorites.value[0].colors).toEqual(['#444444'])
  })

  it('keeps working for the visit when saving fails', async () => {
    resetPaletteLibrary({
      persistent: true,
      load: async () => [],
      save: async () => {
        throw new Error('quota')
      },
    })
    const lib = usePaletteLibrary()
    await lib.record(['#555555'], 'generator')
    expect(lib.entries.value).toHaveLength(1)
    expect(lib.persistent.value).toBe(false)
  })
})

describe('PaletteLibraryDialog', () => {
  beforeEach(() => {
    resetPaletteLibrary(createMemoryStorage())
    document.body.innerHTML = '<div id="app-layer"></div>'
  })

  it('saves the current palette and opens a saved one', async () => {
    const lib = usePaletteLibrary()
    await lib.record(['#AAAAAA', '#BBBBBB'], 'extractor')
    const wrapper = mount(PaletteLibraryDialog, {
      props: { show: true, colors: ['#123456', '#654321'], source: 'generator' },
      attachTo: document.body,
    })
    await nextTick()

    const save = document.querySelector<HTMLButtonElement>('[data-testid="library-save-current"]')!
    save.click()
    await lib.ready()
    await nextTick()
    await nextTick()
    expect(lib.isFavorite(['#123456', '#654321'])).toBe(true)
    expect(save.disabled).toBe(true)
    expect(document.querySelectorAll('[data-testid="library-entry"]')).toHaveLength(2)

    const recent = document.querySelector('[data-testid="library-recent"]')!
    recent.querySelector<HTMLButtonElement>('.library-open')!.click()
    expect(wrapper.emitted('open')).toEqual([[['#AAAAAA', '#BBBBBB']]])
    wrapper.unmount()
  })
})
