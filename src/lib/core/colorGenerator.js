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

export const ADJUST_FIELDS = [
  { key: 'brightness', min: 0, max: 200 },
  { key: 'contrast', min: 0, max: 200 },
  { key: 'saturation', min: 0, max: 200 },
  { key: 'hue', min: 0, max: 360 },
]

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

export const harmonyModes = ['random', 'monochromatic', 'analogous', 'complementary', 'triadic']

export function harmonyColors(mode, count) {
  const base = randInt(0, 359)
  const out = []

  const push = (h, s, l) => out.push({ h: ((h % 360) + 360) % 360, s, l })

  if (mode === 'monochromatic') {
    const s = randInt(45, 75)
    for (let i = 0; i < count; i++) {
      const l = Math.round(24 + (60 * i) / Math.max(1, count - 1))
      push(base + randInt(-6, 6), s, l)
    }
  } else if (mode === 'analogous') {
    const step = 28
    const start = base - (step * (count - 1)) / 2
    for (let i = 0; i < count; i++) {
      push(start + step * i, randInt(55, 80), randInt(45, 68))
    }
  } else if (mode === 'complementary') {
    for (let i = 0; i < count; i++) {
      const h = i % 2 === 0 ? base : base + 180
      push(h + randInt(-10, 10), randInt(50, 80), randInt(40, 70))
    }
  } else if (mode === 'triadic') {
    const wheel = [base, base + 120, base + 240]
    for (let i = 0; i < count; i++) {
      push(wheel[i % 3] + randInt(-8, 8), randInt(55, 80), randInt(42, 68))
    }
  } else {
    // 'random' — pleasant but unconstrained
    for (let i = 0; i < count; i++) {
      push(randInt(0, 359), randInt(45, 85), randInt(38, 72))
    }
  }
  return out
}
