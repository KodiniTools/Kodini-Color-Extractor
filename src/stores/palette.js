import { defineStore } from 'pinia'
import { rgbToHex, rgbToHslRounded as rgbToHsl } from '../lib/core/colorGenerator'
import { ref, computed } from 'vue'
import {
  EXPORT_FORMATS,
  buildPaletteExport,
  downloadPaletteFile,
  exportFormat as findExportFormat,
  formatColor,
  showsHexInline,
  paletteEntry,
} from '../lib/core/paletteExport'

let filterDebounceTimer = null
// The source and filtered canvases are read pixel by pixel while dragging the
// color pickers, so keep them in CPU memory instead of reading back from the GPU.
const READ_OPTIONS = { willReadFrequently: true }
// Bumped on every extractColors call, so only the latest request writes colors.
let extractionId = 0

const MAX_HISTORY = 60
// Steps of the same kind closer together than this merge into one undo step,
// so dragging a slider is undone as a whole and not tick by tick.
const COALESCE_MS = 700

export const usePaletteStore = defineStore('palette', () => {
  const colors = ref([])
  const currentImage = ref(null)
  const colorCount = ref(5)
  const downloadFormat = ref('hex')
  const selectedColorIndex = ref(-1)
  const canvasRef = ref(null)
  const filteredCanvasRef = ref(null)
  const originalImageSize = ref({ width: 0, height: 0 })

  // Image export settings
  const imageExportFormat = ref('png')
  const imageExportSize = ref('medium')

  // Available export sizes (width in pixels, height auto-calculated)
  const exportSizes = {
    small: { width: 400 },
    medium: { width: 800 },
    large: { width: 1200 },
    xlarge: { width: 1600 },
  }

  // Image adjustment settings
  const imageAdjustments = ref({
    zoom: 100,
    brightness: 100,
    contrast: 100,
    saturation: 100,
    hue: 0,
    blur: 0,
    grayscale: 0,
  })

  // Pan position for zoomed image
  const panPosition = ref({ x: 0, y: 0 })

  // Vertical center of the image container relative to .app-container top (px)

  const hasColors = computed(() => colors.value.length > 0)

  // Undo/redo over what the user changed on the image: color point positions
  // and the image adjustments. Zoom and pan are view state and stay out.
  const history = ref([])
  const historyIndex = ref(-1)
  let coalesceKey = null
  let coalesceTime = 0

  const canUndo = computed(() => historyIndex.value > 0)
  const canRedo = computed(() => historyIndex.value < history.value.length - 1)

  function snapshot() {
    // eslint-disable-next-line no-unused-vars
    const { zoom, ...adjustments } = imageAdjustments.value
    return {
      colors: colors.value.map((c) => ({ ...c, hsl: { ...c.hsl }, position: { ...c.position } })),
      adjustments,
    }
  }

  // Equal when every point sits in the same place under the same adjustments;
  // the sampled colors follow from those two.
  function sameSnapshot(a, b) {
    if (!a || !b || a.colors.length !== b.colors.length) return false
    const samePoints = a.colors.every(
      (c, i) =>
        c.position?.x === b.colors[i].position?.x && c.position?.y === b.colors[i].position?.y
    )
    return (
      samePoints && Object.keys(a.adjustments).every((k) => a.adjustments[k] === b.adjustments[k])
    )
  }

  /** Starts a fresh history with the current state as its only entry. */
  function resetHistory() {
    history.value = [snapshot()]
    historyIndex.value = 0
    coalesceKey = null
  }

  /**
   * Records the current state as an undo step. Calls with the same `key`
   * in quick succession replace the last step instead of adding one.
   * @param {string|null} [key]
   */
  function commitHistory(key = null) {
    if (historyIndex.value < 0) return
    const snap = snapshot()
    const now = Date.now()
    const continuation =
      key !== null &&
      key === coalesceKey &&
      now - coalesceTime < COALESCE_MS &&
      historyIndex.value === history.value.length - 1 &&
      historyIndex.value > 0
    coalesceKey = key
    coalesceTime = now
    if (continuation) {
      history.value[historyIndex.value] = snap
      return
    }
    if (sameSnapshot(snap, history.value[historyIndex.value])) return
    const next = history.value.slice(0, historyIndex.value + 1)
    next.push(snap)
    if (next.length > MAX_HISTORY) next.shift()
    history.value = next
    historyIndex.value = next.length - 1
  }

  function restore(snap) {
    clearTimeout(filterDebounceTimer)
    coalesceKey = null
    colors.value = snap.colors.map((c) => ({
      ...c,
      hsl: { ...c.hsl },
      position: { ...c.position },
    }))
    imageAdjustments.value = { ...snap.adjustments, zoom: imageAdjustments.value.zoom }
    if (selectedColorIndex.value >= colors.value.length) selectedColorIndex.value = -1
    // Re-sample the restored points under the restored adjustments.
    applyFiltersToCanvas()
  }

  function undo() {
    if (!canUndo.value) return
    historyIndex.value--
    restore(history.value[historyIndex.value])
  }

  function redo() {
    if (!canRedo.value) return
    historyIndex.value++
    restore(history.value[historyIndex.value])
  }

  function setImage(imgSrc) {
    currentImage.value = imgSrc
  }

  function clearImage() {
    extractionId++ // drop any extraction still running for the old image
    currentImage.value = null
    colors.value = []
    canvasRef.value = null
    filteredCanvasRef.value = null
    selectedColorIndex.value = -1
    originalImageSize.value = { width: 0, height: 0 }
    resetImageAdjustments()
    history.value = []
    historyIndex.value = -1
    coalesceKey = null
  }

  function setColorCount(count) {
    colorCount.value = count
  }

  function setDownloadFormat(format) {
    if (findExportFormat(format)) downloadFormat.value = format
  }

  function setImageExportFormat(format) {
    imageExportFormat.value = format
  }

  function setImageExportSize(size) {
    imageExportSize.value = size
  }

  function setSelectedColor(index) {
    selectedColorIndex.value = index
  }

  function setImageAdjustment(prop, value) {
    imageAdjustments.value[prop] = value
    if (prop === 'zoom' && value === 100) {
      panPosition.value = { x: 0, y: 0 }
    }
    if (prop !== 'zoom') commitHistory(`adjust:${prop}`)
    // Debounce canvas re-render to avoid blocking on every slider tick
    clearTimeout(filterDebounceTimer)
    filterDebounceTimer = setTimeout(applyFiltersToCanvas, 50)
  }

  function setPanPosition(x, y) {
    panPosition.value = { x, y }
  }

  function resetPanPosition() {
    panPosition.value = { x: 0, y: 0 }
  }

  function resetImageAdjustments() {
    imageAdjustments.value = {
      zoom: 100,
      brightness: 100,
      contrast: 100,
      saturation: 100,
      hue: 0,
      blur: 0,
      grayscale: 0,
    }
    panPosition.value = { x: 0, y: 0 }
    applyFiltersToCanvas()
    commitHistory()
  }

  function applyFiltersToCanvas() {
    if (!canvasRef.value || !currentImage.value) return

    const { brightness, contrast, saturation, hue, blur, grayscale } = imageAdjustments.value

    // Create filtered canvas if not exists
    if (!filteredCanvasRef.value) {
      filteredCanvasRef.value = document.createElement('canvas')
    }

    const filteredCanvas = filteredCanvasRef.value
    const originalCanvas = canvasRef.value

    filteredCanvas.width = originalCanvas.width
    filteredCanvas.height = originalCanvas.height

    const ctx = filteredCanvas.getContext('2d', READ_OPTIONS)

    // Apply CSS-like filters using canvas
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) hue-rotate(${hue}deg) blur(${blur}px) grayscale(${grayscale}%)`
    ctx.drawImage(originalCanvas, 0, 0)

    // Reset filter for future operations
    ctx.filter = 'none'

    // Update all color indicators with filtered colors
    updateAllColorsFromFilteredCanvas()
  }

  function updateAllColorsFromFilteredCanvas() {
    if (!filteredCanvasRef.value || colors.value.length === 0) return

    const ctx = filteredCanvasRef.value.getContext('2d', READ_OPTIONS)

    colors.value = colors.value.map((color) => {
      if (!color.position) return color

      const imgX = Math.max(
        0,
        Math.min(originalImageSize.value.width - 1, Math.round(color.position.x))
      )
      const imgY = Math.max(
        0,
        Math.min(originalImageSize.value.height - 1, Math.round(color.position.y))
      )

      const pixel = ctx.getImageData(imgX, imgY, 1, 1).data
      const r = pixel[0]
      const g = pixel[1]
      const b = pixel[2]
      const hex = rgbToHex({ r, g, b })
      const hsl = rgbToHsl(r, g, b)

      return { r, g, b, hex, hsl, position: color.position }
    })
  }

  function extractColors(imgSrc) {
    const requestId = ++extractionId
    return new Promise((resolve) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        if (requestId !== extractionId) return resolve(colors.value)
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d', READ_OPTIONS)

        canvas.width = img.width
        canvas.height = img.height
        originalImageSize.value = { width: img.width, height: img.height }

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        canvasRef.value = canvas

        // Initialize filtered canvas with same content
        filteredCanvasRef.value = document.createElement('canvas')
        filteredCanvasRef.value.width = canvas.width
        filteredCanvasRef.value.height = canvas.height
        const filteredCtx = filteredCanvasRef.value.getContext('2d', READ_OPTIONS)
        filteredCtx.drawImage(canvas, 0, 0)

        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)

        // Transfer pixel buffer to worker for off-thread quantization
        const pixelBuffer = imgData.data.buffer.slice(0)
        const worker = new Worker(new URL('../workers/colorExtractor.worker.js', import.meta.url), {
          type: 'module',
        })
        worker.postMessage({ pixelBuffer, width: canvas.width, colorCount: colorCount.value }, [
          pixelBuffer,
        ])
        worker.onmessage = ({ data: { sorted } }) => {
          worker.terminate()
          // A newer extraction started meanwhile: its result wins.
          if (requestId !== extractionId) return resolve(colors.value)
          // Each dominant color sits on a real pixel of that color; re-sample
          // there so active image adjustments apply right away.
          colors.value = sorted.map(({ r, g, b, hex, hsl, position }) => ({
            r,
            g,
            b,
            hex,
            hsl,
            position,
          }))
          updateAllColorsFromFilteredCanvas()
          // New image or color count: a new starting point for undo.
          resetHistory()
          resolve(colors.value)
        }
        worker.onerror = () => {
          worker.terminate()
          resolve([])
        }
      }
      img.onerror = () => resolve([])
      img.src = imgSrc
    })
  }

  function updateColorFromPosition(index, x, y) {
    // Use filtered canvas if available, otherwise original
    const canvas = filteredCanvasRef.value || canvasRef.value
    if (!canvas || index < 0 || index >= colors.value.length) return

    const ctx = canvas.getContext('2d', READ_OPTIONS)
    const imgX = Math.max(0, Math.min(originalImageSize.value.width - 1, Math.round(x)))
    const imgY = Math.max(0, Math.min(originalImageSize.value.height - 1, Math.round(y)))

    const pixel = ctx.getImageData(imgX, imgY, 1, 1).data
    const r = pixel[0]
    const g = pixel[1]
    const b = pixel[2]
    const hex = rgbToHex({ r, g, b })
    const hsl = rgbToHsl(r, g, b)

    colors.value[index] = {
      r,
      g,
      b,
      hex,
      hsl,
      position: { x: imgX, y: imgY },
    }
  }

  function getPixelZoomData(x, y, size = 12) {
    // Use filtered canvas if available, otherwise original
    const canvas = filteredCanvasRef.value || canvasRef.value
    if (!canvas) return null

    const ctx = canvas.getContext('2d', READ_OPTIONS)
    const imgX = Math.max(
      0,
      Math.min(originalImageSize.value.width - size, Math.round(x - size / 2))
    )
    const imgY = Math.max(
      0,
      Math.min(originalImageSize.value.height - size, Math.round(y - size / 2))
    )

    try {
      return ctx.getImageData(imgX, imgY, size, size)
    } catch {
      return null
    }
  }

  // Extracted colors carry their own rounded HSL — pass it through instead of
  // deriving it again, so the displayed values never shift.
  function toEntry(color) {
    return paletteEntry(color.hex, { r: color.r, g: color.g, b: color.b }, color.hsl)
  }

  function paletteEntries() {
    return colors.value.map(toEntry)
  }

  function getFormatted(color, index) {
    return formatColor(toEntry(color), downloadFormat.value, index)
  }

  function buildExport() {
    return buildPaletteExport(downloadFormat.value, paletteEntries(), {
      basename: `color-palette-${downloadFormat.value}`,
    })
  }

  // Binary formats (Adobe ASE) cannot go to the clipboard; copying then
  // falls back to the plain HEX list.
  function getPaletteText() {
    if (findExportFormat(downloadFormat.value)?.binary) {
      return buildPaletteExport('hex', paletteEntries())?.content ?? ''
    }
    return buildExport()?.content ?? ''
  }

  // Saves the palette in the selected format, with the extension that format
  // actually needs (.css, .scss, .js, .json — .txt for the plain notations).
  function downloadPalette() {
    return downloadPaletteFile(buildExport())
  }

  async function copyPalette() {
    const content = getPaletteText()
    try {
      await navigator.clipboard.writeText(content)
      return true
    } catch {
      return false
    }
  }

  function downloadImage() {
    const f = downloadFormat.value
    const cols = colors.value
    const exportFormat = imageExportFormat.value
    const targetWidth = exportSizes[imageExportSize.value].width

    // Calculate minimum swatch width based on format text length
    // Longer formats like rgba need more space to prevent text overlap
    // Longer notations need a wider swatch so the label does not overlap.
    const formatWidths = {
      hex: 80,
      rgb: 110,
      rgba: 130,
      hsl: 130,
      hsla: 145,
      css: 150,
      scss: 150,
      tailwind4: 175,
      tailwind: 165,
    }
    const baseSwatchSize = formatWidths[f] || 80
    const basePadding = 20
    const baseGap = 15
    const baseTextHeight = 50
    const cols_per_row = Math.min(cols.length, 5)
    const rows = Math.ceil(cols.length / cols_per_row)

    // Calculate base dimensions
    const baseWidth = basePadding * 2 + cols_per_row * (baseSwatchSize + baseGap) - baseGap
    const scale = targetWidth / baseWidth

    // Scaled dimensions
    const swatchSize = Math.round(baseSwatchSize * scale)
    const padding = Math.round(basePadding * scale)
    const gap = Math.round(baseGap * scale)
    const textHeight = Math.round(baseTextHeight * scale)

    const pCanvas = document.createElement('canvas')
    pCanvas.width = padding * 2 + cols_per_row * (swatchSize + gap) - gap
    pCanvas.height = padding * 2 + rows * (swatchSize + textHeight + gap) - gap
    const pCtx = pCanvas.getContext('2d')

    // Background (white for JPEG, transparent for PNG/WEBP optional)
    pCtx.fillStyle = '#ffffff'
    pCtx.fillRect(0, 0, pCanvas.width, pCanvas.height)

    // Font sizes scaled - use smaller font for longer formats
    const baseFontSizes = {
      hex: 12,
      rgb: 11,
      rgba: 10,
      hsl: 10,
      hsla: 9,
      css: 9,
      scss: 9,
      tailwind4: 8,
      tailwind: 9,
    }
    const mainFontSize = Math.round((baseFontSizes[f] || 11) * scale)
    const subFontSize = Math.round(10 * scale)

    cols.forEach((c, i) => {
      const row = Math.floor(i / cols_per_row)
      const col = i % cols_per_row
      const x = padding + col * (swatchSize + gap)
      const y = padding + row * (swatchSize + textHeight + gap)

      pCtx.fillStyle = c.hex
      pCtx.fillRect(x, y, swatchSize, swatchSize)
      pCtx.strokeStyle = '#E5E7EB'
      pCtx.lineWidth = Math.max(1, scale)
      pCtx.strokeRect(x, y, swatchSize, swatchSize)

      pCtx.fillStyle = '#2d3748'
      pCtx.font = `600 ${mainFontSize}px -apple-system, BlinkMacSystemFont, sans-serif`
      pCtx.textAlign = 'center'
      pCtx.fillText(getFormatted(c, i), x + swatchSize / 2, y + swatchSize + Math.round(20 * scale))

      // Second line carries the HEX under notations that do not spell it out.
      if (!showsHexInline(f)) {
        pCtx.fillStyle = '#718096'
        pCtx.font = `500 ${subFontSize}px -apple-system, BlinkMacSystemFont, sans-serif`
        pCtx.fillText(
          c.hex.toUpperCase(),
          x + swatchSize / 2,
          y + swatchSize + Math.round(35 * scale)
        )
      }
    })

    // Determine MIME type and quality
    let mimeType, quality, extension
    switch (exportFormat) {
      case 'jpeg':
        mimeType = 'image/jpeg'
        quality = 0.92
        extension = 'jpg'
        break
      case 'webp':
        mimeType = 'image/webp'
        quality = 0.92
        extension = 'webp'
        break
      default:
        mimeType = 'image/png'
        quality = undefined
        extension = 'png'
    }

    const link = document.createElement('a')
    link.download = `color-palette-${f}.${extension}`
    link.href = pCanvas.toDataURL(mimeType, quality)
    link.click()
  }

  return {
    colors,
    currentImage,
    colorCount,
    downloadFormat,
    EXPORT_FORMATS,
    downloadPalette,
    hasColors,
    selectedColorIndex,
    originalImageSize,
    imageAdjustments,
    panPosition,
    imageExportFormat,
    imageExportSize,
    setImage,
    clearImage,
    setColorCount,
    setDownloadFormat,
    setImageExportFormat,
    setImageExportSize,
    setSelectedColor,
    setImageAdjustment,
    setPanPosition,
    resetPanPosition,
    resetImageAdjustments,
    extractColors,
    updateColorFromPosition,
    getPixelZoomData,
    getFormatted,
    downloadImage,
    copyPalette,
    canUndo,
    canRedo,
    commitHistory,
    resetHistory,
    undo,
    redo,
  }
})
