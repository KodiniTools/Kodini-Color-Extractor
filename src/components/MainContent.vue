<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { usePaletteStore } from '../stores/palette'
import { useI18n } from '../composables/useI18n'
import SampleImages from './SampleImages.vue'
import PixelMagnifier from './PixelMagnifier.vue'
import { useFileDrop } from '../composables/useFileDrop'
import { useCanvasDrag } from '../composables/useCanvasDrag'
import { useCanvasPan } from '../composables/useCanvasPan'

const store = usePaletteStore()
const { t } = useI18n()

const imageContainer = ref(null)
const displayImage = ref(null)
const pixelMagnifierRef = ref(null)
const imageRect = ref(null)
const containerRect = ref(null)
const imageAspectRatio = ref(null)

const pixelZoomCanvas = computed(() => pixelMagnifierRef.value?.canvas)

// Computed style for image filters and pan
const imageFilterStyle = computed(() => {
  const { zoom, brightness, contrast, saturation, hue } = store.imageAdjustments
  const { x: panX, y: panY } = store.panPosition
  return {
    filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) hue-rotate(${hue}deg)`,
    transform: `scale(${zoom / 100}) translate(${panX}px, ${panY}px)`,
    transformOrigin: 'center center',
  }
})

// Check if zoomed in (pan should only work when zoomed)
const isZoomed = computed(() => store.imageAdjustments.zoom > 100)

function updateRects() {
  if (displayImage.value && imageContainer.value) {
    imageRect.value = displayImage.value.getBoundingClientRect()
    containerRect.value = imageContainer.value.getBoundingClientRect()

    const appCont = imageContainer.value.closest('.app-container')
    if (appCont) {
      const appRect = appCont.getBoundingClientRect()
      const icRect = imageContainer.value.getBoundingClientRect()
      store.imageCenterY = icRect.top - appRect.top + icRect.height / 2
    }
  }
}

function onImageLoad() {
  const img = displayImage.value
  if (img) {
    imageAspectRatio.value = img.naturalWidth / img.naturalHeight
  }
  updateRects()
}

const containerAspectStyle = computed(() => {
  if (imageAspectRatio.value) {
    return { aspectRatio: String(imageAspectRatio.value) }
  }
  return { aspectRatio: '4/3' }
})

const { isFileDragging, handleFileDragOver, handleFileDragLeave, handleFileDrop } =
  useFileDrop(store)

const {
  isDragging,
  dragIndex,
  showZoom,
  zoomPosition,
  startDrag,
  stopDrag,
  getIndicatorStyle,
  cleanup: cleanupDrag,
} = useCanvasDrag({
  imageRect,
  containerRect,
  store,
  pixelZoomCanvas,
})

// Wrap startDrag to call updateRects first
function startDragWithRects(e, index) {
  updateRects()
  startDrag(e, index)
}

const {
  isPanning,
  startPan,
  cleanup: cleanupPan,
} = useCanvasPan({
  imageRect,
  containerRect,
  store,
  isDragging,
  isZoomed,
})

function selectColor(index) {
  store.setSelectedColor(index)
}

watch(
  () => store.currentImage,
  () => {
    imageAspectRatio.value = null
    setTimeout(updateRects, 100)
  }
)

// Reset pan when zoom changes to 100%
watch(
  () => store.imageAdjustments.zoom,
  (newZoom) => {
    if (newZoom <= 100) {
      store.resetPanPosition()
    }
  }
)

onMounted(() => {
  window.addEventListener('resize', updateRects)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateRects)
  cleanupDrag()
  cleanupPan()
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
        :style="containerAspectStyle"
        @mousedown="startPan"
      >
        <template v-if="store.currentImage">
          <img
            ref="displayImage"
            :src="store.currentImage"
            alt="Uploaded"
            class="preview-image"
            :style="imageFilterStyle"
            @load="onImageLoad"
            draggable="false"
          />

          <!-- Color Indicators -->
          <div
            v-for="(color, index) in store.colors"
            :key="index"
            class="color-indicator"
            :class="{
              selected: store.selectedColorIndex === index,
              dragging: isDragging && dragIndex === index,
            }"
            :style="getIndicatorStyle(color, index)"
            @mousedown="startDragWithRects($event, index)"
            @touchstart.prevent="startDragWithRects($event, index)"
            @click.stop="selectColor(index)"
          ></div>

          <!-- Pixel Zoom Magnifier -->
          <PixelMagnifier
            ref="pixelMagnifierRef"
            :show="showZoom"
            :x="zoomPosition.x"
            :y="zoomPosition.y"
          />
        </template>

        <div v-else class="placeholder">
          <div class="placeholder-icon">
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
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
  /* aspect-ratio is set dynamically via :style binding */
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-primary);
  border-radius: 12px;
  border: 2px dashed var(--border-color);
  overflow: hidden;
  transition:
    background 0.3s ease,
    border-color 0.3s ease;
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
  width: 100%;
  height: 100%;
  object-fit: cover;
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
  box-shadow:
    0 2px 8px var(--shadow-medium),
    0 0 0 1px var(--shadow-soft);
  cursor: grab;
  z-index: 10;
  transition:
    transform 0.15s ease,
    border-color 0.15s ease;
  animation: pulse 2s ease-in-out infinite;
  /* Touch optimization */
  touch-action: none;
  -webkit-touch-callout: none;
  -webkit-tap-highlight-color: transparent;
}

@keyframes pulse {
  0%,
  100% {
    box-shadow:
      0 2px 8px var(--shadow-medium),
      0 0 0 1px var(--shadow-soft),
      0 0 0 0 rgba(255, 255, 255, 0.4);
  }
  50% {
    box-shadow:
      0 2px 8px var(--shadow-medium),
      0 0 0 1px var(--shadow-soft),
      0 0 0 8px rgba(255, 255, 255, 0);
  }
}

.color-indicator:hover {
  transform: scale(1.15);
  box-shadow:
    0 4px 12px var(--shadow-medium),
    0 0 0 1px var(--shadow-soft);
}

.color-indicator.selected {
  border-color: var(--selection-color);
  border-width: 4px;
  transform: scale(1.1);
  animation: pulse-selected 1.5s ease-in-out infinite;
}

@keyframes pulse-selected {
  0%,
  100% {
    box-shadow:
      0 0 0 3px var(--selection-glow),
      0 4px 12px var(--shadow-medium),
      0 0 0 0 var(--selection-glow);
  }
  50% {
    box-shadow:
      0 0 0 3px var(--selection-glow),
      0 4px 12px var(--shadow-medium),
      0 0 0 10px transparent;
  }
}

.color-indicator.dragging {
  cursor: grabbing;
  transform: scale(1.2);
  z-index: 100;
  animation: none;
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

@media (max-width: 480px) {
  .main-content {
    padding: 12px;
  }

  .image-container {
    border-radius: 8px;
  }

  .placeholder {
    padding: 24px 16px;
  }

  .placeholder-icon svg {
    width: 48px;
    height: 48px;
  }

  .placeholder-text {
    font-size: 16px;
  }

  .placeholder-hint {
    font-size: 12px;
  }
}
</style>
