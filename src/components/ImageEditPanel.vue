<script setup>
import { usePaletteStore } from '../stores/palette'
import { useI18n } from '../composables/useI18n'
import SliderField from './ui/SliderField.vue'
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
            stroke-width="1.75"
          >
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>
        <button class="delete-btn" @click="clearImage" :title="t('deleteImage')">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.75"
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

    <div class="history-actions">
      <button class="btn-history btn-reset reset-all-btn" :title="t('resetAll')" @click="resetAll">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
        </svg>
        {{ t('resetAll') }}
      </button>
    </div>

    <PanelSection
      v-for="(section, i) in SECTIONS"
      :key="section.titleKey"
      :title="t(section.titleKey)"
      :first="i === 0"
    >
      <SliderField
        v-for="key in section.keys"
        :key="key"
        class="slider-group"
        :model-value="value(key)"
        v-bind="RANGES[key]"
        :default-value="DEFAULTS[key]"
        :label="t(key)"
        :input-id="`image-slider-${key}`"
        :variant="key === 'hue' ? 'hue' : 'default'"
        @update:model-value="setValue(key, $event)"
        @reset="setValue(key, DEFAULTS[key])"
      />
    </PanelSection>
  </aside>
</template>

<style scoped>
.edit-panel {
  width: 280px;
  min-width: 280px;
  background: var(--ds-surface-1);
  padding: var(--ds-space-5);
  display: flex;
  flex-direction: column;
  border-left: var(--ds-border-width) solid var(--ds-border);
  overflow-y: auto;
  /* Anchored to the top of the workspace, like the left sidebar. */
  position: sticky;
  top: var(--workspace-top, 60px);
  height: calc(100vh - var(--workspace-top, 60px));
  align-self: flex-start;
  transition: var(--app-transition-colors);
}

.header-buttons {
  display: flex;
  gap: var(--ds-space-2);
}

/* Secondary icon buttons, 36 px; delete speaks through its colour, never a
   red surface. */
.preview-btn,
.delete-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--ds-control-md);
  height: var(--ds-control-md);
  padding: 0;
  background: var(--ds-surface-2);
  border: var(--ds-border-width) solid var(--ds-border-strong);
  border-radius: var(--ds-radius-md);
  color: var(--ds-text);
  cursor: pointer;
  transition: var(--app-transition-colors);
}

.preview-btn svg,
.delete-btn svg {
  width: var(--ds-icon-sm);
  height: var(--ds-icon-sm);
}

.preview-btn:hover,
.delete-btn:hover {
  background: var(--ds-surface-3);
}

.delete-btn:hover {
  color: var(--ds-danger);
}

.preview-btn:focus-visible,
.delete-btn:focus-visible {
  outline: none;
  box-shadow: var(--ds-focus-ring);
}

/* Wide screens leave several hundred pixels of empty margin around the
   canvas. Spend it on the panel so the sliders get a longer, finer track. */
@media (min-width: 1600px) {
  .edit-panel {
    width: 400px;
    min-width: 400px;
  }

  .edit-panel :deep(.panel-section-body) {
    gap: var(--ds-space-4);
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
    border-top: var(--ds-border-width) solid var(--ds-border);
  }
}

@media (max-width: 768px) {
  .edit-panel {
    padding: var(--ds-space-4);
  }

  .panel-header {
    margin-bottom: var(--ds-space-4);
  }
}

@media (max-width: 480px) {
  .edit-panel {
    padding: var(--ds-space-3);
  }

  .preview-btn,
  .delete-btn {
    width: var(--ds-row-height);
    height: var(--ds-row-height);
  }
}
</style>
