import { ref, computed } from 'vue'

const translations = {
  en: {
    title: 'Kodini Color Extractor',
    subtitle: 'Extract colors from any image',
    uploadText: 'Choose image',
    colorCountLabel: 'Number of colors',
    formatLabel: 'Format',
    paletteTitle: 'Extracted colors',
    placeholderText: 'Upload an image to get started',
    placeholderHint: 'Drag & drop or click "Choose image"',
    processingText: 'Processing image...',
    processingHint: 'Extracting colors',
    downloadTxt: 'Download TXT',
    downloadPng: 'Download PNG',
    clickToCopy: 'Click to copy',
    copied: 'Copied!',
    editPanelTitle: 'Image Editing',
    zoom: 'Zoom',
    brightness: 'Brightness',
    contrast: 'Contrast',
    saturation: 'Saturation',
    hue: 'Hue',
    reset: 'Reset',
    resetAll: 'Reset all'
  },
  de: {
    title: 'Kodini Color Extractor',
    subtitle: 'Extrahiere Farben aus jedem Bild',
    uploadText: 'Bild waehlen',
    colorCountLabel: 'Anzahl Farben',
    formatLabel: 'Format',
    paletteTitle: 'Extrahierte Farben',
    placeholderText: 'Lade ein Bild hoch, um zu beginnen',
    placeholderHint: 'Drag & Drop oder klicke auf "Bild waehlen"',
    processingText: 'Bild wird verarbeitet...',
    processingHint: 'Farben werden extrahiert',
    downloadTxt: 'TXT herunterladen',
    downloadPng: 'PNG herunterladen',
    clickToCopy: 'Klicken zum Kopieren',
    copied: 'Kopiert!',
    editPanelTitle: 'Bildbearbeitung',
    zoom: 'Zoom',
    brightness: 'Helligkeit',
    contrast: 'Kontrast',
    saturation: 'Saettigung',
    hue: 'Farbton',
    reset: 'Zuruecksetzen',
    resetAll: 'Alles zuruecksetzen'
  }
}

const browserLang = (navigator.language || 'en').split('-')[0]
const currentLocale = ref(translations[browserLang] ? browserLang : 'en')

export function useI18n() {
  const t = (key) => translations[currentLocale.value]?.[key] || translations.en[key] || key

  const locale = computed({
    get: () => currentLocale.value,
    set: (val) => {
      if (translations[val]) currentLocale.value = val
    }
  })

  const availableLocales = Object.keys(translations)

  return { t, locale, availableLocales }
}
