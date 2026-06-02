import { ref } from 'vue'

export function useCanvasPan({ imageRect, containerRect, store, isDragging, isZoomed }) {
  const isPanning = ref(false)
  const panStart = ref({ x: 0, y: 0 })
  const panStartPosition = ref({ x: 0, y: 0 })

  function startPan(e) {
    // Only pan when zoomed and not dragging a color indicator
    if (!isZoomed.value || isDragging.value) return

    e.preventDefault()
    isPanning.value = true
    panStart.value = { x: e.clientX, y: e.clientY }
    panStartPosition.value = { ...store.panPosition }

    document.addEventListener('mousemove', handlePan)
    document.addEventListener('mouseup', stopPan)
    document.body.style.cursor = 'grabbing'
  }

  function handlePan(e) {
    if (!isPanning.value) return

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
      y: excessY / zoom
    }
  }

  function stopPan() {
    isPanning.value = false
    document.removeEventListener('mousemove', handlePan)
    document.removeEventListener('mouseup', stopPan)
    document.body.style.cursor = ''
  }

  function cleanup() {
    document.removeEventListener('mousemove', handlePan)
    document.removeEventListener('mouseup', stopPan)
  }

  return { isPanning, startPan, stopPan, cleanup }
}
