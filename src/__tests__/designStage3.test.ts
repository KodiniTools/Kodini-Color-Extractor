/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * Etappe 3 des Design-Umbaus: kodini-controls-stage3.css färbt Upload,
 * Einstellungen, Regler und Dialoge. Farben kommen aus den --app-stage1-*
 * Tokens (direkt oder über die --kce-nav-* Aliasse aus Etappe 2).
 */

const SRC = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const strip = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '')
const mainCss = strip(readFileSync(join(SRC, 'assets/main.css'), 'utf8'))
const stage3 = strip(readFileSync(join(SRC, 'assets/kodini-controls-stage3.css'), 'utf8'))
const tokensCss = strip(readFileSync(join(SRC, 'design-system/tokens-v2.css'), 'utf8'))

function vars(css: string, selector: string): Record<string, string> {
  const start = css.indexOf(`${selector} {`)
  if (start === -1) throw new Error(`Selector "${selector}" not found`)
  const block = css.slice(css.indexOf('{', start) + 1, css.indexOf('}', start))
  const out: Record<string, string> = {}
  for (const m of block.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) out[m[1]] = m[2].trim()
  return out
}

function luminance(hex: string): number {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? [...h].map((c) => c + c).join('') : h.slice(0, 6)
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(full.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

const contrast = (a: string, b: string) => {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}

const light = vars(mainCss, ':root')
const dark = { ...light, ...vars(mainCss, ":root[data-theme='dark']") }
const dsLight = vars(tokensCss, ':root')
const dsDark = { ...dsLight, ...vars(tokensCss, ":root[data-theme='dark']") }

describe('Design Etappe 3', () => {
  it('lädt die Etappe-3-Datei direkt nach Etappe 2', () => {
    expect(mainCss).toMatch(
      /@import '\.\/kodini-header-stage2\.css';\s*@import '\.\/kodini-controls-stage3\.css';/
    )
  })

  it('setzt keine festen Farben, nur Tokens', () => {
    expect(stage3).not.toMatch(
      /#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?)\(|(?<![\w-])(?:white|black)(?![\w-])/i
    )
  })

  it('färbt Hauptaktionen dunkelgold mit weisser Schrift', () => {
    expect(stage3).toMatch(/--kce-gold-hover:\s*var\(--app-stage1-gold-hover\)/)
    const primary = stage3.match(/\.export-btn-primary,[^{]*\) \{([^}]*)\}/)?.[1] ?? ''
    expect(primary).toMatch(/background:\s*var\(--kce-nav-gold\)/)
    expect(primary).toMatch(/background-image:\s*var\(--app-stage1-gold-grad\)/)
    expect(primary).toMatch(/color:\s*var\(--app-stage1-on-gold\)/)
  })

  it('lässt den Farbton-Regler beim Farbkreis', () => {
    expect(stage3).toMatch(/input\[type='range'\]:not\(\.slider-field__range--hue\) \{/)
  })

  it.each([
    ['hell', light, dsLight],
    ['dunkel', dark, dsDark],
  ])('Abschnittstitel in Cyan erfüllen WCAG AA auf der Panelfläche (%s)', (_n, app, ds) => {
    expect(contrast(app['--app-stage1-cyan'], ds['--ds-surface-1'])).toBeGreaterThanOrEqual(4.5)
    expect(contrast(app['--app-stage1-cyan'], ds['--ds-surface-0'])).toBeGreaterThanOrEqual(4.5)
  })
})
