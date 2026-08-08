<script setup>
import { useI18n } from '../../../composables/useI18n'

const { t } = useI18n()

defineProps({
  mode: { type: String, required: true },
  count: { type: Number, required: true },
  harmonyModes: { type: Array, required: true },
})

const emit = defineEmits(['update:mode', 'set-count', 'generate', 'copy-all'])

// Changing the harmony updates the bound mode and regenerates in one go.
function onModeChange(event) {
  emit('update:mode', event.target.value)
  emit('generate')
}
</script>

<template>
  <header class="gen-header">
    <div class="gen-header-text">
      <h1 class="gen-title">{{ t('genTitle') }}</h1>
      <p class="gen-subtitle">{{ t('genSubtitle') }}</p>
    </div>

    <div class="gen-controls">
      <div class="gen-control">
        <label class="gen-label">{{ t('genHarmony') }}</label>
        <select :value="mode" class="gen-select" @change="onModeChange">
          <option v-for="m in harmonyModes" :key="m" :value="m">
            {{ t('genMode_' + m) }}
          </option>
        </select>
      </div>

      <div class="gen-control">
        <label class="gen-label">{{ t('genCount') }}</label>
        <select
          :value="count"
          class="gen-select"
          @change="emit('set-count', Number($event.target.value))"
        >
          <option v-for="n in [3, 4, 5, 6, 7, 8]" :key="n" :value="n">{{ n }}</option>
        </select>
      </div>

      <button class="gen-btn gen-btn-primary" @click="emit('generate')">
        {{ t('genGenerate') }}
      </button>
      <button class="gen-btn" @click="emit('copy-all')">
        {{ t('genCopyAll') }}
      </button>
    </div>
  </header>
</template>

<style scoped>
.gen-header {
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 40px 24px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 24px;
}

.gen-header-text {
  max-width: 640px;
}

.gen-title {
  font-size: clamp(26px, 4vw, 38px);
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
  transition: color 0.3s ease;
}

.gen-subtitle {
  margin: 8px auto 0;
  font-size: 15px;
  color: var(--text-secondary);
  max-width: 520px;
  line-height: 1.5;
  transition: color 0.3s ease;
}

.gen-controls {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

.gen-control {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.gen-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  transition: color 0.3s ease;
}

.gen-select {
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 14px;
  background: var(--bg-input);
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.gen-select:hover {
  border-color: var(--border-hover);
}

.gen-select:focus {
  outline: none;
  border-color: var(--selection-color);
  box-shadow: 0 0 0 3px var(--selection-glow);
}

.gen-btn {
  padding: 11px 20px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-input);
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.gen-btn:hover {
  background: var(--bg-hover);
  border-color: var(--border-hover);
  transform: translateY(-1px);
}

.gen-btn-primary {
  background: var(--btn-primary-bg);
  border-color: var(--btn-primary-bg);
  color: var(--btn-primary-text);
}

.gen-btn-primary:hover {
  background: var(--btn-primary-hover);
  border-color: var(--btn-primary-hover);
}

@media (max-width: 700px) {
  .gen-header {
    padding: 24px 16px 12px;
  }
}
</style>
