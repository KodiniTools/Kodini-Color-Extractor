/// <reference types="node" />
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * The global navigation, footer and cookie banner of kodinitools.com are SSI
 * partials inserted as direct children of <body>, outside #app. main.css makes
 * their surfaces transparent and colours their text from the --ds-* tokens, the
 * way the Collage Maker does. Everything Vue teleports must therefore land in
 * #app-layer, which those rules leave alone; a teleport to <body> would be
 * flattened to a transparent, token-coloured box.
 */

const SRC = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const ROOT = resolve(SRC, '..')
const mainCss = readFileSync(join(SRC, 'assets/main.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
const indexHtml = readFileSync(join(ROOT, 'index.html'), 'utf8')

function collectVueFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) collectVueFiles(full, out)
    else if (entry.endsWith('.vue')) out.push(full)
  }
  return out
}

/** Every selector of main.css that reaches outside #app via `body > :not(#app)`. */
function partialSelectors(): string[] {
  const selectors: string[] = []
  for (const match of mainCss.matchAll(/([^{}]+)\{/g)) {
    const prelude = match[1].replace(/\s+/g, ' ').trim()
    if (prelude.startsWith('@')) continue
    for (const selector of prelude.split(/,(?![^(]*\))/)) {
      if (/body ?> ?:not\(#app\)/.test(selector)) selectors.push(selector.trim())
    }
  }
  return selectors
}

describe('SSI-Partials übernehmen die Tokens', () => {
  it('macht die Flächen der Partials durchsichtig', () => {
    expect(mainCss).toMatch(/:not\(#app\)[^{]*\{\s*background-color: transparent !important;/)
  })

  it('färbt Text und Links der Partials aus den Tokens', () => {
    expect(mainCss).toContain('color: var(--ds-text) !important;')
    expect(mainCss).toContain('color: var(--ds-link) !important;')
  })

  it('gibt Menüflächen wieder --ds-surface-1', () => {
    expect(mainCss).toContain('background-color: var(--ds-surface-1) !important;')
  })

  it('nimmt in jeder Partial-Regel #app-layer aus', () => {
    const selectors = partialSelectors()
    expect(selectors.length).toBeGreaterThan(0)
    expect(selectors.filter((s) => !s.includes(':not(#app-layer)'))).toEqual([])
  })
})

describe('Teleportierte Oberflächen liegen in #app-layer', () => {
  it('stellt #app-layer direkt nach #app bereit', () => {
    expect(indexHtml).toMatch(
      /<div id="app"><\/div>\s*(?:<!--[\s\S]*?-->\s*)?<div id="app-layer"><\/div>/
    )
  })

  it('teleportiert nie nach <body>, sondern nach #app-layer', () => {
    const offending: string[] = []
    for (const file of collectVueFiles(SRC)) {
      for (const match of readFileSync(file, 'utf8').matchAll(/<Teleport\s+to="([^"]+)"/g)) {
        if (match[1] !== '#app-layer') offending.push(`${relative(SRC, file)} → ${match[1]}`)
      }
    }
    expect(offending).toEqual([])
  })
})
