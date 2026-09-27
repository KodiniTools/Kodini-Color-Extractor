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
        ↺
      </button>
    </div>
  </div>
</template>

<style scoped>
/* Label above, then one row: slider · spinner · reset (Visualizer layout). */
.slider-control {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
}

.slider-control--disabled {
  opacity: 0.55;
}

.slider-control__label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-secondary);
  transition: color 0.3s ease;
}

.slider-field {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  min-width: 0;
}

/* Thin gradient track, small bordered thumb. */
.slider-field__range {
  flex: 1 1 auto;
  min-width: 0;
  height: 3px;
  margin: 0;
  border-radius: 2px;
  background: linear-gradient(90deg, var(--slider-track-from) 0%, var(--slider-track-to) 100%);
  outline: none;
  cursor: pointer;
  -webkit-appearance: none;
  appearance: none;
}

.slider-field__range--hue {
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

.slider-field__range::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--slider-thumb);
  border: 2px solid #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  cursor: pointer;
  transition: transform 0.15s ease;
}

.slider-field__range::-webkit-slider-thumb:hover {
  transform: scale(1.15);
}

.slider-field__range::-moz-range-thumb {
  width: 12px;
  height: 12px;
  box-sizing: border-box;
  border-radius: 50%;
  background: var(--slider-thumb);
  border: 2px solid #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  cursor: pointer;
}

.slider-field__range:focus-visible {
  box-shadow: 0 0 0 3px var(--selection-glow);
}

.slider-field__range:disabled {
  cursor: not-allowed;
}

.slider-field__reset {
  flex: none;
  width: 22px;
  height: 22px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-input);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  color: var(--text-tertiary);
  font-size: 0.8rem;
  line-height: 1;
  cursor: pointer;
  transition:
    color 0.15s ease,
    border-color 0.15s ease;
}

.slider-field__reset:hover:not(:disabled) {
  color: var(--accent-bg);
  border-color: var(--accent-bg);
}

.slider-field__reset:focus-visible {
  outline: 2px solid var(--accent-bg);
  outline-offset: 1px;
}

.slider-field__reset:disabled {
  opacity: 0.35;
  cursor: default;
}

/* Touch: bigger thumb and reset target. */
@media (max-width: 768px) {
  .slider-field__range::-webkit-slider-thumb {
    width: 20px;
    height: 20px;
  }

  .slider-field__range::-moz-range-thumb {
    width: 20px;
    height: 20px;
  }

  .slider-field__reset {
    width: 28px;
    height: 28px;
    font-size: 0.95rem;
  }
}
</style>
