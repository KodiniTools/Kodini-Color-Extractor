function rgbToHsl(r, g, b) {
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

self.onmessage = function ({ data }) {
  const { pixelBuffer, width, height, colorCount } = data
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
