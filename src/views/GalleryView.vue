<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from '../composables/useI18n'
import { useToast } from '../composables/useToast'
import { usePaletteStore } from '../stores/palette'
import { useHandoffStore, type HandoffImage } from '../stores/handoff'
import LandingNav from '../components/LandingNav.vue'
import HandoffReceiver from '../components/features/HandoffReceiver.vue'
import GalleryUploader from '../components/features/GalleryUploader.vue'
import ToastContainer from '../components/ToastContainer.vue'

const router = useRouter()
const { t } = useI18n()
const toast = useToast()
const paletteStore = usePaletteStore()
const handoffStore = useHandoffStore()

const images = computed(() => handoffStore.images)
const hasImages = computed(() => handoffStore.images.length > 0)

function countMessage(count: number, oneKey: string, manyKey: string) {
  return count === 1 ? t(oneKey) : t(manyKey, { count })
}

function handleHandoffAccept(handoffImages: HandoffImage[]) {
  handoffStore.addImages(handoffImages)
  toast.show(countMessage(handoffImages.length, 'handoffAcceptedOne', 'handoffAccepted'), 'success')
}

function handleUpload(uploaded: HandoffImage[], skipped: number) {
  if (uploaded.length) {
    handoffStore.addImages(uploaded)
    toast.show(countMessage(uploaded.length, 'galleryAddedOne', 'galleryAdded'), 'success')
  }
  if (skipped) {
    toast.show(countMessage(skipped, 'gallerySkippedOne', 'gallerySkipped'), 'error')
  }
}

function selectImage(img: HandoffImage) {
  paletteStore.setImage(img.dataUrl)
  paletteStore.extractColors(img.dataUrl)
  router.push({ name: 'app' })
}

function imageLabel(img: HandoffImage, index: number) {
  return img.name || `${t('galleryImage')} ${index + 1}`
}
</script>

<template>
  <div class="gallery-page">
    <LandingNav />

    <!-- Verwerfen lässt die Galerie unverändert, es verfällt nur die Übergabe. -->
    <HandoffReceiver @accept="handleHandoffAccept" />

    <main class="gallery-content">
      <div class="gallery-toolbar">
        <div class="toolbar-text">
          <h1 class="gallery-title">{{ t('galleryTitle') }}</h1>
          <p class="gallery-intro">{{ t('galleryIntro') }}</p>
        </div>
        <button v-if="hasImages" class="clear-btn" @click="handoffStore.clear()">
          {{ t('galleryClear') }}
        </button>
      </div>

      <GalleryUploader @add="handleUpload" />

      <div v-if="hasImages" class="gallery-grid">
        <div v-for="(img, index) in images" :key="index" class="gallery-item">
          <button class="gallery-select" :title="t('gallerySelectHint')" @click="selectImage(img)">
            <div class="gallery-thumb-wrapper">
              <img :src="img.dataUrl" :alt="imageLabel(img, index)" class="gallery-thumb" />
            </div>
            <div class="gallery-item-info">
              <span class="gallery-item-name">{{ imageLabel(img, index) }}</span>
              <span class="gallery-item-size">{{ img.width }} × {{ img.height }}</span>
            </div>
          </button>
          <button
            class="gallery-remove"
            :title="t('galleryRemove')"
            :aria-label="`${t('galleryRemove')}: ${imageLabel(img, index)}`"
            @click="handoffStore.removeImage(index)"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>

      <div v-else class="gallery-empty">
        <p class="empty-text">{{ t('galleryEmpty') }}</p>
        <p class="empty-hint">{{ t('galleryEmptyHint') }}</p>
      </div>
    </main>

    <ToastContainer />
  </div>
</template>

<style scoped>
.gallery-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--ds-surface-0);
  transition: var(--app-transition-colors);
}

.gallery-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-5);
  padding: var(--ds-space-8);
  max-width: var(--ds-container);
  margin: 0 auto;
  width: 100%;
}

.gallery-toolbar {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--ds-space-4);
  flex-wrap: wrap;
}

.gallery-title {
  font-size: var(--ds-text-lg);
  font-weight: var(--ds-weight-semibold);
  color: var(--ds-text);
  margin: 0 0 var(--ds-space-1) 0;
}

.gallery-intro {
  font-size: var(--ds-text-sm);
  color: var(--ds-text-2);
  margin: 0;
}

.clear-btn {
  display: inline-flex;
  align-items: center;
  height: var(--ds-control-md);
  padding: 0 var(--ds-space-4);
  background: var(--ds-surface-2);
  border: var(--ds-border-width) solid var(--ds-border-strong);
  border-radius: var(--ds-radius-md);
  color: var(--ds-text);
  font-size: var(--ds-text-sm);
  font-weight: var(--ds-weight-medium);
  cursor: pointer;
  transition: var(--app-transition-colors);
}

.clear-btn:hover {
  background: var(--ds-surface-3);
}

.clear-btn:focus-visible {
  outline: none;
  box-shadow: var(--ds-focus-ring);
}

/* Thumbnail grid */
.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: var(--ds-space-5);
}

/* A card: flat, one border; hover strengthens the border, never lifts. */
.gallery-item {
  position: relative;
  background: var(--ds-surface-1);
  border: var(--ds-border-width) solid var(--ds-border);
  border-radius: var(--ds-radius-md);
  overflow: hidden;
  transition: var(--app-transition-colors);
}

.gallery-item:hover {
  border-color: var(--ds-border-strong);
}

.gallery-select {
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 0;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
}

.gallery-select:focus-visible,
.gallery-remove:focus-visible {
  outline: none;
  box-shadow: var(--ds-focus-ring);
}

.gallery-remove {
  position: absolute;
  top: var(--ds-space-2);
  right: var(--ds-space-2);
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--ds-control-sm);
  height: var(--ds-control-sm);
  background: var(--ds-surface-1);
  border: var(--ds-border-width) solid var(--ds-border-strong);
  border-radius: var(--ds-radius-sm);
  color: var(--ds-text);
  cursor: pointer;
  transition: var(--app-transition-colors);
}

.gallery-remove:hover {
  background: var(--ds-surface-3);
}

.gallery-thumb-wrapper {
  width: 100%;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  background: var(--ds-surface-2);
}

.gallery-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.gallery-item-info {
  padding: var(--ds-space-3) var(--ds-space-4);
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.gallery-item-name {
  font-size: var(--ds-text-sm);
  font-weight: var(--ds-weight-semibold);
  color: var(--ds-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.gallery-item-size {
  font-size: var(--ds-text-xs);
  color: var(--ds-text-2);
}

/* Empty state below the upload zone */
.gallery-empty {
  padding: var(--ds-space-8) var(--ds-space-5);
  text-align: center;
}

.empty-text {
  font-size: var(--ds-text-md);
  font-weight: var(--ds-weight-semibold);
  color: var(--ds-text);
  margin: 0 0 var(--ds-space-1) 0;
}

.empty-hint {
  font-size: var(--ds-text-sm);
  color: var(--ds-text-2);
  margin: 0;
}

@media (max-width: 900px) {
  .gallery-content {
    padding: var(--ds-space-5) var(--ds-space-4);
  }

  .gallery-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: var(--ds-space-3);
  }
}

@media (max-width: 480px) {
  .gallery-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--ds-space-2);
  }

  .gallery-content {
    padding: var(--ds-space-4) var(--ds-space-3);
  }

  .gallery-item-info {
    padding: var(--ds-space-2) var(--ds-space-3);
  }
}
</style>
