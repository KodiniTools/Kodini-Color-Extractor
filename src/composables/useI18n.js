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
    placeholderHint: 'Drag & drop, paste (Ctrl+V) or click upload',
    processingText: 'Processing image...',
    processingHint: 'Extracting colors',
    downloadTitle: 'Download',
    downloadTxt: 'Download TXT',
    downloadPng: 'Download PNG',
    downloadImage: 'Download Image',
    imageFormatLabel: 'Image format',
    imageSizeLabel: 'Image size',
    sizeSmall: 'Small (400px)',
    sizeMedium: 'Medium (800px)',
    sizeLarge: 'Large (1200px)',
    sizeXLarge: 'XL (1600px)',
    clickToCopy: 'Click to copy',
    copied: 'Copied!',
    editPanelTitle: 'Image Editing',
    zoom: 'Zoom',
    brightness: 'Brightness',
    contrast: 'Contrast',
    saturation: 'Saturation',
    hue: 'Hue',
    reset: 'Reset',
    resetAll: 'Reset all',
    // Toast messages
    copiedToClipboard: 'Color copied to clipboard',
    imagePasted: 'Image loaded from clipboard',
    noImageInClipboard: 'No image found in clipboard',
    clipboardError: 'Could not access clipboard',
    downloadStarted: 'Download started',
    // Keyboard hints
    keyboardHint: 'Use arrow keys to navigate, Enter or Ctrl+C to copy',
    // Tooltips
    doubleClickToCopy: 'Double-click to copy',
    // Donate
    donate: 'support this project',
    donateTitle: 'Donate via PayPal',
    // Sample images
    sampleImagesLabel: 'Try with sample images:',
    sampleImageHint: 'Click to load this sample image'
  },
  de: {
    title: 'Kodini Color Extractor',
    subtitle: 'Extrahiere Farben aus jedem Bild',
    uploadText: 'Bild waehlen',
    colorCountLabel: 'Anzahl Farben',
    formatLabel: 'Format',
    paletteTitle: 'Extrahierte Farben',
    placeholderText: 'Lade ein Bild hoch, um zu beginnen',
    placeholderHint: 'Drag & Drop, Einfuegen (Strg+V) oder Upload klicken',
    processingText: 'Bild wird verarbeitet...',
    processingHint: 'Farben werden extrahiert',
    downloadTitle: 'Herunterladen',
    downloadTxt: 'TXT herunterladen',
    downloadPng: 'PNG herunterladen',
    downloadImage: 'Bild herunterladen',
    imageFormatLabel: 'Bildformat',
    imageSizeLabel: 'Bildgroesse',
    sizeSmall: 'Klein (400px)',
    sizeMedium: 'Mittel (800px)',
    sizeLarge: 'Gross (1200px)',
    sizeXLarge: 'XL (1600px)',
    clickToCopy: 'Klicken zum Kopieren',
    copied: 'Kopiert!',
    editPanelTitle: 'Bildbearbeitung',
    zoom: 'Zoom',
    brightness: 'Helligkeit',
    contrast: 'Kontrast',
    saturation: 'Saettigung',
    hue: 'Farbton',
    reset: 'Zuruecksetzen',
    resetAll: 'Alles zuruecksetzen',
    // Toast messages
    copiedToClipboard: 'Farbe in Zwischenablage kopiert',
    imagePasted: 'Bild aus Zwischenablage geladen',
    noImageInClipboard: 'Kein Bild in Zwischenablage gefunden',
    clipboardError: 'Zugriff auf Zwischenablage fehlgeschlagen',
    downloadStarted: 'Download gestartet',
    // Keyboard hints
    keyboardHint: 'Pfeiltasten zum Navigieren, Enter oder Strg+C zum Kopieren',
    // Tooltips
    doubleClickToCopy: 'Doppelklick zum Kopieren',
    // Donate
    donate: 'Projekt unterstuetzen',
    donateTitle: 'Spenden via PayPal',
    // Sample images
    sampleImagesLabel: 'Mit Beispielbildern testen:',
    sampleImageHint: 'Klicken um dieses Beispielbild zu laden'
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
