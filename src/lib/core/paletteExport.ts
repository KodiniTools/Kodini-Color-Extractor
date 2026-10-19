// ─── Palette export ───
// The single source of truth for every palette format the site offers, shared
// by the color extractor and the generator so both always expose the same
// list. Pure string building: no DOM, no store, so it stays testable.
//
// A palette entry is the neutral shape { hex, rgb: {r,g,b}, hsl: {h,s,l} };
// `paletteEntry()` builds one from whatever a caller already has.

import { rgbToHsl, type Hsl, type Rgb } from './colorGenerator'

/** The neutral shape every format is built from. */
export interface PaletteEntry {
  hex: string
  rgb: Rgb
  hsl: Hsl
}

export interface ExportFormat {
  key: string
  labelKey: string
  ext: string
  mime: string
  perColor?: boolean
  binary?: boolean
}

export interface ExportFile {
  filename: string
  mime: string
  /** A Uint8Array for `binary` formats, otherwise text. */
  content: string | Uint8Array<ArrayBuffer>
}

/**
 * Every available format.
 *
 * `perColor` marks the formats that also read well as a single line next to
 * one swatch (the extractor renders them in its color list and on the exported
 * image). `ext` and `mime` drive the download, `labelKey` is the i18n key.
 * `binary` formats build a Uint8Array instead of text; they can be downloaded
 * but not copied as text.
 */
export const EXPORT_FORMATS: ExportFormat[] = [
  { key: 'hex', labelKey: 'exportHex', ext: 'txt', mime: 'text/plain', perColor: true },
  { key: 'rgb', labelKey: 'exportRgb', ext: 'txt', mime: 'text/plain', perColor: true },
  { key: 'rgba', labelKey: 'exportRgba', ext: 'txt', mime: 'text/plain', perColor: true },
  { key: 'hsl', labelKey: 'exportHsl', ext: 'txt', mime: 'text/plain', perColor: true },
  { key: 'hsla', labelKey: 'exportHsla', ext: 'txt', mime: 'text/plain', perColor: true },
  { key: 'css', labelKey: 'exportCss', ext: 'css', mime: 'text/css', perColor: true },
  { key: 'scss', labelKey: 'exportScss', ext: 'scss', mime: 'text/x-scss', perColor: true },
  {
    key: 'tailwind4',
    labelKey: 'exportTailwind4',
    ext: 'css',
    mime: 'text/css',
    perColor: true,
  },
  {
    key: 'tailwind',
    labelKey: 'exportTailwind',
    ext: 'js',
    mime: 'text/javascript',
    perColor: true,
  },
  // A single token is a nested object — too much for a swatch label, so the
  // per-color rendering falls back to plain HEX. The same goes for the
  // palette-file formats of design apps below.
  { key: 'tokens', labelKey: 'exportTokens', ext: 'json', mime: 'application/json' },
  { key: 'gpl', labelKey: 'exportGpl', ext: 'gpl', mime: 'text/plain' },
  {
    key: 'ase',
    labelKey: 'exportAse',
    ext: 'ase',
    mime: 'application/octet-stream',
    binary: true,
  },
]

export const DEFAULT_EXPORT_FORMAT = 'css'

/** Look up a format descriptor by key (null for unknown keys). */
export function exportFormat(key: string): ExportFormat | null {
  return EXPORT_FORMATS.find((f) => f.key === key) || null
}

/** Normalize a hex string to upper-case `#RRGGBB`. */
function normalizeHex(hex: string | null | undefined): string {
  const value = String(hex || '').replace(/^#/, '')
  return `#${value.toUpperCase()}`
}

/**
 * Build a palette entry. Missing `rgb`/`hsl` are derived from the hex value;
 * passing them keeps a caller's own values (the extractor stores its own HSL,
 * and rounding it a second time would shift what users see).
 */
export function paletteEntry(
  hex: string,
  rgb: Rgb | null = null,
  hsl: Hsl | null = null
): PaletteEntry {
  const normalized = normalizeHex(hex)
  const channels = rgb || {
    r: parseInt(normalized.slice(1, 3), 16),
    g: parseInt(normalized.slice(3, 5), 16),
    b: parseInt(normalized.slice(5, 7), 16),
  }
  // colorGenerator's rgbToHsl keeps full precision for the adjustment math;
  // an exported entry is display data, so it is rounded to whole units here.
  return { hex: normalized, rgb: channels, hsl: hsl || roundHsl(rgbToHsl(channels)) }
}

function roundHsl({ h, s, l }: Hsl): Hsl {
  return { h: Math.round(h), s: Math.round(s), l: Math.round(l) }
}

/** Token/variable name for the color at `index` (1-based, as shown in the UI). */
function colorName(index: number): string {
  return `color-${index + 1}`
}

/**
 * Tailwind v4 reads theme colors from `--color-*` variables; the name after
 * the prefix becomes the utility (`--color-palette-1` → `bg-palette-1`).
 */
function tailwind4Name(index: number): string {
  return `palette-${index + 1}`
}

/** Swatch name in design-app palettes: position and value, e.g. `color-1 #49313E`. */
function swatchName(entry: PaletteEntry, index: number): string {
  return `${colorName(index)} ${entry.hex}`
}

/**
 * Render one color as a single line in the given format. Used for the file
 * builders below and for the extractor's per-swatch labels. Unknown formats
 * and formats without a sensible one-liner fall back to HEX.
 */
export function formatColor(entry: PaletteEntry, format: string, index = 0): string {
  const { hex, rgb } = entry
  // Last line of defence: a caller-supplied HSL is emitted as whole units too.
  const hsl = roundHsl(entry.hsl)
  switch (format) {
    case 'rgb':
      return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`
    case 'rgba':
      return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 1)`
    case 'hsl':
      return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`
    case 'hsla':
      return `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, 1)`
    case 'css':
      return `--${colorName(index)}: ${hex};`
    case 'scss':
      return `$${colorName(index)}: ${hex};`
    case 'tailwind4':
      return `--color-${tailwind4Name(index)}: ${hex};`
    case 'tailwind':
      return `'${colorName(index)}': '${hex}',`
    default:
      return hex
  }
}

/**
 * True when a format's one-line rendering already spells out the HEX value,
 * so a UI showing that line does not need to repeat the HEX underneath.
 */
export function showsHexInline(format: string): boolean {
  return !['rgb', 'rgba', 'hsl', 'hsla'].includes(format)
}

type Colors = readonly PaletteEntry[]

function header(colors: Colors): string {
  return `Kodini color palette — ${colors.length} colors`
}

/** Plain list: one color per line in the chosen notation. */
function buildList(colors: Colors, format: string): string {
  return colors.map((c, i) => formatColor(c, format, i)).join('\n')
}

function buildCss(colors: Colors): string {
  const lines = colors.map((c, i) => `  ${formatColor(c, 'css', i)}`)
  return [`/* ${header(colors)} */`, ':root {', ...lines, '}', ''].join('\n')
}

function buildScss(colors: Colors): string {
  const vars = colors.map((c, i) => formatColor(c, 'scss', i))
  const list = colors.map((_, i) => `$${colorName(i)}`).join(', ')
  return [`// ${header(colors)}`, ...vars, '', `$palette: (${list});`, ''].join('\n')
}

function buildTailwind(colors: Colors): string {
  const entries = colors.map((c, i) => `        ${formatColor(c, 'tailwind', i)}`)
  return [
    `// ${header(colors)}`,
    '// Tailwind CSS v3 — merge into tailwind.config.js.',
    '// On Tailwind v4, use the "Tailwind v4 theme" export instead.',
    'module.exports = {',
    '  theme: {',
    '    extend: {',
    '      colors: {',
    ...entries,
    '      },',
    '    },',
    '  },',
    '}',
    '',
  ].join('\n')
}

/**
 * W3C Design Tokens Community Group format — the interchange shape read by
 * Style Dictionary, Tokens Studio and the Figma variables plugins. Values are
 * hex strings, which is what those tools consume in practice.
 */
function buildTokens(colors: Colors): string {
  const color: Record<string, { $type: 'color'; $value: string }> = {}
  colors.forEach((c, i) => {
    color[colorName(i)] = { $type: 'color', $value: c.hex }
  })
  return `${JSON.stringify({ color }, null, 2)}\n`
}

/**
 * Tailwind CSS v4: theme variables in an @theme block, placed in the CSS file
 * that imports Tailwind. Each color becomes utilities like `bg-palette-1`.
 */
function buildTailwind4(colors: Colors): string {
  const lines = colors.map((c, i) => `  ${formatColor(c, 'tailwind4', i)}`)
  return [
    `/* ${header(colors)} */`,
    '/* Tailwind CSS v4 — add below @import "tailwindcss"; in your main CSS file. */',
    '@theme {',
    ...lines,
    '}',
    '',
  ].join('\n')
}

/**
 * GIMP palette (.gpl), also read by Inkscape and Krita: a header, then one
 * swatch per line as right-aligned R G B followed by a tab and the name.
 */
function buildGpl(colors: Colors): string {
  const pad = (n: number) => String(n).padStart(3, ' ')
  const rows = colors.map(
    (c, i) => `${pad(c.rgb.r)} ${pad(c.rgb.g)} ${pad(c.rgb.b)}\t${swatchName(c, i)}`
  )
  return ['GIMP Palette', 'Name: Kodini palette', 'Columns: 0', '#', ...rows, ''].join('\n')
}

/**
 * Adobe Swatch Exchange (.ase), read by Photoshop, Illustrator and InDesign.
 * Big-endian: the 'ASEF' signature, version 1.0 and the block count, then one
 * color-entry block per swatch with a UTF-16 name, the 'RGB ' model, three
 * float32 channels from 0 to 1 and the color type (2 = normal).
 */
function buildAse(colors: Colors): Uint8Array<ArrayBuffer> {
  const blocks = colors.map((c, i) => {
    const name = swatchName(c, i)
    const nameUnits = name.length + 1 // UTF-16 code units, null terminator included
    const length = 2 + nameUnits * 2 + 4 + 3 * 4 + 2
    return { name, nameUnits, length, rgb: c.rgb }
  })
  const total = 12 + blocks.reduce((sum, b) => sum + 6 + b.length, 0)
  const view = new DataView(new ArrayBuffer(total))
  let offset = 0
  const ascii = (text: string) => {
    for (const ch of text) view.setUint8(offset++, ch.charCodeAt(0))
  }
  ascii('ASEF')
  view.setUint16(offset, 1)
  view.setUint16(offset + 2, 0)
  view.setUint32(offset + 4, blocks.length)
  offset += 8
  for (const block of blocks) {
    view.setUint16(offset, 0x0001) // color entry
    view.setUint32(offset + 2, block.length)
    view.setUint16(offset + 6, block.nameUnits)
    offset += 8
    for (let i = 0; i < block.name.length; i++) {
      view.setUint16(offset, block.name.charCodeAt(i))
      offset += 2
    }
    offset += 2 // null terminator, already zero
    ascii('RGB ')
    for (const channel of [block.rgb.r, block.rgb.g, block.rgb.b]) {
      view.setFloat32(offset, channel / 255)
      offset += 4
    }
    view.setUint16(offset, 2)
    offset += 2
  }
  return new Uint8Array(view.buffer)
}

const BUILDERS: Record<string, (colors: Colors) => string | Uint8Array<ArrayBuffer>> = {
  css: buildCss,
  scss: buildScss,
  tailwind4: buildTailwind4,
  tailwind: buildTailwind,
  tokens: buildTokens,
  gpl: buildGpl,
  ase: buildAse,
}

/**
 * Render a whole palette in the given format.
 *
 * @param format one of EXPORT_FORMATS' keys
 * @param colors palette entries (see `paletteEntry`)
 * @param options.basename file name without extension
 * @returns null for an unknown format or an empty palette, so callers
 *   can bail out.
 */
export function buildPaletteExport(
  format: string,
  colors: Colors,
  options: { basename?: string } = {}
): ExportFile | null {
  const descriptor = exportFormat(format)
  if (!descriptor || !Array.isArray(colors) || colors.length === 0) return null
  const basename = options.basename || 'kodini-palette'
  const build = Object.hasOwn(BUILDERS, descriptor.key) ? BUILDERS[descriptor.key] : undefined
  return {
    filename: `${basename}.${descriptor.ext}`,
    mime: descriptor.mime,
    content: build ? build(colors) : buildList(colors, descriptor.key),
  }
}

/**
 * Hand a rendered palette to the browser as a file download. Kept here so the
 * extractor and the generator save files the exact same way.
 */
export function downloadPaletteFile(file: ExportFile | null): boolean {
  if (!file) return false
  const type = typeof file.content === 'string' ? `${file.mime};charset=utf-8` : file.mime
  const blob = new Blob([file.content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = file.filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
  return true
}
