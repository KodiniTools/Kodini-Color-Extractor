// WCAG 2.x contrast between palette colors: the ratio formula, the pass
// levels, and the pairings the contrast dialog shows.
import { hexToRgb } from './colorGenerator.js'

// Text colors offered next to the palette when nothing inside it is readable
// enough on a background.
export const NEUTRAL_TEXT = ['#FFFFFF', '#000000']

// Minimum ratios from WCAG 2.2, success criteria 1.4.3 and 1.4.6.
const AAA = 7
const AA = 4.5
const AA_LARGE = 3

function channel(value) {
  const c = value / 255
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

/**
 * WCAG relative luminance of an { r, g, b } color (0-255), from 0 to 1.
 * @param {{r:number,g:number,b:number}} rgb
 * @returns {number}
 */
export function relativeLuminance({ r, g, b }) {
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

/**
 * Contrast ratio between two #RRGGBB colors, from 1 to 21. Order does not
 * matter. Returns null when either color is not a valid hex value.
 * @param {string} hexA
 * @param {string} hexB
 * @returns {number|null}
 */
export function contrastRatio(hexA, hexB) {
  const a = hexToRgb(hexA)
  const b = hexToRgb(hexB)
  if (!a || !b) return null
  const la = relativeLuminance(a)
  const lb = relativeLuminance(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

/**
 * The highest WCAG level a ratio passes: 'AAA', 'AA', 'AA18' (AA for large
 * text only, 18pt or 14pt bold) or 'fail'. Compares the unrounded ratio, as
 * WCAG requires, so 4.49 fails AA even though it displays as 4.5.
 * @param {number|null} ratio
 * @returns {'AAA'|'AA'|'AA18'|'fail'}
 */
export function wcagLevel(ratio) {
  if (!(ratio >= AA_LARGE)) return 'fail'
  if (ratio >= AAA) return 'AAA'
  if (ratio >= AA) return 'AA'
  return 'AA18'
}

/**
 * Display form of a ratio: two decimals rounded down, so a value that fails a
 * threshold never shows as reaching it (4.499 reads 4.49, not 4.50).
 * @param {number} ratio
 * @returns {string}
 */
export function formatRatio(ratio) {
  return (Math.floor(ratio * 100) / 100).toFixed(2)
}

function pair(text, background) {
  const ratio = contrastRatio(text, background)
  return { text, background, ratio, level: wcagLevel(ratio) }
}

// Uppercase, valid and without repeats, keeping the palette order.
function uniqueHexes(hexes) {
  const seen = new Set()
  const out = []
  for (const hex of hexes || []) {
    if (!hexToRgb(hex)) continue
    const norm = `#${String(hex).trim().replace(/^#/, '').toUpperCase()}`
    if (seen.has(norm)) continue
    seen.add(norm)
    out.push(norm)
  }
  return out
}

/**
 * Every text/background combination of the palette, row by row: rows are the
 * text colors, columns the backgrounds. The diagonal (a color on itself) is
 * null.
 * @param {string[]} hexes
 * @returns {{colors:string[], rows:Array<Array<{text:string,background:string,ratio:number,level:string}|null>>}}
 */
export function contrastMatrix(hexes) {
  const colors = uniqueHexes(hexes)
  const rows = colors.map((text, i) =>
    colors.map((background, j) => (i === j ? null : pair(text, background)))
  )
  return { colors, rows }
}

/**
 * The most readable pairings inside the palette, best first. Each pair of
 * colors appears once, with the lighter color as background. Only pairs that
 * pass at least AA for large text are returned.
 * @param {string[]} hexes
 * @param {number} [limit=5]
 */
export function bestPairs(hexes, limit = 5) {
  const colors = uniqueHexes(hexes)
  const pairs = []
  for (let i = 0; i < colors.length; i++) {
    for (let j = i + 1; j < colors.length; j++) {
      const li = relativeLuminance(hexToRgb(colors[i]))
      const lj = relativeLuminance(hexToRgb(colors[j]))
      const [text, background] = li <= lj ? [colors[i], colors[j]] : [colors[j], colors[i]]
      const p = pair(text, background)
      if (p.level !== 'fail') pairs.push(p)
    }
  }
  return pairs.sort((a, b) => b.ratio - a.ratio).slice(0, limit)
}

/**
 * For each palette color as background, the most readable text color: the
 * best one from the palette, or white/black when no palette color reaches AA.
 * `fromPalette` tells which of the two it is.
 * @param {string[]} hexes
 */
export function textSuggestions(hexes) {
  const colors = uniqueHexes(hexes)
  return colors.map((background) => {
    let best = null
    for (const text of colors) {
      if (text === background) continue
      const p = pair(text, background)
      if (!best || p.ratio > best.ratio) best = p
    }
    if (best && best.ratio >= AA) return { ...best, fromPalette: true }
    const neutral = NEUTRAL_TEXT.map((text) => pair(text, background)).sort(
      (a, b) => b.ratio - a.ratio
    )[0]
    return { ...neutral, fromPalette: false }
  })
}
