import { rgbToHslRounded as rgbToHsl } from '../lib/core/colorGenerator.js'

self.onmessage = function ({ data }) {
  const { pixelBuffer, width, colorCount } = data
  const pixels = new Uint8ClampedArray(pixelBuffer)

  const colorMap = new Map()

  for (let i = 0; i < pixels.length; i += 4) {
    const r = Math.round(pixels[i] / 16) * 16
    const g = Math.round(pixels[i + 1] / 16) * 16
    const b = Math.round(pixels[i + 2] / 16) * 16
    const a = pixels[i + 3]
    if (a < 128) continue

    const pixelIndex = i / 4
    const x = pixelIndex % width
    const y = Math.floor(pixelIndex / width)

    const key = `${r},${g},${b}`
    const existing = colorMap.get(key)
    if (existing) {
      existing.count++
      if (Math.random() < 0.01) {
        existing.positions.push({ x, y })
      }
    } else {
      colorMap.set(key, { count: 1, positions: [{ x, y }] })
    }
  }

  const sorted = Array.from(colorMap.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, colorCount)
    .map(([key, data]) => {
      const [r, g, b] = key.split(',').map(Number)
      const hex = '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')
      const hsl = rgbToHsl(r, g, b)
      const pos = data.positions[Math.floor(Math.random() * data.positions.length)]
      return { r, g, b, hex, hsl, position: pos }
    })

  self.postMessage({ sorted })
}
