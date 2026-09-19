<script setup>
import { computed, onUnmounted, ref, watch } from 'vue'
import { useI18n } from '../../composables/useI18n'

const { t } = useI18n()

const props = defineProps({
  modelValue: { type: Number, required: true },
  min: { type: Number, required: true },
  max: { type: Number, required: true },
  step: { type: Number, default: 1 },
  /** Suffix shown inside the field ('%', '°', 'px', …). */
  unit: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  /** Control name, used for the field's and the arrows' accessible labels. */
  label: { type: String, required: true },
})

const emit = defineEmits(['update:modelValue'])

// Decimal places implied by the step size, so a 0.5 step never produces
// 2.5000000000000004 and a whole-number step never grows a ".0".
const decimals = computed(() => {
  const text = String(props.step)
  const dot = text.indexOf('.')
  return dot === -1 ? 0 : text.length - dot - 1
})

/** Snap to the step grid and clamp into range. */
function normalize(n) {
  const snapped = Number((Math.round(n / props.step) * props.step).toFixed(decimals.value))
  return Math.min(props.max, Math.max(props.min, snapped))
}

/** Parse raw field input; null for an empty field or non-numeric text. */
function readNumber(raw) {
  if (raw === '' || raw === null || raw === undefined) return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

// Text the user is currently typing. While it exists the field shows it
// verbatim, so normalizing never rewrites the value under the caret — the
// value behind it still follows every keystroke, clamped.
const draft = ref(null)

const displayValue = computed(() => draft.value ?? String(props.modelValue))

function clearDraft() {
  draft.value = null
}

// A value change from outside (reset button, slider, undo) makes the draft
// stale. It is kept only while it still maps onto the current value — which
// is what typing an out-of-range number does.
watch(
  () => props.modelValue,
  (value) => {
    if (draft.value === null) return
    const typed = readNumber(draft.value)
    if (typed === null || normalize(typed) !== value) clearDraft()
  }
)

function apply(value) {
  if (value !== props.modelValue) emit('update:modelValue', value)
}

function onInput(event) {
  draft.value = event.target.value
  const typed = readNumber(event.target.value)
  if (typed === null) return
  apply(normalize(typed))
}

/**
 * Commit on change/blur: stop showing the raw text and snap the field to the
 * value actually held. The DOM is written directly because Vue does not
 * re-render the input when the bound value did not change.
 */
function onCommit(event) {
  const typed = readNumber(event.target.value)
  const next = typed === null ? props.modelValue : normalize(typed)
  clearDraft()
  apply(next)
  if (event.target.value !== String(next)) event.target.value = String(next)
}

/** Move by `factor` steps. Returns false when the value could not move. */
function stepBy(direction, factor = 1) {
  if (props.disabled) return false
  clearDraft()
  const next = normalize(props.modelValue + direction * props.step * factor)
  if (next === props.modelValue) return false
  emit('update:modelValue', next)
  return true
}

// Press-and-hold: one step on press, then an auto-repeat that starts slow for
// precise nudging and speeds up the longer the button is held.
const HOLD_DELAY = 400
const HOLD_PHASES = [
  { until: 5, interval: 140, factor: 1 },
  { until: 15, interval: 70, factor: 1 },
  { until: 30, interval: 40, factor: 1 },
  { until: Infinity, interval: 40, factor: 5 },
]

let holdTimer = null
let holdTicks = 0

function stopHold() {
  if (holdTimer !== null) {
    clearTimeout(holdTimer)
    holdTimer = null
  }
  holdTicks = 0
  window.removeEventListener('pointerup', stopHold)
  window.removeEventListener('pointercancel', stopHold)
}

function repeatHold(direction) {
  holdTicks += 1
  const phase = HOLD_PHASES.find((p) => holdTicks <= p.until)
  if (!stepBy(direction, phase.factor)) {
    stopHold()
    return
  }
  holdTimer = setTimeout(() => repeatHold(direction), phase.interval)
}

function startHold(direction) {
  stopHold()
  if (!stepBy(direction)) return
  // Listen on the window: the pointer is often released off the button, and
  // the button may be disabled by then (value arrived at its limit).
  window.addEventListener('pointerup', stopHold)
  window.addEventListener('pointercancel', stopHold)
  holdTimer = setTimeout(() => repeatHold(direction), HOLD_DELAY)
}

onUnmounted(stopHold)

const upLabel = computed(() => t('genStepUp').replace('{label}', props.label))
const downLabel = computed(() => t('genStepDown').replace('{label}', props.label))
</script>

<template>
  <div class="spin" :class="{ 'spin--disabled': disabled }">
    <input
      class="spin-input"
      type="number"
      inputmode="decimal"
      :min="min"
      :max="max"
      :step="step"
      :value="displayValue"
      :disabled="disabled"
      :aria-label="label"
      @input="onInput"
      @change="onCommit"
      @blur="onCommit"
    />
    <span v-if="unit" class="spin-unit" aria-hidden="true">{{ unit }}</span>
    <span class="spin-arrows">
      <button
        type="button"
        class="spin-arrow"
        tabindex="-1"
        :disabled="disabled || modelValue >= max"
        :title="upLabel"
        :aria-label="upLabel"
        @pointerdown.prevent="startHold(1)"
        @pointerup="stopHold"
        @pointercancel="stopHold"
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
        class="spin-arrow"
        tabindex="-1"
        :disabled="disabled || modelValue <= min"
        :title="downLabel"
        :aria-label="downLabel"
        @pointerdown.prevent="startHold(-1)"
        @pointerup="stopHold"
        @pointercancel="stopHold"
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
</template>

<style scoped>
.spin {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 1px 2px 1px 6px;
  border: 1px solid var(--border-color);
  border-radius: 7px;
  background: var(--bg-input);
  transition: all 0.2s ease;
}

.spin:focus-within {
  border-color: var(--border-hover);
  box-shadow: 0 0 0 3px var(--selection-glow);
}

.spin--disabled {
  opacity: 0.6;
}

.spin-input {
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

.spin-input::-webkit-outer-spin-button,
.spin-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.spin-input:disabled {
  cursor: not-allowed;
  color: var(--text-tertiary);
}

.spin-unit {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-tertiary);
}

.spin-arrows {
  display: flex;
  flex-direction: column;
  margin-left: 2px;
}

.spin-arrow {
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
  touch-action: none;
  transition: all 0.15s ease;
}

.spin-arrow:hover:not(:disabled) {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.spin-arrow:disabled {
  opacity: 0.3;
  cursor: default;
}
</style>
