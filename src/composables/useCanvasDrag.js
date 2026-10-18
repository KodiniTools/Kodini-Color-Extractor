import { ref } from 'vue'

export function useCanvasDrag({ imageRect, containerRect, store, pixelZoomCanvas }) {
  const isDragging = ref(false)
  const dragIndex = ref(-1)
  const showZoom = ref(false)
  const zoomPosition = ref({ x: 0, y: 0 })

  let animationFrameId = null
  // The pointer (mouse, pen or finger) that grabbed the point; others are ignored.
  let activePointerId = null

  function getIndicatorStyle(color) {
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
    const baseX = imageOffsetX + color.position.x * scaleX - 16
    const baseY = imageOffsetY + color.position.y * scaleY - 16

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
      transform: `scale(${Math.min(zoom, 1.5)})`,
    }
  }

  function startDrag(e, index) {
    // Mouse: only the main button drags; a second pointer cannot take over.
    if (e.pointerType === 'mouse' && e.button !== 0) return
    if (isDragging.value) return
    e.preventDefault()
    e.stopPropagation()

    activePointerId = e.pointerId
    isDragging.value = true
    dragIndex.value = index
    store.setSelectedColor(index)
    showZoom.value = true

    document.addEventListener('pointermove', handleDrag)
    document.addEventListener('pointerup', handlePointerEnd)
    document.addEventListener('pointercancel', handlePointerEnd)
    document.body.style.userSelect = 'none'
  }

  function handleDrag(e) {
    if (e.pointerId !== activePointerId) return
    if (!isDragging.value || dragIndex.value < 0) return
    if (!imageRect.value || !containerRect.value) return

    if (e.cancelable) e.preventDefault()

    // Use requestAnimationFrame for smooth updates
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
    }

    const { clientX, clientY } = e
    animationFrameId = requestAnimationFrame(() => processDrag(clientX, clientY))
  }

  function handlePointerEnd(e) {
    if (e.pointerId === activePointerId) stopDrag()
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
    const relX =
      (clientX - containerCenterX) / zoom +
      containerRect.value.width / 2 -
      (imageRect.value.left - containerRect.value.left) -
      panX * (imageRect.value.width / store.originalImageSize.width)
    const relY =
      (clientY - containerCenterY) / zoom +
      containerRect.value.height / 2 -
      (imageRect.value.top - containerRect.value.top) -
      panY * (imageRect.value.height / store.originalImageSize.height)

    const imgX = Math.max(0, Math.min(store.originalImageSize.width - 1, relX * scaleX))
    const imgY = Math.max(0, Math.min(store.originalImageSize.height - 1, relY * scaleY))

    store.updateColorFromPosition(dragIndex.value, imgX, imgY)

    // Update zoom position
    zoomPosition.value = {
      x: clientX - containerRect.value.left + 30,
      y: clientY - containerRect.value.top - 60,
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

    // A finished drag is one undo step (a click without moving adds none).
    if (dragIndex.value >= 0) store.commitHistory()

    isDragging.value = false
    dragIndex.value = -1
    showZoom.value = false
    activePointerId = null

    removeListeners()
    document.body.style.userSelect = ''
  }

  function removeListeners() {
    document.removeEventListener('pointermove', handleDrag)
    document.removeEventListener('pointerup', handlePointerEnd)
    document.removeEventListener('pointercancel', handlePointerEnd)
  }

  function cleanup() {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
    }
    removeListeners()
  }

  return {
    isDragging,
    dragIndex,
    showZoom,
    zoomPosition,
    startDrag,
    stopDrag,
    getIndicatorStyle,
    cleanup,
  }
}
