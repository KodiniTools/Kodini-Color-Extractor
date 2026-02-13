<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { usePaletteStore } from '../stores/palette'
import { useI18n } from '../composables/useI18n'

const props = defineProps({
  show: Boolean
})

const emit = defineEmits(['close'])

const store = usePaletteStore()
const { t } = useI18n()

const sliderPosition = ref(50)
const isDragging = ref(false)
const containerRef = ref(null)

const imageFilterStyle = computed(() => {
  const { brightness, contrast, saturation, hue } = store.imageAdjustments
  return {
    filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) hue-rotate(${hue}deg)`
  }
})

const hasAdjustments = computed(() => {
  const { brightness, contrast, saturation, hue } = store.imageAdjustments
  return brightness !== 100 || contrast !== 100 || saturation !== 100 || hue !== 0
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
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
                <img
                  :src="store.currentImage"
                  alt="Before"
                  draggable="false"
                />
                <span class="image-label before-label">{{ t('before') }}</span>
              </div>

              <!-- Slider handle -->
              <div
                class="slider-line"
                :style="{ left: `${sliderPosition}%` }"
              >
                <div class="slider-handle">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="15 18 9 12 15 6"></polyline>
                  </svg>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: var(--bg-sidebar);
  border-radius: 16px;
  max-width: 90vw;
  max-height: 90vh;
  width: auto;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-light);
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.close-btn {
  background: var(--btn-secondary-bg);
  border: none;
  border-radius: 8px;
  padding: 8px;
  cursor: pointer;
  color: var(--btn-secondary-text);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: var(--btn-secondary-hover);
  color: var(--btn-primary-text);
}

.modal-body {
  padding: 20px;
  overflow: auto;
}

.comparison-container {
  position: relative;
  cursor: ew-resize;
  user-select: none;
  border-radius: 8px;
  overflow: hidden;
  background: var(--bg-primary);
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

.image-label {
  position: absolute;
  bottom: 12px;
  padding: 6px 12px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  font-size: 12px;
  font-weight: 600;
  border-radius: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.before-label {
  left: 12px;
}

.after-label {
  right: 12px;
}

.slider-line {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 3px;
  background: white;
  transform: translateX(-50%);
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
}

.slider-handle {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 44px;
  height: 44px;
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  color: #333;
}

.slider-handle svg {
  width: 16px;
  height: 16px;
}

.slider-handle svg:first-child {
  margin-right: -4px;
}

.slider-handle svg:last-child {
  margin-left: -4px;
}

.no-adjustments-hint {
  text-align: center;
  color: var(--text-tertiary);
  font-size: 13px;
  margin-top: 12px;
  margin-bottom: 0;
}

/* Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.25s ease;
}

.modal-enter-active .modal-content,
.modal-leave-active .modal-content {
  transition: transform 0.25s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-content,
.modal-leave-to .modal-content {
  transform: scale(0.95);
}

@media (max-width: 768px) {
  .modal-overlay {
    padding: 10px;
  }

  .modal-content {
    max-width: 100%;
  }

  .image-wrapper img {
    max-width: 95vw;
    max-height: 60vh;
  }

  .modal-header {
    padding: 12px 16px;
  }

  .modal-body {
    padding: 12px;
  }

  .close-btn {
    padding: 10px;
    min-height: 44px;
    min-width: 44px;
  }

  .slider-handle {
    width: 44px;
    height: 44px;
  }

  .slider-handle svg {
    width: 14px;
    height: 14px;
  }
}

@media (max-width: 480px) {
  .modal-overlay {
    padding: 8px;
  }

  .modal-header {
    padding: 10px 12px;
  }

  .modal-title {
    font-size: 16px;
  }

  .modal-body {
    padding: 8px;
  }

  .image-wrapper img {
    max-height: 50vh;
  }

  .image-label {
    font-size: 11px;
    padding: 4px 8px;
  }
}
</style>
