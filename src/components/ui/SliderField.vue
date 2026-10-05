<script setup>
/**
 * SliderField — one labelled control: range slider, number spinner and a
 * reset button that returns to `defaultValue`. Mirrors the Visualizer's
 * SliderField so every slider on the site looks and behaves the same.
 *
 * v-model: number. The slider and the spinner both emit `update:modelValue`
 * live. The reset button only emits `reset` — the parent decides how a reset
 * is applied (the generator records it as its own undo step).
 */
import { computed } from 'vue'
import { useI18n } from '../../composables/useI18n'
import NumberSpinner from './NumberSpinner.vue'

const props = defineProps({
  modelValue: { type: Number, required: true },
  min: { type: Number, required: true },
  max: { type: Number, required: true },
  step: { type: Number, default: 1 },
  /** Suffix shown in the spinner ('%', '°', 'px', …). */
  unit: { type: String, default: '' },
  /** Neutral value for the reset button. Without it no reset button is shown. */
  defaultValue: { type: Number, default: undefined },
  disabled: { type: Boolean, default: false },
  /** Control name: visible label and accessible name of all three parts. */
  label: { type: String, required: true },
  /** id of the range input, so outside `<label for>` / tests can target it. */
  inputId: { type: String, default: undefined },
  /** 'hue' paints the track as a colour wheel. */
  variant: { type: String, default: 'default' },
})

const emit = defineEmits(['update:modelValue', 'reset'])

const { t } = useI18n()

const hasDefault = computed(() => typeof props.defaultValue === 'number')
const isAtDefault = computed(() => hasDefault.value && props.modelValue === props.defaultValue)

const resetTitle = computed(() =>
  hasDefault.value ? `${t('reset')} (${props.defaultValue}${props.unit})` : ''
)
const resetLabel = computed(() => t('genResetField').replace('{label}', props.label))

function onRangeInput(event) {
  const n = Number(event.target.value)
  if (Number.isFinite(n) && n !== props.modelValue) emit('update:modelValue', n)
}
</script>

<template>
  <div class="slider-control" :class="{ 'slider-control--disabled': disabled }">
    <label class="slider-control__label" :for="inputId">{{ label }}</label>
    <div class="slider-field">
      <input
        :id="inputId"
        type="range"
        class="slider-field__range"
        :class="{ 'slider-field__range--hue': variant === 'hue' }"
        :min="min"
        :max="max"
        :step="step"
        :value="modelValue"
        :disabled="disabled"
        @input="onRangeInput"
      />
      <NumberSpinner
        :model-value="modelValue"
        :min="min"
        :max="max"
        :step="step"
        :unit="unit"
        :disabled="disabled"
        :label="label"
        @update:model-value="emit('update:modelValue', $event)"
      />
      <button
        v-if="hasDefault"
        type="button"
        class="slider-field__reset"
        :title="resetTitle"
        :aria-label="resetLabel"
        :disabled="disabled || isAtDefault"
        @click="emit('reset')"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.75"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
/* Label above, then one row: slider · spinner · reset. The range input itself
   is styled globally in main.css (#app input[type='range']). */
.slider-control {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-1);
  min-width: 0;
}

.slider-control--disabled {
  opacity: 0.6;
}

.slider-control__label {
  font-size: var(--ds-text-sm);
  font-weight: var(--ds-weight-medium);
  line-height: var(--ds-leading);
  color: var(--ds-text-2);
}

.slider-field {
  display: flex;
  align-items: center;
  gap: var(--ds-space-2);
  width: 100%;
  min-width: 0;
}

.slider-field__range {
  flex: 1 1 auto;
  min-width: 0;
}

/* Ghost icon button, 28 px: quiet until hovered, danger-free. */
.slider-field__reset {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--ds-control-sm);
  height: var(--ds-control-sm);
  padding: 0;
  border: var(--ds-border-width) solid transparent;
  border-radius: var(--ds-radius-sm);
  background: transparent;
  color: var(--ds-text-2);
  cursor: pointer;
  transition: var(--app-transition-colors);
}

.slider-field__reset svg {
  width: var(--ds-icon-sm);
  height: var(--ds-icon-sm);
}

.slider-field__reset:hover:not(:disabled) {
  background: var(--ds-surface-2);
  color: var(--ds-text);
}

.slider-field__reset:focus-visible {
  outline: none;
  box-shadow: var(--ds-focus-ring);
}

.slider-field__reset:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
</style>
