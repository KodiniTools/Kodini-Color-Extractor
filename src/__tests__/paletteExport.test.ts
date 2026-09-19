import { describe, it, expect, beforeEach, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'

const HEXES = ['#49313E', '#77506A', '#A17389']

async function mod() {
  return await import('../lib/core/paletteExport')
}

async function entries(hexes = HEXES) {
  const { paletteEntry } = await mod()
  return hexes.map((h) => paletteEntry(h))
}

describe('paletteExport - palette entries', () => {
  beforeEach(() => vi.resetModules())

  it('derives rgb and hsl from a hex value', async () => {
    const { paletteEntry } = await mod()
    const entry = paletteEntry('#FF0000')
    expect(entry.hex).toBe('#FF0000')
    expect(entry.rgb).toEqual({ r: 255, g: 0, b: 0 })
    expect(entry.hsl).toEqual({ h: 0, s: 100, l: 50 })
  })

  it('normalizes hex input (missing #, lower case)', async () => {
    const { paletteEntry } = await mod()
    expect(paletteEntry('49313e').hex).toBe('#49313E')
    expect(paletteEntry('#49313e').hex).toBe('#49313E')
  })

  it('keeps the rgb it is given instead of re-parsing', async () => {
    const { paletteEntry } = await mod()
    const rgb = { r: 1, g: 2, b: 3 }
    expect(paletteEntry('#010203', rgb).rgb).toBe(rgb)
  })
})

describe('paletteExport - formats', () => {
  beforeEach(() => vi.resetModules())

  it('exposes a filename and mime type per format', async () => {
    const { EXPORT_FORMATS, buildPaletteExport } = await mod()
    const colors = await entries()
    for (const f of EXPORT_FORMATS) {
      const file = buildPaletteExport(f.key, colors)
      expect(file, `format ${f.key}`).not.toBeNull()
      expect(file!.filename).toBe(`kodini-palette.${f.ext}`)
      expect(file!.mime).toBe(f.mime)
      expect(file!.content.length).toBeGreaterThan(0)
      // Every format has to carry every color of the palette.
      for (const hex of HEXES) expect(file!.content).toContain(hex)
    }
  })

  it('hex export is one color per line', async () => {
    const { buildPaletteExport } = await mod()
    const file = buildPaletteExport('hex', await entries())
    expect(file!.content).toBe(HEXES.join('\n'))
  })

  it('css export declares custom properties on :root', async () => {
    const { buildPaletteExport } = await mod()
    const content = buildPaletteExport('css', await entries())!.content
    expect(content).toContain(':root {')
    expect(content).toContain('  --color-1: #49313E;')
    expect(content).toContain('  --color-3: #A17389;')
    expect(content.trimEnd().endsWith('}')).toBe(true)
  })

  it('scss export declares variables and a palette list', async () => {
    const { buildPaletteExport } = await mod()
    const content = buildPaletteExport('scss', await entries())!.content
    expect(content).toContain('$color-1: #49313E;')
    expect(content).toContain('$palette: ($color-1, $color-2, $color-3);')
  })

  it('tailwind export is a requireable config object', async () => {
    const { buildPaletteExport } = await mod()
    const content = buildPaletteExport('tailwind', await entries())!.content
    expect(content).toContain('module.exports = {')
    expect(content).toContain("'color-1': '#49313E',")
    // The snippet has to be syntactically valid JS, not just look like it.
    const factory = new Function('module', `${content}; return module.exports`)
    const config = factory({ exports: {} })
    expect(config.theme.extend.colors).toEqual({
      'color-1': '#49313E',
      'color-2': '#77506A',
      'color-3': '#A17389',
    })
  })

  it('tokens export is valid DTCG json', async () => {
    const { buildPaletteExport } = await mod()
    const content = buildPaletteExport('tokens', await entries())!.content
    const parsed = JSON.parse(content)
    expect(Object.keys(parsed.color)).toEqual(['color-1', 'color-2', 'color-3'])
    expect(parsed.color['color-1']).toEqual({ $type: 'color', $value: '#49313E' })
  })

  it('returns null for an unknown format or an empty palette', async () => {
    const { buildPaletteExport } = await mod()
    expect(buildPaletteExport('nope', await entries())).toBeNull()
    expect(buildPaletteExport('css', [])).toBeNull()
    expect(buildPaletteExport('css', null as never)).toBeNull()
  })

  it('honours a custom basename', async () => {
    const { buildPaletteExport } = await mod()
    const file = buildPaletteExport('css', await entries(), { basename: 'brand' })
    expect(file!.filename).toBe('brand.css')
  })
})

describe('useColorGenerator - download', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.resetModules()
  })

  async function setup() {
    const { useColorGenerator } = await import('../composables/useColorGenerator')
    let api: ReturnType<typeof useColorGenerator>
    mount(
      defineComponent({
        setup() {
          api = useColorGenerator()
          return () => h('div')
        },
      })
    )
    return api!
  }

  // Capture the blob contents and the anchor the download builds.
  function stubDownload() {
    const captured: { name?: string; type?: string; text?: string } = {}
    const blobs: Blob[] = []
    const createObjectURL = vi.fn((blob: Blob) => {
      blobs.push(blob)
      captured.type = blob.type
      return 'blob:stub'
    })
    vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL: vi.fn() })
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement
    ) {
      captured.name = this.download
    })
    return {
      captured,
      async text() {
        return await blobs[0].text()
      },
      restore() {
        click.mockRestore()
        vi.unstubAllGlobals()
      },
    }
  }

  it('defaults to the css format', async () => {
    const api = await setup()
    const { DEFAULT_EXPORT_FORMAT } = await mod()
    expect(api.exportFormat.value).toBe(DEFAULT_EXPORT_FORMAT)
    expect(api.exportFormat.value).toBe('css')
  })

  it('only accepts known formats', async () => {
    const api = await setup()
    api.setExportFormat('scss')
    expect(api.exportFormat.value).toBe('scss')
    api.setExportFormat('definitely-not-a-format')
    expect(api.exportFormat.value).toBe('scss')
  })

  it('downloads the selected format with the right file name', async () => {
    const api = await setup()
    const stub = stubDownload()
    try {
      api.setExportFormat('scss')
      api.downloadPalette()
      expect(stub.captured.name).toBe('kodini-palette.scss')
      expect(stub.captured.type).toContain('text/x-scss')
      expect(await stub.text()).toContain('$color-1:')
    } finally {
      stub.restore()
    }
  })

  it('exports the adjusted colors, not the untouched base values', async () => {
    const api = await setup()
    const stub = stubDownload()
    try {
      const before = api.palette.value.map((c) => c.base.r)
      api.setAdjust('brightness', 0) // everything to black
      api.setExportFormat('hex')
      api.downloadPalette()
      const content = await stub.text()
      expect(content.split('\n')).toEqual(api.palette.value.map(() => '#000000'))
      // The base colors are untouched — only the displayed value was exported.
      expect(api.palette.value.map((c) => c.base.r)).toEqual(before)
    } finally {
      stub.restore()
    }
  })
})
