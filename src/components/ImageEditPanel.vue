<script setup>
import { usePaletteStore } from '../stores/palette'
import { useI18n } from '../composables/useI18n'
import NumberSpinner from './ui/NumberSpinner.vue'
import PanelSection from './ui/PanelSection.vue'

// Range, step and unit per slider — shared by the range input and the number
// spinner so the two can never disagree about what a value may be.
const RANGES = {
  zoom: { min: 25, max: 400, step: 5, unit: '%' },
  brightness: { min: 0, max: 200, step: 1, unit: '%' },
  contrast: { min: 0, max: 200, step: 1, unit: '%' },
  saturation: { min: 0, max: 200, step: 1, unit: '%' },
  hue: { min: -180, max: 180, step: 1, unit: '°' },
  blur: { min: 0, max: 8, step: 0.5, unit: 'px' },
  grayscale: { min: 0, max: 100, step: 1, unit: '%' },
}

/** Only the attributes a range input understands (no `unit`). */
function sliderAttrs(key) {
  const { min, max, step } = RANGES[key]
  return { min, max, step }
}

const store = usePaletteStore()
const { t } = useI18n()

const emit = defineEmits(['open-preview'])

// Neutral value per slider — what its reset button returns to.
const DEFAULTS = {
  zoom: 100,
  brightness: 100,
  contrast: 100,
  saturation: 100,
  hue: 0,
  blur: 0,
  grayscale: 0,
}

// Panel layout: which sliders go into which section, in display order.
const SECTIONS = [
  { titleKey: 'adjustmentsTitle', keys: ['zoom', 'brightness', 'contrast', 'saturation', 'hue'] },
  { titleKey: 'effectsTitle', keys: ['blur', 'grayscale'] },
]

function value(key) {
  return store.imageAdjustments[key]
}

function setValue(key, val) {
  store.setImageAdjustment(key, val)
}

function isModified(key) {
  return value(key) !== DEFAULTS[key]
}

function resetAll() {
  store.resetImageAdjustments()
}

function clearImage() {
  store.clearImage()
}
</script>

<template>
  <aside class="edit-panel" v-if="store.currentImage">
    <div class="panel-header">
      <h2 class="panel-title">{{ t('editPanelTitle') }}</h2>
      <div class="header-buttons">
        <button class="preview-btn" @click="emit('open-preview')" :title="t('preview')">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>
        <button class="reset-all-btn" @click="resetAll" :title="t('resetAll')">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
        </button>
        <button class="delete-btn" @click="clearImage" :title="t('deleteImage')">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <polyline points="3 6 5 6 21 6" />
            <path
              d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
            />
            <line x1="10" y1="11" x2="10" y2="17" />
            <line x1="14" y1="11" x2="14" y2="17" />
          </svg>
        </button>
      </div>
    </div>

    <PanelSection
      v-for="(section, i) in SECTIONS"
      :key="section.titleKey"
      :title="t(section.titleKey)"
      :first="i === 0"
    >
      <div v-for="key in section.keys" :key="key" class="slider-group">
        <label class="slider-label">{{ t(key) }}</label>
        <div class="slider-value-group">
          <NumberSpinner
            :model-value="value(key)"
            v-bind="RANGES[key]"
            :label="t(key)"
            @update:model-value="setValue(key, $event)"
          />
          <button
            class="reset-btn"
            :class="{ active: isModified(key) }"
            :title="t('reset')"
            @click="setValue(key, DEFAULTS[key])"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
          </button>
        </div>
        <!-- Same as v-model.number: range inputs fire `input` while dragging. -->
        <input
          type="range"
          v-bind="sliderAttrs(key)"
          :value="value(key)"
          class="slider"
          :class="{ 'slider-hue': key === 'hue' }"
          @input="setValue(key, Number($event.target.value))"
        />
      </div>
    </PanelSection>
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
  /* Anchored to the top of the workspace, like the left sidebar. */
  position: sticky;
  top: var(--workspace-top, 53px);
  height: calc(100vh - var(--workspace-top, 53px));
  align-self: flex-start;
  transition:
    background 0.3s ease,
    border-color 0.3s ease;
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

.delete-btn {
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

.delete-btn:hover {
  background: #ef4444;
  color: white;
}

/* One control = label, slider, value. A grid so the same markup can be a
   two-row block in a narrow panel and a single row once there is width for
   it (see the wide-workspace media query at the end of this file). */
.slider-group {
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-areas:
    'label value'
    'slider slider';
  align-items: center;
  gap: 8px 10px;
}

.slider-label {
  grid-area: label;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  transition: color 0.3s ease;
}

.slider-value-group {
  grid-area: value;
  display: flex;
  align-items: center;
  gap: 8px;
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
  grid-area: slider;
  width: 100%;
  min-width: 0;
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

/* Wide screens leave several hundred pixels of empty margin around the
   canvas. Spend it on the panel so each control fits on one row instead of
   stacking label, slider and value into a tall pile. */
@media (min-width: 1600px) {
  .edit-panel {
    width: 400px;
    min-width: 400px;
  }

  .slider-group {
    grid-template-columns: 92px 1fr auto;
    grid-template-areas: 'label slider value';
    gap: 10px;
  }

  /* Single-row controls are half as tall, so the panel would otherwise sit
     as a dense block at the top of a viewport-height frame. Spread them. */
  .edit-panel :deep(.panel-section:not(.panel-section--first)) {
    padding-top: 26px;
    margin-top: 26px;
  }

  .edit-panel :deep(.panel-section-head) {
    margin-bottom: 18px;
  }

  .edit-panel :deep(.panel-section-body) {
    gap: 20px;
  }
}

@media (max-width: 1200px) {
  .edit-panel {
    width: 100%;
    min-width: 100%;
    /* Stacked layout: a normal block again, not a viewport-height frame. */
    position: static;
    height: auto;
    max-height: none;
    overflow-y: visible;
    border-left: none;
    border-top: 1px solid var(--border-light);
  }
}

@media (max-width: 768px) {
  .edit-panel {
    padding: 16px;
  }

  .panel-header {
    margin-bottom: 16px;
  }

  .slider::-webkit-slider-thumb {
    width: 24px;
    height: 24px;
    border: 2px solid white;
  }

  .slider::-moz-range-thumb {
    width: 24px;
    height: 24px;
    border: 2px solid white;
  }
}

@media (max-width: 480px) {
  .edit-panel {
    padding: 12px;
  }

  .preview-btn,
  .reset-all-btn,
  .delete-btn {
    padding: 8px 10px;
    min-height: 40px;
    min-width: 40px;
  }

  .slider-group {
    margin-bottom: 16px;
  }
}
</style>
