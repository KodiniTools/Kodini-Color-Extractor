/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * Gefüllte Goldbuttons tragen den KodiniTools-Verlauf (Dunkelgold, 180deg,
 * drei Stopps, weiße Schrift mit mindestens 4,5:1 an jedem Stopp).
 */
const SRC = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const read = (file: string) => readFileSync(join(SRC, file), 'utf8')
const mainCss = read('assets/main.css')
const stage1 = read('assets/kodini-layout-stage1.css')
const stage2 = read('assets/kodini-header-stage2.css')
const stage3 = read('assets/kodini-controls-stage3.css')

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

const contrastToWhite = (hex: string) => 1.05 / (luminance(hex) + 0.05)

function token(name: string): string {
  const match = mainCss.match(new RegExp(`${name}:\\s*([^;]+);`))
  if (!match) throw new Error(`${name} fehlt`)
  return match[1].trim()
}

describe('Goldbutton-Verlauf', () => {
  it.each(['--app-stage1-gold-grad', '--app-stage1-gold-grad-hover'])(
    '%s ist dreistufig, 180deg und an jedem Stopp lesbar mit Weiß',
    (name) => {
      const value = token(name)
      expect(value.startsWith('linear-gradient(180deg,')).toBe(true)
      const stops = value.match(/#[0-9a-f]{6}/gi) ?? []
      expect(stops).toHaveLength(3)
      for (const stop of stops) expect(contrastToWhite(stop)).toBeGreaterThanOrEqual(4.5)
    }
  )

  it('Fläche und Hover-Fläche sind Dunkelgold mit weißer Schrift', () => {
    expect(token('--app-stage1-gold')).toBe('#8f6320')
    expect(token('--app-stage1-gold-hover')).toBe('#7d561c')
    expect(token('--app-stage1-on-gold')).toBe('#ffffff')
  })

  it('Etappe 3 legt den Verlauf auf alle gefüllten Goldbuttons', () => {
    for (const selector of [
      '.upload-area:not(.processing)',
      '.export-btn-primary',
      '.hero-cta:not(.hero-cta-secondary)',
      '.showcase-cta',
      '.cta-button',
      '.faq-cta-button',
      '.handoff-btn-accept',
    ]) {
      expect(stage3).toContain(selector)
    }
    expect(stage3).toMatch(/background-image: var\(--app-stage1-gold-grad\);/)
    expect(stage3).toMatch(/background-image: var\(--app-stage1-gold-grad-hover\);/)
  })

  it('die Landingpage-Regel aus Etappe 1 behält den Verlauf', () => {
    expect(stage1).toMatch(/background-image: var\(--app-stage1-gold-grad\);/)
    expect(stage1).toMatch(/background-image: var\(--app-stage1-gold-grad-hover\);/)
  })

  it('der aktive Sprachbutton der globalen Navigation trägt den Verlauf', () => {
    expect(stage2).toMatch(/background-image: var\(--app-stage1-gold-grad\) !important;/)
    expect(stage2).toMatch(/background-image: var\(--app-stage1-gold-grad-hover\) !important;/)
  })
})
