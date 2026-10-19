import { describe, it, expect } from 'vitest'
import { extractDominantColors } from '../lib/core/dominantColors'

type RGBA = [number, number, number, number]

// Build an RGBA buffer from a row-major list of pixels.
function image(pixels: RGBA[]) {
  return new Uint8ClampedArray(pixels.flat())
}

const RED: RGBA = [220, 30, 30, 255]
const BLUE: RGBA = [20, 40, 200, 255]
const GREEN: RGBA = [30, 180, 60, 255]
const CLEAR: RGBA = [255, 255, 255, 0]

describe('extractDominantColors', () => {
  it('ranks colors by how often they occur', () => {
    // 4×2 image: 5× blue, 2× red, 1× green
    const px = image([BLUE, BLUE, RED, BLUE, GREEN, BLUE, RED, BLUE])
    const result = extractDominantColors(px, 4, 3)
    expect(result.map((c) => c.hex)).toEqual(['#1428C8', '#DC1E1E', '#1EB43C'])
    expect(result.map((c) => c.count)).toEqual([5, 2, 1])
  })

  it('places each color on a real pixel of that color', () => {
    const px = image([BLUE, BLUE, RED, BLUE, GREEN, BLUE, RED, BLUE])
    const width = 4
    for (const c of extractDominantColors(px, width, 3)) {
      const i = (c.position.y * width + c.position.x) * 4
      expect([px[i], px[i + 1], px[i + 2]]).toEqual([c.r, c.g, c.b])
    }
  })

  it('picks a pixel matching the bucket mean, not a quantized value', () => {
    // Three shades in one bucket (mean ≈ 96); only 98 is close to the mean.
    const px = image([
      [88, 88, 88, 255],
      [103, 103, 103, 255],
      [98, 98, 98, 255],
    ])
    const [c] = extractDominantColors(px, 3, 1)
    expect(c).toMatchObject({ r: 98, g: 98, b: 98, position: { x: 2, y: 0 }, count: 3 })
    expect(c.hsl).toEqual({ h: 0, s: 0, l: 38 })
  })

  it('places the dot in the middle of the color area, not at its first pixel', () => {
    // 5×3 image: a red band in the middle row between blue rows.
    const px = image([...Array(5).fill(BLUE), ...Array(5).fill(RED), ...Array(5).fill(BLUE)])
    const [blue, red] = extractDominantColors(px, 5, 2)
    expect(red.position).toEqual({ x: 2, y: 1 })
    // Blue's average position is the center pixel (red), so the nearest
    // matching blue pixel is directly above it.
    expect(blue.position).toEqual({ x: 2, y: 0 })
  })

  it('never produces an out-of-range channel for near-white pixels', () => {
    const [c] = extractDominantColors(image([[255, 255, 250, 255]]), 1, 1)
    expect(c.hex).toBe('#FFFFFA')
  })

  it('ignores transparent pixels', () => {
    const px = image([CLEAR, CLEAR, CLEAR, RED])
    const result = extractDominantColors(px, 2, 5)
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ hex: '#DC1E1E', position: { x: 1, y: 1 } })
  })

  it('returns fewer colors when the image has fewer distinct ones', () => {
    expect(extractDominantColors(image([RED, RED]), 2, 10)).toHaveLength(1)
  })

  it('is deterministic for equal counts', () => {
    const px = image([RED, BLUE, GREEN, RED, BLUE, GREEN])
    const a = extractDominantColors(px, 3, 3)
    const b = extractDominantColors(px, 3, 3)
    expect(a).toEqual(b)
  })

  it('handles empty or invalid input', () => {
    expect(extractDominantColors(new Uint8ClampedArray(0), 1, 5)).toEqual([])
    expect(extractDominantColors(image([CLEAR]), 1, 5)).toEqual([])
    expect(extractDominantColors(image([RED]), 1, 0)).toEqual([])
    expect(extractDominantColors(image([RED]), 0, 5)).toEqual([])
  })
})
