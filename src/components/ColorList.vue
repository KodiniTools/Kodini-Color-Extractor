<script setup>
import { ref } from 'vue'
import { usePaletteStore } from '../stores/palette'
import { useI18n } from '../composables/useI18n'
import { useToast } from '../composables/useToast'

const store = usePaletteStore()
const { t } = useI18n()
const toast = useToast()

const hoveredIndex = ref(null)
const tooltipPosition = ref({ x: 0, y: 0 })

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
  toast.success(t('copiedToClipboard'))
}

function selectColor(index) {
  store.setSelectedColor(index)
}

function getSecondaryText(color) {
  return `rgb(${color.r}, ${color.g}, ${color.b})`
}

function showTooltip(event, index) {
  hoveredIndex.value = index
  updateTooltipPosition(event)
}

function updateTooltipPosition(event) {
  const rect = event.currentTarget.getBoundingClientRect()
  tooltipPosition.value = {
    x: rect.left + rect.width / 2,
    y: rect.top - 8
  }
}

function hideTooltip() {
  hoveredIndex.value = null
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
        @mouseenter="showTooltip($event, index)"
        @mousemove="updateTooltipPosition"
        @mouseleave="hideTooltip"
      >
        <div
          class="color-swatch"
          :style="{ backgroundColor: color.hex }"
        ></div>
        <div class="color-info">
          <div class="color-primary">{{ store.getFormatted(color, index) }}</div>
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

    <!-- Tooltip -->
    <Teleport to="body">
      <Transition name="tooltip">
        <div
          v-if="hoveredIndex !== null && store.colors[hoveredIndex]"
          class="color-tooltip"
          :style="{
            left: tooltipPosition.x + 'px',
            top: tooltipPosition.y + 'px'
          }"
        >
          <div
            class="tooltip-swatch"
            :style="{ backgroundColor: store.colors[hoveredIndex].hex }"
          ></div>
          <div class="tooltip-content">
            <span class="tooltip-hex">{{ store.colors[hoveredIndex].hex }}</span>
            <span class="tooltip-hint">{{ t('doubleClickToCopy') }}</span>
          </div>
        </div>
      </Transition>
    </Teleport>
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

/* Tooltip styles */
.color-tooltip {
  position: fixed;
  z-index: 10000;
  transform: translate(-50%, -100%);
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: 0 4px 20px var(--shadow-medium);
  pointer-events: none;
}

.color-tooltip::after {
  content: '';
  position: absolute;
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%) rotate(45deg);
  width: 10px;
  height: 10px;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
  border-bottom: 1px solid var(--border-color);
}

.tooltip-swatch {
  width: 28px;
  height: 28px;
  border-radius: 4px;
  border: 1px solid var(--border-light);
  flex-shrink: 0;
}

.tooltip-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.tooltip-hex {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  text-transform: uppercase;
}

.tooltip-hint {
  font-size: 11px;
  color: var(--text-tertiary);
}

/* Tooltip transitions */
.tooltip-enter-active {
  animation: tooltip-in 0.15s ease-out;
}

.tooltip-leave-active {
  animation: tooltip-out 0.1s ease-in forwards;
}

@keyframes tooltip-in {
  from {
    opacity: 0;
    transform: translate(-50%, -90%);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -100%);
  }
}

@keyframes tooltip-out {
  from {
    opacity: 1;
    transform: translate(-50%, -100%);
  }
  to {
    opacity: 0;
    transform: translate(-50%, -90%);
  }
}

@media (max-width: 768px) {
  .color-tooltip {
    max-width: 90vw;
  }
}

@media (max-width: 480px) {
  .color-item {
    padding: 10px;
  }

  .color-swatch {
    width: 32px;
    height: 32px;
    margin-right: 10px;
  }

  .color-primary {
    font-size: 13px;
  }

  .color-secondary {
    font-size: 12px;
  }

  .copy-btn {
    padding: 8px;
    min-width: 36px;
    min-height: 36px;
  }
}
</style>
