// Color vision deficiency simulation for palette previews, and a check for
// palette colors that people with such a deficiency can no longer tell apart.
import { hexToRgb, rgbToHex } from './colorGenerator'

type Matrix = [number, number, number][]

// Machado, Oliveira & Fernandes (2009), severity 1.0, applied to linear RGB.
const MATRICES: Record<string, Matrix> = {
  protanopia: [
    [0.152286, 1.052583, -0.204868],
    [0.114503, 0.786281, 0.099216],
    [-0.003882, -0.048116, 1.051998],
  ],
  deuteranopia: [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.01182, 0.04294, 0.968881],
  ],
  tritanopia: [
    [1.255528, -0.076749, -0.178779],
    [-0.078411, 0.930809, 0.147602],
    [0.004733, 0.691367, 0.3039],
  ],
}

/** Simulated vision types, in display order. 'achromatopsia' sees luminance only. */
export const VISION_TYPES = ['protanopia', 'deuteranopia', 'tritanopia', 'achromatopsia'] as const

export type VisionType = (typeof VISION_TYPES)[number]

export interface VisionReport {
  type: VisionType
  colors: { hex: string; simulated: string }[]
  confusable: [string, string][]
}

/**
 * Below this CIE76 color difference two colors read as the same at a glance.
 * A deliberately generous threshold: the check should flag pairs that are
 * risky as fills or lines, not only pairs that are literally identical.
 */
export const CONFUSION_DELTA_E = 10

const toLinear = (c: number): number => {
  const v = c / 255
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
}

const toSrgb = (v: number): number => {
  const c = Math.min(1, Math.max(0, v))
  const s = c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055
  return Math.round(s * 255)
}

/**
 * How a #RRGGBB color appears with the given color vision deficiency.
 * Returns the input (normalized to upper case) for an unknown type, and null
 * for an invalid color.
 * @param type one of VISION_TYPES
 */
export function simulateColorVision(hex: string, type: string): string | null {
  const rgb = hexToRgb(hex)
  if (!rgb) return null
  const lin = [toLinear(rgb.r), toLinear(rgb.g), toLinear(rgb.b)]
  if (type === 'achromatopsia') {
    const y = 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2]
    const g = toSrgb(y)
    return rgbToHex({ r: g, g, b: g })
  }
  const m = Object.hasOwn(MATRICES, type) ? MATRICES[type] : undefined
  if (!m) return rgbToHex(rgb)
  const [r, g, b] = m.map((row) => toSrgb(row[0] * lin[0] + row[1] * lin[1] + row[2] * lin[2]))
  return rgbToHex({ r, g, b })
}

// sRGB → CIE Lab (D65).
// Callers pass valid colors only.
function toLab(hex: string): [number, number, number] {
  const { r, g, b } = hexToRgb(hex)!
  const [lr, lg, lb] = [toLinear(r), toLinear(g), toLinear(b)]
  const x = (0.4124 * lr + 0.3576 * lg + 0.1805 * lb) / 0.95047
  const y = 0.2126 * lr + 0.7152 * lg + 0.0722 * lb
  const z = (0.0193 * lr + 0.1192 * lg + 0.9505 * lb) / 1.08883
  const f = (t: number) => (t > 216 / 24389 ? Math.cbrt(t) : ((24389 / 27) * t + 16) / 116)
  const [fx, fy, fz] = [f(x), f(y), f(z)]
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)]
}

/**
 * CIE76 color difference between two #RRGGBB colors.
 */
export function deltaE(hexA: string, hexB: string): number {
  const a = toLab(hexA)
  const b = toLab(hexB)
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])
}

// Uppercase, valid and without repeats, keeping the palette order.
function uniqueHexes(hexes: readonly string[] | null | undefined): string[] {
  const out: string[] = []
  for (const hex of hexes || []) {
    if (!hexToRgb(hex)) continue
    const norm = `#${String(hex).trim().replace(/^#/, '').toUpperCase()}`
    if (!out.includes(norm)) out.push(norm)
  }
  return out
}

/**
 * The palette as seen with each vision type, plus the pairs that are clearly
 * different with normal vision but collapse with that deficiency.
 */
export function colorVisionReport(hexes: readonly string[]): VisionReport[] {
  const colors = uniqueHexes(hexes)
  return VISION_TYPES.map((type) => {
    // uniqueHexes keeps valid colors only, so the simulation never fails.
    const simulated = colors.map((hex) => ({ hex, simulated: simulateColorVision(hex, type)! }))
    const confusable: [string, string][] = []
    for (let i = 0; i < simulated.length; i++) {
      for (let j = i + 1; j < simulated.length; j++) {
        const a = simulated[i]
        const b = simulated[j]
        if (
          deltaE(a.hex, b.hex) >= CONFUSION_DELTA_E &&
          deltaE(a.simulated, b.simulated) < CONFUSION_DELTA_E
        ) {
          confusable.push([a.hex, b.hex])
        }
      }
    }
    return { type, colors: simulated, confusable }
  })
}
