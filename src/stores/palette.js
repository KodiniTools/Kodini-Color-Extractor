import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

export const usePaletteStore = defineStore('palette', () => {
  const colors = ref([])
  const currentImage = ref(null)
  const imageData = ref(null)
  const colorCount = ref(5)
  const downloadFormat = ref('hex')
  const selectedColorIndex = ref(-1)
  const canvasRef = ref(null)
  const filteredCanvasRef = ref(null)
  const originalImageSize = ref({ width: 0, height: 0 })

  // Image adjustment settings
  const imageAdjustments = ref({
    zoom: 100,
    brightness: 100,
    contrast: 100,
    saturation: 100,
    hue: 0
  })

  const hasColors = computed(() => colors.value.length > 0)

  function setImage(imgSrc) {
    currentImage.value = imgSrc
  }

  function setColorCount(count) {
    colorCount.value = count
  }

  function setDownloadFormat(format) {
    downloadFormat.value = format
  }

  function setSelectedColor(index) {
    selectedColorIndex.value = index
  }

  function setImageAdjustment(prop, value) {
    imageAdjustments.value[prop] = value
    applyFiltersToCanvas()
  }

  function resetImageAdjustments() {
    imageAdjustments.value = {
      zoom: 100,
      brightness: 100,
      contrast: 100,
      saturation: 100,
      hue: 0
    }
    applyFiltersToCanvas()
  }

  function applyFiltersToCanvas() {
    if (!canvasRef.value || !currentImage.value) return

    const { brightness, contrast, saturation, hue } = imageAdjustments.value

    // Create filtered canvas if not exists
    if (!filteredCanvasRef.value) {
      filteredCanvasRef.value = document.createElement('canvas')
    }

    const filteredCanvas = filteredCanvasRef.value
    const originalCanvas = canvasRef.value

    filteredCanvas.width = originalCanvas.width
    filteredCanvas.height = originalCanvas.height

    const ctx = filteredCanvas.getContext('2d')

    // Apply CSS-like filters using canvas
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) hue-rotate(${hue}deg)`
    ctx.drawImage(originalCanvas, 0, 0)

    // Reset filter for future operations
    ctx.filter = 'none'

    // Update all color indicators with filtered colors
    updateAllColorsFromFilteredCanvas()
  }

  function updateAllColorsFromFilteredCanvas() {
    if (!filteredCanvasRef.value || colors.value.length === 0) return

    const ctx = filteredCanvasRef.value.getContext('2d')

    colors.value = colors.value.map((color, index) => {
      if (!color.position) return color

      const imgX = Math.max(0, Math.min(originalImageSize.value.width - 1, Math.round(color.position.x)))
      const imgY = Math.max(0, Math.min(originalImageSize.value.height - 1, Math.round(color.position.y)))

      const pixel = ctx.getImageData(imgX, imgY, 1, 1).data
      const r = pixel[0]
      const g = pixel[1]
      const b = pixel[2]
      const hex = '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')
      const hsl = rgbToHsl(r, g, b)

      return { r, g, b, hex, hsl, position: color.position }
    })
  }

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
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
        case g: h = ((b - r) / d + 2) / 6; break
        case b: h = ((r - g) / d + 4) / 6; break
      }
    }
    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    }
  }

  function extractColors(imgSrc) {
    return new Promise((resolve) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        canvas.width = img.width
        canvas.height = img.height
        originalImageSize.value = { width: img.width, height: img.height }

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        canvasRef.value = canvas

        // Initialize filtered canvas with same content
        filteredCanvasRef.value = document.createElement('canvas')
        filteredCanvasRef.value.width = canvas.width
        filteredCanvasRef.value.height = canvas.height
        const filteredCtx = filteredCanvasRef.value.getContext('2d')
        filteredCtx.drawImage(canvas, 0, 0)

        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        imageData.value = imgData

        const pixels = imgData.data
        const colorMap = new Map()

        for (let i = 0; i < pixels.length; i += 4) {
          const r = Math.round(pixels[i] / 16) * 16
          const g = Math.round(pixels[i + 1] / 16) * 16
          const b = Math.round(pixels[i + 2] / 16) * 16
          const a = pixels[i + 3]
          if (a < 128) continue

          const pixelIndex = i / 4
          const x = pixelIndex % canvas.width
          const y = Math.floor(pixelIndex / canvas.width)

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
          .slice(0, colorCount.value)
          .map(([key, data]) => {
            const [r, g, b] = key.split(',').map(Number)
            const hex = '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')
            const hsl = rgbToHsl(r, g, b)
            const pos = data.positions[Math.floor(Math.random() * data.positions.length)]
            return { r, g, b, hex, hsl, position: pos }
          })

        colors.value = sorted
        resolve(sorted)
      }
      img.src = imgSrc
    })
  }

  function updateColorFromPosition(index, x, y) {
    // Use filtered canvas if available, otherwise original
    const canvas = filteredCanvasRef.value || canvasRef.value
    if (!canvas || index < 0 || index >= colors.value.length) return

    const ctx = canvas.getContext('2d')
    const imgX = Math.max(0, Math.min(originalImageSize.value.width - 1, Math.round(x)))
    const imgY = Math.max(0, Math.min(originalImageSize.value.height - 1, Math.round(y)))

    const pixel = ctx.getImageData(imgX, imgY, 1, 1).data
    const r = pixel[0]
    const g = pixel[1]
    const b = pixel[2]
    const hex = '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')
    const hsl = rgbToHsl(r, g, b)

    colors.value[index] = {
      r, g, b, hex, hsl,
      position: { x: imgX, y: imgY }
    }
  }

  function getPixelZoomData(x, y, size = 12) {
    // Use filtered canvas if available, otherwise original
    const canvas = filteredCanvasRef.value || canvasRef.value
    if (!canvas) return null

    const ctx = canvas.getContext('2d')
    const imgX = Math.max(0, Math.min(originalImageSize.value.width - size, Math.round(x - size / 2)))
    const imgY = Math.max(0, Math.min(originalImageSize.value.height - size, Math.round(y - size / 2)))

    try {
      return ctx.getImageData(imgX, imgY, size, size)
    } catch {
      return null
    }
  }

  function updateColorAt(index, newHex) {
    if (index < 0 || index >= colors.value.length) return
    const hex = newHex.startsWith('#') ? newHex : `#${newHex}`
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    const hsl = rgbToHsl(r, g, b)
    colors.value[index] = { r, g, b, hex, hsl }
  }

  function getFormatted(color, index) {
    const f = downloadFormat.value
    const { r, g, b, hex, hsl } = color
    switch (f) {
      case 'hex': return hex.toUpperCase()
      case 'rgb': return `rgb(${r}, ${g}, ${b})`
      case 'rgba': return `rgba(${r}, ${g}, ${b}, 1)`
      case 'hsl': return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`
      case 'hsla': return `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, 1)`
      case 'css': return `--color-${index + 1}: ${hex};`
      default: return hex.toUpperCase()
    }
  }

  function downloadTxt() {
    const f = downloadFormat.value
    let content = ''
    if (f === 'css') {
      content = ':root {\n' + colors.value.map((c, i) => '  ' + getFormatted(c, i)).join('\n') + '\n}'
    } else {
      content = colors.value.map((c, i) => getFormatted(c, i)).join('\n')
    }
    const blob = new Blob([content], { type: 'text/plain' })
    const link = document.createElement('a')
    link.download = `color-palette-${f}.txt`
    link.href = URL.createObjectURL(blob)
    link.click()
    URL.revokeObjectURL(link.href)
  }

  function downloadPng() {
    const f = downloadFormat.value
    const cols = colors.value
    const swatchSize = 80
    const textHeight = 50
    const padding = 20
    const cols_per_row = Math.min(cols.length, 5)
    const rows = Math.ceil(cols.length / cols_per_row)

    const pCanvas = document.createElement('canvas')
    pCanvas.width = padding * 2 + cols_per_row * (swatchSize + 10) - 10
    pCanvas.height = padding * 2 + rows * (swatchSize + textHeight + 10) - 10
    const pCtx = pCanvas.getContext('2d')

    pCtx.fillStyle = '#ffffff'
    pCtx.fillRect(0, 0, pCanvas.width, pCanvas.height)

    cols.forEach((c, i) => {
      const row = Math.floor(i / cols_per_row)
      const col = i % cols_per_row
      const x = padding + col * (swatchSize + 10)
      const y = padding + row * (swatchSize + textHeight + 10)

      pCtx.fillStyle = c.hex
      pCtx.fillRect(x, y, swatchSize, swatchSize)
      pCtx.strokeStyle = '#E5E7EB'
      pCtx.strokeRect(x, y, swatchSize, swatchSize)

      pCtx.fillStyle = '#2d3748'
      pCtx.font = '600 11px -apple-system, BlinkMacSystemFont, sans-serif'
      pCtx.textAlign = 'center'
      pCtx.fillText(getFormatted(c, i), x + swatchSize / 2, y + swatchSize + 20)

      if (f !== 'hex') {
        pCtx.fillStyle = '#718096'
        pCtx.font = '500 10px -apple-system, BlinkMacSystemFont, sans-serif'
        pCtx.fillText(c.hex.toUpperCase(), x + swatchSize / 2, y + swatchSize + 35)
      }
    })

    const link = document.createElement('a')
    link.download = `color-palette-${f}.png`
    link.href = pCanvas.toDataURL('image/png')
    link.click()
  }

  return {
    colors,
    currentImage,
    imageData,
    colorCount,
    downloadFormat,
    hasColors,
    selectedColorIndex,
    originalImageSize,
    imageAdjustments,
    filteredCanvasRef,
    setImage,
    setColorCount,
    setDownloadFormat,
    setSelectedColor,
    setImageAdjustment,
    resetImageAdjustments,
    applyFiltersToCanvas,
    extractColors,
    updateColorFromPosition,
    getPixelZoomData,
    getFormatted,
    downloadTxt,
    downloadPng,
    rgbToHsl
  }
})
