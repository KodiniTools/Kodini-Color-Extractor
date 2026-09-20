<script setup>
import { useI18n } from '../../../composables/useI18n'
import { displayHex } from '../../../lib/core/colorGenerator'
import NumberSpinner from '../../ui/NumberSpinner.vue'
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

/** True while the field differs from neutral — enables its reset button. */
function isFieldModified(f) {
  return fieldValue(f) !== f.def
}
</script>

<template>
  <!-- Filter adjustments: edit a single color or all of them together -->
  <aside class="gen-adjust">
    <div class="panel-header">
      <h2 class="panel-title">{{ t('genAdjustments') }}</h2>
      <div class="adjust-tools">
        <button
          class="adjust-icon-btn"
          :disabled="!canUndo"
          :title="t('undo')"
          :aria-label="t('undo')"
          @click="emit('undo')"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M9 14 4 9l5-5" />
            <path d="M4 9h11a5 5 0 0 1 0 10h-1" />
          </svg>
        </button>
        <button
          class="adjust-icon-btn"
          :disabled="!canRedo"
          :title="t('redo')"
          :aria-label="t('redo')"
          @click="emit('redo')"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="m15 14 5-5-5-5" />
            <path d="M20 9H9a5 5 0 0 0 0 10h1" />
          </svg>
        </button>
        <button
          class="adjust-reset"
          :disabled="!hasActiveAdjust || activeLocked"
          @click="emit('reset')"
        >
          {{ t('reset') }}
        </button>
      </div>
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
      <div class="adjust-sliders" :class="{ 'adjust-sliders--disabled': activeLocked }">
        <div v-for="f in adjustFields" :key="f.key" class="adjust-field">
          <label class="adjust-field-label" :for="`adjust-slider-${f.key}`">
            {{ fieldLabel(f) }}
          </label>

          <div class="adjust-field-tools">
            <!-- Number spinner: type an exact value or hold the arrows -->
            <NumberSpinner
              :model-value="fieldValue(f)"
              :min="f.min"
              :max="f.max"
              :step="f.step || 1"
              :unit="f.unit"
              :disabled="activeLocked"
              :label="fieldLabel(f)"
              @update:model-value="emit('set-adjust', f.key, $event)"
            />

            <!-- Per-field reset: back to this control's neutral value only -->
            <button
              type="button"
              class="adjust-field-reset"
              :class="{ 'adjust-field-reset--active': isFieldModified(f) }"
              :disabled="activeLocked || !isFieldModified(f)"
              :title="t('genResetField').replace('{label}', fieldLabel(f))"
              :aria-label="t('genResetField').replace('{label}', fieldLabel(f))"
              @click="emit('reset-field', f.key)"
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
            </button>
          </div>

          <input
            :id="`adjust-slider-${f.key}`"
            class="adjust-slider"
            type="range"
            :min="f.min"
            :max="f.max"
            :step="f.step || 1"
            :value="fieldValue(f)"
            :disabled="activeLocked"
            @input="emit('set-adjust', f.key, $event.target.value)"
          />
        </div>
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
  top: 53px;
  height: calc(100vh - 53px);
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

/* Undo / redo / reset grouped together at the right of the adjustments bar */
.adjust-tools {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* Subtle icon buttons for undo/redo — quiet until hovered, dimmed when there
   is nothing to step to. */
.adjust-icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  color: var(--text-tertiary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.adjust-icon-btn:hover:not(:disabled) {
  background: var(--bg-hover);
  border-color: var(--border-hover);
  color: var(--text-primary);
}

.adjust-icon-btn:disabled {
  opacity: 0.35;
  cursor: default;
}

.adjust-reset {
  padding: 7px 16px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-input);
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.adjust-reset:hover:not(:disabled) {
  background: var(--bg-hover);
  border-color: var(--border-hover);
  color: var(--text-primary);
}

.adjust-reset:disabled {
  opacity: 0.45;
  cursor: default;
}

.adjust-sliders {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
}

.adjust-sliders--disabled {
  opacity: 0.5;
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

/* One control = label, slider, tools. A grid so the same markup is a two-row
   block in a narrow card and a single row once there is width for it. */
.adjust-field {
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-areas:
    'label tools'
    'slider slider';
  align-items: center;
  gap: 6px 10px;
  min-height: 30px;
}

.adjust-field-label {
  grid-area: label;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
}

.adjust-field-tools {
  grid-area: tools;
  display: flex;
  align-items: center;
  gap: 4px;
}

/* Per-field reset — quiet until the field leaves its neutral value */
.adjust-field-reset {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 7px;
  background: transparent;
  color: var(--text-tertiary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.adjust-field-reset:hover:not(:disabled) {
  background: var(--bg-hover);
  border-color: var(--border-hover);
  color: var(--text-primary);
}

.adjust-field-reset--active:not(:disabled) {
  color: var(--btn-primary-bg);
}

.adjust-field-reset:disabled {
  opacity: 0.35;
  cursor: default;
}

.adjust-slider {
  grid-area: slider;
  width: 100%;
  min-width: 0;
  height: 6px;
  -webkit-appearance: none;
  appearance: none;
  border-radius: 999px;
  background: var(--bg-hover);
  cursor: pointer;
  outline: none;
}

.adjust-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--btn-primary-bg);
  border: 2px solid var(--bg-secondary);
  box-shadow: 0 1px 4px var(--shadow-medium);
  cursor: pointer;
}

.adjust-slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--btn-primary-bg);
  border: 2px solid var(--bg-secondary);
  cursor: pointer;
}

.adjust-slider:focus-visible {
  box-shadow: 0 0 0 3px var(--selection-glow);
}

.adjust-slider:disabled {
  cursor: not-allowed;
}

/* Wide screens: each control fits on one line, so the four filters sit in a
   single row instead of a 2x2 block of stacked pairs. */
@media (min-width: 1600px) {
  .gen-adjust {
    width: 400px;
    min-width: 400px;
  }

  .adjust-field {
    grid-template-columns: 92px 1fr auto;
    grid-template-areas: 'label slider tools';
    gap: 10px;
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
