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
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
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
  background: var(--bg-primary);
  transition: background 0.3s ease;
}

/* Header — same style as AppPage */
.gallery-header {
  position: relative;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-light);
  transition: all 0.3s ease;
}

.header-left,
.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 200px;
}

.header-right {
  justify-content: flex-end;
}

.back-link {
  display: flex;
  align-items: center;
  gap: 6px;
  text-decoration: none;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  padding: 6px 10px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.back-link:hover {
  color: var(--text-primary);
  background: var(--bg-hover);
}

.header-center {
  flex: 1;
  text-align: center;
}

.header-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  transition: color 0.3s ease;
}

.header-link {
  text-decoration: none;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  padding: 6px 10px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.header-link:hover {
  color: var(--text-primary);
  background: var(--bg-hover);
}

/* Gallery content */
.gallery-content {
  flex: 1;
  padding: 32px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

/* Thumbnail grid */
.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px;
}

.gallery-item {
  display: flex;
  flex-direction: column;
  background: var(--bg-sidebar, #f8f9fa);
  border: 1px solid var(--border-light, #e5e7eb);
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0;
  text-align: left;
}

.gallery-item:hover {
  border-color: var(--selection-color, #014f99);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.gallery-thumb-wrapper {
  width: 100%;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  background: var(--bg-input, #f3f4f6);
}

.gallery-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.gallery-item-info {
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.gallery-item-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary, #003971);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.gallery-item-size {
  font-size: 11px;
  color: var(--text-secondary, #6b7280);
}

/* Empty state */
.gallery-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
}

.empty-icon {
  color: var(--text-secondary, #6b7280);
  opacity: 0.4;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary, #003971);
  margin: 0 0 4px 0;
}

.empty-hint {
  font-size: 13px;
  color: var(--text-secondary, #6b7280);
  margin: 0 0 24px 0;
}

.empty-cta {
  display: inline-flex;
  padding: 10px 24px;
  background: var(--btn-primary-bg, #014f99);
  color: var(--btn-primary-text, #ffffff);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  border-radius: 8px;
  transition: background 0.2s ease;
}

.empty-cta:hover {
  background: var(--btn-primary-hover, #013d77);
}

@media (max-width: 900px) {
  .gallery-content {
    padding: 20px 16px;
  }

  .gallery-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 12px;
  }

  .gallery-header {
    padding: 10px 12px;
  }

  .header-left,
  .header-right {
    min-width: auto;
  }

  .back-link span {
    display: none;
  }

  .header-title {
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .gallery-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }

  .gallery-content {
    padding: 16px 12px;
  }

  .gallery-item-info {
    padding: 8px 10px;
  }

  .gallery-empty {
    padding: 40px 16px;
  }
}
</style>
