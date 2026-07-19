import { ref } from 'vue'

// Zoom limits must match the zoom slider in ImageEditPanel.vue (min="25" max="400")
const ZOOM_MIN = 25
const ZOOM_MAX = 400

export function useCanvasPan({ imageRect, containerRect, store, isDragging, isZoomed }) {
  const isPanning = ref(false)
  const isPinching = ref(false)
  const panStart = ref({ x: 0, y: 0 })
  const panStartPosition = ref({ x: 0, y: 0 })

  // Pinch-to-zoom state
  let pinchStartDistance = 0
  let pinchStartZoom = 100

  // Extract client coordinates from a mouse or (single-finger) touch event
  function getEventCoords(e) {
    if (e.touches && e.touches.length > 0) {
      return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY }
    }
    if (e.changedTouches && e.changedTouches.length > 0) {
      return { clientX: e.changedTouches[0].clientX, clientY: e.changedTouches[0].clientY }
    }
    return { clientX: e.clientX, clientY: e.clientY }
  }

  // Distance between the first two active touch points (for pinch)
  function getTouchDistance(touches) {
    const dx = touches[0].clientX - touches[1].clientX
    const dy = touches[0].clientY - touches[1].clientY
    return Math.hypot(dx, dy)
  }

  function isTouchEvent(e) {
    return typeof TouchEvent !== 'undefined' && e instanceof TouchEvent
  }

  function startPan(e) {
    // Never start a pan/pinch while dragging a color indicator
    if (isDragging.value) return

    // Two-finger pinch-to-zoom takes priority and works at any zoom level
    if (e.touches && e.touches.length >= 2) {
      e.preventDefault()
      isPinching.value = true
      isPanning.value = false
      pinchStartDistance = getTouchDistance(e.touches)
      pinchStartZoom = store.imageAdjustments.zoom
      addTouchListeners()
      return
    }

    // Single-finger / mouse pan: only meaningful when zoomed in
    if (!isZoomed.value) return

    e.preventDefault()
    const { clientX, clientY } = getEventCoords(e)
    isPanning.value = true
    panStart.value = { x: clientX, y: clientY }
    panStartPosition.value = { ...store.panPosition }

    if (isTouchEvent(e)) {
      addTouchListeners()
    } else {
      document.addEventListener('mousemove', handlePan)
      document.addEventListener('mouseup', stopPan)
      document.body.style.cursor = 'grabbing'
    }
  }

  function addTouchListeners() {
    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', handleTouchEnd)
    document.addEventListener('touchcancel', handleTouchEnd)
  }

  function handleTouchMove(e) {
    if (isPinching.value) {
      handlePinch(e)
    } else if (isPanning.value) {
      handlePan(e)
    }
  }

  // A finger lifted or the gesture ended
  function handleTouchEnd(e) {
    // Still two or more fingers down: keep pinching
    if (e.touches && e.touches.length >= 2) {
      pinchStartDistance = getTouchDistance(e.touches)
      pinchStartZoom = store.imageAdjustments.zoom
      return
    }

    // Dropped from pinch (2 -> 1 finger): continue as a single-finger pan
    if (isPinching.value && e.touches && e.touches.length === 1) {
      isPinching.value = false
      if (isZoomed.value) {
        isPanning.value = true
        panStart.value = { x: e.touches[0].clientX, y: e.touches[0].clientY }
        panStartPosition.value = { ...store.panPosition }
      }
      return
    }

    // No fingers left: end everything
    stopPan()
  }

  function handlePinch(e) {
    if (!e.touches || e.touches.length < 2) return
    if (e.cancelable) e.preventDefault()

    const currentDistance = getTouchDistance(e.touches)
    if (pinchStartDistance <= 0) {
      pinchStartDistance = currentDistance
      return
    }

    const scale = currentDistance / pinchStartDistance
    const newZoom = Math.round(Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, pinchStartZoom * scale)))
    store.setImageAdjustment('zoom', newZoom)
  }

  function handlePan(e) {
    if (!isPanning.value) return
    if (e.cancelable) e.preventDefault()

    const { clientX, clientY } = getEventCoords(e)
    const zoom = store.imageAdjustments.zoom / 100
    const deltaX = (clientX - panStart.value.x) / zoom
    const deltaY = (clientY - panStart.value.y) / zoom

    // Calculate pan limits based on zoom level and image size
    const maxPan = calculateMaxPan()

    const newX = Math.max(-maxPan.x, Math.min(maxPan.x, panStartPosition.value.x + deltaX))
    const newY = Math.max(-maxPan.y, Math.min(maxPan.y, panStartPosition.value.y + deltaY))

    store.setPanPosition(newX, newY)
  }

  function calculateMaxPan() {
    if (!imageRect.value || !containerRect.value) return { x: 0, y: 0 }

    const zoom = store.imageAdjustments.zoom / 100
    const scaledWidth = imageRect.value.width * zoom
    const scaledHeight = imageRect.value.height * zoom

    // Calculate how much the image exceeds the container
    const excessX = Math.max(0, (scaledWidth - containerRect.value.width) / 2)
    const excessY = Math.max(0, (scaledHeight - containerRect.value.height) / 2)

    return {
      x: excessX / zoom,
      y: excessY / zoom,
    }
  }

  function stopPan() {
    isPanning.value = false
    isPinching.value = false
    pinchStartDistance = 0

    document.removeEventListener('mousemove', handlePan)
    document.removeEventListener('mouseup', stopPan)
    document.removeEventListener('touchmove', handleTouchMove)
    document.removeEventListener('touchend', handleTouchEnd)
    document.removeEventListener('touchcancel', handleTouchEnd)
    document.body.style.cursor = ''
  }

  function cleanup() {
    document.removeEventListener('mousemove', handlePan)
    document.removeEventListener('mouseup', stopPan)
    document.removeEventListener('touchmove', handleTouchMove)
    document.removeEventListener('touchend', handleTouchEnd)
    document.removeEventListener('touchcancel', handleTouchEnd)
  }

  return { isPanning, isPinching, startPan, stopPan, cleanup }
}
