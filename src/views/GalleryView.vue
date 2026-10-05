<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from '../composables/useI18n'
import { useToast } from '../composables/useToast'
import { usePaletteStore } from '../stores/palette'
import { useHandoffStore } from '../stores/handoff'
import HandoffReceiver from '../components/features/HandoffReceiver.vue'
import ToastContainer from '../components/ToastContainer.vue'

const router = useRouter()
const { t } = useI18n()
const toast = useToast()
const paletteStore = usePaletteStore()
const handoffStore = useHandoffStore()

const images = computed(() => handoffStore.images)
const hasImages = computed(() => handoffStore.images.length > 0)

function handleHandoffAccept(handoffImages) {
  handoffStore.setImages(handoffImages, '')
  toast.show(t('handoffAccepted'), 'success')
}

function handleHandoffDismiss() {
  handoffStore.clear()
}

function selectImage(img) {
  paletteStore.setImage(img.dataUrl)
  paletteStore.extractColors(img.dataUrl)
  router.push({ name: 'app' })
}
</script>

<template>
  <div class="gallery-page">
    <header class="gallery-header">
      <div class="header-left">
        <router-link to="/" class="back-link">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.75"
          >
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          <span>{{ t('navHome') }}</span>
        </router-link>
      </div>
      <div class="header-center">
        <h1 class="header-title">{{ t('galleryTitle') }}</h1>
      </div>
      <div class="header-right">
        <router-link to="/app" class="header-link">{{ t('navApp') }}</router-link>
      </div>
    </header>

    <HandoffReceiver @accept="handleHandoffAccept" @dismiss="handleHandoffDismiss" />

    <main class="gallery-content">
      <div v-if="hasImages" class="gallery-grid">
        <button
          v-for="(img, index) in images"
          :key="index"
          class="gallery-item"
          @click="selectImage(img)"
          :title="t('gallerySelectHint')"
        >
          <div class="gallery-thumb-wrapper">
            <img :src="img.dataUrl" :alt="img.name || `Image ${index + 1}`" class="gallery-thumb" />
          </div>
          <div class="gallery-item-info">
            <span class="gallery-item-name">{{ img.name || `Image ${index + 1}` }}</span>
            <span class="gallery-item-size">{{ img.width }} × {{ img.height }}</span>
          </div>
        </button>
      </div>

      <div v-else class="gallery-empty">
        <div class="empty-icon">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
          </svg>
        </div>
        <p class="empty-text">{{ t('galleryEmpty') }}</p>
        <p class="empty-hint">{{ t('galleryEmptyHint') }}</p>
        <router-link to="/app" class="empty-cta">{{ t('navApp') }}</router-link>
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

/* Header — same style as the app header */
.gallery-header {
  position: relative;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--ds-space-3) var(--ds-space-5);
  background: var(--ds-surface-1);
  border-bottom: var(--ds-border-width) solid var(--ds-border);
  transition: var(--app-transition-colors);
}

.header-left,
.header-right {
  display: flex;
  align-items: center;
  gap: var(--ds-space-3);
  min-width: 200px;
}

.header-right {
  justify-content: flex-end;
}

.back-link,
.header-link {
  display: inline-flex;
  align-items: center;
  gap: var(--ds-space-1);
  height: var(--ds-control-md);
  padding: 0 var(--ds-space-3);
  text-decoration: none;
  color: var(--ds-text-2);
  font-size: var(--ds-text-sm);
  font-weight: var(--ds-weight-medium);
  border-radius: var(--ds-radius-sm);
  transition: var(--app-transition-colors);
}

.back-link:hover,
.header-link:hover {
  color: var(--ds-text);
  background: var(--ds-surface-2);
}

.back-link:focus-visible,
.header-link:focus-visible {
  outline: none;
  box-shadow: var(--ds-focus-ring);
}

.header-center {
  flex: 1;
  text-align: center;
}

.header-title {
  font-size: var(--ds-text-lg);
  font-weight: var(--ds-weight-semibold);
  color: var(--ds-text);
}

/* Gallery content */
.gallery-content {
  flex: 1;
  padding: var(--ds-space-8);
  max-width: var(--ds-container);
  margin: 0 auto;
  width: 100%;
}

/* Thumbnail grid */
.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: var(--ds-space-5);
}

/* A card: flat, one border; hover strengthens the border, never lifts. */
.gallery-item {
  display: flex;
  flex-direction: column;
  background: var(--ds-surface-1);
  border: var(--ds-border-width) solid var(--ds-border);
  border-radius: var(--ds-radius-md);
  overflow: hidden;
  cursor: pointer;
  transition: var(--app-transition-colors);
  padding: 0;
  text-align: left;
}

.gallery-item:hover {
  border-color: var(--ds-border-strong);
}

.gallery-item:focus-visible {
  outline: none;
  box-shadow: var(--ds-focus-ring);
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

/* Empty state */
.gallery-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--ds-space-16) var(--ds-space-5);
  text-align: center;
}

.empty-icon {
  color: var(--ds-text-3);
  margin-bottom: var(--ds-space-4);
}

.empty-text {
  font-size: var(--ds-text-lg);
  font-weight: var(--ds-weight-semibold);
  color: var(--ds-text);
  margin: 0 0 var(--ds-space-1) 0;
}

.empty-hint {
  font-size: var(--ds-text-sm);
  color: var(--ds-text-2);
  margin: 0 0 var(--ds-space-6) 0;
}

.empty-cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: var(--ds-control-md);
  padding: 0 var(--ds-space-4);
  background: var(--ds-accent);
  color: var(--ds-on-accent);
  border: var(--ds-border-width) solid transparent;
  text-decoration: none;
  font-size: var(--ds-text-md);
  font-weight: var(--ds-weight-semibold);
  line-height: 1;
  border-radius: var(--ds-radius-md);
  transition: var(--app-transition-colors);
}

.empty-cta:hover {
  background: var(--ds-accent-hover);
}

.empty-cta:focus-visible {
  outline: none;
  box-shadow: var(--ds-focus-ring);
}

@media (max-width: 900px) {
  .gallery-content {
    padding: var(--ds-space-5) var(--ds-space-4);
  }

  .gallery-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: var(--ds-space-3);
  }

  .gallery-header {
    padding: var(--ds-space-2) var(--ds-space-3);
  }

  .header-left,
  .header-right {
    min-width: auto;
  }

  .back-link span {
    display: none;
  }

  .header-title {
    font-size: var(--ds-text-md);
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

  .gallery-empty {
    padding: var(--ds-space-10) var(--ds-space-4);
  }
}
</style>
