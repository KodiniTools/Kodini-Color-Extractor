<script setup>
import { computed } from 'vue'
import { usePaletteStore } from '../stores/palette'
import { useI18n } from '../composables/useI18n'

const store = usePaletteStore()
const { t } = useI18n()

const emit = defineEmits(['open-preview'])

const zoom = computed({
  get: () => store.imageAdjustments.zoom,
  set: (val) => store.setImageAdjustment('zoom', val)
})

const brightness = computed({
  get: () => store.imageAdjustments.brightness,
  set: (val) => store.setImageAdjustment('brightness', val)
})

const contrast = computed({
  get: () => store.imageAdjustments.contrast,
  set: (val) => store.setImageAdjustment('contrast', val)
})

const saturation = computed({
  get: () => store.imageAdjustments.saturation,
  set: (val) => store.setImageAdjustment('saturation', val)
})

const hue = computed({
  get: () => store.imageAdjustments.hue,
  set: (val) => store.setImageAdjustment('hue', val)
})

const defaults = { zoom: 100, brightness: 100, contrast: 100, saturation: 100, hue: 0 }

const isModified = computed(() => ({
  zoom: zoom.value !== defaults.zoom,
  brightness: brightness.value !== defaults.brightness,
  contrast: contrast.value !== defaults.contrast,
  saturation: saturation.value !== defaults.saturation,
  hue: hue.value !== defaults.hue
}))

function resetAll() {
  store.resetImageAdjustments()
}

function resetSlider(prop) {
  store.setImageAdjustment(prop, defaults[prop])
}
</script>

<template>
  <aside class="edit-panel" v-if="store.currentImage">
    <div class="panel-header">
      <h2 class="panel-title">{{ t('editPanelTitle') }}</h2>
      <div class="header-buttons">
        <button class="preview-btn" @click="emit('open-preview')" :title="t('preview')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </button>
        <button class="reset-all-btn" @click="resetAll" :title="t('resetAll')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
            <path d="M3 3v5h5"/>
          </svg>
        </button>
      </div>
    </div>

    <div class="slider-group">
      <div class="slider-header">
        <label>{{ t('zoom') }}</label>
        <div class="slider-value-group">
          <span class="slider-value">{{ zoom }}%</span>
          <button class="reset-btn" :class="{ active: isModified.zoom }" @click="resetSlider('zoom')" :title="t('reset')">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
            </svg>
          </button>
        </div>
      </div>
      <input
        type="range"
        v-model.number="zoom"
        min="25"
        max="400"
        step="5"
        class="slider"
      >
    </div>

    <div class="slider-group">
      <div class="slider-header">
        <label>{{ t('brightness') }}</label>
        <div class="slider-value-group">
          <span class="slider-value">{{ brightness }}%</span>
          <button class="reset-btn" :class="{ active: isModified.brightness }" @click="resetSlider('brightness')" :title="t('reset')">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
            </svg>
          </button>
        </div>
      </div>
      <input
        type="range"
        v-model.number="brightness"
        min="0"
        max="200"
        step="1"
        class="slider"
      >
    </div>

    <div class="slider-group">
      <div class="slider-header">
        <label>{{ t('contrast') }}</label>
        <div class="slider-value-group">
          <span class="slider-value">{{ contrast }}%</span>
          <button class="reset-btn" :class="{ active: isModified.contrast }" @click="resetSlider('contrast')" :title="t('reset')">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
            </svg>
          </button>
        </div>
      </div>
      <input
        type="range"
        v-model.number="contrast"
        min="0"
        max="200"
        step="1"
        class="slider"
      >
    </div>

    <div class="slider-group">
      <div class="slider-header">
        <label>{{ t('saturation') }}</label>
        <div class="slider-value-group">
          <span class="slider-value">{{ saturation }}%</span>
          <button class="reset-btn" :class="{ active: isModified.saturation }" @click="resetSlider('saturation')" :title="t('reset')">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
            </svg>
          </button>
        </div>
      </div>
      <input
        type="range"
        v-model.number="saturation"
        min="0"
        max="200"
        step="1"
        class="slider"
      >
    </div>

    <div class="slider-group">
      <div class="slider-header">
        <label>{{ t('hue') }}</label>
        <div class="slider-value-group">
          <span class="slider-value">{{ hue }}°</span>
          <button class="reset-btn" :class="{ active: isModified.hue }" @click="resetSlider('hue')" :title="t('reset')">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
            </svg>
          </button>
        </div>
      </div>
      <input
        type="range"
        v-model.number="hue"
        min="-180"
        max="180"
        step="1"
        class="slider slider-hue"
      >
    </div>
  </aside>
</template>

<style scoped>
.edit-panel {
  width: 280px;
  min-width: 280px;
  background: var(--bg-sidebar);
  padding: 24px;
  display: flex;
  flex-direction: column;
  border-left: 1px solid var(--border-light);
  overflow-y: auto;
  max-height: 100vh;
  transition: background 0.3s ease, border-color 0.3s ease;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.header-buttons {
  display: flex;
  gap: 6px;
}

.preview-btn {
  background: var(--btn-secondary-bg);
  border: none;
  border-radius: 6px;
  padding: 6px 8px;
  cursor: pointer;
  color: var(--btn-secondary-text);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.preview-btn:hover {
  background: var(--accent-bg);
  color: var(--btn-primary-text);
}

.panel-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  transition: color 0.3s ease;
}

.reset-all-btn {
  background: var(--btn-secondary-bg);
  border: none;
  border-radius: 6px;
  padding: 6px 8px;
  cursor: pointer;
  color: var(--btn-secondary-text);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.reset-all-btn:hover {
  background: var(--btn-secondary-hover);
  color: var(--btn-primary-text);
}

.slider-group {
  margin-bottom: 20px;
}

.slider-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.slider-header label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  transition: color 0.3s ease;
}

.slider-value-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.slider-value {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
  min-width: 45px;
  text-align: right;
  transition: color 0.3s ease;
}

.reset-btn {
  background: transparent;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: var(--text-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.reset-btn:hover {
  background: var(--btn-secondary-bg);
  color: var(--text-primary);
}

.reset-btn.active {
  color: #4ade80;
}

.reset-btn.active:hover {
  background: rgba(74, 222, 128, 0.15);
  color: #4ade80;
}

.slider {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: var(--border-color);
  outline: none;
  -webkit-appearance: none;
  appearance: none;
  transition: background 0.3s ease;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--accent-bg);
  cursor: pointer;
  border: 3px solid white;
  box-shadow: 0 2px 6px var(--shadow-medium);
  transition: transform 0.15s ease;
}

.slider::-webkit-slider-thumb:hover {
  transform: scale(1.1);
}

.slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--accent-bg);
  cursor: pointer;
  border: 3px solid white;
  box-shadow: 0 2px 6px var(--shadow-medium);
}

.slider-hue {
  background: linear-gradient(
    to right,
    hsl(0, 100%, 50%),
    hsl(60, 100%, 50%),
    hsl(120, 100%, 50%),
    hsl(180, 100%, 50%),
    hsl(240, 100%, 50%),
    hsl(300, 100%, 50%),
    hsl(360, 100%, 50%)
  );
}

@media (max-width: 1200px) {
  .edit-panel {
    width: 100%;
    min-width: 100%;
    max-height: none;
    border-left: none;
    border-top: 1px solid var(--border-light);
  }
}
</style>
