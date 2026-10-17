import { rgbToHex, rgbToHslRounded } from './colorGenerator.js'

// Channel bucket width for the histogram: 256 / 16 = 16 buckets per channel.
const BUCKET = 16
// Pixels at or below this alpha are treated as transparent and skipped.
const MIN_ALPHA = 128
// Squared RGB distance (about 4 per channel) within which a pixel still counts
// as matching its bucket's mean color when choosing where to place the dot.
const MATCH_TOLERANCE = 48

function bucketKey(r, g, b) {
  return (Math.round(r / BUCKET) << 10) | (Math.round(g / BUCKET) << 5) | Math.round(b / BUCKET)
}

/**
 * Find the `colorCount` most frequent colors of an RGBA pixel buffer.
 *
 * Pixels are grouped into coarse RGB buckets and the buckets ranked by size.
 * Each result is a real pixel that (within MATCH_TOLERANCE) best matches its
 * bucket's mean color, taking the one nearest to where that color sits in the
 * image on average. So the swatch and its indicator always point at a color
 * that exists in the image, inside the area it comes from rather than at its
 * first occurrence on the top edge.
 *
 * @param {Uint8ClampedArray} pixels RGBA data, as from ImageData.data
 * @param {number} width image width in pixels
 * @param {number} colorCount maximum number of colors to return
 * @returns {Array<{r:number,g:number,b:number,hex:string,hsl:{h:number,s:number,l:number},position:{x:number,y:number},count:number}>}
 *   sorted by frequency, most frequent first; fewer entries if the image has
 *   fewer distinct buckets
 */
export function extractDominantColors(pixels, width, colorCount) {
  if (!pixels || !width || !(colorCount > 0)) return []

  // Pass 1: histogram with per-bucket channel and coordinate sums.
  const buckets = new Map()
  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i + 3] < MIN_ALPHA) continue
    const r = pixels[i]
    const g = pixels[i + 1]
    const b = pixels[i + 2]
    const p = i / 4
    const x = p % width
    const y = (p - x) / width
    const key = bucketKey(r, g, b)
    const bucket = buckets.get(key)
    if (bucket) {
      bucket.count++
      bucket.sumR += r
      bucket.sumG += g
      bucket.sumB += b
      bucket.sumX += x
      bucket.sumY += y
    } else {
      buckets.set(key, { key, count: 1, sumR: r, sumG: g, sumB: b, sumX: x, sumY: y })
    }
  }

  // Ties are broken by bucket key so the result is deterministic.
  const ranked = [...buckets.values()]
    .sort((a, b) => b.count - a.count || a.key - b.key)
    .slice(0, Math.floor(colorCount))
  if (ranked.length === 0) return []

  const slotByKey = new Map(ranked.map((bucket, slot) => [bucket.key, slot]))
  const top = ranked.map((bucket) => ({
    count: bucket.count,
    meanR: bucket.sumR / bucket.count,
    meanG: bucket.sumG / bucket.count,
    meanB: bucket.sumB / bucket.count,
    centerX: bucket.sumX / bucket.count,
    centerY: bucket.sumY / bucket.count,
    minColorDist: Infinity,
    bestIndex: -1,
    bestSpatialDist: Infinity,
  }))

  // Calls visit(entry, i, colorDist) for every opaque pixel in a top bucket.
  function forEachTopPixel(visit) {
    for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i + 3] < MIN_ALPHA) continue
      const r = pixels[i]
      const g = pixels[i + 1]
      const b = pixels[i + 2]
      const slot = slotByKey.get(bucketKey(r, g, b))
      if (slot === undefined) continue
      const entry = top[slot]
      visit(entry, i, (r - entry.meanR) ** 2 + (g - entry.meanG) ** 2 + (b - entry.meanB) ** 2)
    }
  }

  // Pass 2: how close each bucket's best pixel gets to the bucket mean.
  forEachTopPixel((entry, i, colorDist) => {
    if (colorDist < entry.minColorDist) entry.minColorDist = colorDist
  })

  // Pass 3: of the pixels matching the mean, the one nearest the bucket's
  // average position (first one wins on ties).
  forEachTopPixel((entry, i, colorDist) => {
    if (colorDist > entry.minColorDist + MATCH_TOLERANCE) return
    const p = i / 4
    const x = p % width
    const y = (p - x) / width
    const spatialDist = (x - entry.centerX) ** 2 + (y - entry.centerY) ** 2
    if (spatialDist < entry.bestSpatialDist) {
      entry.bestSpatialDist = spatialDist
      entry.bestIndex = i
    }
  })

  return top.map((entry) => {
    const i = entry.bestIndex
    const r = pixels[i]
    const g = pixels[i + 1]
    const b = pixels[i + 2]
    const pixelIndex = i / 4
    return {
      r,
      g,
      b,
      hex: rgbToHex({ r, g, b }),
      hsl: rgbToHslRounded(r, g, b),
      position: { x: pixelIndex % width, y: Math.floor(pixelIndex / width) },
      count: entry.count,
    }
  })
}
