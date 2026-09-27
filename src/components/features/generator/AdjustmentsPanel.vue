<script setup>
import { useI18n } from '../../../composables/useI18n'
import { displayHex } from '../../../lib/core/colorGenerator'
import SliderField from '../../ui/SliderField.vue'
import PanelSection from '../../ui/PanelSection.vue'

const { t } = useI18n()

const props = defineProps({
  palette: { type: Array, required: true },
  scope: { type: [String, Array], required: true },
  selectedCount: { type: Number, required: true },
  anyLocked: { type: Boolean, required: true },
  activeAdjust: { type: Object, required: true },
  activeLocked: { type: Boolean, required: true },
  canPick: { type: Boolean, required: true },
  pickerHex: { type: String, required: true },
  hasActiveAdjust: { type: Boolean, required: true },
  adjustFields: { type: Array, required: true },
  isSelected: { type: Function, required: true },
  canUndo: { type: Boolean, required: true },
  canRedo: { type: Boolean, required: true },
})

const emit = defineEmits([
  'all-scope',
  'select-scope',
  'clear-scope',
  'copy-selected',
  'reset',
  'reset-field',
  'pick',
  'set-adjust',
  'undo',
  'redo',
])

/** Translated name of an adjustment field, used in labels and titles. */
function fieldLabel(f) {
  return t(f.key)
}

/** Current value of a field, falling back to its neutral default. */
function fieldValue(f) {
  const v = Number(props.activeAdjust[f.key])
  return Number.isFinite(v) ? v : f.def
}
</script>

<template>
  <!-- Filter adjustments: edit a single color or all of them together -->
  <aside class="gen-adjust">
    <div class="panel-header">
      <h2 class="panel-title">{{ t('genAdjustments') }}</h2>
    </div>

    <div class="history-actions">
      <button
        class="btn-history"
        :disabled="!canUndo"
        :title="t('undoTitle')"
        @click="emit('undo')"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 7v6h6" />
          <path d="M3 13C5.33 7.5 10 4 16 4a9 9 0 0 1 0 18H8" />
        </svg>
        {{ t('undo') }}
      </button>
      <button
        class="btn-history"
        :disabled="!canRedo"
        :title="t('redoTitle')"
        @click="emit('redo')"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 7v6h-6" />
          <path d="M21 13C18.67 7.5 14 4 8 4a9 9 0 0 0 0 18h8" />
        </svg>
        {{ t('redo') }}
      </button>
      <button
        class="btn-history btn-reset"
        :disabled="!hasActiveAdjust || activeLocked"
        :title="t('reset')"
        @click="emit('reset')"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
        </svg>
        {{ t('reset') }}
      </button>
    </div>

    <p v-if="activeLocked" class="adjust-locked-note">{{ t('genLockedHint') }}</p>

    <PanelSection :title="t('genSectionPick')" first>
      <div class="adjust-scope">
        <div class="scope-tabs" role="group" :aria-label="t('genAdjustScope')">
          <button
            class="scope-tab"
            :class="{
              'scope-tab--active': scope === 'all',
              'scope-tab--muted': anyLocked,
            }"
            :title="anyLocked ? t('genUnlockAllHint') : null"
            @click="emit('all-scope')"
          >
            {{ t('genScopeAll') }}
          </button>
          <button
            v-for="(color, index) in palette"
            :key="index"
            class="scope-dot"
            :class="{
              'scope-dot--active': isSelected(index),
              'scope-dot--locked': color.locked,
            }"
            :style="{ background: displayHex(color) }"
            :disabled="color.locked"
            :title="
              color.locked ? t('genLockedHint') : t('genScopeColor').replace('{n}', index + 1)
            "
            :aria-label="t('genScopeColor').replace('{n}', index + 1)"
            @click="emit('select-scope', index)"
          ></button>
        </div>
        <span v-if="selectedCount > 0" class="scope-count" aria-live="polite">
          {{ t('genSelectedCount').replace('{n}', selectedCount) }}
        </span>
      </div>

      <!-- Colour picker (native input includes the browser's eyedropper).
         Always visible; enabled once a single colour field is selected
         (disabled with a hint in "all" mode). -->
      <div class="adjust-picker">
        <span class="adjust-picker-label">{{ t('genPickColor') }}</span>
        <label
          class="color-well"
          :class="{ 'color-well--disabled': !canPick }"
          :style="canPick ? { background: pickerHex } : null"
          :title="canPick ? t('genPickColor') : t('genPickHint')"
        >
          <input
            type="color"
            :value="canPick ? pickerHex : '#000000'"
            :disabled="!canPick"
            @input="emit('pick', $event.target.value)"
          />
        </label>
        <span class="adjust-picker-hex">{{ canPick ? pickerHex : '—' }}</span>
        <span v-if="selectedCount > 1" class="adjust-picker-hint">{{ t('genMultiHint') }}</span>
        <span v-else-if="!canPick" class="adjust-picker-hint">{{ t('genPickHint') }}</span>

        <!-- Selection actions: copy just the chosen colors, or clear the selection.
           Only shown while at least one color is selected. -->
        <div v-if="scope !== 'all'" class="adjust-actions">
          <button
            class="adjust-action-btn adjust-action-btn--primary"
            :title="t('genCopySelected')"
            @click="emit('copy-selected')"
          >
            {{ t('genCopySelected') }} ({{ selectedCount }})
          </button>
          <button
            class="adjust-action-btn"
            :title="t('genClearScope')"
            @click="emit('clear-scope')"
          >
            {{ t('genClearScope') }}
          </button>
        </div>
      </div>
    </PanelSection>

    <PanelSection :title="t('genSectionFilters')">
      <div class="adjust-sliders">
        <!-- Slider, number spinner (type or hold the arrows) and a reset to
           this control's neutral value only -->
        <SliderField
          v-for="f in adjustFields"
          :key="f.key"
          class="adjust-field"
          :model-value="fieldValue(f)"
          :min="f.min"
          :max="f.max"
          :step="f.step || 1"
          :unit="f.unit"
          :default-value="f.def"
          :disabled="activeLocked"
          :label="fieldLabel(f)"
          :input-id="`adjust-slider-${f.key}`"
          :variant="f.key === 'hue' ? 'hue' : 'default'"
          @update:model-value="emit('set-adjust', f.key, $event)"
          @reset="emit('reset-field', f.key)"
        />
      </div>
    </PanelSection>
  </aside>
</template>

<style scoped>
/* Adjustments panel — a compact, centered control card */
/* Right-hand panel of the workspace, matching the extractor's image panel. */
.gen-adjust {
  width: 320px;
  min-width: 320px;
  background: var(--bg-sidebar);
  padding: 20px;
  display: flex;
  flex-direction: column;
  border-left: 1px solid var(--border-light);
  overflow-y: auto;
  position: sticky;
  top: var(--workspace-top, 53px);
  height: calc(100vh - var(--workspace-top, 53px));
  align-self: flex-start;
  transition:
    background 0.3s ease,
    border-color 0.3s ease;
}

.adjust-scope {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.scope-tabs {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

/* Live count of selected colors, updates as the selection changes */
.scope-count {
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--btn-primary-bg);
  color: var(--btn-primary-text);
  font-size: 12px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.scope-tab {
  padding: 7px 14px;
  border: 1px solid var(--border-color);
  border-radius: 999px;
  background: var(--bg-input);
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.scope-tab:hover {
  border-color: var(--border-hover);
  color: var(--text-primary);
}

.scope-tab--active {
  background: var(--btn-primary-bg);
  border-color: var(--btn-primary-bg);
  color: var(--btn-primary-text);
}

/* Keep the filled button's light label readable on hover (the generic
   .scope-tab:hover would otherwise darken the text onto the dark fill). */
.scope-tab--active:not(.scope-tab--muted):hover {
  background: var(--btn-primary-hover);
  border-color: var(--btn-primary-hover);
  color: var(--btn-primary-text);
}

/* "All colors" looks deactivated while individual colors are locked.
   Kept as an unfilled toggle so the label stays high-contrast in light mode. */
.scope-tab--muted {
  background: var(--bg-hover);
  border-color: var(--border-color);
  border-style: dashed;
  color: var(--text-secondary);
}

.scope-tab--muted:hover {
  color: var(--text-primary);
  border-color: var(--border-hover);
}

.scope-dot {
  width: 26px;
  height: 26px;
  padding: 0;
  border: 2px solid transparent;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 0 0 1px var(--border-light);
  transition:
    transform 0.15s ease,
    border-color 0.15s ease;
}

.scope-dot:hover {
  transform: scale(1.12);
}

.scope-dot--active {
  border-color: var(--text-primary);
  transform: scale(1.12);
}

.scope-dot--locked {
  opacity: 0.4;
  cursor: not-allowed;
}

.scope-dot--locked:hover {
  transform: none;
}

.adjust-sliders {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
}

.adjust-locked-note {
  margin: 0 0 12px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-tertiary);
}

/* Colour picker row */
.adjust-picker {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  min-height: 34px;
}

.adjust-picker-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

/* Native colour input rendered as a small square swatch */
.color-well {
  position: relative;
  display: inline-block;
  width: 34px;
  height: 34px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  box-shadow: inset 0 0 0 2px var(--bg-secondary);
  cursor: pointer;
  overflow: hidden;
}

.color-well input[type='color'] {
  position: absolute;
  inset: -4px;
  width: calc(100% + 8px);
  height: calc(100% + 8px);
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  opacity: 0;
}

/* No colour selected yet: show the well as an inert, striped placeholder */
.color-well--disabled {
  cursor: not-allowed;
  background: repeating-linear-gradient(
    45deg,
    var(--bg-hover),
    var(--bg-hover) 5px,
    var(--bg-secondary) 5px,
    var(--bg-secondary) 10px
  );
}

.color-well--disabled input[type='color'] {
  cursor: not-allowed;
}

.adjust-picker-hex {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.04em;
}

.adjust-picker-hint {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-tertiary);
}

/* Selection actions — "Copy selected" and "Clear selection". Pushed to the
   far right of the picker row; only shown while colors are selected. */
.adjust-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.adjust-action-btn {
  padding: 6px 14px;
  border: 1px solid var(--border-color);
  border-radius: 999px;
  background: var(--bg-input);
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.adjust-action-btn:hover {
  background: var(--bg-hover);
  border-color: var(--border-hover);
  color: var(--text-primary);
}

.adjust-action-btn--primary {
  background: var(--btn-primary-bg);
  border-color: var(--btn-primary-bg);
  color: var(--btn-primary-text);
}

.adjust-action-btn--primary:hover {
  background: var(--btn-primary-hover);
  border-color: var(--btn-primary-hover);
  color: var(--btn-primary-text);
}

/* Wide screens: a wider panel gives the sliders a longer, finer track. */
@media (min-width: 1600px) {
  .gen-adjust {
    width: 400px;
    min-width: 400px;
  }
}

/* Stacked layout: a normal full-width block again, not a viewport-height
   frame pinned to the side of the workspace. */
@media (max-width: 1200px) {
  .gen-adjust {
    width: 100%;
    min-width: 100%;
    position: static;
    height: auto;
    max-height: none;
    overflow-y: visible;
    border-left: none;
    border-top: 1px solid var(--border-light);
  }
}

@media (max-width: 700px) {
  .gen-adjust {
    padding: 16px;
  }
}
</style>
