# Kodini Color Extractor

Extrahiere automatisch Farbpaletten aus deinen Bildern - direkt im Browser.

## Features

- **Drag & Drop Color Indicators** - Verschiebbare Farbpunkte auf dem Bild
- **Pixel Zoom Lupe** - Zeigt gezoomte Pixel beim Ziehen der Indikatoren
- **Farbanzahl 1-20** - Waehlbare Anzahl extrahierter Farben
- **Mehrere Ausgabeformate**: HEX, RGB, RGBA, HSL, HSLA, CSS Variables
- **Download als TXT oder PNG**
- **Zweisprachig (DE/EN)** mit automatischer Browsererkennung
- **Ein-Klick Kopieren** von Farbcodes
- **Komplett clientseitig** - keine Daten werden hochgeladen
- **DSGVO-konform**

## Installation

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

### Englische HTML-Köpfe (`?lang=en`)

Der Build legt neben `dist/index.html` (Deutsch) pro Route eine englische Kopie an:
`index.en.html`, `app.en.html`, `generator.en.html`, `faq.en.html`, `app/gallery.en.html`.
Sie enthalten `<html lang="en">`, englischen Titel und Description, Canonical auf die
`?lang=en`-URL, hreflang (de/en/x-default) sowie Open-Graph- und Twitter-Tags
(Quelle: `src/lib/core/staticHead.ts`, Texte aus `src/i18n/translations.ts`).

Damit nginx sie bei `?lang=en` ausliefert, einmalig auf dem Server:

```nginx
# im http { }-Block (z. B. /etc/nginx/conf.d/kodini-lang.conf)
map $arg_lang $kce_lang { en .en; default ""; }

# im server { }-Block, SSI bleibt wie bisher an
location /kodini-color-extractor/ {
    try_files $uri ${uri}index$kce_lang.html $uri$kce_lang.html /kodini-color-extractor/index.html;
}
```

Ohne `?lang=en` (oder bei anderen Werten) bleibt alles wie bisher: `index.html` für jede Route.

## Verwendung

1. Bild hochladen (Drag & Drop oder Klick)
2. Anzahl Farben waehlen (1-20)
3. Farbpunkte auf dem Bild verschieben um andere Farben zu waehlen
4. Ausgabeformat waehlen
5. Als TXT oder PNG herunterladen

## Tech Stack

- Vue 3 (Composition API)
- Pinia (State Management)
- Vite (Build Tool)

## Lizenz

MIT
