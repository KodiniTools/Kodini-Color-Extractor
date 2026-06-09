import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

describe('palette store - rgbToHsl', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.resetModules()
  })

  it('converts pure red (255,0,0) correctly', async () => {
    const { usePaletteStore } = await import('../stores/palette')
    const store = usePaletteStore()
    const hsl = store.rgbToHsl(255, 0, 0)
    expect(hsl.h).toBe(0)
    expect(hsl.s).toBe(100)
    expect(hsl.l).toBe(50)
  })

  it('converts pure green (0,255,0) correctly', async () => {
    const { usePaletteStore } = await import('../stores/palette')
    const store = usePaletteStore()
    const hsl = store.rgbToHsl(0, 255, 0)
    expect(hsl.h).toBe(120)
    expect(hsl.s).toBe(100)
    expect(hsl.l).toBe(50)
  })

  it('converts pure blue (0,0,255) correctly', async () => {
    const { usePaletteStore } = await import('../stores/palette')
    const store = usePaletteStore()
    const hsl = store.rgbToHsl(0, 0, 255)
    expect(hsl.h).toBe(240)
    expect(hsl.s).toBe(100)
    expect(hsl.l).toBe(50)
  })

  it('converts white (255,255,255) correctly', async () => {
    const { usePaletteStore } = await import('../stores/palette')
    const store = usePaletteStore()
    const hsl = store.rgbToHsl(255, 255, 255)
    expect(hsl.s).toBe(0)
    expect(hsl.l).toBe(100)
  })

  it('converts black (0,0,0) correctly', async () => {
    const { usePaletteStore } = await import('../stores/palette')
    const store = usePaletteStore()
    const hsl = store.rgbToHsl(0, 0, 0)
    expect(hsl.s).toBe(0)
    expect(hsl.l).toBe(0)
  })
})

describe('palette store - getFormatted', () => {
  const color = { r: 255, g: 100, b: 50, hex: '#ff6432', hsl: { h: 16, s: 100, l: 60 } }

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.resetModules()
  })

  it('formats hex (uppercased)', async () => {
    const { usePaletteStore } = await import('../stores/palette')
    const store = usePaletteStore()
    store.setDownloadFormat('hex')
    expect(store.getFormatted(color, 0)).toBe('#FF6432')
  })

  it('formats rgb', async () => {
    const { usePaletteStore } = await import('../stores/palette')
    const store = usePaletteStore()
    store.setDownloadFormat('rgb')
    expect(store.getFormatted(color, 0)).toBe('rgb(255, 100, 50)')
  })

  it('formats rgba', async () => {
    const { usePaletteStore } = await import('../stores/palette')
    const store = usePaletteStore()
    store.setDownloadFormat('rgba')
    expect(store.getFormatted(color, 0)).toBe('rgba(255, 100, 50, 1)')
  })

  it('formats hsl', async () => {
    const { usePaletteStore } = await import('../stores/palette')
    const store = usePaletteStore()
    store.setDownloadFormat('hsl')
    expect(store.getFormatted(color, 0)).toBe('hsl(16, 100%, 60%)')
  })

  it('formats hsla', async () => {
    const { usePaletteStore } = await import('../stores/palette')
    const store = usePaletteStore()
    store.setDownloadFormat('hsla')
    expect(store.getFormatted(color, 0)).toBe('hsla(16, 100%, 60%, 1)')
  })

  it('formats css custom property', async () => {
    const { usePaletteStore } = await import('../stores/palette')
    const store = usePaletteStore()
    store.setDownloadFormat('css')
    expect(store.getFormatted(color, 0)).toBe('--color-1: #ff6432;')
  })
})

describe('palette store - setColorCount', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.resetModules()
  })

  it('sets color count', async () => {
    const { usePaletteStore } = await import('../stores/palette')
    const store = usePaletteStore()
    store.setColorCount(10)
    expect(store.colorCount).toBe(10)
  })

  it('allows minimum value of 1', async () => {
    const { usePaletteStore } = await import('../stores/palette')
    const store = usePaletteStore()
    store.setColorCount(1)
    expect(store.colorCount).toBe(1)
  })

  it('allows maximum value of 20', async () => {
    const { usePaletteStore } = await import('../stores/palette')
    const store = usePaletteStore()
    store.setColorCount(20)
    expect(store.colorCount).toBe(20)
  })
})

describe('palette store - getPaletteText (via getFormatted)', () => {
  it('getFormatted produces correct hex output for multiple colors', async () => {
    setActivePinia(createPinia())
    const { usePaletteStore } = await import('../stores/palette')
    const store = usePaletteStore()
    store.setDownloadFormat('hex')
    const c1 = { r: 255, g: 0, b: 0, hex: '#ff0000', hsl: { h: 0, s: 100, l: 50 } }
    const c2 = { r: 0, g: 255, b: 0, hex: '#00ff00', hsl: { h: 120, s: 100, l: 50 } }
    const lines = [c1, c2].map((c, i) => store.getFormatted(c, i))
    const text = lines.join('\n')
    expect(text).toContain('#FF0000')
    expect(text).toContain('#00FF00')
    expect(lines.length).toBe(2)
  })

  it('getFormatted css wraps as CSS custom properties', async () => {
    setActivePinia(createPinia())
    const { usePaletteStore } = await import('../stores/palette')
    const store = usePaletteStore()
    store.setDownloadFormat('css')
    const c1 = { r: 255, g: 0, b: 0, hex: '#ff0000', hsl: { h: 0, s: 100, l: 50 } }
    const c2 = { r: 0, g: 0, b: 255, hex: '#0000ff', hsl: { h: 240, s: 100, l: 50 } }
    const lines = [c1, c2].map((c, i) => store.getFormatted(c, i))
    const cssBlock = ':root {\n' + lines.map((l) => '  ' + l).join('\n') + '\n}'
    expect(cssBlock.startsWith(':root {')).toBe(true)
    expect(cssBlock).toContain('--color-1:')
    expect(cssBlock).toContain('--color-2:')
    expect(cssBlock.endsWith('}')).toBe(true)
  })
})
