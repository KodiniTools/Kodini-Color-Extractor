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
  const { zoom, brightness, contrast, saturation, hue, blur, grayscale } = store.imageAdjustments
  const { x: panX, y: panY } = store.panPosition
  return {
    filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) hue-rotate(${hue}deg) blur(${blur}px) grayscale(${grayscale}%)`,
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
  isPinching,
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
        :class="{
          'is-zoomed': isZoomed,
          'is-panning': isPanning || isPinching,
          'file-dragging': isFileDragging,
          'has-image': store.currentImage,
        }"
        :style="containerAspectStyle"
        @mousedown="startPan"
        @touchstart="startPan"
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
  padding: var(--ds-space-10);
  background: var(--ds-surface-0);
  transition: var(--app-transition-colors);
}

.main-content.file-dragging {
  background: var(--ds-accent-soft);
}

.main-content-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  /* Was a hard 800px, which left ~260px of dead margin on either side on a
     wide screen. The canvas now grows with the workspace. */
  max-width: 1000px;
}

/* The canvas frame: a flat panel surface with a dashed 1 px border that
   marks it as the drop zone. */
.image-container {
  position: relative;
  width: 100%;
  max-width: 1000px;
  /* aspect-ratio is set dynamically via :style binding */
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--ds-surface-1);
  border-radius: var(--ds-radius-lg);
  border: var(--ds-border-width) dashed var(--ds-border-strong);
  overflow: hidden;
  transition: var(--app-transition-colors);
}

.image-container.file-dragging {
  border-color: var(--ds-accent);
  background: var(--ds-accent-soft);
}

/* Capture touch gestures (single-finger pan / two-finger pinch-zoom)
   instead of letting the browser scroll or native-zoom the page. */
.image-container.has-image {
  touch-action: none;
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
  border-radius: var(--ds-radius-md);
  user-select: none;
  -webkit-user-drag: none;
}

/* Colour markers on the image: a white ring with a thin dark edge so they
   read on any photo. Selected adds the accent ring; nothing pulses. */
.color-indicator {
  position: absolute;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 3px solid #ffffff;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.35);
  cursor: grab;
  z-index: 10;
  transition:
    border-color var(--ds-duration) var(--ds-ease),
    box-shadow var(--ds-duration) var(--ds-ease);
  /* Touch optimization */
  touch-action: none;
  -webkit-touch-callout: none;
  -webkit-tap-highlight-color: transparent;
}

.color-indicator:hover {
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.35);
}

.color-indicator.selected {
  border-color: #ffffff;
  box-shadow:
    0 0 0 2px var(--ds-accent),
    0 0 0 3px rgba(0, 0, 0, 0.35);
}

.color-indicator.dragging {
  cursor: grabbing;
  z-index: 100;
}

.placeholder {
  text-align: center;
  padding: var(--ds-space-10);
}

.placeholder-icon {
  color: var(--ds-text-3);
  margin-bottom: var(--ds-space-4);
}

.placeholder-text {
  font-size: var(--ds-text-lg);
  font-weight: var(--ds-weight-semibold);
  line-height: var(--ds-leading);
  color: var(--ds-text);
  margin: 0 0 var(--ds-space-1) 0;
}

.placeholder-hint {
  font-size: var(--ds-text-sm);
  line-height: var(--ds-leading);
  color: var(--ds-text-3);
  margin: 0;
}

@media (max-width: 900px) {
  .main-content {
    padding: var(--ds-space-5);
  }
}

@media (max-width: 480px) {
  .main-content {
    padding: var(--ds-space-3);
  }

  .image-container {
    border-radius: var(--ds-radius-md);
  }

  .placeholder {
    padding: var(--ds-space-6) var(--ds-space-4);
  }

  .placeholder-icon svg {
    width: 48px;
    height: 48px;
  }

  .placeholder-text {
    font-size: var(--ds-text-md);
  }

  .placeholder-hint {
    font-size: var(--ds-text-xs);
  }
}
</style>
