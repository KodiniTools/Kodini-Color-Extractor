/// <reference types="node" />
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * Regression guard for the shared KodiniTools design tokens (--ds-*, see
 * src/design-system/README.md).
 *
 * 1. tokens-v2.json and tokens-v2.css stay in lockstep for both themes.
 * 2. Components use only the tokens: no legacy palette variables, no fixed
 *    colours except white and neutral black transparencies, no gradients,
 *    no hover transforms, no literal durations, no card shadows, only the
 *    three radii and the seven type sizes.
 * 3. main.css loads Supreme in the three real weights and index.html's
 *    theme-color matches the page surface of each theme.
 */

const SRC = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const ROOT = resolve(SRC, '..')

const tokensJson = JSON.parse(readFileSync(join(SRC, 'design-system/tokens-v2.json'), 'utf8'))
const tokensCss = readFileSync(join(SRC, 'design-system/tokens-v2.css'), 'utf8')
const mainCss = readFileSync(join(SRC, 'assets/main.css'), 'utf8')
const indexHtml = readFileSync(join(ROOT, 'index.html'), 'utf8')

type Token = { $value: unknown; $extensions?: { css?: string } }
type Group = { [key: string]: unknown }

/** Custom properties of the first `selector { … }` block, comments stripped. */
function customProperties(css: string, selector: string): Record<string, string> {
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '')
  const start = stripped.indexOf(`${selector} {`)
  if (start === -1) throw new Error(`Selector "${selector}" not found`)
  const open = stripped.indexOf('{', start)
  const close = stripped.indexOf('}', open)
  const vars: Record<string, string> = {}
  for (const match of stripped.slice(open + 1, close).matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    vars[match[1]] = match[2].replace(/\s+/g, ' ').trim()
  }
  return vars
}

/** Every token that names a CSS variable, as [path, variable, value]. */
function cssTokens(group: Group, path: string[] = []): Array<[string, string, string]> {
  const out: Array<[string, string, string]> = []
  for (const [key, value] of Object.entries(group)) {
    if (key.startsWith('$') || value === null || typeof value !== 'object') continue
    const node = value as Group
    if ('$value' in node) {
      const token = node as unknown as Token
      const variable = token.$extensions?.css
      if (variable) out.push([[...path, key].join('.'), variable, String(token.$value)])
    } else {
      out.push(...cssTokens(node, [...path, key]))
    }
  }
  return out
}

function collectVueFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) collectVueFiles(full, out)
    else if (entry.endsWith('.vue')) out.push(full)
  }
  return out
}

/** The <style> blocks of every component plus main.css, keyed by file. */
function styleSources(): Record<string, string> {
  const sources: Record<string, string> = { 'assets/main.css': mainCss }
  for (const file of collectVueFiles(SRC)) {
    const blocks = [...readFileSync(file, 'utf8').matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)]
    const css = blocks.map((m) => m[1]).join('\n')
    if (css.trim()) sources[relative(SRC, file)] = css
  }
  return sources
}

/** Lines (file:line) of every style source whose text matches the pattern. */
function findInStyles(pattern: RegExp, exclude: string[] = []): string[] {
  const hits: string[] = []
  for (const [file, css] of Object.entries(styleSources())) {
    if (exclude.includes(file)) continue
    css.split('\n').forEach((line, index) => {
      if (pattern.test(line)) hits.push(`${file}:${index + 1}`)
    })
  }
  return hits
}

/** Every `property: value` declaration of a property, as [file, value]. */
function declarations(property: string): Array<[string, string]> {
  const out: Array<[string, string]> = []
  const pattern = new RegExp(`(?<![\\w-])${property}\\s*:\\s*([^;{}]+);`, 'g')
  for (const [file, css] of Object.entries(styleSources())) {
    const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '')
    for (const match of stripped.matchAll(pattern)) {
      out.push([file, match[1].replace(/\s+/g, ' ').trim()])
    }
  }
  return out
}

describe('tokens-v2.json mirrors tokens-v2.css', () => {
  const light = customProperties(tokensCss, ':root')
  const dark = customProperties(tokensCss, ":root[data-theme='dark']")
  const all = cssTokens(tokensJson)
  const isDark = (path: string) => /^(color|effect)\.dark\./.test(path)
  const expectedLight = Object.fromEntries(all.filter(([p]) => !isDark(p)).map((t) => [t[1], t[2]]))
  const expectedDark = Object.fromEntries(all.filter(([p]) => isDark(p)).map((t) => [t[1], t[2]]))

  it('declares light as the default theme on :root with every token', () => {
    expect(light).toEqual(expectedLight)
  })

  it("overrides exactly the theme-dependent tokens on :root[data-theme='dark']", () => {
    expect(dark).toEqual(expectedDark)
  })

  it('keeps the dark set to the same variables as the light colour and effect sets', () => {
    const lightThemed = all.filter(([p]) => /^(color|effect)\.light\./.test(p)).map((t) => t[1])
    expect(Object.keys(expectedDark).sort()).toEqual(lightThemed.sort())
  })

  it('uses the --ds- namespace for every variable', () => {
    const offNamespace = all.filter(([, variable]) => !variable.startsWith('--ds-'))
    expect(offNamespace).toEqual([])
  })
})

describe('Komponenten nutzen nur die Tokens', () => {
  it('kennen die alte Palette nicht mehr (--bg-*, --text-primary, --btn-*, --selection-*, …)', () => {
    expect(
      findInStyles(/var\(--(?:bg|text|border|btn|accent|selection|shadow|slider)-[\w-]*\)/)
    ).toEqual([])
  })

  it('setzen keine festen Farben außer Weiß und neutralen Schwarz-Transparenzen', () => {
    const hex = findInStyles(/#(?!fff\b|ffffff\b)[0-9a-f]{3,8}\b/i, ['design-system/tokens-v2.css'])
    expect(hex).toEqual([])
    const tinted = findInStyles(/rgba\(\s*(\d+)\s*,\s*(?!\1\s*,\s*\1\s*,)\d+\s*,\s*\d+\s*,/)
    expect(tinted).toEqual([])
  })

  it('zeichnen keine Verläufe mit Farbwerten (nur der Farbton-Regler zeigt den Farbkreis)', () => {
    const hits: string[] = []
    for (const [file, css] of Object.entries(styleSources())) {
      for (const match of css.matchAll(/gradient\(([^;]*)/g)) {
        if (/#|rgba?\(/.test(match[1])) hits.push(file)
      }
    }
    expect(hits).toEqual([])
    expect(mainCss).toMatch(/\.slider-field__range--hue \{\s*background: linear-gradient\(/)
  })

  it('verändern bei Hover nur Farbe, nie Größe oder Position', () => {
    const hits: string[] = []
    for (const [file, css] of Object.entries(styleSources())) {
      if (/:hover[^{]*\{[^}]*transform\s*:/.test(css)) hits.push(file)
      if (/scale\(/.test(css)) hits.push(`${file} (scale)`)
    }
    expect(hits).toEqual([])
  })

  it('bewegen sich in den Token-Dauern, nicht in festen Sekunden', () => {
    expect(findInStyles(/\b0?\.\d+s\b|(?<![\d.])\d{2,4}ms\b/)).toEqual([])
  })

  it('tragen Schatten nur als Overlay-Token, Fokus-Ring oder flachen Ring', () => {
    const allowed = /^(?:inset )?(?:var\(--ds-(?:shadow-overlay|focus-ring)\)|none|0 0 0 \d+px .+)$/
    const offending = declarations('box-shadow')
      .flatMap(([file, value]) => value.split(/,(?![^(]*\))/).map((part) => [file, part.trim()]))
      .filter(([, part]) => !allowed.test(part))
    expect(offending).toEqual([])
  })

  it('runden nur mit den drei Radien, Pille oder Kreis', () => {
    const allowed =
      /^(?:var\(--ds-radius-(?:sm|md|lg|full)\)|50%|0)(?: (?:var\(--ds-radius-(?:sm|md|lg|full)\)|50%|0))*$/
    const offending = declarations('border-radius').filter(([, value]) => !allowed.test(value))
    expect(offending).toEqual([])
  })

  it('bleiben in den sieben Schriftgraden (--ds-text-xs … --ds-text-3xl)', () => {
    const offending = declarations('font-size').filter(
      ([, value]) =>
        value !== 'inherit' && !/var\(--ds-text-(?:xs|sm|md|lg|xl|2xl|3xl)\)/.test(value)
    )
    expect(offending).toEqual([])
  })
})

describe('Grundlagen in main.css und index.html', () => {
  it('bindet die Tokens ein und setzt Body auf --ds-text-lg', () => {
    expect(mainCss).toContain("@import '../design-system/tokens-v2.css';")
    expect(mainCss).toMatch(/html,\s*body \{[^}]*font-size: var\(--ds-text-lg\)/)
  })

  it.each([
    [400, 'Regular'],
    [500, 'Medium'],
    [700, 'Bold'],
  ])('deklariert @font-face für Supreme %i aus dem Bundle', (weight, file) => {
    const faces = mainCss.match(/@font-face\s*{[^}]*}/g) ?? []
    const face = faces.find((f) => new RegExp(`font-weight:\\s*${weight}\\b`).test(f))
    expect(face, `Kein @font-face für Supreme ${weight}`).toBeDefined()
    expect(face).toContain(`./fonts/Supreme-${file}.woff2`)
  })

  it('setzt theme-color auf die Seitenfläche beider Themes', () => {
    const light = customProperties(tokensCss, ':root')['--ds-surface-0']
    const dark = customProperties(tokensCss, ":root[data-theme='dark']")['--ds-surface-0']
    expect(indexHtml).toContain(`content="${light}" media="(prefers-color-scheme: light)"`)
    expect(indexHtml).toContain(`content="${dark}" media="(prefers-color-scheme: dark)"`)
  })

  it('setzt data-theme vor dem ersten Paint', () => {
    expect(indexHtml).toMatch(/document\.documentElement\.setAttribute\(\s*['"]data-theme['"]/)
  })
})
