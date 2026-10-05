# Design-System · Tokens v2

Design Tokens des Kodini Color Extractor. Sie sind eine Kopie der v2-Tokens, die der Collage Maker
(`KodiniTools/Collage-Maker`, `src/design-system/`, Stand `9dc4eca`) vom Playlist Generator
(`89bb48e`) hält, damit alle Apps auf kodinitools.com dieselbe Palette, dieselben Radien und
dieselbe Motion teilen. Werte werden dort gepflegt und hierher übernommen;
`src/__tests__/designTokens.test.ts` hält JSON und CSS konsistent und schützt die Regeln unten.

## Dateien

| Datei            | Zweck                                                                                                        |
| ---------------- | ------------------------------------------------------------------------------------------------------------ |
| `tokens-v2.css`  | **Laufzeit-Quelle.** CSS Custom Properties `--ds-*`, Light auf `:root`, Dark auf `:root[data-theme='dark']`. |
| `tokens-v2.json` | Maschinenlesbare Fassung (W3C-Design-Tokens-nah), `$extensions.css` nennt die Variable.                      |

## Theme-Mechanik

Light ist Standard und gilt ohne Attribut. Die globale Navigation von kodinitools.com (SSI-Partial)
setzt `html[data-theme]`; ein Inline-Skript in `index.html` setzt den Wert vor dem ersten Paint aus
`localStorage.theme`, damit Dark-Nutzer keinen hellen Flash sehen. `color-scheme` folgt dem Theme,
damit native Selects und Scrollbalken passen.

## Regeln

- **Eine Goldfläche pro Ansicht.** `--ds-accent` füllt genau eine Primäraktion (Upload im Extractor,
  Generieren im Generator, Hero-CTA auf der Landing-Page). Sonst zeigt Gold nur Zustand: aktiver
  Umschalter, Auswahlring, Fokus-Ring, Slider-Daumen; `--ds-accent-soft` als ausgewählte Fläche.
- **Ein Rahmen.** 1 px (`--ds-border-width`) in `--ds-border`, Felder und Sekundär-Buttons in
  `--ds-border-strong`. Keine Rahmen in Statusfarben.
- **Drei Radien.** `--ds-radius-sm` (6) für kleine Controls, `--ds-radius-md` (10) für Buttons,
  Felder, Karten, `--ds-radius-lg` (16) für Panels und Dialoge; `--ds-radius-full` für Pillen.
- **Schatten nur für Overlays.** `--ds-shadow-overlay` tragen Modal, Toast, Tooltip und Lupe.
  Panels, Karten und Buttons liegen flach; der Rahmen trennt.
- **Hover ändert Farbe, nie Größe.** Nur `background-color`, `border-color`, `color` und `opacity`
  animieren, in `--ds-duration` (150 ms) mit `--ds-ease`. Kein `scale`, kein `translate`, kein Glow,
  kein Gradient. Dauerhafte Bewegung gibt es nur beim Lade-Icon.
- **Destruktiv ist textbasiert.** Löschen heißt `--ds-danger` als Text oder Icon auf flacher Fläche,
  nie eine rote Vollfläche.
- **Fokus statt Glow.** `focus-visible` zeigt `--ds-focus-ring` (2 px Lücke in `--ds-surface-0`,
  2 px Ring in `--ds-accent`); Felder färben zusätzlich den Rahmen in `--ds-accent`.
- **Sieben Schriftgrade.** 12 / 13 / 14 / 16 / 20 / 24 / 32 px, Supreme in 400, 500 und 700 als
  echte Schnitte aus `src/assets/fonts/`. Grundgröße des Body ist `--ds-text-lg`.
- **Feste Farbwerte** gibt es nur für Weiß und neutrale Schwarz-Transparenzen (Indikator-Rand,
  Backdrop, Bildlabel). Alles andere kommt aus `--ds-*`.

## Verwendung

```css
.card {
  background: var(--ds-surface-1);
  border: var(--ds-border-width) solid var(--ds-border);
  border-radius: var(--ds-radius-md);
  transition: var(--app-transition-colors);
}
.card:hover {
  border-color: var(--ds-border-strong);
}
.card:focus-visible {
  outline: none;
  box-shadow: var(--ds-focus-ring);
}
```

`--app-transition-colors` ist ein app-eigener Composite-Wert in `src/assets/main.css`
(`background-color`, `border-color`, `color` in `--ds-duration`/`--ds-ease`), kein geteilter Token.

## Nicht übernommen

`--ds-player-height`, `--ds-z-player`, `--ds-container`, `--ds-gutter` und `--ds-gap` sind Teil der
geteilten Kopie und im Color Extractor ohne eigene Verwendung.
