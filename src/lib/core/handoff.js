/**
 * Kodini Tools — Handoff Protocol
 *
 * Shared module for transferring images between Kodini tools via localStorage.
 * localStorage is the channel, not the URL. The URL query param (?handoff=kodinitools)
 * is only a bonus signal for router guards.
 *
 * Usage:
 *   Sender:  prepareHandoff(canvases, targetKey, sourceToolName)
 *   Receiver: checkHandoff() / consumeHandoff() / handoffImageToCanvas()
 */

const STORAGE_KEY = 'kodinitools-handoff'
const HANDOFF_PARAM = 'kodinitools'
const MAX_WIDTH = 1200
const JPEG_QUALITY = 0.7
/** A handoff older than this is stale and ignored. */
const MAX_AGE_MS = 5 * 60 * 1000
/** Only raster image data URLs are accepted, no SVG and no other schemes. */
const IMAGE_DATA_URL = /^data:image\/(jpeg|png|webp|gif);base64,/

const TARGET_URLS = {
  bildkonverter: '/bildkonverter/gallery',
  collagemaker: '/collagemaker/editor',
  'color-extractor': '/kodini-color-extractor/app',
}

// ── Sender ──────────────────────────────────────────────────

/**
 * Compress a canvas to a data URL (max 1200px wide, JPEG 0.7).
 */
function compressCanvas(canvas, maxWidth = MAX_WIDTH, quality = JPEG_QUALITY) {
  if (canvas.width <= maxWidth) {
    return canvas.toDataURL('image/jpeg', quality)
  }

  const scale = maxWidth / canvas.width
  const offscreen = document.createElement('canvas')
  offscreen.width = maxWidth
  offscreen.height = Math.round(canvas.height * scale)

  const ctx = offscreen.getContext('2d')
  ctx.drawImage(canvas, 0, 0, offscreen.width, offscreen.height)
  return offscreen.toDataURL('image/jpeg', quality)
}

/**
 * Prepare a handoff: compress images, write to localStorage, return target URL.
 *
 * @param {Array<{name: string, canvas: HTMLCanvasElement}>} canvases
 * @param {string} targetKey — key in TARGET_URLS (e.g. 'color-extractor')
 * @param {string} sourceTool — name of the sending tool (e.g. 'bildkonverter')
 * @returns {string|null} full URL to navigate to, or null on error
 */
export function prepareHandoff(canvases, targetKey, sourceTool) {
  const targetPath = TARGET_URLS[targetKey]
  if (!targetPath) {
    console.warn(`[handoff] Unknown target: ${targetKey}`)
    return null
  }

  try {
    const images = canvases.map((item) => {
      const dataUrl = compressCanvas(item.canvas)
      return {
        name: item.name || 'image',
        dataUrl,
        width: item.canvas.width,
        height: item.canvas.height,
      }
    })

    const payload = {
      version: 1,
      source: sourceTool,
      timestamp: Date.now(),
      images,
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))

    const separator = targetPath.includes('?') ? '&' : '?'
    return `${targetPath}${separator}handoff=${HANDOFF_PARAM}`
  } catch (err) {
    console.error('[handoff] prepareHandoff failed:', err)
    return null
  }
}

// ── Receiver ────────────────────────────────────────────────

/**
 * Check if a handoff is pending in localStorage.
 *
 * @returns {{ source: string, images: Array<{name: string, dataUrl: string, width: number, height: number}>, timestamp: number } | null}
 */
export function checkHandoff() {
  return readHandoff(true)
}

/**
 * Reads and validates the pending handoff. `checkAge` is off only when consuming,
 * so a banner that stayed open past the expiry still imports what it shows.
 */
function readHandoff(checkAge) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null

    const payload = JSON.parse(raw)
    if (!payload || !Array.isArray(payload.images)) return null
    if (typeof payload.timestamp !== 'number') return null
    if (checkAge && Date.now() - payload.timestamp > MAX_AGE_MS) return null

    const images = validImages(payload.images)
    if (images.length === 0) return null

    return {
      source: typeof payload.source === 'string' && payload.source ? payload.source : 'unknown',
      images,
      timestamp: payload.timestamp,
    }
  } catch {
    return null
  }
}

/**
 * Keeps only entries with a name and a raster image data URL.
 */
function validImages(images) {
  return images.filter(
    (img) =>
      img &&
      typeof img.name === 'string' &&
      typeof img.dataUrl === 'string' &&
      IMAGE_DATA_URL.test(img.dataUrl)
  )
}

/**
 * Consume (read + delete) the handoff data from localStorage.
 *
 * @returns {{ source: string, images: Array<{name: string, dataUrl: string, width: number, height: number}> } | null}
 */
export function consumeHandoff() {
  const data = readHandoff(false)
  localStorage.removeItem(STORAGE_KEY)
  return data
}

/**
 * Clear any pending handoff without consuming it.
 */
export function clearHandoff() {
  localStorage.removeItem(STORAGE_KEY)
}

/**
 * Convert a handoff image object to an HTMLCanvasElement.
 *
 * @param {{ dataUrl: string, width: number, height: number }} img
 * @returns {Promise<HTMLCanvasElement>}
 */
export function handoffImageToCanvas(img) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = image.width
      canvas.height = image.height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(image, 0, 0)
      resolve(canvas)
    }
    image.onerror = () => reject(new Error('Failed to load handoff image'))
    image.src = img.dataUrl
  })
}

/**
 * Check if the current URL has the handoff query parameter.
 */
export function hasHandoffParam() {
  const params = new URLSearchParams(window.location.search)
  return params.get('handoff') === HANDOFF_PARAM
}

export { STORAGE_KEY, HANDOFF_PARAM, TARGET_URLS, MAX_AGE_MS }
