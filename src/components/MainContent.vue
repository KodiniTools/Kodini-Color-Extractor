<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { usePaletteStore } from '../stores/palette'
import { useI18n } from '../composables/useI18n'

const store = usePaletteStore()
const { t } = useI18n()

// Computed style for image filters
const imageFilterStyle = computed(() => {
  const { zoom, brightness, contrast, saturation, hue } = store.imageAdjustments
  return {
    filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) hue-rotate(${hue}deg)`,
    transform: `scale(${zoom / 100})`,
    transformOrigin: 'center center'
  }
})

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

  const scaleX = imageRect.value.width / store.originalImageSize.width
  const scaleY = imageRect.value.height / store.originalImageSize.height

  const imageOffsetX = imageRect.value.left - containerRect.value.left
  const imageOffsetY = imageRect.value.top - containerRect.value.top

  const x = imageOffsetX + (color.position.x * scaleX) - 16
  const y = imageOffsetY + (color.position.y * scaleY) - 16

  return {
    left: `${x}px`,
    top: `${y}px`,
    backgroundColor: color.hex,
    borderColor: store.selectedColorIndex === index ? '#0F5CD4' : 'white'
  }
}

function startDrag(e, index) {
  e.preventDefault()
  e.stopPropagation()

  isDragging.value = true
  dragIndex.value = index
  store.setSelectedColor(index)
  showZoom.value = true

  document.addEventListener('mousemove', handleDrag)
  document.addEventListener('mouseup', stopDrag)
  document.body.style.userSelect = 'none'
}

function handleDrag(e) {
  if (!isDragging.value || dragIndex.value < 0) return
  if (!imageRect.value || !containerRect.value) return

  const scaleX = store.originalImageSize.width / imageRect.value.width
  const scaleY = store.originalImageSize.height / imageRect.value.height

  const relX = e.clientX - imageRect.value.left
  const relY = e.clientY - imageRect.value.top

  const imgX = Math.max(0, Math.min(store.originalImageSize.width - 1, relX * scaleX))
  const imgY = Math.max(0, Math.min(store.originalImageSize.height - 1, relY * scaleY))

  store.updateColorFromPosition(dragIndex.value, imgX, imgY)

  // Update zoom position
  zoomPosition.value = {
    x: e.clientX - containerRect.value.left + 30,
    y: e.clientY - containerRect.value.top - 60
  }

  // Draw zoom canvas
  const zoomData = store.getPixelZoomData(imgX, imgY, 24)
  if (zoomData && pixelZoomCanvas.value) {
    const ctx = pixelZoomCanvas.value.getContext('2d')
    ctx.putImageData(zoomData, 0, 0)
  }
}

function stopDrag() {
  isDragging.value = false
  dragIndex.value = -1
  showZoom.value = false
  document.removeEventListener('mousemove', handleDrag)
  document.removeEventListener('mouseup', stopDrag)
  document.body.style.userSelect = ''
}

function selectColor(index) {
  store.setSelectedColor(index)
}

watch(() => store.currentImage, () => {
  setTimeout(updateRects, 100)
})

onMounted(() => {
  window.addEventListener('resize', updateRects)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateRects)
  document.removeEventListener('mousemove', handleDrag)
  document.removeEventListener('mouseup', stopDrag)
})
</script>

<template>
  <main class="main-content">
    <div ref="imageContainer" class="image-container">
      <template v-if="store.currentImage">
        <img
          ref="displayImage"
          :src="store.currentImage"
          alt="Uploaded"
          class="preview-image"
          :style="imageFilterStyle"
          @load="updateRects"
        >

        <!-- Color Indicators -->
        <div
          v-for="(color, index) in store.colors"
          :key="index"
          class="color-indicator"
          :class="{ selected: store.selectedColorIndex === index, dragging: isDragging && dragIndex === index }"
          :style="getIndicatorStyle(color, index)"
          @mousedown="startDrag($event, index)"
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
        <div class="placeholder-icon">🖼️</div>
        <p class="placeholder-text">{{ t('placeholderText') }}</p>
        <p class="placeholder-hint">{{ t('placeholderHint') }}</p>
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
  background: #ffffff;
}

.image-container {
  position: relative;
  width: 100%;
  max-width: 800px;
  aspect-ratio: 4/3;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  border-radius: 12px;
  border: 2px dashed #e2e8f0;
  overflow: visible;
}

.preview-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 8px;
}

.color-indicator {
  position: absolute;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 3px solid white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.1);
  cursor: grab;
  z-index: 10;
  transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
}

.color-indicator:hover {
  transform: scale(1.15);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.1);
}

.color-indicator.selected {
  border-color: #0F5CD4;
  border-width: 4px;
  box-shadow: 0 0 0 3px rgba(15, 92, 212, 0.3), 0 4px 12px rgba(0, 0, 0, 0.2);
  transform: scale(1.1);
}

.color-indicator.dragging {
  cursor: grabbing;
  transform: scale(1.2);
  z-index: 100;
}

.pixel-zoom {
  position: absolute;
  width: 120px;
  height: 120px;
  border: 3px solid white;
  border-radius: 50%;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
  pointer-events: none;
  z-index: 1000;
  overflow: hidden;
  background: #fff;
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
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid white;
  transform: translate(-50%, -50%);
  border-radius: 1px;
}

.placeholder {
  text-align: center;
  padding: 40px;
}

.placeholder-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.placeholder-text {
  font-size: 18px;
  font-weight: 500;
  color: #4a5568;
  margin: 0 0 8px 0;
}

.placeholder-hint {
  font-size: 14px;
  color: #718096;
  margin: 0;
}

@media (max-width: 900px) {
  .main-content {
    padding: 20px;
  }
}
</style>
