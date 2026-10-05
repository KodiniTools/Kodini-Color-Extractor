/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'

/**
 * tokens.json is documentation of main.css, not its source. These tests keep
 * the two in lockstep: every CSS custom property in main.css must be described
 * by exactly one token with the same value, and every token that claims a CSS
 * variable must still exist in the stylesheet.
 */

const here = dirname(fileURLToPath(import.meta.url))
const css = readFileSync(resolve(here, '../assets/main.css'), 'utf8')
const tokens = JSON.parse(readFileSync(resolve(here, '../assets/tokens.json'), 'utf8')) as Group

type Extensions = {
  'com.kodinitools'?: {
    cssVariable?: string
    css?: string
  }
}

type Token = {
  $value: unknown
  $type?: string
  $description?: string
  $extensions?: Extensions
}

type Group = { [key: string]: unknown }

type Entry = { path: string[]; type: string | undefined; token: Token }

/** Custom properties declared in the first `selector { … }` block of main.css. */
function customProperties(selector: string): Record<string, string> {
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '')
  const start = stripped.indexOf(`${selector} {`)
  if (start === -1) throw new Error(`Selector "${selector}" not found in main.css`)
  const open = stripped.indexOf('{', start)
  const close = stripped.indexOf('}', open)
  const body = stripped.slice(open + 1, close)

  const vars: Record<string, string> = {}
  for (const match of body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    vars[match[1]] = match[2].replace(/\s+/g, ' ').trim()
  }
  return vars
}

/** Depth-first walk over every token, carrying the inherited `$type`. */
function* walk(group: Group, path: string[] = [], inherited?: string): Generator<Entry> {
  const groupType = typeof group.$type === 'string' ? group.$type : inherited
  for (const [key, value] of Object.entries(group)) {
    if (key.startsWith('$') || value === null || typeof value !== 'object') continue
    const node = value as Group
    if ('$value' in node) {
      const token = node as unknown as Token
      yield { path: [...path, key], type: token.$type ?? groupType, token }
    } else {
      yield* walk(node, [...path, key], groupType)
    }
  }
}

const entries = [...walk(tokens)]
const byPath = new Map(entries.map((e) => [e.path.join('.'), e]))

/** The CSS value a token documents: a composite token carries it in `$extensions`. */
function cssValue(token: Token): string {
  const ext = token.$extensions?.['com.kodinitools']
  if (ext?.css) return ext.css
  if (typeof token.$value === 'string') return token.$value
  throw new Error('Token has no string value and no css extension')
}

/** Tokens that document a CSS variable, keyed by that variable, for one theme. */
function themeTokens(theme: 'light' | 'dark'): Record<string, string> {
  const map: Record<string, string> = {}
  for (const { path, token } of entries) {
    const variable = token.$extensions?.['com.kodinitools']?.cssVariable
    if (!variable) continue
    const isDark = path[0] === 'color' && path[1] === 'dark'
    const isBrand = path[0] === 'color' && path[1] === 'brand'
    const belongs = theme === 'dark' ? isDark : !isDark && (isBrand || path[1] === 'light')
    if (!belongs) continue
    if (variable in map) throw new Error(`Variable ${variable} documented twice for ${theme}`)
    map[variable] = cssValue(token)
  }
  return map
}

describe('tokens.json mirrors main.css', () => {
  const root = customProperties(':root')
  const dark = customProperties("[data-theme='dark']")
  const lightTokens = themeTokens('light')
  const darkTokens = themeTokens('dark')

  it('parses both theme blocks from main.css', () => {
    expect(Object.keys(root).length).toBeGreaterThan(0)
    expect(Object.keys(dark).length).toBeGreaterThan(0)
    expect(root['--bg-primary']).toBe('#f5f4d6')
    expect(dark['--bg-primary']).toBe('#1a1a2e')
  })

  it('documents every :root variable with the same value', () => {
    expect(lightTokens).toEqual(root)
  })

  it("documents every [data-theme='dark'] variable with the same value", () => {
    expect(darkTokens).toEqual(dark)
  })

  it('declares the same semantic structure for light and dark', () => {
    const shape = (theme: string) =>
      entries
        .filter((e) => e.path[0] === 'color' && e.path[1] === theme)
        .map((e) => e.path.slice(2).join('.'))
        .sort()
    expect(shape('dark')).toEqual(shape('light'))
  })
})

describe('tokens.json is internally consistent', () => {
  it('resolves every {reference} to an existing token', () => {
    const references = (value: unknown): string[] => {
      if (typeof value === 'string') return value.match(/^\{([^}]+)\}$/) ? [value.slice(1, -1)] : []
      if (Array.isArray(value)) return value.flatMap(references)
      if (value && typeof value === 'object') return Object.values(value).flatMap(references)
      return []
    }
    const missing = entries
      .flatMap((e) => references(e.token.$value).map((ref) => `${e.path.join('.')} -> ${ref}`))
      .filter((pair) => !byPath.has(pair.split(' -> ')[1]))
    expect(missing).toEqual([])
  })

  it('writes every color as six-digit hex or rgba()', () => {
    const pattern = /^(#[0-9a-f]{6}|rgba\(\d{1,3}, \d{1,3}, \d{1,3}, 0?\.\d+\))$/
    const invalid = entries
      .filter((e) => e.type === 'color')
      .filter((e) => typeof e.token.$value !== 'string' || !pattern.test(e.token.$value))
      .map((e) => e.path.join('.'))
    expect(invalid).toEqual([])
  })

  it('gives every token a type', () => {
    const untyped = entries.filter((e) => !e.type).map((e) => e.path.join('.'))
    expect(untyped).toEqual([])
  })
})
