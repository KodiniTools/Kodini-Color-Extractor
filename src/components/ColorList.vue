<script setup>
import { ref } from 'vue'
import { showsHexInline } from '../lib/core/paletteExport'
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

/**
 * The second line carries the HEX value under notations that do not spell it
 * out (rgb/hsl). Under HEX itself, or a CSS/SCSS/Tailwind line that already
 * contains it, it would just repeat what is above.
 */
function getSecondaryText(color) {
  return color.hex.toUpperCase()
}

function showTooltip(event, index) {
  hoveredIndex.value = index
  updateTooltipPosition(event)
}

function updateTooltipPosition(event) {
  const rect = event.currentTarget.getBoundingClientRect()
  tooltipPosition.value = {
    x: rect.left + rect.width / 2,
    y: rect.top - 8,
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
        <div class="color-swatch" :style="{ backgroundColor: color.hex }"></div>
        <div class="color-info">
          <div class="color-primary">{{ store.getFormatted(color, index) }}</div>
          <div v-if="!showsHexInline(store.downloadFormat)" class="color-secondary">
            {{ getSecondaryText(color) }}
          </div>
        </div>
        <button class="copy-btn" @click.stop="copyColor(color, index)" :title="t('clickToCopy')">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.75"
          >
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
        </button>
      </div>
    </template>
    <template v-else>
      <div v-for="n in store.colorCount" :key="n" class="color-item placeholder">
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
            top: tooltipPosition.y + 'px',
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
  gap: var(--ds-space-2);
}

/* A selectable row: flat input surface, hover darkens, selected is the soft
   accent fill with a 1 px accent border. */
.color-item {
  display: flex;
  align-items: center;
  background: var(--ds-surface-2);
  border-radius: var(--ds-radius-md);
  border: var(--ds-border-width) solid var(--ds-border);
  padding: var(--ds-space-2) var(--ds-space-3);
  cursor: pointer;
  transition: var(--app-transition-colors);
}

.color-item:hover {
  background: var(--ds-surface-3);
  border-color: var(--ds-border-strong);
}

.color-item.selected {
  background: var(--ds-accent-soft);
  border-color: var(--ds-accent);
}

.color-item.placeholder {
  cursor: default;
}

.color-item.placeholder:hover {
  background: var(--ds-surface-2);
  border-color: var(--ds-border);
}

.color-swatch {
  width: var(--ds-control-md);
  height: var(--ds-control-md);
  border-radius: var(--ds-radius-sm);
  margin-right: var(--ds-space-3);
  border: var(--ds-border-width) solid var(--ds-border);
  background: var(--ds-surface-3);
  flex-shrink: 0;
}

.color-info {
  flex: 1;
  min-width: 0;
}

.color-primary {
  font-size: var(--ds-text-sm);
  font-weight: var(--ds-weight-semibold);
  font-variant-numeric: tabular-nums;
  line-height: var(--ds-leading);
  color: var(--ds-text);
  word-break: break-all;
}

.color-secondary {
  font-size: var(--ds-text-xs);
  line-height: var(--ds-leading);
  color: var(--ds-text-2);
}

/* Ghost icon button, 28 px. */
.copy-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--ds-control-sm);
  height: var(--ds-control-sm);
  padding: 0;
  background: transparent;
  border: var(--ds-border-width) solid transparent;
  border-radius: var(--ds-radius-sm);
  color: var(--ds-text-2);
  cursor: pointer;
  transition: var(--app-transition-colors);
}

.copy-btn svg {
  width: var(--ds-icon-sm);
  height: var(--ds-icon-sm);
}

.copy-btn:hover {
  background: var(--ds-surface-1);
  color: var(--ds-text);
}

.copy-btn:focus-visible {
  outline: none;
  box-shadow: var(--ds-focus-ring);
}

.placeholder .color-primary,
.placeholder .color-secondary {
  color: var(--ds-text-3);
}

/* Tooltip: an overlay, so it carries the overlay shadow. */
.color-tooltip {
  position: fixed;
  z-index: var(--ds-z-dialog);
  transform: translate(-50%, -100%);
  display: flex;
  align-items: center;
  gap: var(--ds-space-2);
  padding: var(--ds-space-2) var(--ds-space-3);
  background: var(--ds-surface-1);
  border: var(--ds-border-width) solid var(--ds-border);
  border-radius: var(--ds-radius-md);
  box-shadow: var(--ds-shadow-overlay);
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
  background: var(--ds-surface-1);
  border-right: var(--ds-border-width) solid var(--ds-border);
  border-bottom: var(--ds-border-width) solid var(--ds-border);
}

.tooltip-swatch {
  width: var(--ds-control-sm);
  height: var(--ds-control-sm);
  border-radius: var(--ds-radius-sm);
  border: var(--ds-border-width) solid var(--ds-border);
  flex-shrink: 0;
}

.tooltip-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.tooltip-hex {
  font-size: var(--ds-text-sm);
  font-weight: var(--ds-weight-semibold);
  font-variant-numeric: tabular-nums;
  color: var(--ds-text);
  text-transform: uppercase;
}

.tooltip-hint {
  font-size: var(--ds-text-xs);
  color: var(--ds-text-3);
}

/* Tooltip transitions: fade only. */
.tooltip-enter-active,
.tooltip-leave-active {
  transition: opacity var(--ds-duration) var(--ds-ease);
}

.tooltip-enter-from,
.tooltip-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .color-tooltip {
    max-width: 90vw;
  }
}

@media (max-width: 480px) {
  .color-item {
    padding: var(--ds-space-2);
  }

  .color-swatch {
    width: 32px;
    height: 32px;
    margin-right: var(--ds-space-2);
  }

  .copy-btn {
    width: var(--ds-control-md);
    height: var(--ds-control-md);
  }
}
</style>
