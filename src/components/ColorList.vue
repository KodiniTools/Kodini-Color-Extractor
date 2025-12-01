<script setup>
import { ref } from 'vue'
import { usePaletteStore } from '../stores/palette'
import { useI18n } from '../composables/useI18n'

const store = usePaletteStore()
const { t } = useI18n()
const copiedIndex = ref(null)

async function copyColor(color, index) {
  const text = store.getFormatted(color, index)
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
  }
  copiedIndex.value = index
  setTimeout(() => {
    copiedIndex.value = null
  }, 1500)
}

function selectColor(index) {
  store.setSelectedColor(index)
}

function getSecondaryText(color) {
  return `rgb(${color.r}, ${color.g}, ${color.b})`
}
</script>

<template>
  <div class="color-list">
    <template v-if="store.hasColors">
      <div
        v-for="(color, index) in store.colors"
        :key="index"
        class="color-item"
        :class="{ selected: store.selectedColorIndex === index }"
        @click="selectColor(index)"
        @dblclick="copyColor(color, index)"
      >
        <div
          class="color-swatch"
          :style="{ backgroundColor: color.hex }"
        ></div>
        <div class="color-info">
          <div class="color-primary">
            <template v-if="copiedIndex === index">
              {{ t('copied') }}
            </template>
            <template v-else>
              {{ store.getFormatted(color, index) }}
            </template>
          </div>
          <div class="color-secondary">{{ getSecondaryText(color) }}</div>
        </div>
        <button class="copy-btn" @click.stop="copyColor(color, index)" :title="t('clickToCopy')">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
        </button>
      </div>
    </template>
    <template v-else>
      <div
        v-for="n in store.colorCount"
        :key="n"
        class="color-item placeholder"
      >
        <div class="color-swatch"></div>
        <div class="color-info">
          <div class="color-primary">#------</div>
          <div class="color-secondary">rgb(---, ---, ---)</div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.color-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.color-item {
  display: flex;
  align-items: center;
  background: var(--bg-secondary);
  border-radius: 8px;
  border: 1px solid var(--border-light);
  padding: 10px 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.color-item:hover {
  background-color: var(--bg-hover);
  border-color: var(--border-hover);
}

.color-item.selected {
  border-color: var(--selection-color);
  box-shadow: 0 0 0 2px var(--selection-glow);
  background-color: var(--bg-hover);
}

.color-item.placeholder {
  cursor: default;
}

.color-item.placeholder:hover {
  background: var(--bg-secondary);
  border-color: var(--border-light);
}

.color-swatch {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  margin-right: 12px;
  border: 1px solid var(--border-light);
  background: var(--text-tertiary);
  flex-shrink: 0;
  transition: border-color 0.2s ease;
}

.color-info {
  flex: 1;
  min-width: 0;
}

.color-primary {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 2px;
  word-break: break-all;
  transition: color 0.2s ease;
}

.color-secondary {
  font-size: 11px;
  color: var(--text-secondary);
  transition: color 0.2s ease;
}

.copy-btn {
  background: transparent;
  border: none;
  padding: 6px;
  cursor: pointer;
  color: var(--text-tertiary);
  border-radius: 4px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.copy-btn:hover {
  background: var(--btn-secondary-bg);
  color: var(--text-primary);
}

.placeholder .color-primary,
.placeholder .color-secondary {
  color: var(--text-tertiary);
}
</style>
