# Kodini Color Extractor: Ein technischer Deep Dive

## Einführung

Der **Kodini Color Extractor** ist eine vollständig clientseitige Web-Anwendung zur Extraktion von Farbpaletten aus Bildern. Diese technische Dokumentation richtet sich an Entwickler, die moderne Frontend-Technologien verstehen und die Architektur dieser Anwendung tiefgreifend kennenlernen möchten.

### Was diese Dokumentation abdeckt

1. **Vue.js 3 Composition API** - Reaktive Patterns und Best Practices
2. **Canvas API** - Pixelmanipulation und Bildverarbeitung
3. **Farbextraktionsalgorithmen** - Quantisierung und Frequenzanalyse
4. **State Management mit Pinia** - Zentralisierte Zustandsverwaltung
5. **Moderne Browser-APIs** - Clipboard, File API, Drag & Drop
6. **Performance-Optimierungen** - Memory Management und Rendering
7. **Responsive Design** - CSS Custom Properties und adaptive Layouts

---

## Inhaltsverzeichnis

1. [Architektur-Übersicht](#1-architektur-übersicht)
2. [Vue.js 3 Composition API im Detail](#2-vuejs-3-composition-api-im-detail)
3. [Canvas API und Bildverarbeitung](#3-canvas-api-und-bildverarbeitung)
4. [Der Farbextraktionsalgorithmus](#4-der-farbextraktionsalgorithmus)
5. [State Management mit Pinia](#5-state-management-mit-pinia)
6. [Composables-Architektur](#6-composables-architektur)
7. [Moderne Browser-APIs](#7-moderne-browser-apis)
8. [Drag & Drop Farbpositionierung](#8-drag--drop-farbpositionierung)
9. [Bildanpassungen und Echtzeit-Filterung](#9-bildanpassungen-und-echtzeit-filterung)
10. [Export-Funktionalitäten](#10-export-funktionalitäten)
11. [Performance-Optimierungen](#11-performance-optimierungen)
12. [CSS-Architektur und Theming](#12-css-architektur-und-theming)
13. [Internationalisierung (i18n)](#13-internationalisierung-i18n)
14. [Barrierefreiheit und UX](#14-barrierefreiheit-und-ux)
15. [Build-Konfiguration](#15-build-konfiguration)
16. [Fazit und Learnings](#16-fazit-und-learnings)

---

## 1. Architektur-Übersicht

### Projektstruktur

```
src/
├── main.js                         # Vue 3 App-Initialisierung
├── App.vue                         # Root-Komponente (Theme-Setup)
├── router/index.js                 # Vue Router Konfiguration
├── stores/palette.js               # Pinia State Management (Kernlogik)
├── composables/                    # Wiederverwendbare Logik
│   ├── useI18n.js                 # Zweisprachiger Support (EN/DE)
│   ├── useKeyboard.js             # Keyboard-Shortcuts
│   ├── useToast.js                # Toast-Benachrichtigungen
│   └── useTheme.js                # Dark/Light Theme Management
├── components/                     # UI-Komponenten
│   ├── ImageUploader.vue          # Drag & Drop Upload
│   ├── MainContent.vue            # Bildanzeige mit Farbindikatoren
│   ├── ColorList.vue              # Farbpaletten-Anzeige
│   ├── ImageEditPanel.vue         # Anpassungs-Slider
│   ├── ImagePreviewModal.vue      # Vorher/Nachher-Vergleich
│   ├── SampleImages.vue           # Beispielbilder-Galerie
│   ├── ToastContainer.vue         # Benachrichtigungs-Container
│   └── LandingNav.vue             # Navigationsheader
├── views/                         # Seiten-Komponenten
│   ├── LandingPage.vue            # Marketing-Seite
│   ├── AppPage.vue                # Hauptanwendung
│   └── FaqPage.vue                # Hilfe-Seite
└── assets/main.css                # Globale Styles mit CSS Variables
```

### Technologie-Stack

| Technologie | Version | Verwendung |
|-------------|---------|------------|
| Vue.js | 3.4.x | Reaktives Framework |
| Pinia | 2.1.x | State Management |
| Vue Router | 4.6.x | Client-Side Routing |
| Vite | 5.2.x | Build Tool & Dev Server |

### Komponentenhierarchie

```
App.vue
└── <router-view>
    ├── LandingPage.vue
    │   └── LandingNav.vue
    ├── AppPage.vue
    │   ├── Sidebar
    │   │   ├── ImageUploader.vue
    │   │   ├── ColorList.vue
    │   │   └── Export-Bereich
    │   ├── MainContent.vue
    │   │   ├── SampleImages.vue
    │   │   └── Farbindikatoren (dynamisch)
    │   ├── ImageEditPanel.vue
    │   ├── ImagePreviewModal.vue
    │   └── ToastContainer.vue
    └── FaqPage.vue
```

### Datenfluss-Diagramm

```
┌─────────────────┐
│   File Upload   │
│  (Drag & Drop)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  FileReader API │
│  readAsDataURL  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Pinia Store   │
│   setImage()    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ extractColors() │
│  Canvas API     │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌───────┐ ┌──────────┐
│ Image │ │  Colors  │
│ State │ │   Array  │
└───┬───┘ └────┬─────┘
    │          │
    ▼          ▼
┌─────────────────┐
│   Reaktives     │
│   Re-Rendering  │
└─────────────────┘
```

---

## 2. Vue.js 3 Composition API im Detail

### Setup und Initialisierung

Die Anwendung nutzt konsequent die **Composition API** mit dem `<script setup>` Syntax für maximale Kompaktheit und TypeScript-Kompatibilität.

#### main.js - Application Bootstrap

```javascript
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/main.css'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
```

**Wichtige Konzepte:**

1. **createApp()** - Erstellt eine neue Vue-Instanz ohne globale Seiteneffekte
2. **createPinia()** - Initialisiert den State Management Store
3. **app.use()** - Plugin-Registration vor dem Mounting
4. **app.mount()** - Verbindet Vue mit dem DOM

### Reaktive Referenzen (Refs)

```javascript
// Primitive Werte
const colorCount = ref(5)
const selectedColorIndex = ref(-1)

// Komplexe Objekte
const imageAdjustments = ref({
  zoom: 100,
  brightness: 100,
  contrast: 100,
  saturation: 100,
  hue: 0
})

// Zugriff auf Werte
console.log(colorCount.value)           // 5
console.log(imageAdjustments.value.zoom) // 100

// In Templates (automatisches Unwrapping)
// <input v-model="colorCount">
```

### Computed Properties

Computed Properties werden für abgeleitete Werte verwendet und sind **gecached**:

```javascript
// Read-only Computed
const hasColors = computed(() => colors.value.length > 0)

const hasActiveFilters = computed(() => {
  const adj = imageAdjustments.value
  return adj.brightness !== 100 ||
         adj.contrast !== 100 ||
         adj.saturation !== 100 ||
         adj.hue !== 0
})

// Read-Write Computed (Two-Way Binding)
const count = computed({
  get: () => store.colorCount,
  set: (val) => {
    store.setColorCount(val)
    if (store.currentImage) {
      store.extractColors(store.currentImage)
    }
  }
})
```

### Watchers

Watchers reagieren auf Zustandsänderungen:

```javascript
// Einfacher Watch
watch(() => store.currentImage, (newImage) => {
  if (newImage) {
    setTimeout(updateIndicatorRects, 100)
  }
})

// Watch mit Options
watch(
  () => store.imageAdjustments,
  (adjustments) => {
    applyFiltersToCanvas()
  },
  { deep: true, immediate: false }
)

// WatchEffect (automatische Dependency-Tracking)
watchEffect(() => {
  document.documentElement.setAttribute(
    'data-theme',
    currentTheme.value
  )
})
```

### Lifecycle Hooks

```javascript
import { onMounted, onUnmounted, onBeforeUnmount } from 'vue'

onMounted(() => {
  // DOM ist verfügbar
  window.addEventListener('resize', handleResize)
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  // Cleanup
  window.removeEventListener('resize', handleResize)
  document.removeEventListener('keydown', handleKeydown)
})
```

### Template Refs

Zugriff auf DOM-Elemente:

```javascript
// Script
const canvasRef = ref(null)
const mainImageRef = ref(null)

onMounted(() => {
  if (canvasRef.value) {
    const ctx = canvasRef.value.getContext('2d')
    // Canvas-Operationen
  }
})

// Template
// <canvas ref="canvasRef"></canvas>
// <img ref="mainImageRef" :src="imageSrc">
```

---

## 3. Canvas API und Bildverarbeitung

### Grundlagen der Canvas 2D API

Die Canvas API ist das Herzstück der Farbextraktion. Sie ermöglicht direkten Zugriff auf Pixeldaten.

#### Canvas-Element erstellen

```javascript
// Dynamische Canvas-Erstellung (im Memory)
const canvas = document.createElement('canvas')
const ctx = canvas.getContext('2d')

// Canvas-Dimensionen setzen
canvas.width = image.naturalWidth
canvas.height = image.naturalHeight
```

#### Bild auf Canvas zeichnen

```javascript
const img = new Image()
img.crossOrigin = 'anonymous'  // CORS für externe Bilder
img.src = imageSrc

img.onload = () => {
  ctx.drawImage(img, 0, 0)

  // Jetzt können Pixeldaten gelesen werden
  const imageData = ctx.getImageData(
    0, 0,
    canvas.width,
    canvas.height
  )
}
```

### ImageData-Struktur

```javascript
const imageData = ctx.getImageData(0, 0, width, height)

// imageData.data ist ein Uint8ClampedArray
// Format: [R, G, B, A, R, G, B, A, ...]
// Jeder Wert: 0-255

const pixels = imageData.data
const totalPixels = pixels.length / 4

for (let i = 0; i < pixels.length; i += 4) {
  const r = pixels[i]      // Rot
  const g = pixels[i + 1]  // Grün
  const b = pixels[i + 2]  // Blau
  const a = pixels[i + 3]  // Alpha (Transparenz)

  // Pixelkoordinaten berechnen
  const pixelIndex = i / 4
  const x = pixelIndex % width
  const y = Math.floor(pixelIndex / width)
}
```

### Pixeldaten schreiben

```javascript
// Einzelne Pixel modifizieren
pixels[i] = 255      // R
pixels[i + 1] = 0    // G
pixels[i + 2] = 0    // B
pixels[i + 3] = 255  // A

// Zurück auf Canvas schreiben
ctx.putImageData(imageData, 0, 0)
```

### Canvas-Filter (CSS-basiert)

Die Canvas API unterstützt CSS-Filter direkt:

```javascript
// Filter anwenden (muss VOR drawImage gesetzt werden!)
ctx.filter = `
  brightness(${brightness}%)
  contrast(${contrast}%)
  saturate(${saturation}%)
  hue-rotate(${hue}deg)
`

// Bild mit Filtern zeichnen
ctx.drawImage(sourceCanvas, 0, 0)

// Filter zurücksetzen
ctx.filter = 'none'
```

### Canvas zu Bild exportieren

```javascript
// Als Data URL (Base64)
const dataUrl = canvas.toDataURL('image/png')
const jpegUrl = canvas.toDataURL('image/jpeg', 0.9)  // Qualität 0-1
const webpUrl = canvas.toDataURL('image/webp', 0.8)

// Als Blob (für Downloads)
canvas.toBlob((blob) => {
  const url = URL.createObjectURL(blob)
  // Download-Link erstellen
}, 'image/png')
```

---

## 4. Der Farbextraktionsalgorithmus

### Überblick

Der Algorithmus basiert auf **Farbquantisierung** und **Häufigkeitsanalyse**:

1. Pixeldaten aus Canvas extrahieren
2. Farben quantisieren (reduzieren)
3. Häufigkeiten zählen
4. Nach Häufigkeit sortieren
5. Top-N Farben zurückgeben

### Implementierung im Detail

```javascript
async extractColors(imgSrc) {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      // 1. Canvas vorbereiten
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      canvas.width = img.width
      canvas.height = img.height

      ctx.drawImage(img, 0, 0)

      // 2. Pixeldaten extrahieren
      const imgData = ctx.getImageData(
        0, 0,
        canvas.width,
        canvas.height
      )
      const pixels = imgData.data

      // 3. Farbmap erstellen
      const colorMap = new Map()

      for (let i = 0; i < pixels.length; i += 4) {
        const a = pixels[i + 3]

        // Transparente Pixel überspringen
        if (a < 128) continue

        // QUANTISIERUNG: Auf 16er-Schritte runden
        const r = Math.round(pixels[i] / 16) * 16
        const g = Math.round(pixels[i + 1] / 16) * 16
        const b = Math.round(pixels[i + 2] / 16) * 16

        const key = `${r},${g},${b}`

        // Pixelposition berechnen
        const pixelIndex = i / 4
        const x = pixelIndex % canvas.width
        const y = Math.floor(pixelIndex / canvas.width)

        if (colorMap.has(key)) {
          const entry = colorMap.get(key)
          entry.count++

          // Memory-Optimierung: Nur 1% der Positionen speichern
          if (Math.random() < 0.01) {
            entry.positions.push({ x, y })
          }
        } else {
          colorMap.set(key, {
            r, g, b,
            count: 1,
            positions: [{ x, y }]
          })
        }
      }

      // 4. Nach Häufigkeit sortieren
      const sorted = [...colorMap.values()]
        .sort((a, b) => b.count - a.count)

      // 5. Top-N Farben extrahieren
      const topColors = sorted
        .slice(0, this.colorCount)
        .map(color => {
          // Zufällige Position aus gespeicherten wählen
          const pos = color.positions[
            Math.floor(Math.random() * color.positions.length)
          ]

          return {
            r: color.r,
            g: color.g,
            b: color.b,
            hex: this.rgbToHex(color.r, color.g, color.b),
            hsl: this.rgbToHsl(color.r, color.g, color.b),
            position: pos
          }
        })

      this.colors = topColors
      resolve(topColors)
    }

    img.src = imgSrc
  })
}
```

### Farbquantisierung erklärt

#### Das Problem
- Ein Bild hat bis zu **16,7 Millionen** mögliche Farben (256³)
- Direkte Analyse wäre zu langsam und speicherintensiv

#### Die Lösung: 16-Bit-Quantisierung
```javascript
// Original: 256 Stufen pro Kanal
// Nach Quantisierung: 16 Stufen pro Kanal (256/16)

const r = Math.round(pixels[i] / 16) * 16

// Beispiel:
// r = 143 → Math.round(143/16) * 16 = 9 * 16 = 144
// r = 147 → Math.round(147/16) * 16 = 9 * 16 = 144
// → Beide werden als "144" gruppiert

// Ergebnis: 16 × 16 × 16 = 4.096 mögliche Farben
```

#### Vorteile
1. **Dramatische Reduktion**: 16.7M → 4.096 Farben
2. **Ähnliche Farben gruppiert**: Kleine Variationen werden zusammengefasst
3. **Schnelle Map-Lookups**: O(1) für jeden Pixel

### RGB zu HSL Konvertierung

```javascript
rgbToHsl(r, g, b) {
  // Auf 0-1 normalisieren
  r /= 255
  g /= 255
  b /= 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const diff = max - min

  // Lightness (Helligkeit)
  let l = (max + min) / 2

  let h = 0
  let s = 0

  if (diff !== 0) {
    // Saturation (Sättigung)
    s = l > 0.5
      ? diff / (2 - max - min)
      : diff / (max + min)

    // Hue (Farbton)
    switch (max) {
      case r:
        h = ((g - b) / diff) + (g < b ? 6 : 0)
        break
      case g:
        h = ((b - r) / diff) + 2
        break
      case b:
        h = ((r - g) / diff) + 4
        break
    }
    h /= 6
  }

  return {
    h: Math.round(h * 360),     // 0-360 Grad
    s: Math.round(s * 100),     // 0-100%
    l: Math.round(l * 100)      // 0-100%
  }
}
```

### RGB zu HEX Konvertierung

```javascript
rgbToHex(r, g, b) {
  const toHex = (n) => {
    const hex = Math.min(255, Math.max(0, n)).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}
```

---

## 5. State Management mit Pinia

### Store-Definition

```javascript
// stores/palette.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const usePaletteStore = defineStore('palette', () => {
  // State
  const colors = ref([])
  const currentImage = ref(null)
  const imageData = ref(null)
  const colorCount = ref(5)
  const downloadFormat = ref('hex')
  const selectedColorIndex = ref(-1)

  const imageAdjustments = ref({
    zoom: 100,
    brightness: 100,
    contrast: 100,
    saturation: 100,
    hue: 0
  })

  const panPosition = ref({ x: 0, y: 0 })
  const canvasRef = ref(null)
  const filteredCanvasRef = ref(null)
  const imageExportFormat = ref('png')
  const imageExportSize = ref('medium')
  const originalImageSize = ref({ width: 0, height: 0 })

  // Getters (Computed)
  const hasColors = computed(() => colors.value.length > 0)

  const hasActiveFilters = computed(() => {
    const adj = imageAdjustments.value
    return adj.brightness !== 100 ||
           adj.contrast !== 100 ||
           adj.saturation !== 100 ||
           adj.hue !== 0
  })

  // Actions
  function setColorCount(count) {
    colorCount.value = count
  }

  function setImage(imageSrc) {
    currentImage.value = imageSrc
  }

  function clearImage() {
    currentImage.value = null
    colors.value = []
    imageData.value = null
    resetImageAdjustments()
  }

  // ... weitere Actions

  return {
    // State
    colors,
    currentImage,
    imageData,
    colorCount,
    downloadFormat,
    selectedColorIndex,
    imageAdjustments,
    panPosition,
    canvasRef,
    filteredCanvasRef,
    imageExportFormat,
    imageExportSize,
    originalImageSize,

    // Getters
    hasColors,
    hasActiveFilters,

    // Actions
    setColorCount,
    setImage,
    clearImage,
    extractColors,
    // ... weitere
  }
})
```

### Store-Verwendung in Komponenten

```javascript
// In einer Komponente
import { usePaletteStore } from '@/stores/palette'

const store = usePaletteStore()

// State lesen (reaktiv)
const colors = computed(() => store.colors)

// Actions aufrufen
function handleUpload(file) {
  store.setImage(file.dataUrl)
  store.extractColors(file.dataUrl)
}

// Two-Way Binding
const colorCount = computed({
  get: () => store.colorCount,
  set: (val) => {
    store.setColorCount(val)
    if (store.currentImage) {
      store.extractColors(store.currentImage)
    }
  }
})
```

### State-Struktur

```javascript
{
  colors: [
    {
      r: 171, g: 193, b: 35,
      hex: '#ABC123',
      hsl: { h: 65, s: 66, l: 45 },
      position: { x: 245, y: 380 }
    },
    // ... weitere Farben
  ],

  currentImage: 'data:image/png;base64,...',

  imageData: ImageData { width, height, data: Uint8ClampedArray },

  colorCount: 5,  // 1-20

  downloadFormat: 'hex',  // hex|rgb|rgba|hsl|hsla|css

  selectedColorIndex: 0,  // -1 = keine Auswahl

  imageAdjustments: {
    zoom: 100,        // 25-400
    brightness: 100,  // 0-200
    contrast: 100,    // 0-200
    saturation: 100,  // 0-200
    hue: 0            // -180 bis +180
  },

  panPosition: { x: 0, y: 0 },

  imageExportFormat: 'png',  // png|jpeg|webp

  imageExportSize: 'medium',  // small|medium|large|xlarge

  originalImageSize: { width: 1920, height: 1080 }
}
```

---

## 6. Composables-Architektur

Composables sind wiederverwendbare Logik-Einheiten in Vue 3.

### useTheme.js - Theme Management

```javascript
import { ref, computed, watchEffect } from 'vue'

// Singleton-Pattern: State außerhalb der Funktion
const currentTheme = ref('light')

export function useTheme() {
  // System-Präferenz prüfen
  const prefersDark = window.matchMedia(
    '(prefers-color-scheme: dark)'
  ).matches

  // Gespeicherte Präferenz laden
  const saved = localStorage.getItem('kodini-color-theme')

  if (saved) {
    currentTheme.value = saved
  } else if (prefersDark) {
    currentTheme.value = 'dark'
  }

  // Reaktiv auf DOM anwenden
  watchEffect(() => {
    document.documentElement.setAttribute(
      'data-theme',
      currentTheme.value
    )
  })

  // Toggle-Funktion
  function toggleTheme() {
    currentTheme.value =
      currentTheme.value === 'light' ? 'dark' : 'light'
    localStorage.setItem('kodini-color-theme', currentTheme.value)
  }

  // Computed für UI-Anzeige
  const isDark = computed(() => currentTheme.value === 'dark')

  return {
    currentTheme,
    isDark,
    toggleTheme
  }
}
```

### useI18n.js - Internationalisierung

```javascript
import { ref, computed } from 'vue'

const locale = ref('en')

const translations = {
  en: {
    'app.title': 'Color Extractor',
    'upload.hint': 'Click or drag to upload an image',
    'colors.copy': 'Copy color',
    'export.download': 'Download',
    // ... 260+ weitere Übersetzungen
  },
  de: {
    'app.title': 'Farbextraktor',
    'upload.hint': 'Klicken oder Bild hierher ziehen',
    'colors.copy': 'Farbe kopieren',
    'export.download': 'Herunterladen',
    // ...
  }
}

export function useI18n() {
  // Browser-Sprache erkennen
  const browserLang = navigator.language.split('-')[0]
  if (translations[browserLang]) {
    locale.value = browserLang
  }

  // Übersetzungsfunktion
  function t(key, params = {}) {
    let text = translations[locale.value]?.[key]
             || translations['en'][key]
             || key

    // Parameter ersetzen: {name} → params.name
    Object.entries(params).forEach(([k, v]) => {
      text = text.replace(new RegExp(`{${k}}`, 'g'), v)
    })

    return text
  }

  // Sprache wechseln
  function setLocale(newLocale) {
    if (translations[newLocale]) {
      locale.value = newLocale
    }
  }

  return {
    locale,
    t,
    setLocale,
    availableLocales: Object.keys(translations)
  }
}
```

### useKeyboard.js - Keyboard Shortcuts

```javascript
import { onMounted, onUnmounted } from 'vue'

export function useKeyboard(options = {}) {
  const {
    onCopy,
    onPaste,
    onNavigateUp,
    onNavigateDown,
    onEnter
  } = options

  // Plattform-Erkennung
  const isMac = navigator.platform.toLowerCase().includes('mac')
  const modifierKey = isMac ? 'metaKey' : 'ctrlKey'

  function handleKeydown(e) {
    // Ignorieren wenn in Input-Feld
    if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
      return
    }

    // Ctrl/Cmd + C
    if (e[modifierKey] && e.key === 'c') {
      e.preventDefault()
      onCopy?.()
    }

    // Ctrl/Cmd + V
    if (e[modifierKey] && e.key === 'v') {
      e.preventDefault()
      onPaste?.()
    }

    // Arrow Up
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      onNavigateUp?.()
    }

    // Arrow Down
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      onNavigateDown?.()
    }

    // Enter
    if (e.key === 'Enter') {
      onEnter?.()
    }
  }

  onMounted(() => {
    document.addEventListener('keydown', handleKeydown)
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown)
  })

  return {
    isMac,
    modifierKeyLabel: isMac ? '⌘' : 'Ctrl'
  }
}
```

### useToast.js - Benachrichtigungssystem

```javascript
import { ref } from 'vue'

// Globaler Singleton
const toasts = ref([])
let toastId = 0

export function useToast() {
  function showToast(message, type = 'info', duration = 2500) {
    const id = ++toastId

    toasts.value.push({
      id,
      message,
      type  // 'success' | 'error' | 'info'
    })

    // Auto-Entfernung
    setTimeout(() => {
      removeToast(id)
    }, duration)

    return id
  }

  function removeToast(id) {
    const index = toasts.value.findIndex(t => t.id === id)
    if (index > -1) {
      toasts.value.splice(index, 1)
    }
  }

  // Convenience-Methoden
  const success = (msg) => showToast(msg, 'success')
  const error = (msg) => showToast(msg, 'error')
  const info = (msg) => showToast(msg, 'info')

  return {
    toasts,
    showToast,
    removeToast,
    success,
    error,
    info
  }
}
```

---

## 7. Moderne Browser-APIs

### File API & FileReader

```javascript
// Datei aus Input-Element
const input = document.createElement('input')
input.type = 'file'
input.accept = 'image/*'

input.onchange = (e) => {
  const file = e.target.files[0]

  if (!file.type.startsWith('image/')) {
    console.error('Keine Bilddatei')
    return
  }

  const reader = new FileReader()

  reader.onload = (e) => {
    const dataUrl = e.target.result
    // dataUrl ist jetzt: "data:image/png;base64,..."
    store.setImage(dataUrl)
    store.extractColors(dataUrl)
  }

  reader.onerror = () => {
    console.error('Fehler beim Lesen der Datei')
  }

  reader.readAsDataURL(file)
}

input.click()
```

### Drag & Drop API

```javascript
// Template
// <div
//   @dragover.prevent="onDragOver"
//   @dragleave="onDragLeave"
//   @drop.prevent="onDrop"
// >

function onDragOver(e) {
  e.dataTransfer.dropEffect = 'copy'
  isDragging.value = true
}

function onDragLeave() {
  isDragging.value = false
}

function onDrop(e) {
  isDragging.value = false

  const files = e.dataTransfer.files
  if (files.length === 0) return

  const file = files[0]
  if (!file.type.startsWith('image/')) return

  const reader = new FileReader()
  reader.onload = (e) => {
    store.setImage(e.target.result)
    store.extractColors(e.target.result)
  }
  reader.readAsDataURL(file)
}
```

### Clipboard API

```javascript
// Text kopieren (Modern)
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success('Kopiert!')
  } catch (err) {
    // Fallback für ältere Browser
    fallbackCopy(text)
  }
}

// Fallback mit execCommand
function fallbackCopy(text) {
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()

  try {
    document.execCommand('copy')
    toast.success('Kopiert!')
  } catch (err) {
    toast.error('Kopieren fehlgeschlagen')
  }

  document.body.removeChild(textarea)
}

// Bild aus Clipboard lesen
async function pasteFromClipboard() {
  try {
    const items = await navigator.clipboard.read()

    for (const item of items) {
      for (const type of item.types) {
        if (type.startsWith('image/')) {
          const blob = await item.getType(type)
          const reader = new FileReader()

          reader.onload = (e) => {
            store.setImage(e.target.result)
            store.extractColors(e.target.result)
          }

          reader.readAsDataURL(blob)
          return
        }
      }
    }
  } catch (err) {
    console.error('Paste fehlgeschlagen:', err)
  }
}
```

### Blob & URL API

```javascript
// Text-Datei erstellen und herunterladen
function downloadTextFile(content, filename) {
  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()

  // Memory aufräumen
  URL.revokeObjectURL(url)
}

// Canvas als Bild herunterladen
function downloadCanvasAsImage(canvas, format, filename) {
  const mimeType = {
    png: 'image/png',
    jpeg: 'image/jpeg',
    webp: 'image/webp'
  }[format]

  const quality = format === 'png' ? undefined : 0.9

  canvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = `${filename}.${format}`
    link.click()

    URL.revokeObjectURL(url)
  }, mimeType, quality)
}
```

### matchMedia API

```javascript
// System-Farbschema erkennen
const prefersDark = window.matchMedia(
  '(prefers-color-scheme: dark)'
)

// Initial prüfen
if (prefersDark.matches) {
  currentTheme.value = 'dark'
}

// Auf Änderungen reagieren
prefersDark.addEventListener('change', (e) => {
  if (!localStorage.getItem('kodini-color-theme')) {
    currentTheme.value = e.matches ? 'dark' : 'light'
  }
})
```

### localStorage API

```javascript
// Speichern
localStorage.setItem('kodini-color-theme', 'dark')

// Laden
const theme = localStorage.getItem('kodini-color-theme')

// Löschen
localStorage.removeItem('kodini-color-theme')

// Mit JSON
const settings = { zoom: 150, format: 'hex' }
localStorage.setItem('settings', JSON.stringify(settings))

const loaded = JSON.parse(
  localStorage.getItem('settings') || '{}'
)
```

---

## 8. Drag & Drop Farbpositionierung

Eine der komplexesten Features ist das Ziehen von Farbindikatoren zur Neupositionierung.

### Konzept

```
┌─────────────────────────────────────┐
│                                     │
│     ●───────────────────→ ●         │
│   Indikator              Neue       │
│   (dragging)             Position   │
│                                     │
│              [Bild]                 │
│                                     │
└─────────────────────────────────────┘
```

### Koordinaten-Transformation

Das Bild kann gezoomt und gepannt sein. Daher müssen Mauskoordinaten transformiert werden:

```javascript
function getImageCoordinates(mouseX, mouseY) {
  const rect = imageContainer.getBoundingClientRect()

  // 1. Container-relative Koordinaten
  const containerX = mouseX - rect.left
  const containerY = mouseY - rect.top

  // 2. Zoom-Faktor berücksichtigen
  const zoom = store.imageAdjustments.zoom / 100

  // 3. Pan-Offset berücksichtigen
  const panX = store.panPosition.x
  const panY = store.panPosition.y

  // 4. Rücktransformation
  const imageX = (containerX - panX) / zoom
  const imageY = (containerY - panY) / zoom

  return { x: imageX, y: imageY }
}
```

### Drag-Implementierung

```javascript
const isDragging = ref(false)
const dragIndex = ref(-1)
const dragPosition = ref({ x: 0, y: 0 })

function startDrag(index, event) {
  event.preventDefault()
  isDragging.value = true
  dragIndex.value = index

  // Event-Listener hinzufügen
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', endDrag)
  document.addEventListener('touchmove', onDrag, { passive: false })
  document.addEventListener('touchend', endDrag)
}

function onDrag(event) {
  if (!isDragging.value) return

  event.preventDefault()

  // Touch oder Mouse?
  const clientX = event.touches?.[0]?.clientX ?? event.clientX
  const clientY = event.touches?.[0]?.clientY ?? event.clientY

  // Performance: requestAnimationFrame
  requestAnimationFrame(() => {
    const coords = getImageCoordinates(clientX, clientY)

    // Grenzen prüfen
    coords.x = Math.max(0, Math.min(imageWidth, coords.x))
    coords.y = Math.max(0, Math.min(imageHeight, coords.y))

    dragPosition.value = coords

    // Live-Update der Farbe
    updateColorPreview(dragIndex.value, coords.x, coords.y)
  })
}

function endDrag() {
  if (!isDragging.value) return

  // Farbe final aktualisieren
  store.updateColorFromPosition(
    dragIndex.value,
    dragPosition.value.x,
    dragPosition.value.y
  )

  isDragging.value = false
  dragIndex.value = -1

  // Listener entfernen
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', endDrag)
  document.removeEventListener('touchmove', onDrag)
  document.removeEventListener('touchend', endDrag)
}
```

### Pixel-Zoom-Vorschau

Während des Ziehens wird eine 12×12 Pixel-Lupe angezeigt:

```javascript
function getPixelZoomData(x, y, size = 12) {
  const canvas = store.canvasRef
  if (!canvas) return null

  const ctx = canvas.getContext('2d')

  // Bereich um den Cursor
  const halfSize = Math.floor(size / 2)
  const startX = Math.floor(x) - halfSize
  const startY = Math.floor(y) - halfSize

  // Pixeldaten extrahieren
  const imageData = ctx.getImageData(
    startX, startY,
    size, size
  )

  // In Array von Farbwerten konvertieren
  const pixels = []
  for (let i = 0; i < imageData.data.length; i += 4) {
    pixels.push({
      r: imageData.data[i],
      g: imageData.data[i + 1],
      b: imageData.data[i + 2]
    })
  }

  return {
    pixels,
    centerColor: pixels[Math.floor(pixels.length / 2)]
  }
}
```

---

## 9. Bildanpassungen und Echtzeit-Filterung

### Anpassungsparameter

| Parameter | Bereich | Standard | Beschreibung |
|-----------|---------|----------|--------------|
| Zoom | 25-400% | 100% | Bildvergrößerung |
| Helligkeit | 0-200% | 100% | Brightness-Filter |
| Kontrast | 0-200% | 100% | Contrast-Filter |
| Sättigung | 0-200% | 100% | Saturation-Filter |
| Farbton | -180° bis +180° | 0° | Hue-Rotation |

### Filter anwenden

```javascript
function applyFiltersToCanvas() {
  const canvas = store.canvasRef
  const filteredCanvas = store.filteredCanvasRef

  if (!canvas || !filteredCanvas) return

  const ctx = filteredCanvas.getContext('2d')
  const adj = store.imageAdjustments

  // Canvas-Größe synchronisieren
  filteredCanvas.width = canvas.width
  filteredCanvas.height = canvas.height

  // CSS-Filter zusammenbauen
  ctx.filter = [
    `brightness(${adj.brightness}%)`,
    `contrast(${adj.contrast}%)`,
    `saturate(${adj.saturation}%)`,
    `hue-rotate(${adj.hue}deg)`
  ].join(' ')

  // Original mit Filtern zeichnen
  ctx.drawImage(canvas, 0, 0)

  // Filter zurücksetzen für zukünftige Operationen
  ctx.filter = 'none'
}
```

### Two-Way Binding für Slider

```javascript
// In ImageEditPanel.vue

const brightness = computed({
  get: () => store.imageAdjustments.brightness,
  set: (value) => {
    store.setImageAdjustment('brightness', value)
    // Echtzeit-Update
    applyFiltersToCanvas()
  }
})

// Template
// <input
//   type="range"
//   v-model="brightness"
//   min="0"
//   max="200"
// >
```

### Vorher/Nachher-Vergleich

```javascript
// ImagePreviewModal.vue
// Verwendet clip-path für den Vergleich

const sliderPosition = ref(50)  // Prozent

// Linke Seite (Original)
const originalStyle = computed(() => ({
  clipPath: `inset(0 ${100 - sliderPosition.value}% 0 0)`
}))

// Rechte Seite (Gefiltert)
const filteredStyle = computed(() => ({
  clipPath: `inset(0 0 0 ${sliderPosition.value}%)`
}))

// Template:
// <div class="comparison">
//   <img :src="originalImage" :style="originalStyle">
//   <img :src="filteredImage" :style="filteredStyle">
//   <div class="slider" @mousedown="startSlide">
//     <!-- Slider-Linie -->
//   </div>
// </div>
```

---

## 10. Export-Funktionalitäten

### Farbformate

```javascript
function getFormatted(color, index) {
  const { r, g, b, hex, hsl } = color

  switch (store.downloadFormat) {
    case 'hex':
      return hex.toUpperCase()

    case 'rgb':
      return `rgb(${r}, ${g}, ${b})`

    case 'rgba':
      return `rgba(${r}, ${g}, ${b}, 1)`

    case 'hsl':
      return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`

    case 'hsla':
      return `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, 1)`

    case 'css':
      return `:root {\n  --color-${index + 1}: ${hex};\n}`

    default:
      return hex
  }
}
```

### Text-Export

```javascript
function downloadTxt() {
  const lines = store.colors.map((color, i) => {
    return getFormatted(color, i)
  })

  // CSS-Variante braucht spezielle Formatierung
  let content
  if (store.downloadFormat === 'css') {
    const vars = store.colors
      .map((c, i) => `  --color-${i + 1}: ${c.hex};`)
      .join('\n')
    content = `:root {\n${vars}\n}`
  } else {
    content = lines.join('\n')
  }

  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = 'color-palette.txt'
  link.click()

  URL.revokeObjectURL(url)
}
```

### Bild-Export

```javascript
function downloadImage() {
  const sizes = {
    small: 400,
    medium: 800,
    large: 1200,
    xlarge: 1600
  }

  const width = sizes[store.imageExportSize]
  const colorHeight = 100
  const textHeight = 30
  const totalHeight = colorHeight + textHeight

  // Canvas erstellen
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = totalHeight

  const ctx = canvas.getContext('2d')
  const colorWidth = width / store.colors.length

  store.colors.forEach((color, i) => {
    const x = i * colorWidth

    // Farbfläche
    ctx.fillStyle = color.hex
    ctx.fillRect(x, 0, colorWidth, colorHeight)

    // Textbereich
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(x, colorHeight, colorWidth, textHeight)

    // HEX-Text
    ctx.fillStyle = '#333333'
    ctx.font = '12px monospace'
    ctx.textAlign = 'center'
    ctx.fillText(
      color.hex.toUpperCase(),
      x + colorWidth / 2,
      colorHeight + 20
    )
  })

  // Download
  const mimeTypes = {
    png: 'image/png',
    jpeg: 'image/jpeg',
    webp: 'image/webp'
  }

  canvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `palette.${store.imageExportFormat}`
    link.click()
    URL.revokeObjectURL(url)
  }, mimeTypes[store.imageExportFormat], 0.9)
}
```

---

## 11. Performance-Optimierungen

### Memory Management

#### 1. Position-Sampling
```javascript
// Problem: Alle Positionen speichern = massiver Speicherverbrauch
// Lösung: Nur 1% samplen

if (Math.random() < 0.01) {
  entry.positions.push({ x, y })
}

// Ergebnis:
// - 1000x1000 Bild = 1 Million Pixel
// - Ohne Sampling: 1M Positionen × 16 Bytes = 16 MB
// - Mit Sampling: 10.000 Positionen × 16 Bytes = 160 KB
```

#### 2. Canvas-Referenz-Management
```javascript
// Lazy Creation
if (!filteredCanvasRef.value) {
  filteredCanvasRef.value = document.createElement('canvas')
}

// Cleanup
function clearImage() {
  canvasRef.value = null
  filteredCanvasRef.value = null
}
```

#### 3. URL.revokeObjectURL()
```javascript
function downloadFile(blob, filename) {
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()

  // WICHTIG: Memory freigeben!
  URL.revokeObjectURL(url)
}
```

### Rendering-Optimierungen

#### 1. requestAnimationFrame
```javascript
function onDrag(event) {
  // Ohne RAF: Potentiell 60+ Updates pro Sekunde
  // Mit RAF: Synchronisiert mit Display-Refresh (16.67ms)

  requestAnimationFrame(() => {
    const coords = getImageCoordinates(event.clientX, event.clientY)
    updateDragPosition(coords)
  })
}
```

#### 2. Computed Property Caching
```javascript
// ✅ Gut: Wird gecached bis Abhängigkeiten ändern
const hasActiveFilters = computed(() => {
  const adj = imageAdjustments.value
  return adj.brightness !== 100 || adj.contrast !== 100
})

// ❌ Schlecht: Wird bei jedem Render ausgeführt
const hasActiveFilters = () => {
  return adjustments.brightness !== 100
}
```

#### 3. Touch-Action CSS
```css
.drag-target {
  touch-action: none;
  /* Verhindert Browser-Gesten (Scroll, Zoom) während Drag */
}
```

### Algorithmus-Effizienz

#### Map-basierte Lookups
```javascript
// ✅ O(1) Lookup mit Map
const colorMap = new Map()
const key = `${r},${g},${b}`

if (colorMap.has(key)) {
  colorMap.get(key).count++
}

// ❌ O(n) Lookup mit Array.find
const existing = colors.find(c =>
  c.r === r && c.g === g && c.b === b
)
```

#### Single-Pass Pixel-Verarbeitung
```javascript
// Ein einziger Durchlauf durch alle Pixel
for (let i = 0; i < pixels.length; i += 4) {
  // Quantisieren
  // Zählen
  // Position speichern
  // Alles in einem Loop!
}
```

---

## 12. CSS-Architektur und Theming

### CSS Custom Properties System

```css
/* assets/main.css */

/* Basis-Farbpalette */
:root {
  --color-accent: #F2E28E;    /* Gelb */
  --color-secondary: #A28680;  /* Braun */
  --color-neutral: #5E5F69;    /* Grau */
  --color-tertiary: #AEAFB7;   /* Hellgrau */
  --color-dark: #0C0C10;       /* Fast Schwarz */
}

/* Light Theme (Standard) */
:root {
  --bg-primary: #f8f9fa;
  --bg-secondary: #ffffff;
  --bg-sidebar: linear-gradient(
    135deg,
    rgba(248,249,250,0.95),
    rgba(255,255,255,0.98)
  );

  --text-primary: #0C0C10;
  --text-secondary: #5E5F69;
  --text-tertiary: #AEAFB7;

  --border-color: #AEAFB7;
  --selection-color: #5E5F69;

  --shadow-soft: rgba(0, 0, 0, 0.08);
  --shadow-medium: rgba(0, 0, 0, 0.12);
}

/* Dark Theme */
[data-theme="dark"] {
  --bg-primary: #0C0C10;
  --bg-secondary: #1a1a20;
  --bg-sidebar: linear-gradient(
    135deg,
    rgba(12,12,16,0.95),
    rgba(26,26,32,0.98)
  );

  --text-primary: #f8f9fa;
  --text-secondary: #AEAFB7;
  --text-tertiary: #5E5F69;

  --border-color: #3a3a45;
  --selection-color: #F2E28E;

  --shadow-soft: rgba(0, 0, 0, 0.3);
  --shadow-medium: rgba(0, 0, 0, 0.4);
}
```

### Verwendung in Komponenten

```css
/* In einer <style scoped> Sektion */

.container {
  background: var(--bg-primary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  box-shadow: 0 2px 8px var(--shadow-soft);
}

.button-primary {
  background: var(--color-accent);
  color: var(--color-dark);
}

.button-primary:hover {
  filter: brightness(1.1);
}
```

### Theme-Wechsel mit JavaScript

```javascript
// useTheme.js
function toggleTheme() {
  const newTheme = currentTheme.value === 'light' ? 'dark' : 'light'
  currentTheme.value = newTheme
  localStorage.setItem('kodini-color-theme', newTheme)
}

// WatchEffect aktualisiert automatisch das DOM
watchEffect(() => {
  document.documentElement.setAttribute(
    'data-theme',
    currentTheme.value
  )
})
```

### Responsive Design Breakpoints

```css
/* Mobile First Approach */

.color-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

/* Tablet */
@media (min-width: 768px) {
  .color-grid {
    grid-template-columns: repeat(6, 1fr);
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .color-grid {
    grid-template-columns: repeat(8, 1fr);
  }
}

/* Layout-Wechsel */
.app-layout {
  display: flex;
  flex-direction: column;
}

@media (min-width: 1024px) {
  .app-layout {
    flex-direction: row;
  }

  .sidebar {
    width: 320px;
    flex-shrink: 0;
  }

  .main-content {
    flex: 1;
  }
}
```

### CSS Transitions

```css
/* Sanfte Übergänge */
.theme-transition {
  transition:
    background-color 0.3s ease,
    color 0.3s ease,
    border-color 0.3s ease;
}

/* Button Hover */
.button {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px var(--shadow-medium);
}

/* Farbindikator Pulse */
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.color-indicator {
  animation: pulse 2s ease-in-out infinite;
}

.color-indicator.selected {
  animation: none;
  transform: scale(1.2);
}
```

---

## 13. Internationalisierung (i18n)

### Unterstützte Sprachen

| Sprache | Code | Übersetzungen |
|---------|------|---------------|
| Englisch | en | 260+ Keys |
| Deutsch | de | 260+ Keys |

### Übersetzungsstruktur

```javascript
// useI18n.js

const translations = {
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.app': 'App',
    'nav.faq': 'FAQ',

    // Upload
    'upload.title': 'Upload Image',
    'upload.hint': 'Click or drag to upload',
    'upload.formats': 'JPG, PNG, WebP, GIF',
    'upload.processing': 'Processing...',

    // Colors
    'colors.title': 'Color Palette',
    'colors.empty': 'Upload an image to extract colors',
    'colors.copy': 'Copy color',
    'colors.copied': 'Copied!',
    'colors.count': '{count} colors',

    // Export
    'export.title': 'Export',
    'export.format': 'Format',
    'export.download': 'Download',
    'export.copy': 'Copy All',

    // Adjustments
    'adjust.title': 'Image Adjustments',
    'adjust.zoom': 'Zoom',
    'adjust.brightness': 'Brightness',
    'adjust.contrast': 'Contrast',
    'adjust.saturation': 'Saturation',
    'adjust.hue': 'Hue',
    'adjust.reset': 'Reset',
    'adjust.resetAll': 'Reset All',

    // Keyboard
    'keyboard.hint': 'Press {key} to copy selected color',

    // Errors
    'error.invalidFile': 'Please upload a valid image file',
    'error.loadFailed': 'Failed to load image',
  },

  de: {
    // Navigation
    'nav.home': 'Startseite',
    'nav.app': 'App',
    'nav.faq': 'FAQ',

    // Upload
    'upload.title': 'Bild hochladen',
    'upload.hint': 'Klicken oder Bild hierher ziehen',
    'upload.formats': 'JPG, PNG, WebP, GIF',
    'upload.processing': 'Verarbeitung...',

    // Farben
    'colors.title': 'Farbpalette',
    'colors.empty': 'Laden Sie ein Bild hoch, um Farben zu extrahieren',
    'colors.copy': 'Farbe kopieren',
    'colors.copied': 'Kopiert!',
    'colors.count': '{count} Farben',

    // Export
    'export.title': 'Exportieren',
    'export.format': 'Format',
    'export.download': 'Herunterladen',
    'export.copy': 'Alle kopieren',

    // Anpassungen
    'adjust.title': 'Bildanpassungen',
    'adjust.zoom': 'Zoom',
    'adjust.brightness': 'Helligkeit',
    'adjust.contrast': 'Kontrast',
    'adjust.saturation': 'Sättigung',
    'adjust.hue': 'Farbton',
    'adjust.reset': 'Zurücksetzen',
    'adjust.resetAll': 'Alle zurücksetzen',

    // Tastatur
    'keyboard.hint': 'Drücken Sie {key}, um die ausgewählte Farbe zu kopieren',

    // Fehler
    'error.invalidFile': 'Bitte laden Sie eine gültige Bilddatei hoch',
    'error.loadFailed': 'Bild konnte nicht geladen werden',
  }
}
```

### Verwendung in Komponenten

```vue
<script setup>
import { useI18n } from '@/composables/useI18n'

const { t, locale, setLocale } = useI18n()
</script>

<template>
  <!-- Einfache Übersetzung -->
  <h1>{{ t('colors.title') }}</h1>

  <!-- Mit Parametern -->
  <p>{{ t('colors.count', { count: colors.length }) }}</p>

  <!-- Sprachwechsler -->
  <button @click="setLocale('en')">EN</button>
  <button @click="setLocale('de')">DE</button>
</template>
```

### Automatische Spracherkennung

```javascript
export function useI18n() {
  // Browser-Sprache ermitteln
  const browserLang = navigator.language.split('-')[0]

  // Fallback auf Englisch wenn nicht unterstützt
  if (translations[browserLang]) {
    locale.value = browserLang
  } else {
    locale.value = 'en'
  }

  // ...
}
```

---

## 14. Barrierefreiheit und UX

### Keyboard-Navigation

| Tastenkombination | Aktion |
|-------------------|--------|
| `Ctrl/Cmd + C` | Ausgewählte Farbe kopieren |
| `Ctrl/Cmd + V` | Bild aus Zwischenablage einfügen |
| `↑` / `↓` | Durch Farben navigieren |
| `Enter` | Aktuelle Farbe kopieren |
| `Escape` | Modal schließen |

### Fokus-Management

```css
/* Sichtbarer Fokus-Indikator */
:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

/* Fokus für Buttons */
.button:focus-visible {
  box-shadow: 0 0 0 3px rgba(242, 226, 142, 0.5);
}
```

### Touch-Optimierung

```css
/* Mindestgröße für Touch-Targets (44x44px) */
.button {
  min-width: 44px;
  min-height: 44px;
  padding: 12px 16px;
}

/* Touch-Action für Drag-Bereiche */
.draggable {
  touch-action: none;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
}
```

### Farbkontrast

```css
/* Mindestkontrast 4.5:1 für normalen Text */
.text-primary {
  color: var(--text-primary);  /* #0C0C10 auf #f8f9fa = 18:1 */
}

/* Mindestkontrast 3:1 für großen Text */
.heading {
  color: var(--text-secondary);  /* #5E5F69 auf #f8f9fa = 5.7:1 */
}
```

### Ladezustände

```vue
<template>
  <!-- Während Verarbeitung -->
  <div v-if="isProcessing" class="loading">
    <div class="spinner"></div>
    <span>{{ t('upload.processing') }}</span>
  </div>

  <!-- Skeleton für leere Liste -->
  <div v-else-if="!hasColors" class="skeleton">
    <div v-for="i in 5" class="skeleton-item"></div>
  </div>

  <!-- Eigentlicher Inhalt -->
  <div v-else class="color-list">
    <!-- ... -->
  </div>
</template>
```

### Toast-Benachrichtigungen

```vue
<!-- ToastContainer.vue -->
<template>
  <Teleport to="body">
    <div class="toast-container" aria-live="polite">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        :class="['toast', `toast-${toast.type}`]"
        role="alert"
      >
        {{ toast.message }}
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9999;
}

.toast {
  padding: 12px 24px;
  border-radius: 8px;
  margin-top: 8px;
  animation: slideIn 0.3s ease;
}

.toast-success {
  background: #10b981;
  color: white;
}

.toast-error {
  background: #ef4444;
  color: white;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>
```

---

## 15. Build-Konfiguration

### Vite Configuration

```javascript
// vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'url'

export default defineConfig({
  plugins: [vue()],

  // Basis-URL für GitHub Pages Deployment
  base: '/kodini-color-extractor/',

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },

  build: {
    outDir: 'dist',
    assetsDir: 'assets',

    // Optimierungen
    minify: 'terser',
    sourcemap: false,

    rollupOptions: {
      output: {
        // Chunk-Splitting
        manualChunks: {
          'vue-vendor': ['vue', 'vue-router', 'pinia']
        }
      }
    }
  },

  server: {
    port: 5173,
    open: true
  }
})
```

### Package.json Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

### Entwicklungs-Workflow

```bash
# Entwicklungsserver starten
npm run dev
# → http://localhost:5173

# Produktions-Build erstellen
npm run build
# → Output in /dist

# Build lokal testen
npm run preview
# → http://localhost:4173
```

### Abhängigkeiten

```json
{
  "dependencies": {
    "vue": "^3.4.21",
    "vue-router": "^4.6.4",
    "pinia": "^2.1.7"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.0.4",
    "vite": "^5.2.8"
  }
}
```

### Bundle-Größen (Approximate)

| Bundle | Größe (gzip) |
|--------|--------------|
| Vue + Router + Pinia | ~47 KB |
| App-Code | ~25 KB |
| CSS | ~8 KB |
| **Total** | **~80 KB** |

---

## 16. Fazit und Learnings

### Architektur-Entscheidungen

| Entscheidung | Begründung |
|--------------|------------|
| **Canvas-basiert** | Einzige Möglichkeit, Pixeldaten von Bildern zu lesen |
| **Quantisierung** | Performance: 16.7M → 4.096 Farben |
| **Composition API** | Bessere Code-Organisation und TypeScript-Support |
| **Pinia statt Vuex** | Moderner, einfacher, volle TypeScript-Unterstützung |
| **CSS Variables** | Einfaches Theme-Switching ohne JavaScript |
| **Keine Web Workers** | Bildgrößen erfordern kein Multi-Threading |
| **Base64 Storage** | In-Memory Persistenz, funktioniert über Routen hinweg |

### Best Practices

1. **Composables für wiederverwendbare Logik**
   - Trennung von UI und Business-Logik
   - Einfaches Testing möglich
   - Klare Verantwortlichkeiten

2. **Computed Properties für abgeleitete Werte**
   - Automatisches Caching
   - Reaktive Updates
   - Keine manuellen Subscriptions nötig

3. **Memory Management**
   - `URL.revokeObjectURL()` nach Downloads
   - Position-Sampling für große Bilder
   - Lazy Canvas-Erstellung

4. **Progressive Enhancement**
   - Fallback für Clipboard API
   - Touch + Mouse Support
   - Responsive Layout

### Erweiterungsmöglichkeiten

1. **Web Workers für große Bilder**
   ```javascript
   // Farbextraktion in Worker auslagern
   const worker = new Worker('color-worker.js')
   worker.postMessage({ imageData, colorCount })
   worker.onmessage = (e) => {
     colors.value = e.data.colors
   }
   ```

2. **IndexedDB für Bildhistorie**
   ```javascript
   // Bilder persistent speichern
   const db = await openDB('color-extractor', 1)
   await db.add('images', {
     dataUrl,
     colors,
     timestamp: Date.now()
   })
   ```

3. **Color Harmony Suggestions**
   ```javascript
   // Komplementärfarben berechnen
   function getComplementary(hsl) {
     return {
       ...hsl,
       h: (hsl.h + 180) % 360
     }
   }
   ```

4. **Export zu Design-Tools**
   ```javascript
   // ASE (Adobe Swatch Exchange) Export
   function exportToASE(colors) {
     // Binary format für Photoshop/Illustrator
   }
   ```

### Statistiken

| Metrik | Wert |
|--------|------|
| **Dateien** | 20 |
| **Codezeilen** | ~4.587 |
| **Vue-Komponenten** | 12 |
| **Composables** | 4 |
| **Abhängigkeiten** | 3 |
| **Sprachen** | 2 (EN, DE) |
| **Export-Formate** | 6 |
| **Bildformate** | 3 |

---

## Anhang: Nützliche Ressourcen

### Offizielle Dokumentation

- [Vue.js 3 Documentation](https://vuejs.org/guide/introduction.html)
- [Pinia Documentation](https://pinia.vuejs.org/)
- [Vite Documentation](https://vitejs.dev/)
- [MDN Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [MDN Clipboard API](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API)
- [MDN File API](https://developer.mozilla.org/en-US/docs/Web/API/File_API)

### Weiterführende Artikel

- [Color Theory in Digital Design](https://www.interaction-design.org/literature/article/color-theory-for-designers)
- [Understanding Color Quantization](https://en.wikipedia.org/wiki/Color_quantization)
- [Vue 3 Composition API Patterns](https://vuejs.org/guide/reusability/composables.html)

---

*Diese Dokumentation wurde für den Kodini Color Extractor erstellt. Stand: Januar 2026.*
