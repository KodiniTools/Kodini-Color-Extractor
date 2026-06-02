import { ref } from 'vue'

export function useCanvasDrag({ imageRect, containerRect, store, pixelZoomCanvas }) {
  const isDragging = ref(false)
  const dragIndex = ref(-1)
  const showZoom = ref(false)
  const zoomPosition = ref({ x: 0, y: 0 })

  let animationFrameId = null

  function getIndicatorStyle(color, index) {
    if (!imageRect.value || !containerRect.value || !store.originalImageSize.width) {
      return { display: 'none' }
    }

    const zoom = store.imageAdjustments.zoom / 100
    const { x: panX, y: panY } = store.panPosition

    const scaleX = imageRect.value.width / store.originalImageSize.width
    const scaleY = imageRect.value.height / store.originalImageSize.height

    const imageOffsetX = imageRect.value.left - containerRect.value.left
    const imageOffsetY = imageRect.value.top - containerRect.value.top

    // Calculate base position
    const baseX = imageOffsetX + (color.position.x * scaleX) - 16
    const baseY = imageOffsetY + (color.position.y * scaleY) - 16

    // Apply zoom and pan transformation relative to container center
    const containerCenterX = containerRect.value.width / 2
    const containerCenterY = containerRect.value.height / 2

    // Calculate position with zoom and pan
    const x = containerCenterX + (baseX - containerCenterX + 16 + panX * scaleX) * zoom - 16
    const y = containerCenterY + (baseY - containerCenterY + 16 + panY * scaleY) * zoom - 16

    return {
      left: `${x}px`,
      top: `${y}px`,
      backgroundColor: color.hex,
      borderColor: store.selectedColorIndex === index ? 'var(--selection-color)' : 'white',
      transform: `scale(${Math.min(zoom, 1.5)})`
    }
  }

  // Get client coordinates from mouse or touch event
  function getEventCoords(e) {
    if (e.touches && e.touches.length > 0) {
      return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY }
    }
    return { clientX: e.clientX, clientY: e.clientY }
  }

  function startDrag(e, index) {
    e.preventDefault()
    e.stopPropagation()

    isDragging.value = true
    dragIndex.value = index
    store.setSelectedColor(index)
    showZoom.value = true

    // Mouse events
    document.addEventListener('mousemove', handleDrag)
    document.addEventListener('mouseup', stopDrag)
    // Touch events
    document.addEventListener('touchmove', handleDrag, { passive: false })
    document.addEventListener('touchend', stopDrag)
    document.addEventListener('touchcancel', stopDrag)
    document.body.style.userSelect = 'none'
  }

  function handleDrag(e) {
    if (!isDragging.value || dragIndex.value < 0) return
    if (!imageRect.value || !containerRect.value) return

    // Prevent scrolling on touch devices
    if (e.cancelable) e.preventDefault()

    // Use requestAnimationFrame for smooth updates
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
    }

    animationFrameId = requestAnimationFrame(() => {
      const coords = getEventCoords(e)
      processDrag(coords.clientX, coords.clientY)
    })
  }

  function processDrag(clientX, clientY) {
    if (!isDragging.value || dragIndex.value < 0) return
    if (!imageRect.value || !containerRect.value) return

    const zoom = store.imageAdjustments.zoom / 100
    const { x: panX, y: panY } = store.panPosition

    const scaleX = store.originalImageSize.width / imageRect.value.width
    const scaleY = store.originalImageSize.height / imageRect.value.height

    // Calculate mouse position relative to container center
    const containerCenterX = containerRect.value.left + containerRect.value.width / 2
    const containerCenterY = containerRect.value.top + containerRect.value.height / 2

    // Reverse the zoom and pan transformation to get image coordinates
    const relX = (clientX - containerCenterX) / zoom + containerRect.value.width / 2 - (imageRect.value.left - containerRect.value.left) - panX * (imageRect.value.width / store.originalImageSize.width)
    const relY = (clientY - containerCenterY) / zoom + containerRect.value.height / 2 - (imageRect.value.top - containerRect.value.top) - panY * (imageRect.value.height / store.originalImageSize.height)

    const imgX = Math.max(0, Math.min(store.originalImageSize.width - 1, relX * scaleX))
    const imgY = Math.max(0, Math.min(store.originalImageSize.height - 1, relY * scaleY))

    store.updateColorFromPosition(dragIndex.value, imgX, imgY)

    // Update zoom position
    zoomPosition.value = {
      x: clientX - containerRect.value.left + 30,
      y: clientY - containerRect.value.top - 60
    }

    // Draw zoom canvas
    const zoomData = store.getPixelZoomData(imgX, imgY, 24)
    if (zoomData && pixelZoomCanvas.value) {
      const ctx = pixelZoomCanvas.value.getContext('2d')
      ctx.putImageData(zoomData, 0, 0)
    }
  }

  function stopDrag() {
    // Cancel any pending animation frame
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
      animationFrameId = null
    }

    isDragging.value = false
    dragIndex.value = -1
    showZoom.value = false

    // Remove mouse events
    document.removeEventListener('mousemove', handleDrag)
    document.removeEventListener('mouseup', stopDrag)
    // Remove touch events
    document.removeEventListener('touchmove', handleDrag)
    document.removeEventListener('touchend', stopDrag)
    document.removeEventListener('touchcancel', stopDrag)
    document.body.style.userSelect = ''
  }

  function cleanup() {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
    }
    document.removeEventListener('mousemove', handleDrag)
    document.removeEventListener('mouseup', stopDrag)
    document.removeEventListener('touchmove', handleDrag)
    document.removeEventListener('touchend', stopDrag)
    document.removeEventListener('touchcancel', stopDrag)
  }

  return { isDragging, dragIndex, showZoom, zoomPosition, startDrag, stopDrag, getIndicatorStyle, cleanup }
}
