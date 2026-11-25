/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * Etappe 2 des Design-Umbaus: kodini-header-stage2.css färbt die
 * Werkzeugnavigation und die globale SSI-Navigation. Farben kommen aus den
 * --app-stage1-* Tokens. Flächen in den Partials brauchen !important, weil
 * main.css sie mit !important durchsichtig macht.
 */

const SRC = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const strip = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '')
const mainCss = strip(readFileSync(join(SRC, 'assets/main.css'), 'utf8'))
const stage2 = strip(readFileSync(join(SRC, 'assets/kodini-header-stage2.css'), 'utf8'))

/** Every rule as [selector, body]. */
function rules(css: string): Array<[string, string]> {
  return [...css.matchAll(/([^{}@]+)\{([^{}]*)\}/g)].map((m) => [
    m[1].replace(/\s+/g, ' ').trim(),
    m[2],
  ])
}

describe('Design Etappe 2', () => {
  it('lädt die Etappe-2-Datei direkt nach Etappe 1', () => {
    expect(mainCss).toMatch(
      /@import '\.\/kodini-layout-stage1\.css';\s*@import '\.\/kodini-header-stage2\.css';/
    )
  })

  it('setzt keine festen Farben, nur Tokens', () => {
    expect(stage2).not.toMatch(
      /#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?)\(|(?<![\w-])(?:white|black)(?![\w-])/i
    )
  })

  it('leitet Cyan und Gold der Navigation aus den Etappe-1-Tokens ab', () => {
    expect(stage2).toMatch(/--kce-nav-tint:\s*var\(--app-stage1-cyan\)/)
    expect(stage2).toMatch(/--kce-nav-gold:\s*var\(--app-stage1-gold\)/)
  })

  it('setzt Flächen der globalen Navigation mit !important gegen die Partial-Regeln', () => {
    const missing = rules(stage2)
      .filter(([selector]) => selector.includes('global-nav'))
      .flatMap(([selector, body]) =>
        [...body.matchAll(/(?<![\w-])background(?:-color)?\s*:\s*([^;]+);/g)]
          .filter((m) => !m[1].includes('!important'))
          .map(() => selector)
      )
    expect(missing).toEqual([])
  })

  it('nimmt die globale Navigation von der Durchsichtig-Regel für Partials aus', () => {
    // Etappe 5: Die Fläche der Leiste setzt kodini-header-stage2.css.
    expect(mainCss).toMatch(
      /body\s*>\s*:not\(#app\):not\(#app-layer\):not\(\.global-nav\)[^{]*\{\s*background-color: transparent !important;/
    )
  })

  it('hebt die aktuelle Seite der Werkzeugnavigation über aria-current hervor', () => {
    const active = rules(stage2).find(([selector]) => selector.includes("[aria-current='page']"))
    expect(active?.[1]).toMatch(/var\(--ds-accent\)/)
  })
})
