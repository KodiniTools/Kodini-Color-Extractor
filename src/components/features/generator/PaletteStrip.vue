<script setup>
import { useI18n } from '../../../composables/useI18n'
import { displayHex, displayLight } from '../../../lib/core/colorGenerator'

const { t } = useI18n()

defineProps({
  palette: { type: Array, required: true },
  isSelected: { type: Function, required: true },
})

const emit = defineEmits(['select', 'toggle-lock', 'copy'])
</script>

<template>
  <main class="palette-strip" :style="{ '--cols': palette.length }">
    <div
      v-for="(color, index) in palette"
      :key="index"
      class="swatch"
      :class="{
        'swatch--light': displayLight(color),
        'swatch--locked': color.locked,
        'swatch--selected': isSelected(index),
      }"
      :style="{ background: displayHex(color) }"
      @click="emit('select', index)"
    >
      <div class="swatch-actions">
        <button
          class="swatch-action"
          :class="{ 'is-active': color.locked }"
          :title="color.locked ? t('genUnlock') : t('genLock')"
          @click.stop="emit('toggle-lock', index)"
        >
          <svg
            v-if="color.locked"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          <svg
            v-else
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 9.9-1"></path>
          </svg>
        </button>
      </div>

      <button class="swatch-hex" :title="t('genClickCopy')" @click.stop="emit('copy', color)">
        {{ displayHex(color) }}
      </button>
    </div>
  </main>
</template>

<style scoped>
/* Palette strip — aligned to the same content width as the adjustments panel
   and rendered as a tidy, rounded card so it never outgrows its container. */
.palette-strip {
  max-width: 720px;
  width: 100%;
  margin: 0 auto 40px;
  display: grid;
  grid-template-columns: repeat(var(--cols), minmax(0, 1fr));
  min-height: 340px;
  gap: 0;
  border: 1px solid var(--border-light);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 6px 24px var(--shadow-soft);
}

.swatch {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  min-width: 0;
  padding: 20px 8px 28px;
  color: #ffffff;
  cursor: pointer;
  transition: background 0.35s ease;
}

.swatch--light {
  color: #1a1a2e;
}

/* Selected color: a fixed, identical double ring (white over dark) so the
   marker looks exactly the same and stays clearly visible on every color,
   regardless of the swatch's brightness. Raised above neighbors so adjacent
   selections never merge into uneven bands. */
.swatch--selected {
  z-index: 1;
  box-shadow:
    inset 0 0 0 3px #ffffff,
    inset 0 0 0 6px rgba(17, 17, 17, 0.85);
}

/* Locked colors are protected from the sliders and are not selectable */
.swatch--locked {
  cursor: default;
}

.swatch-actions {
  position: absolute;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.swatch:hover .swatch-actions,
.swatch:focus-within .swatch-actions,
.swatch--locked .swatch-actions {
  opacity: 1;
}

.swatch-action {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: inherit;
  cursor: pointer;
  transition: background 0.2s ease;
}

.swatch-action:hover {
  background: rgba(127, 127, 127, 0.22);
}

.swatch-action.is-active {
  background: rgba(127, 127, 127, 0.22);
}

.swatch-hex {
  border: none;
  background: transparent;
  color: inherit;
  font-family: inherit;
  font-size: clamp(14px, 1.4vw, 18px);
  font-weight: 700;
  letter-spacing: 0.06em;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 8px;
  transition: background 0.2s ease;
}

.swatch-hex:hover {
  background: rgba(127, 127, 127, 0.18);
}

/* Responsive: stack swatches vertically on small screens */
@media (max-width: 700px) {
  .palette-strip {
    grid-template-columns: 1fr;
    grid-auto-rows: minmax(74px, 1fr);
    min-height: 0;
    margin: 0 16px 24px;
    width: auto;
  }

  .swatch {
    flex-direction: row;
    justify-content: space-between;
    padding: 14px 20px;
  }

  .swatch-actions {
    position: static;
    transform: none;
    opacity: 1;
  }

  .swatch-hex {
    font-size: 16px;
  }
}
</style>
