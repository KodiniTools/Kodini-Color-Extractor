import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import { translations } from './src/i18n/translations'
import { STATIC_ROUTES, localizeHead, staticHtmlFile } from './src/lib/core/staticHead'

// Writes an English copy of dist/index.html per route (index.en.html, faq.en.html, ...)
// so ?lang=en requests get English title, description, canonical and lang="en"
// without JavaScript. nginx picks the file, see README "Englische HTML-Köpfe".
// Für Unterseiten (nicht '/') zusätzlich eine deutsche Kopie (faq.html, app.html, ...):
// dieselbe nginx-Regel findet sie ohne ?lang über `$uri.html`. Die Startseite bleibt
// dist/index.html (Rückfall für alle Routen, daher ohne statisches Canonical).
function englishHtmlHeads(): Plugin {
  const en: Record<string, string> = translations.en
  const de: Record<string, string> = translations.de
  const tFor = (dict: Record<string, string>) => (key: string) => dict[key] ?? key
  return {
    name: 'kodini-english-html-heads',
    apply: 'build',
    writeBundle(options) {
      const outDir = resolve(options.dir ?? 'dist')
      const html = readFileSync(join(outDir, 'index.html'), 'utf8')
      for (const route of STATIC_ROUTES) {
        for (const [lang, dict] of [
          ['en', en],
          ['de', de],
        ] as const) {
          if (lang === 'de' && route.path === '/') continue
          const file = join(outDir, staticHtmlFile(route.path, lang))
          mkdirSync(dirname(file), { recursive: true })
          writeFileSync(
            file,
            localizeHead(html, { routeName: route.name, path: route.path, lang, t: tFor(dict) })
          )
        }
      }
    },
  }
}

export default defineConfig({
  plugins: [vue(), englishHtmlHeads()],
  base: '/kodini-color-extractor/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/__tests__/**/*.test.ts'],
    exclude: ['e2e/**', 'node_modules/**'],
  },
})
