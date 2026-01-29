<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { usePaletteStore } from '../stores/palette'
import { useI18n } from '../composables/useI18n'
import SampleImages from './SampleImages.vue'

const store = usePaletteStore()
const { t } = useI18n()

// Drag and drop for image upload
const isFileDragging = ref(false)

function handleFileDragOver(e) {
  e.preventDefault()
  isFileDragging.value = true
}

function handleFileDragLeave(e) {
  e.preventDefault()
  isFileDragging.value = false
}

async function handleFileDrop(e) {
  e.preventDefault()
  isFileDragging.value = false

  const file = e.dataTransfer?.files?.[0]
  if (file && file.type.startsWith('image/')) {
    const reader = new FileReader()
    reader.onload = async (event) => {
      const imgSrc = event.target.result
      store.setImage(imgSrc)
      await store.extractColors(imgSrc)
    }
    reader.readAsDataURL(file)
  }
}

// Computed style for image filters and pan
const imageFilterStyle = computed(() => {
  const { zoom, brightness, contrast, saturation, hue } = store.imageAdjustments
  const { x: panX, y: panY } = store.panPosition
  return {
    filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) hue-rotate(${hue}deg)`,
    transform: `scale(${zoom / 100}) translate(${panX}px, ${panY}px)`,
    transformOrigin: 'center center'
  }
})

// Check if zoomed in (pan should only work when zoomed)
const isZoomed = computed(() => store.imageAdjustments.zoom > 100)

const imageContainer = ref(null)
const displayImage = ref(null)
const pixelZoom = ref(null)
const pixelZoomCanvas = ref(null)
const imageRect = ref(null)
const containerRect = ref(null)
const isDragging = ref(false)
const dragIndex = ref(-1)
const showZoom = ref(false)
const zoomPosition = ref({ x: 0, y: 0 })

// Pan state
const isPanning = ref(false)
const panStart = ref({ x: 0, y: 0 })
const panStartPosition = ref({ x: 0, y: 0 })

// Performance optimization: track pending animation frame
let animationFrameId = null

function updateRects() {
  if (displayImage.value && imageContainer.value) {
    imageRect.value = displayImage.value.getBoundingClientRect()
    containerRect.value = imageContainer.value.getBoundingClientRect()
  }
}

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

  // Update rects at drag start for accuracy
  updateRects()

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

function selectColor(index) {
  store.setSelectedColor(index)
}

// Pan functionality
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

watch(() => store.currentImage, () => {
  setTimeout(updateRects, 100)
})

// Reset pan when zoom changes to 100%
watch(() => store.imageAdjustments.zoom, (newZoom) => {
  if (newZoom <= 100) {
    store.resetPanPosition()
  }
})

onMounted(() => {
  window.addEventListener('resize', updateRects)
})

onUnmounted(() => {
  // Cancel any pending animation frame
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }
  window.removeEventListener('resize', updateRects)
  // Mouse events
  document.removeEventListener('mousemove', handleDrag)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('mousemove', handlePan)
  document.removeEventListener('mouseup', stopPan)
  // Touch events
  document.removeEventListener('touchmove', handleDrag)
  document.removeEventListener('touchend', stopDrag)
  document.removeEventListener('touchcancel', stopDrag)
})
</script>

<template>
  <main
    class="main-content"
    :class="{ 'file-dragging': isFileDragging }"
    @dragover.prevent="handleFileDragOver"
    @dragleave.prevent="handleFileDragLeave"
    @drop.prevent="handleFileDrop"
  >
    <div class="main-content-inner">
      <SampleImages />
      <div
        ref="imageContainer"
        class="image-container"
        :class="{ 'is-zoomed': isZoomed, 'is-panning': isPanning, 'file-dragging': isFileDragging }"
        @mousedown="startPan"
      >
      <template v-if="store.currentImage">
        <img
          ref="displayImage"
          :src="store.currentImage"
          alt="Uploaded"
          class="preview-image"
          :style="imageFilterStyle"
          @load="updateRects"
          draggable="false"
        >

        <!-- Color Indicators -->
        <div
          v-for="(color, index) in store.colors"
          :key="index"
          class="color-indicator"
          :class="{ selected: store.selectedColorIndex === index, dragging: isDragging && dragIndex === index }"
          :style="getIndicatorStyle(color, index)"
          @mousedown="startDrag($event, index)"
          @touchstart.prevent="startDrag($event, index)"
          @click.stop="selectColor(index)"
        ></div>

        <!-- Pixel Zoom Magnifier -->
        <div
          v-show="showZoom"
          ref="pixelZoom"
          class="pixel-zoom"
          :style="{ left: zoomPosition.x + 'px', top: zoomPosition.y + 'px' }"
        >
          <canvas ref="pixelZoomCanvas" width="24" height="24"></canvas>
        </div>
      </template>

      <div v-else class="placeholder">
        <div class="placeholder-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
        </div>
        <p class="placeholder-text">{{ t('placeholderText') }}</p>
        <p class="placeholder-hint">{{ t('placeholderHint') }}</p>
      </div>
    </div>
    </div>
  </main>
</template>

<style scoped>
.main-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  background: var(--bg-secondary);
  transition: background 0.3s ease;
}

.main-content.file-dragging {
  background: var(--bg-hover);
}

.main-content-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 800px;
}

.image-container {
  position: relative;
  width: 100%;
  max-width: 800px;
  aspect-ratio: 4/3;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-primary);
  border-radius: 12px;
  border: 2px dashed var(--border-color);
  overflow: hidden;
  transition: background 0.3s ease, border-color 0.3s ease;
}

.image-container.file-dragging {
  border-color: var(--selection-color);
  border-width: 3px;
  background: var(--bg-hover);
}

.image-container.is-zoomed {
  cursor: grab;
}

.image-container.is-zoomed.is-panning {
  cursor: grabbing;
}

.preview-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 8px;
  user-select: none;
  -webkit-user-drag: none;
}

.color-indicator {
  position: absolute;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 3px solid white;
  box-shadow: 0 2px 8px var(--shadow-medium), 0 0 0 1px var(--shadow-soft);
  cursor: grab;
  z-index: 10;
  transition: transform 0.15s ease, border-color 0.15s ease;
  animation: pulse 2s ease-in-out infinite;
  /* Touch optimization */
  touch-action: none;
  -webkit-touch-callout: none;
  -webkit-tap-highlight-color: transparent;
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 2px 8px var(--shadow-medium), 0 0 0 1px var(--shadow-soft), 0 0 0 0 rgba(255, 255, 255, 0.4);
  }
  50% {
    box-shadow: 0 2px 8px var(--shadow-medium), 0 0 0 1px var(--shadow-soft), 0 0 0 8px rgba(255, 255, 255, 0);
  }
}

.color-indicator:hover {
  transform: scale(1.15);
  box-shadow: 0 4px 12px var(--shadow-medium), 0 0 0 1px var(--shadow-soft);
}

.color-indicator.selected {
  border-color: var(--selection-color);
  border-width: 4px;
  transform: scale(1.1);
  animation: pulse-selected 1.5s ease-in-out infinite;
}

@keyframes pulse-selected {
  0%, 100% {
    box-shadow: 0 0 0 3px var(--selection-glow), 0 4px 12px var(--shadow-medium), 0 0 0 0 var(--selection-glow);
  }
  50% {
    box-shadow: 0 0 0 3px var(--selection-glow), 0 4px 12px var(--shadow-medium), 0 0 0 10px transparent;
  }
}

.color-indicator.dragging {
  cursor: grabbing;
  transform: scale(1.2);
  z-index: 100;
  animation: none;
}

.pixel-zoom {
  position: absolute;
  width: 120px;
  height: 120px;
  border: 3px solid white;
  border-radius: 50%;
  box-shadow: 0 4px 20px var(--shadow-medium);
  pointer-events: none;
  z-index: 1000;
  overflow: hidden;
  background: var(--bg-secondary);
}

.pixel-zoom canvas {
  width: 100%;
  height: 100%;
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
}

.pixel-zoom::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 4px;
  height: 4px;
  background: var(--text-primary);
  border: 1px solid white;
  transform: translate(-50%, -50%);
  border-radius: 1px;
}

.placeholder {
  text-align: center;
  padding: 40px;
}

.placeholder-icon {
  color: var(--text-tertiary);
  margin-bottom: 20px;
  transition: color 0.3s ease;
}

.placeholder-text {
  font-size: 18px;
  font-weight: 500;
  color: var(--text-secondary);
  margin: 0 0 8px 0;
  transition: color 0.3s ease;
}

.placeholder-hint {
  font-size: 14px;
  color: var(--text-tertiary);
  margin: 0;
  transition: color 0.3s ease;
}

@media (max-width: 900px) {
  .main-content {
    padding: 20px;
  }
}
</style>
