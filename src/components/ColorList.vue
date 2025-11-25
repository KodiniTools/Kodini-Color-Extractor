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
  return `RGB(${color.r}, ${color.g}, ${color.b})`
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
          <div class="color-secondary">RGB(---, ---, ---)</div>
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
  background: white;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  padding: 10px 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.color-item:hover {
  background-color: #f8fafc;
  border-color: #cbd5e0;
}

.color-item.selected {
  border-color: #0F5CD4;
  box-shadow: 0 0 0 2px rgba(15, 92, 212, 0.15);
  background-color: #f0f7ff;
}

.color-item.placeholder {
  cursor: default;
}

.color-item.placeholder:hover {
  background: white;
  border-color: #e2e8f0;
}

.color-swatch {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  margin-right: 12px;
  border: 1px solid #e2e8f0;
  background: #E5E7EB;
  flex-shrink: 0;
}

.color-info {
  flex: 1;
  min-width: 0;
}

.color-primary {
  font-size: 13px;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 2px;
  word-break: break-all;
}

.color-secondary {
  font-size: 11px;
  color: #718096;
}

.copy-btn {
  background: transparent;
  border: none;
  padding: 6px;
  cursor: pointer;
  color: #a0aec0;
  border-radius: 4px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.copy-btn:hover {
  background: #e2e8f0;
  color: #4a5568;
}

.placeholder .color-primary,
.placeholder .color-secondary {
  color: #9CA3AF;
}
</style>
