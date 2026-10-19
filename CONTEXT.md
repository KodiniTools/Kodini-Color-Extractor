# CONTEXT.md - Kodini Color Extractor

## Übersicht

Der Kodini Color Extractor ist eine clientseitige Vue-3-Single-Page-Application auf
kodinitools.com (Basis-Pfad `/kodini-color-extractor/`). Sie besteht aus zwei Werkzeugen:

- **Extraktor** (`/app`): Er liest die dominanten Farben eines Bildes aus, das hochgeladen, eingefügt oder aus den
  Beispielbildern gewählt wird. Die Farbpunkte lassen sich auf dem Bild verschieben, das Bild lässt sich anpassen
  (beides mit Undo/Redo), und die Palette kann als Text oder Bild exportiert werden.
- **Generator** (`/generator`): Er erzeugt Paletten aus Farbharmonien und Stil-Presets. Farben lassen sich sperren
  und anpassen, mit Undo/Redo, und die Palette kann exportiert und per Link geteilt werden.

Alle Daten werden lokal im Browser verarbeitet. Es gibt kein Backend und keine Datenbank.

---

## Tech-Stack

| Technologie     | Version (package.json) | Zweck                                                   |
| --------------- | ---------------------- | ------------------------------------------------------- |
| Vue 3           | ^3.5                   | UI, Composition API, `<script setup>`-SFCs (JavaScript) |
| Vue Router      | ^4.6                   | Routing, History-Modus, Seiten als Lazy-Chunks          |
| Pinia           | ^3.0                   | State des Extraktors (`stores/palette.js`)              |
| Vite            | ^8.3                   | Dev-Server und Build                                    |
| Vitest + jsdom  | ^4.1                   | Unit- und Komponententests (`src/__tests__/`)           |
| Playwright      | ^1.64                  | E2E-Tests (`e2e/`), Chromium                            |
| ESLint/Prettier | ^10 / ^3.9             | Lint und Formatierung                                   |
| vue-tsc         | ^3.3                   | Typcheck (`npm run build:check`)                        |

Node: `^20.19.0 || >=22.12.0`. Die CI (`.github/workflows/ci.yml`) führt format:check, lint, build:check, test und
build aus und startet die E2E-Tests in einem eigenen Job.

Browser-APIs: Canvas (Pixelanalyse, Bildanpassungen, Bildexport), Web Worker (Farbextraktion), Clipboard (Kopieren
und Einfügen), File API (Drag & Drop).

---

## Ordnerstruktur

```
src/
├── main.js                      # App, Pinia, Router
├── App.vue                      # nur <router-view>
├── router/index.js              # Routen, Titel, Handoff-Weiterleitung zur Galerie
├── views/
│   ├── LandingPage.vue          # /
│   ├── AppPage.vue              # /app – Extraktor
│   ├── GeneratorPage.vue        # /generator – Generator
│   ├── GalleryView.vue          # /app/gallery – Bilder aus anderen Kodini-Tools (noindex)
│   └── FaqPage.vue              # /faq
├── components/
│   ├── ImageUploader.vue, SampleImages.vue, MainContent.vue, PixelMagnifier.vue,
│   │   ColorList.vue, ImageEditPanel.vue, ImagePreviewModal.vue        # Extraktor
│   ├── ContrastDialog.vue       # WCAG-Kontrastcheck (Extraktor und Generator)
│   ├── PaletteLibraryDialog.vue # „Meine Paletten“: Verlauf und Favoriten (beide Werkzeuge)
│   ├── LandingNav.vue, ToolCrossLink.vue, ToastContainer.vue
│   ├── features/generator/      # PaletteStrip.vue, AdjustmentsPanel.vue
│   ├── features/HandoffReceiver.vue
│   └── ui/                      # PanelSection, SliderField, NumberSpinner
├── composables/
│   ├── useColorGenerator.js     # gesamter Generator-State inkl. Undo/Redo, Export, Teilen-Link
│   ├── useCanvasDrag.js, useCanvasPan.js, useFileDrop.js   # Interaktion auf dem Bild
│   ├── useKeyboard.js           # Tastaturkürzel des Extraktors
│   ├── usePaletteLibrary.js     # gemeinsame Liste gespeicherter Paletten (IndexedDB)
│   ├── useI18n.js               # DE/EN, Standard de
│   ├── useSeo.js, useToast.js
├── lib/core/                    # framework-freie Logik
│   ├── dominantColors.ts        # Histogramm-Extraktion (läuft im Worker)
│   ├── colorGenerator.ts        # Farbkonvertierung, Harmonien, Anpassungen
│   ├── paletteExport.ts         # alle Exportformate, geteilt von Extraktor und Generator
│   ├── paletteLink.ts           # Paletten im URL-Hash (#p=rrggbb-…)
│   ├── contrast.ts              # WCAG-Kontrast, Stufen, Paarvorschläge
│   ├── paletteLibrary.ts        # Listenlogik und Speicher-Adapter für gespeicherte Paletten
│   ├── handoff.js               # Bildübergabe zwischen Kodini-Tools (localStorage, geteilt)
│   ├── collageHandoff.ts        # Bild + Palettenkarte an den Collage Maker; eigene Übergabe ignorieren
│   └── seo.ts
├── stores/
│   ├── palette.js               # Extraktor
│   └── handoff.js               # empfangene Galerie-Bilder
├── workers/colorExtractor.worker.ts
├── design-system/               # geteilte --ds-* Tokens, siehe README dort
└── assets/main.css              # globale Styles, --app-* Tokens
e2e/                             # Playwright-Specs
public/samples/                  # 8 Beispielbilder
```

---

## Datenmodell

Es gibt keine Datenbank. Der Extraktor hält seinen State im Pinia-Store, der Generator in `useColorGenerator`.

### Extraktor (`stores/palette.js`)

| State                           | Inhalt                                                                     |
| ------------------------------- | -------------------------------------------------------------------------- |
| `colors`                        | `Color[]`, nach Häufigkeit sortiert                                        |
| `currentImage`                  | Data-URL des geladenen Bildes                                              |
| `colorCount`                    | 1–20, Standard 5                                                           |
| `selectedColorIndex`            | ausgewählte Farbe, `-1` für keine                                          |
| `originalImageSize`             | `{ width, height }`                                                        |
| `imageAdjustments`              | `zoom`, `brightness`, `contrast`, `saturation`, `hue`, `blur`, `grayscale` |
| `panPosition`                   | `{ x, y }`                                                                 |
| `downloadFormat`                | Schlüssel aus `EXPORT_FORMATS` (paletteExport.ts)                          |
| `imageExportFormat` / `...Size` | `png \| jpeg \| webp` / `small \| medium \| large \| xlarge`               |

```typescript
interface Color {
  r: number
  g: number
  b: number // 0–255
  hex: string // #RRGGBB
  hsl: { h: number; s: number; l: number }
  position: { x: number; y: number } // Pixel im Originalbild
}
```

Die Extraktion läuft im Web Worker. Eine laufende Extraktion wird verworfen, sobald ein neueres Bild sie überholt
(`extractionId`).

Undo/Redo (`undo`, `redo`, `commitHistory`) speichert bis zu 60 Snapshots aus Farbpunkt-Positionen und
Bildanpassungen ohne Zoom; Zoom und Pan sind Ansicht und bleiben außen vor. Schnelle Schritte am selben Regler
werden zu einem Schritt zusammengefasst, ein beendetes Ziehen ist ein Schritt. Jede neue Extraktion setzt den
Verlauf zurück.

### Generator (`composables/useColorGenerator.js`)

Jeder Eintrag der Palette hat die Form `{ base: {r,g,b}, adj: {brightness, contrast, saturation, hue}, locked }`.
Angezeigt und exportiert wird `displayHex(color)`, also die Grundfarbe mit den Anpassungen. Gesperrte Farben
überstehen das Neugenerieren und Anpassungen. Undo/Redo speichert Snapshots der ganzen Palette.

### Exportformate (`lib/core/paletteExport.ts`)

HEX, RGB, RGBA, HSL, HSLA, CSS-Variablen, SCSS, Tailwind und Design-Tokens (JSON). Der Extraktor exportiert
außerdem ein Palettenbild als PNG, JPG oder WebP.

### Persistenz im Browser

| Schlüssel                          | Wo                      | Inhalt                                                   |
| ---------------------------------- | ----------------------- | -------------------------------------------------------- |
| `localStorage.locale`              | useI18n, globale Nav    | `de` oder `en`                                           |
| `localStorage.theme`               | index.html, globale Nav | `light` oder `dark` (`html[data-theme]`)                 |
| Handoff-Schlüssel                  | lib/core/handoff.js     | Bilder aus anderen Kodini-Tools und an den Collage Maker |
| URL-Hash `#p=…`                    | Generator               | geteilte Palette, wird nach dem Laden entfernt           |
| IndexedDB `kodini-color-extractor` | usePaletteLibrary       | gespeicherte Paletten (Verlauf und Favoriten)            |

Gespeicherte Paletten: Kopieren, Herunterladen, Teilen und „Im Generator bearbeiten“ legen die Palette unter
„Zuletzt verwendet“ ab (höchstens 30, gleiche Farben in gleicher Reihenfolge sind ein Eintrag). Favoriten fallen
nie heraus. Ohne IndexedDB (z. B. manche private Modi) gilt die Liste nur bis zum Neuladen.

---

## Architektur-Regeln

- **Tokens statt Farben:** UI-Farben kommen aus `--ds-*` (`src/design-system/`). Feste Farben für Elemente über Fotos
  oder Palettenfarben (Ringe, Kanten, Abdunklung, Farbkreis) stehen nur als `--app-*` Tokens im ersten `:root`-Block
  von `main.css`. `src/__tests__/designTokens.test.ts` prüft das.
- **Teleports nach `#app-layer`**, nie nach `<body>`, weil die SSI-Partials von kodinitools.com dort eigene Regeln
  haben (siehe `src/design-system/README.md`).
- **Keine Spenden-Elemente** (`src/__tests__/noDonation.test.ts`).
- **Logik in `lib/core/`** bleibt frei von Vue und DOM und wird dort direkt getestet.
- **TypeScript (Umstellung läuft):** `lib/core/` und der Worker sind TypeScript und schreiben ihre Typen selbst aus
  (`Rgb`, `PaletteEntry`, `LibraryEntry` …). Ausnahme: `lib/core/handoff.js` bleibt JavaScript, weil es 1:1 mit den
  anderen Kodini-Tools geteilt wird. Neue Dateien in `lib/core/` werden `.ts`.

---

## Tastaturkürzel

| Taste                                     | Extraktor                            | Generator    |
| ----------------------------------------- | ------------------------------------ | ------------ |
| Strg/Cmd + V                              | Bild aus der Zwischenablage einfügen |              |
| Strg/Cmd + C                              | ausgewählte Farbe kopieren           |              |
| Enter                                     | ausgewählte Farbe kopieren           |              |
| ↑ / ↓                                     | vorherige / nächste Farbe wählen     |              |
| Leertaste                                 |                                      | neue Palette |
| Strg/Cmd + Z                              | Rückgängig                           | Rückgängig   |
| Strg/Cmd + Y oder Umschalt + Strg/Cmd + Z | Wiederholen                          | Wiederholen  |

---

## Befehle

```bash
npm install
npm run dev            # Dev-Server
npm run format:check
npm run lint
npm run build:check    # vue-tsc
npm test               # Vitest
npm run test:e2e       # Playwright
npm run build
```

Ausführliche Hintergründe zu Algorithmus und Aufbau stehen in `BLOG_TECHNICAL_DEEP_DIVE.md`.
