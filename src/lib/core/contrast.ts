// WCAG 2.x contrast between palette colors: the ratio formula, the pass
// levels, and the pairings the contrast dialog shows.
import { hexToRgb, type Rgb } from './colorGenerator'

/** WCAG level a ratio passes; 'AA18' is AA for large text only. */
export type WcagLevel = 'AAA' | 'AA' | 'AA18' | 'fail'

export interface ContrastPair {
  text: string
  background: string
  ratio: number
  level: WcagLevel
}

// Text colors offered next to the palette when nothing inside it is readable
// enough on a background.
export const NEUTRAL_TEXT = ['#FFFFFF', '#000000']

// Minimum ratios from WCAG 2.2, success criteria 1.4.3 and 1.4.6.
const AAA = 7
const AA = 4.5
const AA_LARGE = 3

function channel(value: number): number {
  const c = value / 255
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

/**
 * WCAG relative luminance of an { r, g, b } color (0-255), from 0 to 1.
 */
export function relativeLuminance({ r, g, b }: Rgb): number {
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

/**
 * Contrast ratio between two #RRGGBB colors, from 1 to 21. Order does not
 * matter. Returns null when either color is not a valid hex value.
 */
export function contrastRatio(hexA: string, hexB: string): number | null {
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
 */
export function wcagLevel(ratio: number | null): WcagLevel {
  if (ratio === null || !(ratio >= AA_LARGE)) return 'fail'
  if (ratio >= AAA) return 'AAA'
  if (ratio >= AA) return 'AA'
  return 'AA18'
}

/**
 * Display form of a ratio: two decimals rounded down, so a value that fails a
 * threshold never shows as reaching it (4.499 reads 4.49, not 4.50).
 */
export function formatRatio(ratio: number): string {
  return (Math.floor(ratio * 100) / 100).toFixed(2)
}

// Both colors come from uniqueHexes or NEUTRAL_TEXT, so they are valid.
function pair(text: string, background: string): ContrastPair {
  const ratio = contrastRatio(text, background)!
  return { text, background, ratio, level: wcagLevel(ratio) }
}

// Uppercase, valid and without repeats, keeping the palette order.
function uniqueHexes(hexes: readonly string[] | null | undefined): string[] {
  const seen = new Set<string>()
  const out: string[] = []
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
 */
export function contrastMatrix(hexes: readonly string[]): {
  colors: string[]
  rows: (ContrastPair | null)[][]
} {
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
 */
export function bestPairs(hexes: readonly string[], limit = 5): ContrastPair[] {
  const colors = uniqueHexes(hexes)
  const pairs: ContrastPair[] = []
  for (let i = 0; i < colors.length; i++) {
    for (let j = i + 1; j < colors.length; j++) {
      // uniqueHexes keeps valid colors only.
      const li = relativeLuminance(hexToRgb(colors[i])!)
      const lj = relativeLuminance(hexToRgb(colors[j])!)
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
 */
export function textSuggestions(
  hexes: readonly string[]
): (ContrastPair & { fromPalette: boolean })[] {
  const colors = uniqueHexes(hexes)
  return colors.map((background) => {
    let best: ContrastPair | null = null
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
