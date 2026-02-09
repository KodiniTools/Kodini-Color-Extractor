<script setup>
import { ref, computed } from 'vue'
import { usePaletteStore } from '../stores/palette'
import { useI18n } from '../composables/useI18n'
import { useKeyboard } from '../composables/useKeyboard'
import { useToast } from '../composables/useToast'
import ColorList from '../components/ColorList.vue'
import ImageUploader from '../components/ImageUploader.vue'
import MainContent from '../components/MainContent.vue'
import ImageEditPanel from '../components/ImageEditPanel.vue'
import ImagePreviewModal from '../components/ImagePreviewModal.vue'
import ToastContainer from '../components/ToastContainer.vue'

const store = usePaletteStore()
const { t } = useI18n()
const toast = useToast()

// Initialize keyboard shortcuts
useKeyboard()

// Preview modal state
const showPreviewModal = ref(false)

const count = computed({
  get: () => store.colorCount,
  set: (val) => {
    store.setColorCount(val)
    if (store.currentImage) store.extractColors(store.currentImage)
  }
})

const format = computed({
  get: () => store.downloadFormat,
  set: (val) => store.setDownloadFormat(val)
})

const imageFormat = computed({
  get: () => store.imageExportFormat,
  set: (val) => store.setImageExportFormat(val)
})

const imageSize = computed({
  get: () => store.imageExportSize,
  set: (val) => store.setImageExportSize(val)
})

async function handleCopy() {
  const success = await store.copyPalette()
  if (success) {
    toast.show(t('paletteCopied'), 'success')
  } else {
    toast.show(t('clipboardError'), 'error')
  }
}

function handleDownloadTxt() {
  store.downloadTxt()
  toast.show(t('downloadStarted'), 'success')
}

function handleDownloadImage() {
  store.downloadImage()
  toast.show(t('downloadStarted'), 'success')
}
</script>

<template>
  <div class="app-page">
    <!-- App Header Navigation -->
    <header class="app-header">
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
        <h1 class="header-title">{{ t('title') }}</h1>
      </div>
      <div class="header-right">
        <router-link to="/faq" class="header-link">{{ t('navFaq') }}</router-link>
      </div>
    </header>

    <div class="app-container">
      <aside class="sidebar">
        <div class="sidebar-header">
          <p class="subtitle">{{ t('subtitle') }}</p>
        </div>

        <ImageUploader />

        <div class="controls">
          <div class="control-group">
            <label>{{ t('colorCountLabel') }}</label>
            <select v-model.number="count">
              <option v-for="n in 20" :key="n" :value="n">{{ n }}</option>
            </select>
          </div>

          <div class="control-group">
            <label>{{ t('formatLabel') }}</label>
            <select v-model="format" class="format-select">
              <option value="hex">hex</option>
              <option value="rgb">rgb</option>
              <option value="rgba">rgba</option>
              <option value="hsl">hsl</option>
              <option value="hsla">hsla</option>
              <option value="css">css variables</option>
            </select>
          </div>
        </div>

        <div class="palette-section">
          <h2 class="palette-title">{{ t('paletteTitle') }}</h2>
          <ColorList />
        </div>

        <div v-if="store.hasColors" class="export-section">
          <div class="export-header">
            <h3 class="export-title">{{ t('exportTitle') }}</h3>
            <div class="export-format-selects">
              <select v-model="imageFormat" class="export-select" :title="t('imageFormatLabel')">
                <option value="png">PNG</option>
                <option value="jpeg">JPG</option>
                <option value="webp">WebP</option>
              </select>
              <select v-model="imageSize" class="export-select" :title="t('imageSizeLabel')">
                <option value="small">400px</option>
                <option value="medium">800px</option>
                <option value="large">1200px</option>
                <option value="xlarge">1600px</option>
              </select>
            </div>
          </div>

          <div class="export-buttons">
            <button class="export-btn" @click="handleCopy" :title="t('copyPalette')">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            </button>
            <button class="export-btn" @click="handleDownloadTxt" :title="t('downloadTxt')">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
            </button>
            <button class="export-btn export-btn-primary" @click="handleDownloadImage" :title="t('downloadImage')">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
            </button>
          </div>
        </div>

        <!-- Donate Section -->
        <div class="donate-section">
          <form action="https://www.paypal.com/donate" method="post" target="_blank" class="donate-form">
            <input type="hidden" name="hosted_button_id" value="8RGLGQ2BFMHU6" />
            <button type="submit" class="donate-btn" :title="t('donateTitle')">
              <svg class="paypal-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.77.77 0 0 1 .757-.64h6.406c2.612 0 4.52.64 5.67 1.903.482.53.832 1.132 1.04 1.79.218.693.27 1.506.153 2.418l-.013.082v.738l.575.326c.46.248.833.548 1.118.902.483.6.793 1.363.918 2.265.13.938.07 2.055-.178 3.32-.286 1.457-.758 2.724-1.4 3.762a6.41 6.41 0 0 1-2.073 2.085 7.99 7.99 0 0 1-2.6 1.06c-.926.208-1.96.312-3.07.312H11.1a.947.947 0 0 0-.935.796l-.048.3-.61 3.865-.038.188a.946.946 0 0 1-.935.796H7.076z"/>
              </svg>
              <span>{{ t('donate') }}</span>
            </button>
          </form>
        </div>
      </aside>

      <MainContent />
      <ImageEditPanel @open-preview="showPreviewModal = true" />
      <ImagePreviewModal :show="showPreviewModal" @close="showPreviewModal = false" />
      <ToastContainer />
    </div>
  </div>
</template>

<style scoped>
.app-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  transition: background 0.3s ease;
}

/* App Header */
.app-header {
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

/* App Container */
.app-container {
  display: flex;
  flex: 1;
}

.sidebar {
  width: 320px;
  min-width: 320px;
  background: var(--bg-sidebar);
  padding: 24px;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--border-light);
  overflow-y: auto;
  max-height: calc(100vh - 53px);
  transition: background 0.3s ease, border-color 0.3s ease;
}

.sidebar-header {
  margin-bottom: 24px;
}

.subtitle {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0;
  transition: color 0.3s ease;
}

.controls {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin: 20px 0;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.control-group label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  transition: color 0.3s ease;
}

.control-group select {
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 14px;
  background: var(--bg-input);
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.control-group select:focus {
  outline: none;
  border-color: var(--selection-color);
  box-shadow: 0 0 0 3px var(--selection-glow);
}

.control-group select:hover {
  border-color: var(--border-hover);
}

.palette-section {
  flex: 1;
  margin-top: 20px;
}

.palette-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 12px 0;
  transition: color 0.3s ease;
}

.export-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid var(--border-light);
  transition: border-color 0.3s ease;
}

.export-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.export-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  transition: color 0.3s ease;
}

.export-format-selects {
  display: flex;
  gap: 6px;
}

.export-select {
  padding: 6px 8px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 11px;
  background: var(--bg-input);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.export-select:hover {
  border-color: var(--border-hover);
}

.export-select:focus {
  outline: none;
  border-color: var(--selection-color);
}

.export-buttons {
  display: flex;
  gap: 8px;
}

.export-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-input);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.export-btn:hover {
  background: var(--bg-hover);
  border-color: var(--border-hover);
  color: var(--text-primary);
}

.export-btn-primary {
  background: var(--btn-primary-bg);
  border-color: var(--btn-primary-bg);
  color: var(--btn-primary-text);
}

.export-btn-primary:hover {
  background: var(--btn-primary-hover);
  border-color: var(--btn-primary-hover);
}

/* Donate Section */
.donate-section {
  margin-top: auto;
  padding-top: 20px;
  border-top: 1px solid var(--border-light);
  transition: border-color 0.3s ease;
}

.donate-form {
  display: flex;
}

.donate-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 10px 16px;
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.donate-btn:hover {
  background: var(--bg-hover);
  border-color: #0070ba;
  color: #0070ba;
}

.donate-btn:hover .paypal-icon {
  color: #0070ba;
}

.paypal-icon {
  transition: color 0.2s ease;
}

@media (max-width: 1200px) {
  .app-container {
    flex-wrap: wrap;
  }
}

@media (max-width: 900px) {
  .app-container {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    min-width: 100%;
    max-height: none;
    border-right: none;
    border-bottom: 1px solid var(--border-light);
  }

  .app-header {
    padding: 10px 12px;
  }

  .header-left,
  .header-right {
    min-width: auto;
    gap: 8px;
  }

  .back-link span {
    display: none;
  }

  .header-title {
    font-size: 14px;
  }

  .header-link {
    display: none;
  }
}
</style>
