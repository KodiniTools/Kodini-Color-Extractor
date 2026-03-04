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

const TARGET_URLS = {
  'bildkonverter': '/bildkonverter/gallery',
  'collagemaker': '/collagemaker/editor',
  'color-extractor': '/kodini-color-extractor/app'
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
        height: item.canvas.height
      }
    })

    const payload = {
      version: 1,
      source: sourceTool,
      timestamp: Date.now(),
      images
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
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null

    const payload = JSON.parse(raw)
    if (!payload || !Array.isArray(payload.images) || payload.images.length === 0) {
      return null
    }

    return {
      source: payload.source || 'unknown',
      images: payload.images,
      timestamp: payload.timestamp || 0
    }
  } catch {
    return null
  }
}

/**
 * Consume (read + delete) the handoff data from localStorage.
 *
 * @returns {{ source: string, images: Array<{name: string, dataUrl: string, width: number, height: number}> } | null}
 */
export function consumeHandoff() {
  const data = checkHandoff()
  if (data) {
    localStorage.removeItem(STORAGE_KEY)
  }
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

export { STORAGE_KEY, HANDOFF_PARAM, TARGET_URLS }
