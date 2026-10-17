import { extractDominantColors } from '../lib/core/dominantColors.js'

self.onmessage = function ({ data }) {
  const { pixelBuffer, width, colorCount } = data
  const sorted = extractDominantColors(new Uint8ClampedArray(pixelBuffer), width, colorCount)
  self.postMessage({ sorted })
}
