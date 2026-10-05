<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { usePaletteStore } from '../stores/palette'
import { useI18n } from '../composables/useI18n'

defineProps({
  show: Boolean,
})

const emit = defineEmits(['close'])

const store = usePaletteStore()
const { t } = useI18n()

const sliderPosition = ref(50)
const isDragging = ref(false)
const containerRef = ref(null)

const imageFilterStyle = computed(() => {
  const { brightness, contrast, saturation, hue, blur, grayscale } = store.imageAdjustments
  return {
    filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) hue-rotate(${hue}deg) blur(${blur}px) grayscale(${grayscale}%)`,
  }
})

const hasAdjustments = computed(() => {
  const { brightness, contrast, saturation, hue, blur, grayscale } = store.imageAdjustments
  return (
    brightness !== 100 ||
    contrast !== 100 ||
    saturation !== 100 ||
    hue !== 0 ||
    blur !== 0 ||
    grayscale !== 0
  )
})

function handleKeydown(e) {
  if (e.key === 'Escape') {
    emit('close')
  }
}

function startDrag(e) {
  isDragging.value = true
  updateSliderPosition(e)
}

function onDrag(e) {
  if (!isDragging.value) return
  updateSliderPosition(e)
}

function stopDrag() {
  isDragging.value = false
}

function updateSliderPosition(e) {
  if (!containerRef.value) return

  const rect = containerRef.value.getBoundingClientRect()
  const clientX = e.touches ? e.touches[0].clientX : e.clientX
  const x = clientX - rect.left
  const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100))
  sliderPosition.value = percentage
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
  document.addEventListener('touchmove', onDrag)
  document.addEventListener('touchend', stopDrag)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('touchmove', onDrag)
  document.removeEventListener('touchend', stopDrag)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="modal-overlay" @click.self="emit('close')">
        <div class="modal-content">
          <div class="modal-header">
            <h2 class="modal-title">{{ t('previewTitle') }}</h2>
            <button class="close-btn" @click="emit('close')" :title="t('closePreview')">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.75"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <div class="modal-body">
            <div
              ref="containerRef"
              class="comparison-container"
              @mousedown="startDrag"
              @touchstart="startDrag"
            >
              <!-- After image (with filters) - full width background -->
              <div class="image-wrapper after-image">
                <img
                  :src="store.currentImage"
                  :style="imageFilterStyle"
                  alt="After"
                  draggable="false"
                />
                <span class="image-label after-label">{{ t('after') }}</span>
              </div>

              <!-- Before image (original) - clipped -->
              <div
                class="image-wrapper before-image"
                :style="{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }"
              >
                <img :src="store.currentImage" alt="Before" draggable="false" />
                <span class="image-label before-label">{{ t('before') }}</span>
              </div>

              <!-- Slider handle -->
              <div class="slider-line" :style="{ left: `${sliderPosition}%` }">
                <div class="slider-handle">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.75"
                  >
                    <polyline points="15 18 9 12 15 6"></polyline>
                  </svg>
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.75"
                  >
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </div>
              </div>
            </div>

            <p v-if="!hasAdjustments" class="no-adjustments-hint">
              {{ t('before') }} = {{ t('after') }}
            </p>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Modal: a dim backdrop, a flat panel with the overlay shadow. */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--ds-z-backdrop);
  padding: var(--ds-space-5);
}

.modal-content {
  background: var(--ds-surface-1);
  border: var(--ds-border-width) solid var(--ds-border);
  border-radius: var(--ds-radius-lg);
  max-width: 90vw;
  max-height: 90vh;
  width: auto;
  display: flex;
  flex-direction: column;
  box-shadow: var(--ds-shadow-overlay);
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ds-space-2);
  padding: var(--ds-space-3) var(--ds-space-5);
  border-bottom: var(--ds-border-width) solid var(--ds-border);
}

.modal-title {
  font-size: var(--ds-text-lg);
  font-weight: var(--ds-weight-semibold);
  line-height: var(--ds-leading);
  color: var(--ds-text);
  margin: 0;
}

/* Ghost icon button, 36 px. */
.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--ds-control-md);
  height: var(--ds-control-md);
  padding: 0;
  background: transparent;
  border: var(--ds-border-width) solid transparent;
  border-radius: var(--ds-radius-md);
  color: var(--ds-text-2);
  cursor: pointer;
  transition: var(--app-transition-colors);
}

.close-btn svg {
  width: var(--ds-icon-md);
  height: var(--ds-icon-md);
}

.close-btn:hover {
  background: var(--ds-surface-2);
  color: var(--ds-text);
}

.close-btn:focus-visible {
  outline: none;
  box-shadow: var(--ds-focus-ring);
}

.modal-body {
  padding: var(--ds-space-5);
  overflow: auto;
}

.comparison-container {
  position: relative;
  cursor: ew-resize;
  user-select: none;
  border-radius: var(--ds-radius-md);
  overflow: hidden;
  background: var(--ds-surface-2);
}

.image-wrapper {
  position: relative;
}

.image-wrapper img {
  display: block;
  max-width: 80vw;
  max-height: 70vh;
  width: auto;
  height: auto;
  object-fit: contain;
}

.before-image {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.before-image img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

/* Labels sit on the photo, so they keep a fixed dark tint and white type. */
.image-label {
  position: absolute;
  bottom: var(--ds-space-3);
  padding: var(--ds-space-1) var(--ds-space-3);
  background: rgba(0, 0, 0, 0.7);
  color: #ffffff;
  font-size: var(--ds-text-xs);
  font-weight: var(--ds-weight-semibold);
  border-radius: var(--ds-radius-sm);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.before-label {
  left: var(--ds-space-3);
}

.after-label {
  right: var(--ds-space-3);
}

.slider-line {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 3px;
  background: #ffffff;
  transform: translateX(-50%);
}

.slider-handle {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: var(--ds-row-height);
  height: var(--ds-row-height);
  background: #ffffff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.35);
  color: var(--ds-on-accent);
}

.slider-handle svg {
  width: var(--ds-icon-sm);
  height: var(--ds-icon-sm);
}

.slider-handle svg:first-child {
  margin-right: -4px;
}

.slider-handle svg:last-child {
  margin-left: -4px;
}

.no-adjustments-hint {
  text-align: center;
  color: var(--ds-text-3);
  font-size: var(--ds-text-sm);
  line-height: var(--ds-leading);
  margin-top: var(--ds-space-3);
  margin-bottom: 0;
}

/* Transitions: fade, the panel rises 8 px. */
.modal-enter-active,
.modal-leave-active {
  transition: opacity var(--ds-duration-slow) var(--ds-ease);
}

.modal-enter-active .modal-content,
.modal-leave-active .modal-content {
  transition: transform var(--ds-duration-slow) var(--ds-ease);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-content,
.modal-leave-to .modal-content {
  transform: translateY(8px);
}

@media (max-width: 768px) {
  .modal-overlay {
    padding: var(--ds-space-2);
  }

  .modal-content {
    max-width: 100%;
  }

  .image-wrapper img {
    max-width: 95vw;
    max-height: 60vh;
  }

  .modal-header {
    padding: var(--ds-space-3) var(--ds-space-4);
  }

  .modal-body {
    padding: var(--ds-space-3);
  }

  .close-btn {
    width: var(--ds-row-height);
    height: var(--ds-row-height);
  }
}

@media (max-width: 480px) {
  .modal-overlay {
    padding: var(--ds-space-2);
  }

  .modal-header {
    padding: var(--ds-space-2) var(--ds-space-3);
  }

  .modal-body {
    padding: var(--ds-space-2);
  }

  .image-wrapper img {
    max-height: 50vh;
  }

  .image-label {
    padding: var(--ds-space-1) var(--ds-space-2);
  }
}
</style>
