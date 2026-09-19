// ─── Palette export ───
// The single source of truth for every palette format the site offers, shared
// by the color extractor and the generator so both always expose the same
// list. Pure string building: no DOM, no store, so it stays testable.
//
// A palette entry is the neutral shape { hex, rgb: {r,g,b}, hsl: {h,s,l} };
// `paletteEntry()` builds one from whatever a caller already has.

import { rgbToHsl } from './colorGenerator'

/**
 * Every available format.
 *
 * `perColor` marks the formats that also read well as a single line next to
 * one swatch (the extractor renders them in its color list and on the exported
 * image). `ext` and `mime` drive the download, `labelKey` is the i18n key.
 */
export const EXPORT_FORMATS = [
  { key: 'hex', labelKey: 'exportHex', ext: 'txt', mime: 'text/plain', perColor: true },
  { key: 'rgb', labelKey: 'exportRgb', ext: 'txt', mime: 'text/plain', perColor: true },
  { key: 'rgba', labelKey: 'exportRgba', ext: 'txt', mime: 'text/plain', perColor: true },
  { key: 'hsl', labelKey: 'exportHsl', ext: 'txt', mime: 'text/plain', perColor: true },
  { key: 'hsla', labelKey: 'exportHsla', ext: 'txt', mime: 'text/plain', perColor: true },
  { key: 'css', labelKey: 'exportCss', ext: 'css', mime: 'text/css', perColor: true },
  { key: 'scss', labelKey: 'exportScss', ext: 'scss', mime: 'text/x-scss', perColor: true },
  {
    key: 'tailwind',
    labelKey: 'exportTailwind',
    ext: 'js',
    mime: 'text/javascript',
    perColor: true,
  },
  // A single token is a nested object — too much for a swatch label, so the
  // per-color rendering falls back to plain HEX.
  { key: 'tokens', labelKey: 'exportTokens', ext: 'json', mime: 'application/json' },
]

export const DEFAULT_EXPORT_FORMAT = 'css'

/** Look up a format descriptor by key (null for unknown keys). */
export function exportFormat(key) {
  return EXPORT_FORMATS.find((f) => f.key === key) || null
}

/** Normalize a hex string to upper-case `#RRGGBB`. */
function normalizeHex(hex) {
  const value = String(hex || '').replace(/^#/, '')
  return `#${value.toUpperCase()}`
}

/**
 * Build a palette entry. Missing `rgb`/`hsl` are derived from the hex value;
 * passing them keeps a caller's own values (the extractor stores its own HSL,
 * and rounding it a second time would shift what users see).
 */
export function paletteEntry(hex, rgb = null, hsl = null) {
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

function roundHsl({ h, s, l }) {
  return { h: Math.round(h), s: Math.round(s), l: Math.round(l) }
}

/** Token/variable name for the color at `index` (1-based, as shown in the UI). */
function colorName(index) {
  return `color-${index + 1}`
}

/**
 * Render one color as a single line in the given format. Used for the file
 * builders below and for the extractor's per-swatch labels. Unknown formats
 * and formats without a sensible one-liner fall back to HEX.
 */
export function formatColor(entry, format, index = 0) {
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
    case 'tailwind':
      return `'${colorName(index)}': '${hex}',`
    default:
      return hex
  }
}

function header(colors) {
  return `Kodini color palette — ${colors.length} colors`
}

/** Plain list: one color per line in the chosen notation. */
function buildList(colors, format) {
  return colors.map((c, i) => formatColor(c, format, i)).join('\n')
}

function buildCss(colors) {
  const lines = colors.map((c, i) => `  ${formatColor(c, 'css', i)}`)
  // Also valid inside Tailwind v4's @theme block, where CSS variables are the
  // theme configuration.
  return [`/* ${header(colors)} */`, ':root {', ...lines, '}', ''].join('\n')
}

function buildScss(colors) {
  const vars = colors.map((c, i) => formatColor(c, 'scss', i))
  const list = colors.map((_, i) => `$${colorName(i)}`).join(', ')
  return [`// ${header(colors)}`, ...vars, '', `$palette: (${list});`, ''].join('\n')
}

function buildTailwind(colors) {
  const entries = colors.map((c, i) => `        ${formatColor(c, 'tailwind', i)}`)
  return [
    `// ${header(colors)}`,
    '// Tailwind CSS v3 — merge into tailwind.config.js.',
    '// On Tailwind v4, use the CSS export inside your @theme block instead.',
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
function buildTokens(colors) {
  const color = {}
  colors.forEach((c, i) => {
    color[colorName(i)] = { $type: 'color', $value: c.hex }
  })
  return `${JSON.stringify({ color }, null, 2)}\n`
}

const BUILDERS = {
  css: buildCss,
  scss: buildScss,
  tailwind: buildTailwind,
  tokens: buildTokens,
}

/**
 * Render a whole palette in the given format.
 *
 * @param {string} format one of EXPORT_FORMATS' keys
 * @param {Array} colors palette entries (see `paletteEntry`)
 * @param {{ basename?: string }} [options] file name without extension
 * @returns {{ filename: string, mime: string, content: string }|null}
 *   null for an unknown format or an empty palette, so callers can bail out.
 */
export function buildPaletteExport(format, colors, options = {}) {
  const descriptor = exportFormat(format)
  if (!descriptor || !Array.isArray(colors) || colors.length === 0) return null
  const basename = options.basename || 'kodini-palette'
  const build = BUILDERS[descriptor.key]
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
export function downloadPaletteFile(file) {
  if (!file) return false
  const blob = new Blob([file.content], { type: `${file.mime};charset=utf-8` })
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
