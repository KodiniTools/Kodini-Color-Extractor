# CONTEXT.md - Kodini Color Extractor

## Übersicht

Der Kodini Color Extractor ist eine clientseitige Vue 3 Single-Page-Application zur Extraktion von Farbpaletten aus Bildern. Die Anwendung verarbeitet alle Daten lokal im Browser - es gibt kein Backend und keine Datenbank.

---

## Tech-Stack

### Frontend Framework
| Technologie | Version | Beschreibung |
|-------------|---------|--------------|
| Vue 3 | ^3.4.21 | Reaktives Frontend-Framework (Composition API) |
| Pinia | ^2.1.7 | State-Management |
| Vite | ^5.2.8 | Build-Tool und Dev-Server |

### Styling
- **CSS3** mit CSS Custom Properties (Variablen)
- Scoped Component Styles
- Light/Dark Theme Support

### Bildverarbeitung
- **HTML5 Canvas API** - Bildanalyse und Farbextraktion
- **Clipboard API** - Copy/Paste Funktionalität
- **File API** - Drag & Drop Upload

### Backend
- **Keines** - Vollständig clientseitige Anwendung
- DSGVO-konform (keine Daten werden an Server gesendet)

### Dependencies (package.json)
```json
{
  "dependencies": {
    "pinia": "^2.1.7",
    "vue": "^3.4.21"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.0.4",
    "vite": "^5.2.8"
  }
}
```

---

## Ordnerstruktur

```
Kodini-Color-Extractor/
├── src/                              # Quellcode
│   ├── main.js                       # Vue App Entry Point
│   ├── App.vue                       # Root-Komponente (Layout + Hauptsteuerung)
│   │
│   ├── assets/
│   │   └── main.css                  # Globale Styles mit CSS-Variablen
│   │
│   ├── components/                   # Vue Single File Components
│   │   ├── ImageUploader.vue         # Drag-Drop Upload Interface
│   │   ├── MainContent.vue           # Bildanzeige mit draggbaren Farbindikatoren
│   │   ├── ImageEditPanel.vue        # Slider für Zoom, Helligkeit, Kontrast, etc.
│   │   ├── ColorList.vue             # Anzeige der extrahierten Farbpalette
│   │   ├── ImagePreviewModal.vue     # Vorher/Nachher Vergleich
│   │   ├── SampleImages.vue          # Galerie mit Beispielbildern
│   │   └── ToastContainer.vue        # Benachrichtigungssystem
│   │
│   ├── composables/                  # Wiederverwendbare Composition Logic
│   │   ├── useI18n.js                # Internationalisierung (DE/EN)
│   │   ├── useKeyboard.js            # Tastaturkürzel-Handler
│   │   ├── useToast.js               # Toast-Benachrichtigungen
│   │   └── useTheme.js               # Dark/Light Theme Management
│   │
│   └── stores/
│       └── palette.js                # Pinia Store (zentrale State-Verwaltung)
│
├── public/
│   └── samples/                      # Beispielbilder zum Testen
│       ├── sample-1.jpg ... sample-8.jpg
│       └── README.md
│
├── index.html                        # HTML Entry Point
├── vite.config.js                    # Vite Build-Konfiguration
├── package.json                      # Dependencies und Scripts
├── .gitignore                        # Git-Ausschlüsse
├── README.md                         # Projektdokumentation
└── CONTEXT.md                        # Diese Datei
```

### Verzeichnis-Beschreibungen

| Verzeichnis | Beschreibung |
|-------------|--------------|
| `src/components/` | UI-Komponenten für spezifische Features |
| `src/composables/` | Wiederverwendbare Logik (i18n, Keyboard, Toasts, Theme) |
| `src/stores/` | Pinia Store für zentrales State Management |
| `src/assets/` | Globale CSS-Styles |
| `public/samples/` | 8 Beispielbilder zum Testen der Anwendung |

---

## Datenbankschema / Datenmodelle

Da es sich um eine reine Client-Anwendung handelt, gibt es **keine Datenbank**. Alle Daten werden im Browser-Speicher über den Pinia Store verwaltet.

### Haupt-State (stores/palette.js)

```javascript
{
  // Extrahierte Farben
  colors: Array<Color>,

  // Bildverarbeitung
  currentImage: string,                    // Base64 Data URL
  imageData: ImageData,                    // Canvas ImageData Objekt
  originalImageSize: ImageSize,

  // Einstellungen
  colorCount: number,                      // Anzahl zu extrahierender Farben (1-20)

  // Canvas-Referenzen
  canvasRef: HTMLCanvasElement,
  filteredCanvasRef: HTMLCanvasElement,

  // Export-Einstellungen
  downloadFormat: DownloadFormat,
  imageExportFormat: ImageFormat,
  imageExportSize: ExportSize,

  // Bildanpassungen
  imageAdjustments: ImageAdjustments,
  panPosition: Position,

  // UI-State
  selectedColorIndex: number
}
```

### Typ-Definitionen

#### Color
```typescript
interface Color {
  r: number;           // Rot (0-255)
  g: number;           // Grün (0-255)
  b: number;           // Blau (0-255)
  hex: string;         // HEX-Wert (#RRGGBB)
  hsl: {
    h: number;         // Farbton (0-360)
    s: number;         // Sättigung (0-100)
    l: number;         // Helligkeit (0-100)
  };
  position: {
    x: number;         // X-Koordinate im Originalbild
    y: number;         // Y-Koordinate im Originalbild
  };
}
```

#### ImageSize
```typescript
interface ImageSize {
  width: number;       // Breite in Pixeln
  height: number;      // Höhe in Pixeln
}
```

#### ImageAdjustments
```typescript
interface ImageAdjustments {
  zoom: number;        // 100-300+ (Prozent)
  brightness: number;  // 0-200 (Prozent)
  contrast: number;    // 0-200 (Prozent)
  saturation: number;  // 0-200 (Prozent)
  hue: number;         // 0-360 (Grad)
}
```

#### Position
```typescript
interface Position {
  x: number;           // X-Offset in Pixeln
  y: number;           // Y-Offset in Pixeln
}
```

#### Enums / Konstanten
```typescript
type DownloadFormat = 'hex' | 'rgb' | 'rgba' | 'hsl' | 'hsla' | 'css';
type ImageFormat = 'png' | 'jpeg' | 'webp';
type ExportSize = 'small' | 'medium' | 'large' | 'xlarge';

const exportSizes = {
  small:  { label: 'Small (400px)',  width: 400 },
  medium: { label: 'Medium (800px)', width: 800 },
  large:  { label: 'Large (1200px)', width: 1200 },
  xlarge: { label: 'XL (1600px)',    width: 1600 }
};
```

### Toast-System (composables/useToast.js)
```typescript
interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}
```

### Theme-Persistierung
```javascript
// Gespeichert in localStorage
{
  key: 'kodini-color-theme',
  value: 'light' | 'dark'
}
```

### I18n-Struktur (composables/useI18n.js)
```javascript
{
  en: { [key: string]: string },  // ~60 englische Übersetzungen
  de: { [key: string]: string }   // ~60 deutsche Übersetzungen
}
```

---

## Architektur-Patterns

### State Management
- Zentraler Pinia Store (`usePaletteStore`)
- Reactive Refs und Computed Properties
- Klare Trennung von State, Getters und Actions

### Komponenten-Architektur
- **App.vue** - Root-Komponente mit Layout
- **Spezialisierte Komponenten** - Eine Komponente pro Feature
- Props für Konfiguration, Emits für Kind-zu-Eltern-Kommunikation

### Composables Pattern
| Composable | Funktion |
|------------|----------|
| `useI18n()` | Zweisprachigkeit mit Fallback auf Englisch |
| `useKeyboard()` | Tastaturkürzel (Ctrl+C, Ctrl+V, Pfeiltasten) |
| `useToast()` | Globales Benachrichtigungssystem |
| `useTheme()` | System-Präferenz-Erkennung + localStorage |

---

## Wichtige Funktionen (stores/palette.js)

| Funktion | Beschreibung |
|----------|--------------|
| `extractColors()` | Analysiert Bild und extrahiert dominante Farben |
| `updateColorFromPosition()` | Holt Pixelfarbe an gezogener Position |
| `applyFiltersToCanvas()` | Wendet Bildanpassungen an |
| `getPixelZoomData()` | Liefert Pixel-Daten für Zoom-Lupe |
| `downloadTxt()` | Exportiert Palette als Textdatei |
| `downloadImage()` | Exportiert Palette als Bild |
| `copyPalette()` | Kopiert formatierte Palette in Zwischenablage |
| `rgbToHsl()` | RGB zu HSL Farbraum-Konvertierung |

---

## Features

- Drag & Drop Farbindikatoren auf dem Bild
- Pixel-Zoom (12x12 Pixel Lupe)
- Echtzeit-Bildanpassungen (Canvas API)
- Vorher/Nachher-Vergleich
- 6 Farbformat-Optionen + 3 Bildformate für Export
- Zweisprachige UI (DE/EN)
- Tastaturkürzel
- 8 Beispielbilder
- Dark Mode mit persistenter Präferenz

---

## Hinweise

- **Keine Server-Kommunikation**: Alle Verarbeitung erfolgt lokal
- **Ephemerer State**: Daten gehen bei Seitenaktualisierung verloren
- **DSGVO-konform**: Keine Nutzerdaten verlassen das Gerät
- **Gesamtumfang**: ~2.884 Zeilen Code
