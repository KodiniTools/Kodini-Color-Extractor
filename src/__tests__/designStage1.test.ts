/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * Etappe 1 des Design-Umbaus: kodini-layout-stage1.css wird von main.css
 * geladen und bezieht alle Farben aus den --app-stage1-* Tokens in main.css.
 */

const SRC = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const strip = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '')
const mainCss = strip(readFileSync(join(SRC, 'assets/main.css'), 'utf8'))
const stage1 = strip(readFileSync(join(SRC, 'assets/kodini-layout-stage1.css'), 'utf8'))
const tokensCss = strip(readFileSync(join(SRC, 'design-system/tokens-v2.css'), 'utf8'))

/** Custom properties of the first `selector {` block. */
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

function contrast(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}

const light = vars(mainCss, ':root')
const dark = { ...light, ...vars(mainCss, ":root[data-theme='dark']") }
const dsLight = vars(tokensCss, ':root')
const dsDark = { ...dsLight, ...vars(tokensCss, ":root[data-theme='dark']") }

describe('Design Etappe 1', () => {
  it('lädt die Etappe-1-Datei direkt nach den Tokens', () => {
    expect(mainCss).toMatch(
      /@import '\.\.\/design-system\/tokens-v2\.css';\s*@import '\.\/kodini-layout-stage1\.css';/
    )
  })

  it('setzt keine festen Farben, nur Tokens', () => {
    expect(stage1).not.toMatch(
      /#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?)\(|(?<![\w-])(?:white|black)(?![\w-])/i
    )
  })

  it('definiert jedes verwendete --app-stage1-* Token im hellen :root', () => {
    const used = [...stage1.matchAll(/var\((--app-stage1-[\w-]+)\)/g)].map((m) => m[1])
    expect(used.length).toBeGreaterThan(0)
    expect(used.filter((name) => !(name in light))).toEqual([])
  })

  it('überschreibt im Dunkelmodus nur vorhandene --app-stage1-* Tokens', () => {
    const darkOnly = Object.keys(vars(mainCss, ":root[data-theme='dark']"))
    expect(darkOnly.filter((name) => !(name in light))).toEqual([])
  })

  it('erzwingt Supreme in Stärke 400 im ganzen App-Bereich', () => {
    expect(stage1).toMatch(/--ds-weight-bold:\s*var\(--ds-weight-regular\)/)
    expect(stage1).toMatch(/font-synthesis:\s*none/)
  })

  it.each([
    ['hell', light, dsLight],
    ['dunkel', dark, dsDark],
  ])('erfüllt WCAG AA im Theme %s', (_name, app, ds) => {
    // Weisse Schrift auf dem goldenen Hauptbutton, auch im Hover.
    expect(contrast(app['--app-stage1-on-gold'], app['--app-stage1-gold'])).toBeGreaterThanOrEqual(
      4.5
    )
    expect(
      contrast(app['--app-stage1-on-gold'], app['--app-stage1-gold-hover'])
    ).toBeGreaterThanOrEqual(4.5)
    // Cyan-Untertitel auf Seitenfläche und auf dem Verlauf.
    expect(contrast(app['--app-stage1-cyan'], ds['--ds-surface-0'])).toBeGreaterThanOrEqual(4.5)
    expect(contrast(app['--app-stage1-cyan'], app['--app-stage1-glow'])).toBeGreaterThanOrEqual(4.5)
  })
})
