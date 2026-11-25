/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * Etappe 4 des Design-Umbaus: kodini-workspace-stage4.css färbt die
 * Bildarbeitsfläche, die Farbliste und die Palette des Generators.
 */

const SRC = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const strip = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '')
const mainCss = strip(readFileSync(join(SRC, 'assets/main.css'), 'utf8'))
const stage4 = strip(readFileSync(join(SRC, 'assets/kodini-workspace-stage4.css'), 'utf8'))

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

describe('Design Etappe 4', () => {
  it('lädt die Etappe-4-Datei direkt nach Etappe 3', () => {
    expect(mainCss).toMatch(
      /@import '\.\/kodini-controls-stage3\.css';\s*@import '\.\/kodini-workspace-stage4\.css';/
    )
  })

  it('setzt keine festen Farben, nur Tokens', () => {
    expect(stage4).not.toMatch(
      /#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?)\(|(?<![\w-])(?:white|black)(?![\w-])/i
    )
  })

  it('definiert jedes verwendete --app-* Token im hellen :root', () => {
    const defined = vars(mainCss, ':root')
    const used = [...stage4.matchAll(/var\((--app-[\w-]+)\)/g)].map((m) => m[1])
    expect(used.filter((name) => !(name in defined))).toEqual([])
  })

  it('zeigt den Fokus auf Farbfeldern mit heller und dunkler Kontur', () => {
    const focus = stage4.match(/:is\(\.swatch-hex, \.swatch-action\):focus-visible \{([^}]*)\}/)
    expect(focus?.[1]).toMatch(/var\(--app-overlay-light\)/)
    expect(focus?.[1]).toMatch(/var\(--app-overlay-dark\)/)
  })

  it('hält die beiden Fokuskonturen weit auseinander, damit eine immer sichtbar ist', () => {
    const root = vars(mainCss, ':root')
    // Jede Palettenfarbe erreicht mit einer der beiden Konturen mindestens 3:1
    // (WCAG 1.4.11), wenn die Konturen untereinander deutlich über 9:1 liegen.
    expect(contrast(root['--app-overlay-light'], root['--app-overlay-dark'])).toBeGreaterThan(9)
  })

  it('markiert ausgewählte Paletteneinträge mit der Gold-Akzentfarbe', () => {
    const selected = stage4.match(/\.color-item\.selected \{([^}]*)\}/)?.[1] ?? ''
    expect(selected).toMatch(/border-color:\s*var\(--ds-accent\)/)
    expect(selected).toMatch(/box-shadow:\s*inset 3px 0 var\(--ds-accent\)/)
  })
})
