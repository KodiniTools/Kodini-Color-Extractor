<script setup>
import { reactive } from 'vue'
import { useI18n } from '../../../composables/useI18n'
import { displayHex } from '../../../lib/core/colorGenerator'

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

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n))
}

/** Parse a raw input value; null for an empty field or non-numeric text. */
function readNumber(raw) {
  if (raw === '' || raw === null || raw === undefined) return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

// Text the user is currently typing, per field key. The palette always follows
// the clamped value live (like the slider), while the field keeps showing the
// raw text — so typing "250" into a 0-200 field is not rewritten under the
// caret, it just stops moving the palette past the maximum.
const drafts = reactive({})

/** Drop the in-progress text so the field shows the model value again. */
function clearDraft(f) {
  if (f.key in drafts) delete drafts[f.key]
}

/** What the number field displays: the in-progress text, else the model. */
function spinValue(f) {
  return drafts[f.key] ?? String(fieldValue(f))
}

/** Slider drag — same value path as the spinner, and the field follows along. */
function onSlide(f, raw) {
  clearDraft(f)
  emit('set-adjust', f.key, raw)
}

/** Spinner arrow: move the value by one step, clamped to the field range. */
function stepField(f, direction) {
  if (props.activeLocked) return
  clearDraft(f)
  const size = f.step || 1
  const current = fieldValue(f)
  const next = clamp(current + direction * size, f.min, f.max)
  if (next !== current) emit('set-adjust', f.key, next)
}

/** Per-field reset — clears any in-progress text along with the value. */
function onResetField(f) {
  clearDraft(f)
  emit('reset-field', f.key)
}

/**
 * Typing in the number field: apply every keystroke to the palette right away,
 * clamped to the field range. An empty (or not-yet-numeric) field applies
 * nothing and keeps the last value until the user types a number.
 */
function onSpinInput(f, raw) {
  drafts[f.key] = raw
  const n = readNumber(raw)
  if (n === null) return
  emit('set-adjust', f.key, clamp(Math.round(n), f.min, f.max))
}

/**
 * Commit on change/blur: the field stops showing the raw text and snaps to the
 * value the palette actually holds. The DOM is written directly because Vue
 * does not re-render the input when the model value did not change.
 */
function onSpinCommit(f, el) {
  const n = readNumber(el.value)
  const next = n === null ? fieldValue(f) : clamp(Math.round(n), f.min, f.max)
  clearDraft(f)
  if (next !== fieldValue(f)) emit('set-adjust', f.key, next)
  if (el.value !== String(next)) el.value = String(next)
}
</script>

<template>
  <!-- Filter adjustments: edit a single color or all of them together -->
  <section class="gen-adjust">
    <div class="adjust-bar">
      <div class="adjust-scope">
        <span class="adjust-title">{{ t('genAdjustments') }}</span>
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
        <button class="adjust-action-btn" :title="t('genClearScope')" @click="emit('clear-scope')">
          {{ t('genClearScope') }}
        </button>
      </div>
    </div>

    <div class="adjust-sliders" :class="{ 'adjust-sliders--disabled': activeLocked }">
      <div v-for="f in adjustFields" :key="f.key" class="adjust-field">
        <div class="adjust-field-head">
          <label class="adjust-field-label" :for="`adjust-slider-${f.key}`">
            {{ fieldLabel(f) }}
          </label>

          <div class="adjust-field-tools">
            <!-- Number spinner: type an exact value or step it with the arrows -->
            <div class="adjust-spin" :class="{ 'adjust-spin--disabled': activeLocked }">
              <input
                class="adjust-spin-input"
                type="number"
                inputmode="numeric"
                :min="f.min"
                :max="f.max"
                :step="f.step || 1"
                :value="spinValue(f)"
                :disabled="activeLocked"
                :aria-label="fieldLabel(f)"
                @input="onSpinInput(f, $event.target.value)"
                @change="onSpinCommit(f, $event.target)"
                @blur="onSpinCommit(f, $event.target)"
              />
              <span class="adjust-spin-unit" aria-hidden="true">{{ f.unit }}</span>
              <span class="adjust-spin-arrows">
                <button
                  type="button"
                  class="adjust-spin-arrow"
                  tabindex="-1"
                  :disabled="activeLocked || fieldValue(f) >= f.max"
                  :title="t('genStepUp').replace('{label}', fieldLabel(f))"
                  :aria-label="t('genStepUp').replace('{label}', fieldLabel(f))"
                  @click="stepField(f, 1)"
                >
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="3"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="m6 15 6-6 6 6" />
                  </svg>
                </button>
                <button
                  type="button"
                  class="adjust-spin-arrow"
                  tabindex="-1"
                  :disabled="activeLocked || fieldValue(f) <= f.min"
                  :title="t('genStepDown').replace('{label}', fieldLabel(f))"
                  :aria-label="t('genStepDown').replace('{label}', fieldLabel(f))"
                  @click="stepField(f, -1)"
                >
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="3"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
              </span>
            </div>

            <!-- Per-field reset: back to this control's neutral value only -->
            <button
              type="button"
              class="adjust-field-reset"
              :class="{ 'adjust-field-reset--active': isFieldModified(f) }"
              :disabled="activeLocked || !isFieldModified(f)"
              :title="t('genResetField').replace('{label}', fieldLabel(f))"
              :aria-label="t('genResetField').replace('{label}', fieldLabel(f))"
              @click="onResetField(f)"
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
          @input="onSlide(f, $event.target.value)"
        />
      </div>
    </div>
  </section>
</template>

<style scoped>
/* Adjustments panel — a compact, centered control card */
.gen-adjust {
  max-width: 720px;
  width: 100%;
  margin: 0 auto 20px;
  padding: 14px 18px;
  border: 1px solid var(--border-light);
  border-radius: 12px;
  background: var(--bg-secondary);
  box-shadow: 0 6px 24px var(--shadow-soft);
  transition: all 0.3s ease;
}

.adjust-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}

.adjust-scope {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.adjust-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
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
  grid-template-columns: repeat(2, 1fr);
  gap: 12px 22px;
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
  margin-bottom: 14px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--border-light);
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

.adjust-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.adjust-field-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 30px;
}

.adjust-field-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
}

.adjust-field-tools {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* Number spinner — exact value entry with stepper arrows, kept visually
   in line with the other inputs on the card. */
.adjust-spin {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 1px 2px 1px 6px;
  border: 1px solid var(--border-color);
  border-radius: 7px;
  background: var(--bg-input);
  transition: all 0.2s ease;
}

.adjust-spin:focus-within {
  border-color: var(--border-hover);
  box-shadow: 0 0 0 3px var(--selection-glow);
}

.adjust-spin--disabled {
  opacity: 0.6;
}

.adjust-spin-input {
  width: 38px;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--text-primary);
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  text-align: right;
  outline: none;
  /* Native arrows are hidden in favour of the custom ones below. */
  -moz-appearance: textfield;
  appearance: textfield;
}

.adjust-spin-input::-webkit-outer-spin-button,
.adjust-spin-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.adjust-spin-input:disabled {
  cursor: not-allowed;
  color: var(--text-tertiary);
}

.adjust-spin-unit {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-tertiary);
}

.adjust-spin-arrows {
  display: flex;
  flex-direction: column;
  margin-left: 2px;
}

.adjust-spin-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 13px;
  padding: 0;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--text-tertiary);
  cursor: pointer;
  transition: all 0.15s ease;
}

.adjust-spin-arrow:hover:not(:disabled) {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.adjust-spin-arrow:disabled {
  opacity: 0.3;
  cursor: default;
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
  width: 100%;
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

@media (max-width: 700px) {
  .gen-adjust {
    margin: 0 16px 16px;
    width: auto;
    padding: 14px 16px;
  }

  /* One column on phones: the label + spinner + reset row needs the width. */
  .adjust-sliders {
    grid-template-columns: 1fr;
    gap: 14px;
  }
}
</style>
