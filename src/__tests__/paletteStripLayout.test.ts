/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * Layout guard for the generator preview: half the workspace height, pinned
 * to the top so it keeps the position of the former full-height strip.
 * jsdom does no layout, so the rule itself is checked.
 */
const file = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../components/features/generator/PaletteStrip.vue'
)
const css = readFileSync(file, 'utf8')
const rule = css.match(/\n\.palette-strip \{([^}]*)\}/)?.[1] ?? ''

describe('PaletteStrip layout', () => {
  it('takes half the workspace height', () => {
    expect(rule).toMatch(/\bheight: 50%;/)
    expect(rule).toMatch(/min-height: 170px;/)
  })

  it('stays at the top instead of being centred by the workspace shell', () => {
    expect(rule).toMatch(/align-self: flex-start;/)
  })
})
