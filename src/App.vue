<script setup>
import { ref, computed } from 'vue'
import { usePaletteStore } from './stores/palette'
import { useI18n } from './composables/useI18n'
import ColorList from './components/ColorList.vue'
import ImageUploader from './components/ImageUploader.vue'
import MainContent from './components/MainContent.vue'
import ImageEditPanel from './components/ImageEditPanel.vue'

const store = usePaletteStore()
const { t, locale, availableLocales } = useI18n()

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

function toggleLocale() {
  locale.value = locale.value === 'de' ? 'en' : 'de'
}
</script>

<template>
  <div class="app-container">
    <aside class="sidebar">
      <div class="sidebar-header">
        <h1 class="title">{{ t('title') }}</h1>
        <p class="subtitle">{{ t('subtitle') }}</p>
        <button class="locale-toggle" @click="toggleLocale">
          {{ locale.toUpperCase() }}
        </button>
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
            <option value="hex">HEX</option>
            <option value="rgb">RGB</option>
            <option value="rgba">RGBA</option>
            <option value="hsl">HSL</option>
            <option value="hsla">HSLA</option>
            <option value="css">CSS Variables</option>
          </select>
        </div>
      </div>

      <div class="palette-section">
        <h2 class="palette-title">{{ t('paletteTitle') }}</h2>
        <ColorList />
      </div>

      <div v-if="store.hasColors" class="download-buttons">
        <button class="btn btn-secondary" @click="store.downloadTxt">
          {{ t('downloadTxt') }}
        </button>
        <button class="btn btn-primary" @click="store.downloadPng">
          {{ t('downloadPng') }}
        </button>
      </div>
    </aside>

    <MainContent />
    <ImageEditPanel />
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  min-height: 100vh;
  background: #f8f9fa;
}

.sidebar {
  width: 320px;
  min-width: 320px;
  background: linear-gradient(180deg, #f8f9fa 0%, #e9ecef 100%);
  padding: 24px;
  display: flex;
  flex-direction: column;
  border-right: 1px solid rgba(0, 0, 0, 0.1);
  overflow-y: auto;
  max-height: 100vh;
}

.sidebar-header {
  position: relative;
  margin-bottom: 24px;
}

.title {
  font-size: 22px;
  font-weight: 700;
  color: #2d3748;
  margin: 0 0 6px 0;
}

.subtitle {
  font-size: 13px;
  color: #718096;
  margin: 0;
}

.locale-toggle {
  position: absolute;
  top: 0;
  right: 0;
  background: #e2e8f0;
  border: none;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  color: #4a5568;
}

.locale-toggle:hover {
  background: #cbd5e0;
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
  color: #4a5568;
}

.control-group select {
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  background: white;
  cursor: pointer;
}

.control-group select:focus {
  outline: none;
  border-color: #0F5CD4;
  box-shadow: 0 0 0 3px rgba(15, 92, 212, 0.1);
}

.palette-section {
  flex: 1;
  margin-top: 20px;
}

.palette-title {
  font-size: 16px;
  font-weight: 600;
  color: #2d3748;
  margin: 0 0 12px 0;
}

.download-buttons {
  display: flex;
  gap: 10px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e2e8f0;
}

.btn {
  flex: 1;
  padding: 12px 16px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #0F5CD4;
  color: white;
}

.btn-primary:hover {
  background: #0D4DB8;
}

.btn-secondary {
  background: #e2e8f0;
  color: #4a5568;
}

.btn-secondary:hover {
  background: #cbd5e0;
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
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  }
}
</style>
