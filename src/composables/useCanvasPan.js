import { ref } from 'vue'

// Zoom limits must match the zoom slider in ImageEditPanel.vue (min="25" max="400")
const ZOOM_MIN = 25
const ZOOM_MAX = 400

export function useCanvasPan({ imageRect, containerRect, store, isDragging, isZoomed }) {
  const isPanning = ref(false)
  const isPinching = ref(false)
  const panStart = ref({ x: 0, y: 0 })
  const panStartPosition = ref({ x: 0, y: 0 })

  // Active pointers on the image (mouse, pen or fingers) by pointerId, so one
  // code path handles a mouse pan, a one-finger pan and a two-finger pinch.
  const pointers = new Map()
  let panPointerId = null

  // Pinch-to-zoom state
  let pinchStartDistance = 0
  let pinchStartZoom = 100

  // Distance between the first two active pointers (for pinch)
  function pointerDistance() {
    const [a, b] = [...pointers.values()]
    return Math.hypot(a.x - b.x, a.y - b.y)
  }

  function startPinch() {
    isPinching.value = true
    isPanning.value = false
    panPointerId = null
    pinchStartDistance = pointerDistance()
    pinchStartZoom = store.imageAdjustments.zoom
  }

  function beginPanWith(id) {
    const p = pointers.get(id)
    isPanning.value = true
    panPointerId = id
    panStart.value = { x: p.x, y: p.y }
    panStartPosition.value = { ...store.panPosition }
  }

  function startPan(e) {
    // Never start a pan/pinch while dragging a color indicator
    if (isDragging.value) return
    // Mouse: only the main button pans
    if (e.pointerType === 'mouse' && e.button !== 0) return

    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
    addListeners()

    // Second finger down: pinch-to-zoom takes priority and works at any zoom level
    if (pointers.size >= 2) {
      e.preventDefault()
      startPinch()
      return
    }

    // Single pointer pan: only meaningful when zoomed in. A finger stays
    // tracked anyway, since a second one may still turn it into a pinch.
    if (!isZoomed.value) {
      if (e.pointerType !== 'touch') releasePointer(e.pointerId)
      return
    }

    e.preventDefault()
    beginPanWith(e.pointerId)
    if (e.pointerType === 'mouse') document.body.style.cursor = 'grabbing'
  }

  function addListeners() {
    document.addEventListener('pointermove', handlePointerMove)
    document.addEventListener('pointerup', handlePointerUp)
    document.addEventListener('pointercancel', handlePointerUp)
  }

  function removeListeners() {
    document.removeEventListener('pointermove', handlePointerMove)
    document.removeEventListener('pointerup', handlePointerUp)
    document.removeEventListener('pointercancel', handlePointerUp)
  }

  function releasePointer(id) {
    pointers.delete(id)
    if (!pointers.size) removeListeners()
  }

  function handlePointerMove(e) {
    if (!pointers.has(e.pointerId)) return
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (isPinching.value) {
      handlePinch(e)
    } else if (isPanning.value && e.pointerId === panPointerId) {
      handlePan(e)
    }
  }

  // A pointer lifted or the gesture was cancelled
  function handlePointerUp(e) {
    if (!pointers.has(e.pointerId)) return
    pointers.delete(e.pointerId)

    // Still two or more pointers down: keep pinching from the new distance
    if (pointers.size >= 2) {
      startPinch()
      return
    }

    // Dropped from pinch (2 -> 1 finger): continue as a single-finger pan
    if (isPinching.value && pointers.size === 1) {
      isPinching.value = false
      if (isZoomed.value) beginPanWith([...pointers.keys()][0])
      return
    }

    // The panning pointer lifted, or nothing is left: end everything
    if (!pointers.size || e.pointerId === panPointerId) stopPan()
  }

  function handlePinch(e) {
    if (pointers.size < 2) return
    if (e.cancelable) e.preventDefault()

    const currentDistance = pointerDistance()
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

    const zoom = store.imageAdjustments.zoom / 100
    const deltaX = (e.clientX - panStart.value.x) / zoom
    const deltaY = (e.clientY - panStart.value.y) / zoom

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
    panPointerId = null
    pointers.clear()
    removeListeners()
    document.body.style.cursor = ''
  }

  function cleanup() {
    pointers.clear()
    removeListeners()
  }

  return { isPanning, isPinching, startPan, stopPan, cleanup }
}
