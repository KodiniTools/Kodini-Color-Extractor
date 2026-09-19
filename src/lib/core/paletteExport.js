// ─── Palette export ───
// Turns a palette into the file formats web designers actually paste into a
// project. Pure string building: no DOM, no store, so both the generator and
// the extractor can share it and it stays trivially testable.
//
// A palette entry is the neutral shape { hex, rgb: {r,g,b}, hsl: {h,s,l} };
// `paletteEntry()` builds one from any color descriptor.

import { rgbToHsl } from './colorGenerator'

/**
 * Available export formats. `ext` and `mime` drive the download, `labelKey`
 * is the i18n key shown in the format picker.
 */
export const EXPORT_FORMATS = [
  { key: 'hex', labelKey: 'exportHex', ext: 'txt', mime: 'text/plain' },
  { key: 'css', labelKey: 'exportCss', ext: 'css', mime: 'text/css' },
  { key: 'scss', labelKey: 'exportScss', ext: 'scss', mime: 'text/x-scss' },
  { key: 'tailwind', labelKey: 'exportTailwind', ext: 'js', mime: 'text/javascript' },
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
 * Build a palette entry from a hex value plus optional rgb. Missing rgb/hsl
 * are derived, so callers can pass whatever they already have.
 */
export function paletteEntry(hex, rgb = null) {
  const normalized = normalizeHex(hex)
  const channels = rgb || {
    r: parseInt(normalized.slice(1, 3), 16),
    g: parseInt(normalized.slice(3, 5), 16),
    b: parseInt(normalized.slice(5, 7), 16),
  }
  return { hex: normalized, rgb: channels, hsl: rgbToHsl(channels) }
}

/** Token/variable name for the color at `index` (1-based, as shown in the UI). */
function colorName(index) {
  return `color-${index + 1}`
}

function header(colors) {
  return `Kodini color palette — ${colors.length} colors`
}

function buildHex(colors) {
  return colors.map((c) => c.hex).join('\n')
}

function buildCss(colors) {
  const lines = colors.map((c, i) => `  --${colorName(i)}: ${c.hex};`)
  // Also valid inside Tailwind v4's @theme block, where CSS variables are the
  // theme configuration.
  return [`/* ${header(colors)} */`, ':root {', ...lines, '}', ''].join('\n')
}

function buildScss(colors) {
  const vars = colors.map((c, i) => `$${colorName(i)}: ${c.hex};`)
  const list = colors.map((_, i) => `$${colorName(i)}`).join(', ')
  return [`// ${header(colors)}`, ...vars, '', `$palette: (${list});`, ''].join('\n')
}

function buildTailwind(colors) {
  const entries = colors.map((c, i) => `        '${colorName(i)}': '${c.hex}',`)
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
  hex: buildHex,
  css: buildCss,
  scss: buildScss,
  tailwind: buildTailwind,
  tokens: buildTokens,
}

/**
 * Render a palette in the given format.
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
  return {
    filename: `${basename}.${descriptor.ext}`,
    mime: descriptor.mime,
    content: BUILDERS[descriptor.key](colors),
  }
}
