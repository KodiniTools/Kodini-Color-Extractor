// Colour generation utilities — self-contained, framework-agnostic helpers.
// The generator creates colours from scratch (via HSL harmonies) rather than
// extracting them from an image, so nothing here depends on Vue or the DOM.

// ─── Colour conversions ───

// Convert HSL (h: 0-360, s/l: 0-100) to an { r, g, b } object (0-255).
export function hslToRgb(h, s, l) {
  h = ((h % 360) + 360) % 360
  s = Math.max(0, Math.min(100, s)) / 100
  l = Math.max(0, Math.min(100, l)) / 100
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  let r, g, b
  if (h < 60) [r, g, b] = [c, x, 0]
  else if (h < 120) [r, g, b] = [x, c, 0]
  else if (h < 180) [r, g, b] = [0, c, x]
  else if (h < 240) [r, g, b] = [0, x, c]
  else if (h < 300) [r, g, b] = [x, 0, c]
  else [r, g, b] = [c, 0, x]
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  }
}

// Convert an { r, g, b } object (0-255) to HSL (h: 0-360, s/l: 0-100).
export function rgbToHsl({ r, g, b }) {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  let h = 0
  const l = (max + min) / 2
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1))
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h *= 60
    if (h < 0) h += 360
  }
  return { h, s: s * 100, l: l * 100 }
}

/**
 * RGB (0-255 each) to HSL rounded to whole units — the values the extractor
 * shows and exports.
 *
 * Deliberately a separate formula from rgbToHsl above: that one keeps full
 * precision for the adjustment math, and rounding its result is NOT the same
 * thing — floating-point differences put 22,989 of the 16.7M colours on the
 * other side of a .5 hue boundary. Keep this one for anything user-facing
 * that must stay stable.
 */
export function rgbToHslRounded(r, g, b) {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h, s
  const l = (max + min) / 2

  if (max === min) {
    h = s = 0
  } else {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
}

export function rgbToHex({ r, g, b }) {
  const toHex = (n) => n.toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase()
}

// Parse a #RRGGBB string into an { r, g, b } object, or null if invalid.
export function hexToRgb(hex) {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(String(hex).trim())
  if (!m) return null
  const n = parseInt(m[1], 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

// Relative luminance → pick readable overlay text (dark vs light).
export function isLightColor({ r, g, b }) {
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return lum > 0.6
}

export function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// ─── Filter adjustments (brightness / contrast / saturation / hue) ───
// Mirrors the CSS-filter semantics used by the image editor: percentages
// default to 100 (identity), hue is a rotation in degrees (0 = identity).
export function neutralAdjust() {
  return { brightness: 100, contrast: 100, saturation: 100, hue: 0 }
}

// Neutral (identity) values, kept as the single source of truth for both the
// per-color adjustment objects and the field descriptors below.
const NEUTRAL_ADJUST = neutralAdjust()

// Field descriptors for the adjustment controls: range, step size, display
// unit and the neutral default the per-field reset returns to.
export const ADJUST_FIELDS = [
  { key: 'brightness', min: 0, max: 200, step: 1, unit: '%', def: NEUTRAL_ADJUST.brightness },
  { key: 'contrast', min: 0, max: 200, step: 1, unit: '%', def: NEUTRAL_ADJUST.contrast },
  { key: 'saturation', min: 0, max: 200, step: 1, unit: '%', def: NEUTRAL_ADJUST.saturation },
  { key: 'hue', min: 0, max: 360, step: 1, unit: '°', def: NEUTRAL_ADJUST.hue },
]

// Look up a field descriptor by key (null for unknown keys).
export function adjustField(key) {
  return ADJUST_FIELDS.find((f) => f.key === key) || null
}

// Normalize an adjustment value coming from a control: rounded to whole units
// and clamped to the field range. Returns null for unknown fields or values
// that are not a finite number (an empty number input, for instance), so
// callers can ignore the change instead of writing NaN into the palette.
export function clampAdjust(key, value) {
  const field = adjustField(key)
  if (!field) return null
  // Number('') and Number(null) are 0, so empty input is rejected up front
  // instead of silently snapping the control to its minimum.
  if (value === null || value === undefined || typeof value === 'boolean') return null
  if (typeof value === 'string' && value.trim() === '') return null
  const n = Number(value)
  if (!Number.isFinite(n)) return null
  return Math.max(field.min, Math.min(field.max, Math.round(n)))
}

// Apply an adjustment set to a base RGB color and return the resulting RGB.
export function applyAdjust(rgb, adj) {
  const clamp = (n) => Math.max(0, Math.min(255, n))
  const bf = adj.brightness / 100
  let r = rgb.r * bf
  let g = rgb.g * bf
  let b = rgb.b * bf
  const cf = adj.contrast / 100
  r = clamp((r - 128) * cf + 128)
  g = clamp((g - 128) * cf + 128)
  b = clamp((b - 128) * cf + 128)
  let { h, s, l } = rgbToHsl({ r, g, b })
  h = (h + adj.hue) % 360
  s = Math.max(0, Math.min(100, s * (adj.saturation / 100)))
  return hslToRgb(h, s, l)
}

// Build a single color descriptor from HSL values. `base` is the generated
// color; `adj` holds the per-color filter values applied on top of it.
export function makeColor(h, s, l, locked = false) {
  return { base: hslToRgb(h, s, l), adj: neutralAdjust(), locked }
}

// ─── Displayed (adjusted) values used throughout the UI ───
export function displayRgb(color) {
  return applyAdjust(color.base, color.adj)
}
export function displayHex(color) {
  return rgbToHex(displayRgb(color))
}
export function displayLight(color) {
  return isLightColor(displayRgb(color))
}

// ─── Harmony generators ───
// Each returns an array of {h,s,l} of the requested length, derived from a
// random base hue. Locked colors are re-applied by the caller afterwards.

// ─── Harmonies and style presets ───
// The first group is classic colour-wheel theory, the second is a set of
// ready-made looks a web designer can drop into a site. Presets still
// randomise inside their style, so "Generate" keeps producing new palettes.
export const harmonyModes = [
  'random',
  'monochromatic',
  'analogous',
  'complementary',
  'triadic',
  'pastel',
  'neon',
  'earthy',
  'sunset',
  'darkui',
]

/** Dropdown grouping: colour theory first, then the style presets. */
export const harmonyGroups = [
  { labelKey: 'genHarmonyTheory', modes: harmonyModes.slice(0, 5) },
  { labelKey: 'genHarmonyPresets', modes: harmonyModes.slice(5) },
]

// Each builder receives the random base hue, the wanted count and a `push`
// that normalizes the hue and stores one colour.
const HARMONY_BUILDERS = {
  monochromatic(base, count, push) {
    const s = randInt(45, 75)
    for (let i = 0; i < count; i++) {
      const l = Math.round(24 + (60 * i) / Math.max(1, count - 1))
      push(base + randInt(-6, 6), s, l)
    }
  },

  analogous(base, count, push) {
    const step = 28
    const start = base - (step * (count - 1)) / 2
    for (let i = 0; i < count; i++) {
      push(start + step * i, randInt(55, 80), randInt(45, 68))
    }
  },

  complementary(base, count, push) {
    for (let i = 0; i < count; i++) {
      const h = i % 2 === 0 ? base : base + 180
      push(h + randInt(-10, 10), randInt(50, 80), randInt(40, 70))
    }
  },

  triadic(base, count, push) {
    const wheel = [base, base + 120, base + 240]
    for (let i = 0; i < count; i++) {
      push(wheel[i % 3] + randInt(-8, 8), randInt(55, 80), randInt(42, 68))
    }
  },

  // Soft, airy tints — the look behind most "soft UI" and onboarding pages.
  pastel(base, count, push) {
    const step = 360 / Math.max(1, count)
    for (let i = 0; i < count; i++) {
      push(base + step * i + randInt(-10, 10), randInt(38, 62), randInt(82, 90))
    }
  },

  // Vivid, electric hues. Muddy oranges and browns are skipped on purpose —
  // they never read as neon.
  neon(base, count, push) {
    const vivid = [180, 195, 165, 280, 300, 320, 90, 135]
    const offset = randInt(0, vivid.length - 1)
    for (let i = 0; i < count; i++) {
      push(
        vivid[(offset + i * 3) % vivid.length] + randInt(-8, 8),
        randInt(88, 100),
        randInt(52, 64)
      )
    }
  },

  // Muted naturals: terracotta, ochre, clay, olive, sand.
  earthy(base, count, push) {
    const warm = [18, 28, 38, 45, 70, 85]
    const offset = randInt(0, warm.length - 1)
    for (let i = 0; i < count; i++) {
      push(warm[(offset + i * 2) % warm.length] + randInt(-6, 6), randInt(24, 52), randInt(34, 72))
    }
  },

  // A warm dusk ramp, violet through red and orange into gold — the usual
  // hero-gradient palette.
  sunset(base, count, push) {
    const from = 282
    const span = 123 // ends around 45deg (gold) after wrapping past 360
    for (let i = 0; i < count; i++) {
      const t = count === 1 ? 0 : i / (count - 1)
      push(from + span * t + randInt(-5, 5), randInt(68, 92), Math.round(48 + 18 * t))
    }
  },

  // A dark interface ramp: near-black surfaces on one hue, then bright
  // accents for buttons and links.
  darkui(base, count, push) {
    const accents = count <= 3 ? 1 : 2
    const surfaces = Math.max(1, count - accents)
    for (let i = 0; i < surfaces; i++) {
      const l = Math.round(10 + (18 * i) / Math.max(1, surfaces - 1))
      push(base + randInt(-4, 4), randInt(8, 20), l)
    }
    // One accent hue, and a related second tone rather than a competing one —
    // two unrelated bright colours on dark surfaces read as a clash.
    const accentHue = base + 150 + randInt(-20, 20)
    for (let i = 0; i < count - surfaces; i++) {
      push(accentHue + i * randInt(18, 28), randInt(70, 92), 58 + i * 8)
    }
  },
}

export function harmonyColors(mode, count) {
  const base = randInt(0, 359)
  const out = []

  const push = (h, s, l) =>
    out.push({
      h: ((h % 360) + 360) % 360,
      s: Math.max(0, Math.min(100, Math.round(s))),
      l: Math.max(0, Math.min(100, Math.round(l))),
    })

  const build = HARMONY_BUILDERS[mode]
  if (build) {
    build(base, count, push)
  } else {
    // 'random' — pleasant but unconstrained
    for (let i = 0; i < count; i++) {
      push(randInt(0, 359), randInt(45, 85), randInt(38, 72))
    }
  }
  return out
}
