<script setup>
import { ref, reactive } from 'vue'
import { usePaletteStore } from '../stores/palette'
import { useI18n } from '../composables/useI18n'

const store = usePaletteStore()
const { t } = useI18n()

// Sample images configuration - paths to be replaced with actual images
const sampleImages = ref([
  { id: 1, src: '/samples/sample-1.jpg', alt: 'Sample 1' },
  { id: 2, src: '/samples/sample-2.jpg', alt: 'Sample 2' },
  { id: 3, src: '/samples/sample-3.jpg', alt: 'Sample 3' },
  { id: 4, src: '/samples/sample-4.jpg', alt: 'Sample 4' },
  { id: 5, src: '/samples/sample-5.jpg', alt: 'Sample 5' },
  { id: 6, src: '/samples/sample-6.jpg', alt: 'Sample 6' },
  { id: 7, src: '/samples/sample-7.jpg', alt: 'Sample 7' },
  { id: 8, src: '/samples/sample-8.jpg', alt: 'Sample 8' }
])

const selectedSampleId = ref(null)
const loadedImages = reactive({})

function onImageLoad(id) {
  loadedImages[id] = true
}

function onImageError(id) {
  loadedImages[id] = false
}

async function loadSampleImage(sample) {
  // Only load if image is available
  if (loadedImages[sample.id] !== true) return

  selectedSampleId.value = sample.id

  // Reset image adjustments when loading a new sample
  store.resetImageAdjustments()

  // Set the image and extract colors
  store.setImage(sample.src)
  await store.extractColors(sample.src)
}
</script>

<template>
  <div class="sample-images-container">
    <p class="sample-label">{{ t('sampleImagesLabel') }}</p>
    <div class="sample-images">
      <button
        v-for="sample in sampleImages"
        :key="sample.id"
        class="sample-thumbnail"
        :class="{
          selected: selectedSampleId === sample.id,
          loaded: loadedImages[sample.id] === true,
          'not-available': loadedImages[sample.id] === false
        }"
        @click="loadSampleImage(sample)"
        :title="loadedImages[sample.id] === true ? t('sampleImageHint') : ''"
      >
        <img
          :src="sample.src"
          :alt="sample.alt"
          loading="lazy"
          @load="onImageLoad(sample.id)"
          @error="onImageError(sample.id)"
        />
        <div class="placeholder-overlay">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
        </div>
      </button>
    </div>
  </div>
</template>

<style scoped>
.sample-images-container {
  width: 100%;
  max-width: 800px;
  margin-bottom: 16px;
}

.sample-label {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0 0 8px 0;
  transition: color 0.3s ease;
}

.sample-images {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 8px;
}

.sample-thumbnail {
  position: relative;
  aspect-ratio: 1;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
  background: var(--bg-primary);
  padding: 0;
  transition: all 0.2s ease;
}

.sample-thumbnail.selected {
  border-color: var(--selection-color);
  box-shadow: 0 0 0 3px var(--selection-glow);
}

.sample-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.placeholder-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  color: var(--text-tertiary);
  transition: opacity 0.2s ease;
}

/* Hide placeholder when image is loaded */
.sample-thumbnail.loaded .placeholder-overlay {
  opacity: 0;
}

/* Cursor and hover styles for loaded images */
.sample-thumbnail.loaded {
  cursor: pointer;
}

.sample-thumbnail.loaded:hover {
  border-color: var(--selection-color);
  transform: scale(1.05);
}

/* Styles for unavailable images */
.sample-thumbnail.not-available {
  cursor: default;
  opacity: 0.5;
}

.sample-thumbnail.not-available:hover {
  transform: none;
  border-color: var(--border-color);
}

.sample-thumbnail:not(.loaded):not(.not-available) {
  cursor: wait;
}

.sample-thumbnail:hover:not(.not-available) .placeholder-overlay {
  background: var(--bg-hover);
}

/* Responsive: 6 columns on smaller screens */
@media (max-width: 900px) {
  .sample-images {
    grid-template-columns: repeat(6, 1fr);
  }

  /* Hide last 2 thumbnails on smaller screens */
  .sample-thumbnail:nth-child(n+7) {
    display: none;
  }
}

@media (max-width: 600px) {
  .sample-images {
    grid-template-columns: repeat(4, 1fr);
    gap: 6px;
  }

  /* Show only 4 thumbnails on mobile */
  .sample-thumbnail:nth-child(n+5) {
    display: none;
  }
}
</style>
