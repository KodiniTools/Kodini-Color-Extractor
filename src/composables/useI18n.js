import { ref, computed, triggerRef } from 'vue'

const translations = {
  en: {
    // App
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
    exportTitle: 'Export',
    downloadTitle: 'Download',
    downloadTxt: 'Download as TXT',
    downloadPng: 'Download PNG',
    downloadImage: 'Download as Image',
    copyPalette: 'Copy to clipboard',
    paletteCopied: 'Palette copied to clipboard',
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
    deleteImage: 'Delete image',
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
    sampleImageHint: 'Click to load this sample image',
    // Preview modal
    preview: 'Preview',
    previewTitle: 'Before / After Comparison',
    before: 'Before',
    after: 'After',
    closePreview: 'Close preview',

    // Navigation
    navHome: 'Home',
    navApp: 'Open App',
    navFaq: 'FAQ',

    // Landing Page - Hero
    heroTitle: 'Extract Beautiful Color Palettes from Any Image',
    heroSubtitle: 'A free, privacy-focused tool that runs entirely in your browser. No uploads, no tracking - just pure color extraction.',
    heroCta: 'Start Extracting Colors',

    // Landing Page - Features
    feature1Title: 'Drag & Drop Upload',
    feature1Desc: 'Simply drag your image into the browser or paste from clipboard. Support for all common image formats.',
    feature2Title: 'Precise Color Picking',
    feature2Desc: 'Drag color indicators directly on the image to pick exact colors with pixel-level precision.',
    feature3Title: 'Multiple Export Formats',
    feature3Desc: 'Export as HEX, RGB, HSL, or CSS variables. Download as text file or beautifully designed palette image.',

    // Landing Page - Details
    detailsTitle: 'All Features at a Glance',
    detailsSubtitle: 'Professional color extraction with everything you need.',

    detail1Title: 'Image Processing',
    detail1Desc: 'Adjust brightness, contrast, saturation and hue in real-time.',
    detail2Title: 'Up to 20 Colors',
    detail2Desc: 'Extract between 1 and 20 dominant colors from your image.',
    detail3Title: 'Easy to Use',
    detail3Desc: 'Intuitive interface with keyboard shortcuts for power users.',
    detail4Title: '100% Private',
    detail4Desc: 'All processing happens locally. Your images never leave your device.',
    detail5Title: 'Keyboard Shortcuts',
    detail5Desc: 'Navigate with arrow keys, copy with Ctrl+C, paste images with Ctrl+V.',
    detail6Title: 'Responsive Design',
    detail6Desc: 'Works on desktop, tablet and mobile devices.',

    // Landing Page - CTA
    ctaTitle: 'Ready to Extract Colors?',
    ctaSubtitle: 'No registration required. Start using the tool right away.',
    ctaButton: 'Launch Color Extractor',

    // FAQ Page
    faqTitle: 'Frequently Asked Questions',
    faqSubtitle: 'Everything you need to know about Kodini Color Extractor.',

    faq1Question: 'Is Kodini Color Extractor free to use?',
    faq1Answer: 'Yes, Kodini Color Extractor is completely free to use. There are no hidden costs, subscriptions, or premium features. All functionality is available to everyone.',

    faq2Question: 'Are my images uploaded to a server?',
    faq2Answer: 'No, your images are never uploaded anywhere. All processing happens directly in your browser using the HTML5 Canvas API. Your images and extracted colors stay completely private on your device.',

    faq3Question: 'What image formats are supported?',
    faq3Answer: 'The tool supports all common image formats including JPEG, PNG, WebP, GIF, and BMP. You can drag & drop files, paste from clipboard, or use the file picker.',

    faq4Question: 'How do I extract a specific color from my image?',
    faq4Answer: 'After loading your image, you will see color indicators placed on the image. Simply drag these indicators to any position to extract the exact color at that pixel. A 12x12 pixel magnifier helps you with precision positioning.',

    faq5Question: 'What export formats are available?',
    faq5Answer: 'You can export your color palette in multiple formats: HEX (#RRGGBB), RGB (rgb(r,g,b)), RGBA, HSL, HSLA, and CSS custom properties. Export as a text file or as a beautiful palette image in PNG, JPG, or WebP format.',

    faq6Question: 'Can I adjust the image before extracting colors?',
    faq6Answer: 'Yes, the image edit panel allows you to adjust zoom, brightness, contrast, saturation, and hue. This is useful when you want to extract colors from a modified version of your image.',

    faq7Question: 'Does it work on mobile devices?',
    faq7Answer: 'Yes, Kodini Color Extractor is fully responsive and works on smartphones and tablets. The interface adapts to smaller screens while maintaining full functionality.',

    faq8Question: 'Is there a dark mode?',
    faq8Answer: 'Yes, the application supports both light and dark themes. Click the sun/moon icon to toggle between modes. Your preference is saved locally.',

    faqCtaTitle: 'Still have questions? Try it yourself!',
    faqCtaButton: 'Open Color Extractor'
  },
  de: {
    // App
    title: 'Kodini Color Extractor',
    subtitle: 'Extrahiere Farben aus jedem Bild',
    uploadText: 'Bild wählen',
    colorCountLabel: 'Anzahl Farben',
    formatLabel: 'Format',
    paletteTitle: 'Extrahierte Farben',
    placeholderText: 'Lade ein Bild hoch, um zu beginnen',
    placeholderHint: 'Drag & Drop, Einfügen (Strg+V) oder Upload klicken',
    processingText: 'Bild wird verarbeitet...',
    processingHint: 'Farben werden extrahiert',
    exportTitle: 'Export',
    downloadTitle: 'Herunterladen',
    downloadTxt: 'Als TXT herunterladen',
    downloadPng: 'PNG herunterladen',
    downloadImage: 'Als Bild herunterladen',
    copyPalette: 'In Zwischenablage kopieren',
    paletteCopied: 'Palette in Zwischenablage kopiert',
    imageFormatLabel: 'Bildformat',
    imageSizeLabel: 'Bildgröße',
    sizeSmall: 'Klein (400px)',
    sizeMedium: 'Mittel (800px)',
    sizeLarge: 'Groß (1200px)',
    sizeXLarge: 'XL (1600px)',
    clickToCopy: 'Klicken zum Kopieren',
    copied: 'Kopiert!',
    editPanelTitle: 'Bildbearbeitung',
    zoom: 'Zoom',
    brightness: 'Helligkeit',
    contrast: 'Kontrast',
    saturation: 'Sättigung',
    hue: 'Farbton',
    reset: 'Zurücksetzen',
    resetAll: 'Alles zurücksetzen',
    deleteImage: 'Bild löschen',
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
    donate: 'Projekt unterstützen',
    donateTitle: 'Spenden via PayPal',
    // Sample images
    sampleImagesLabel: 'Mit Beispielbildern testen:',
    sampleImageHint: 'Klicken um dieses Beispielbild zu laden',
    // Preview modal
    preview: 'Vorschau',
    previewTitle: 'Vorher / Nachher Vergleich',
    before: 'Vorher',
    after: 'Nachher',
    closePreview: 'Vorschau schließen',

    // Navigation
    navHome: 'Start',
    navApp: 'App öffnen',
    navFaq: 'FAQ',

    // Landing Page - Hero
    heroTitle: 'Extrahiere Farbpaletten aus jedem Bild',
    heroSubtitle: 'Ein kostenloses, datenschutzfreundliches Tool, das vollständig in deinem Browser läuft. Keine Uploads, kein Tracking - nur reine Farbextraktion.',
    heroCta: 'Farben extrahieren',

    // Landing Page - Features
    feature1Title: 'Drag & Drop Upload',
    feature1Desc: 'Ziehe dein Bild einfach in den Browser oder füge es aus der Zwischenablage ein. Unterstützung für alle gängigen Bildformate.',
    feature2Title: 'Präzise Farbauswahl',
    feature2Desc: 'Ziehe Farbindikatoren direkt auf dem Bild, um exakte Farben mit Pixel-Genauigkeit auszuwählen.',
    feature3Title: 'Mehrere Exportformate',
    feature3Desc: 'Exportiere als HEX, RGB, HSL oder CSS-Variablen. Download als Textdatei oder als ansprechend gestaltetes Palettenbild.',

    // Landing Page - Details
    detailsTitle: 'Alle Funktionen im Überblick',
    detailsSubtitle: 'Professionelle Farbextraktion mit allem was du brauchst.',

    detail1Title: 'Bildbearbeitung',
    detail1Desc: 'Passe Helligkeit, Kontrast, Sättigung und Farbton in Echtzeit an.',
    detail2Title: 'Bis zu 20 Farben',
    detail2Desc: 'Extrahiere zwischen 1 und 20 dominante Farben aus deinem Bild.',
    detail3Title: 'Einfache Bedienung',
    detail3Desc: 'Intuitive Oberfläche mit Tastaturkürzeln für Power-User.',
    detail4Title: '100% Privat',
    detail4Desc: 'Alle Verarbeitung erfolgt lokal. Deine Bilder verlassen niemals dein Gerät.',
    detail5Title: 'Tastaturkürzel',
    detail5Desc: 'Navigiere mit Pfeiltasten, kopiere mit Strg+C, füge Bilder mit Strg+V ein.',
    detail6Title: 'Responsives Design',
    detail6Desc: 'Funktioniert auf Desktop, Tablet und mobilen Geräten.',

    // Landing Page - CTA
    ctaTitle: 'Bereit Farben zu extrahieren?',
    ctaSubtitle: 'Keine Registrierung erforderlich. Starte sofort mit dem Tool.',
    ctaButton: 'Color Extractor starten',

    // FAQ Page
    faqTitle: 'Häufig gestellte Fragen',
    faqSubtitle: 'Alles was du über Kodini Color Extractor wissen musst.',

    faq1Question: 'Ist Kodini Color Extractor kostenlos?',
    faq1Answer: 'Ja, Kodini Color Extractor ist vollständig kostenlos. Es gibt keine versteckten Kosten, Abonnements oder Premium-Funktionen. Alle Funktionen sind für jeden verfügbar.',

    faq2Question: 'Werden meine Bilder auf einen Server hochgeladen?',
    faq2Answer: 'Nein, deine Bilder werden nirgendwo hochgeladen. Die gesamte Verarbeitung erfolgt direkt in deinem Browser mit der HTML5 Canvas API. Deine Bilder und extrahierten Farben bleiben vollständig privat auf deinem Gerät.',

    faq3Question: 'Welche Bildformate werden unterstützt?',
    faq3Answer: 'Das Tool unterstützt alle gängigen Bildformate wie JPEG, PNG, WebP, GIF und BMP. Du kannst Dateien per Drag & Drop, aus der Zwischenablage oder über die Dateiauswahl laden.',

    faq4Question: 'Wie extrahiere ich eine bestimmte Farbe aus meinem Bild?',
    faq4Answer: 'Nach dem Laden deines Bildes siehst du Farbindikatoren auf dem Bild. Ziehe diese Indikatoren einfach an eine beliebige Position, um die exakte Farbe an diesem Pixel zu extrahieren. Eine 12x12 Pixel Lupe hilft dir bei der präzisen Positionierung.',

    faq5Question: 'Welche Exportformate sind verfügbar?',
    faq5Answer: 'Du kannst deine Farbpalette in mehreren Formaten exportieren: HEX (#RRGGBB), RGB (rgb(r,g,b)), RGBA, HSL, HSLA und CSS Custom Properties. Export als Textdatei oder als ansprechendes Palettenbild im PNG-, JPG- oder WebP-Format.',

    faq6Question: 'Kann ich das Bild vor der Farbextraktion anpassen?',
    faq6Answer: 'Ja, das Bildbearbeitungspanel ermöglicht die Anpassung von Zoom, Helligkeit, Kontrast, Sättigung und Farbton. Dies ist nützlich, wenn du Farben aus einer modifizierten Version deines Bildes extrahieren möchtest.',

    faq7Question: 'Funktioniert es auf mobilen Geräten?',
    faq7Answer: 'Ja, Kodini Color Extractor ist vollständig responsiv und funktioniert auf Smartphones und Tablets. Die Oberfläche passt sich an kleinere Bildschirme an und behält dabei die volle Funktionalität.',

    faq8Question: 'Gibt es einen Dark Mode?',
    faq8Answer: 'Ja, die Anwendung unterstützt sowohl helle als auch dunkle Themes. Klicke auf das Sonnen-/Mond-Symbol, um zwischen den Modi zu wechseln. Deine Präferenz wird lokal gespeichert.',

    faqCtaTitle: 'Noch Fragen? Probiere es selbst aus!',
    faqCtaButton: 'Color Extractor öffnen'
  }
}

// ─── SSI Navigation Synchronisation ───
// Die SSI-Nav (nav.html) steuert Sprachwechsel über:
//   localStorage key: 'locale' (default: 'de')
//   CustomEvent: 'language-changed' mit { detail: { lang: 'de'|'en' } }
//   document.documentElement.setAttribute('lang', lang)
//
// Sync-Mechanismen (dreifach-redundant):
//   1. CustomEvent 'language-changed' → direkter Update
//   2. MutationObserver auf <html lang="..."> → Fallback
//   3. storage Event → Tab-übergreifende Synchronisation

// Default 'de' - identisch mit SSI-Nav: localStorage.getItem('locale') || 'de'
function getInitialLocale() {
  const stored = localStorage.getItem('locale')
  if (stored && translations[stored]) return stored
  return 'de'
}

const currentLocale = ref(getInitialLocale())

// Computed für aktuelle Übersetzungen – stärkt die reaktive Abhängigkeitskette
const currentTranslations = computed(() => translations[currentLocale.value] || translations.de)

function setLocale(lang) {
  if (lang && translations[lang] && currentLocale.value !== lang) {
    currentLocale.value = lang
    triggerRef(currentLocale)
  }
}

// Sync 1: CustomEvent von SSI-Nav
window.addEventListener('language-changed', (e) => {
  const lang = e.detail?.lang
  setLocale(lang)
})

// Sync 2: MutationObserver auf <html lang> Attribut (Fallback)
if (typeof MutationObserver !== 'undefined') {
  const langObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.attributeName === 'lang') {
        const lang = document.documentElement.lang
        setLocale(lang)
      }
    }
  })

  function initLangObserver() {
    langObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['lang']
    })
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLangObserver)
  } else {
    initLangObserver()
  }
}

// Sync 3: Tab-übergreifende Synchronisation via storage Event
window.addEventListener('storage', (e) => {
  if (e.key === 'locale' && e.newValue) {
    setLocale(e.newValue)
  }
})

// Initiale Synchronisation mit SSI-Nav (falls locale vor Vue-Mount gesetzt wurde)
function syncInitialLocale() {
  const stored = localStorage.getItem('locale')
  if (stored && translations[stored] && currentLocale.value !== stored) {
    currentLocale.value = stored
  }
  const docLang = document.documentElement.lang
  if (docLang && translations[docLang] && currentLocale.value !== docLang) {
    currentLocale.value = docLang
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', syncInitialLocale)
} else {
  syncInitialLocale()
}

export function useI18n() {
  const t = (key) => {
    return currentTranslations.value[key] || translations.de[key] || key
  }

  const locale = computed({
    get: () => currentLocale.value,
    set: (val) => {
      if (translations[val]) {
        currentLocale.value = val
        localStorage.setItem('locale', val)
        document.documentElement.setAttribute('lang', val)
        window.dispatchEvent(new CustomEvent('language-changed', { detail: { lang: val } }))
      }
    }
  })

  const availableLocales = Object.keys(translations)

  return { t, locale, availableLocales }
}
