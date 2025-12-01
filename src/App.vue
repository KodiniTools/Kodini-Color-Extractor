<script setup>
import { ref, computed } from 'vue'
import { usePaletteStore } from './stores/palette'
import { useI18n } from './composables/useI18n'
import { useTheme } from './composables/useTheme'
import { useKeyboard } from './composables/useKeyboard'
import { useToast } from './composables/useToast'
import ColorList from './components/ColorList.vue'
import ImageUploader from './components/ImageUploader.vue'
import MainContent from './components/MainContent.vue'
import ImageEditPanel from './components/ImageEditPanel.vue'
import ToastContainer from './components/ToastContainer.vue'

const store = usePaletteStore()
const { t, locale, availableLocales } = useI18n()
const { theme, toggleTheme } = useTheme()
const toast = useToast()

// Initialize keyboard shortcuts
useKeyboard()

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

function toggleLocale() {
  locale.value = locale.value === 'de' ? 'en' : 'de'
}
</script>

<template>
  <div class="app-container">
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="header-controls">
          <button class="theme-toggle" @click="toggleTheme" :title="theme === 'dark' ? 'light mode' : 'dark mode'">
            <svg v-if="theme === 'dark'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="5"></circle>
              <line x1="12" y1="1" x2="12" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="23"></line>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
              <line x1="1" y1="12" x2="3" y2="12"></line>
              <line x1="21" y1="12" x2="23" y2="12"></line>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
            <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
          </button>
          <button class="locale-toggle" @click="toggleLocale">
            {{ locale }}
          </button>
        </div>
        <h1 class="title">{{ t('title') }}</h1>
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

      <div v-if="store.hasColors" class="download-section">
        <h3 class="download-title">{{ t('downloadTitle') }}</h3>

        <div class="export-options">
          <div class="control-group">
            <label>{{ t('imageFormatLabel') }}</label>
            <select v-model="imageFormat">
              <option value="png">png</option>
              <option value="jpeg">jpeg</option>
              <option value="webp">webp</option>
            </select>
          </div>

          <div class="control-group">
            <label>{{ t('imageSizeLabel') }}</label>
            <select v-model="imageSize">
              <option value="small">{{ t('sizeSmall') }}</option>
              <option value="medium">{{ t('sizeMedium') }}</option>
              <option value="large">{{ t('sizeLarge') }}</option>
              <option value="xlarge">{{ t('sizeXLarge') }}</option>
            </select>
          </div>
        </div>

        <div class="download-buttons">
          <button class="btn btn-secondary" @click="store.downloadTxt">
            {{ t('downloadTxt') }}
          </button>
          <button class="btn btn-primary" @click="store.downloadImage">
            {{ t('downloadImage') }}
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
    <ImageEditPanel />
    <ToastContainer />
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  min-height: 100vh;
  background: var(--bg-primary);
  transition: background 0.3s ease;
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
  max-height: 100vh;
  transition: background 0.3s ease, border-color 0.3s ease;
}

.sidebar-header {
  margin-bottom: 24px;
}

.header-controls {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
  margin-bottom: 12px;
}

.title {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 6px 0;
  transition: color 0.3s ease;
}

.subtitle {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0;
  transition: color 0.3s ease;
}

.theme-toggle {
  background: var(--btn-secondary-bg);
  border: none;
  border-radius: 4px;
  padding: 6px;
  cursor: pointer;
  color: var(--btn-secondary-text);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.theme-toggle:hover {
  background: var(--btn-secondary-hover);
  color: var(--btn-primary-text);
}

.locale-toggle {
  background: var(--btn-secondary-bg);
  border: none;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  color: var(--btn-secondary-text);
  transition: all 0.2s ease;
}

.locale-toggle:hover {
  background: var(--btn-secondary-hover);
  color: var(--btn-primary-text);
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

.download-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid var(--border-light);
  transition: border-color 0.3s ease;
}

.download-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 12px 0;
  transition: color 0.3s ease;
}

.export-options {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.export-options .control-group {
  flex: 1;
}

.export-options .control-group select {
  width: 100%;
  padding: 8px 10px;
  font-size: 13px;
}

.download-buttons {
  display: flex;
  gap: 10px;
}

.btn {
  flex: 1;
  padding: 12px 16px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background: var(--btn-primary-bg);
  color: var(--btn-primary-text);
}

.btn-primary:hover {
  background: var(--btn-primary-hover);
}

.btn-secondary {
  background: var(--btn-secondary-bg);
  color: var(--btn-secondary-text);
}

.btn-secondary:hover {
  background: var(--btn-secondary-hover);
  color: var(--btn-primary-text);
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
}
</style>
