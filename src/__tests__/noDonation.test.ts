/// <reference types="node" />
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * The donate button was removed on purpose. This guard keeps it, its payment
 * form and its translations from coming back through a merge or a copy from
 * another KodiniTools app.
 */

const SRC = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const ROOT = resolve(SRC, '..')

function collectSourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      if (entry !== '__tests__') collectSourceFiles(full, out)
    } else if (/\.(vue|js|ts|css|json)$/.test(entry)) {
      out.push(full)
    }
  }
  return out
}

describe('Kein Spenden-Button', () => {
  const pattern = /paypal|donat(?:e|ion)|hosted_button_id/i
  const files = [...collectSourceFiles(SRC), join(ROOT, 'index.html')]

  it('nennt weder PayPal noch Spenden im Quellcode', () => {
    const hits = files
      .filter((file) => pattern.test(readFileSync(file, 'utf8')))
      .map((file) => relative(ROOT, file))
    expect(hits).toEqual([])
  })

  it('hat keine Spenden-Übersetzungen mehr', () => {
    const i18n = readFileSync(join(SRC, 'composables/useI18n.js'), 'utf8')
    expect(i18n).not.toMatch(/\bdonate(?:Title)?\s*:/)
  })
})
