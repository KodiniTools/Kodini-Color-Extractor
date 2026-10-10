<script setup>
import { computed } from 'vue'
import { useI18n } from '../../../composables/useI18n'
import { displayHex, displayLight, displayRgb } from '../../../lib/core/colorGenerator'
import { formatColor, paletteEntry } from '../../../lib/core/paletteExport'

const { t } = useI18n()

const props = defineProps({
  palette: { type: Array, required: true },
  isSelected: { type: Function, required: true },
  /** Export format the labels are written in, so the strip shows what you get. */
  format: { type: String, default: 'hex' },
})

/** The swatch label in the selected notation (HEX for formats without one). */
function swatchLabel(color, index) {
  const rgb = displayRgb(color)
  return formatColor(paletteEntry(displayHex(color), rgb), props.format, index)
}

// Code-shaped formats produce a much longer label than a bare HEX value.
const longLabel = computed(() => ['css', 'scss', 'tailwind'].includes(props.format))

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
            stroke-width="1.75"
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
            stroke-width="1.75"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 9.9-1"></path>
          </svg>
        </button>
      </div>

      <button
        class="swatch-hex"
        :class="{ 'swatch-hex--long': longLabel }"
        :title="t('genClickCopy')"
        @click.stop="emit('copy', color)"
      >
        {{ swatchLabel(color, index) }}
      </button>
    </div>
  </main>
</template>

<style scoped>
/* Sits at the top of the workspace at half its height, flat, bordered, no
   shadow. align-self keeps the top edge where the full-height strip started
   instead of letting the shared, centring workspace shell move it down. */
.palette-strip {
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
  align-self: flex-start;
  display: grid;
  grid-template-columns: repeat(var(--cols), minmax(0, 1fr));
  min-height: 170px;
  height: 50%;
  gap: 0;
  border: var(--ds-border-width) solid var(--ds-border);
  border-radius: var(--ds-radius-lg);
  overflow: hidden;
}

.swatch {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  min-width: 0;
  padding: var(--ds-space-5) var(--ds-space-2) var(--ds-space-6);
  color: #ffffff;
  cursor: pointer;
  transition: background-color var(--ds-duration-slow) var(--ds-ease);
}

/* Light swatches take the dark ink that also sits on the gold accent. */
.swatch--light {
  color: var(--ds-on-accent);
}

/* Selected color: a fixed, identical double ring (white over dark ink) so the
   marker looks the same and stays visible on every color. Raised above
   neighbors so adjacent selections never merge into uneven bands. */
.swatch--selected {
  z-index: 1;
  box-shadow:
    inset 0 0 0 3px #ffffff,
    inset 0 0 0 6px var(--ds-on-accent);
}

/* Locked colors are protected from the sliders and are not selectable */
.swatch--locked {
  cursor: default;
}

.swatch-actions {
  position: absolute;
  top: var(--ds-space-4);
  left: 50%;
  transform: translateX(-50%);
  opacity: 0;
  transition: opacity var(--ds-duration) var(--ds-ease);
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
  width: var(--ds-control-lg);
  height: var(--ds-control-lg);
  border: none;
  border-radius: var(--ds-radius-full);
  background: transparent;
  color: inherit;
  cursor: pointer;
  transition: var(--app-transition-colors);
}

.swatch-action svg {
  width: var(--ds-icon-md);
  height: var(--ds-icon-md);
}

.swatch-action:hover,
.swatch-action.is-active {
  background: rgba(127, 127, 127, 0.22);
}

.swatch-action:focus-visible {
  outline: none;
  box-shadow: var(--ds-focus-ring);
}

.swatch-hex {
  max-width: 100%;
  overflow-wrap: anywhere;
  border: none;
  background: transparent;
  color: inherit;
  font-family: inherit;
  font-size: clamp(var(--ds-text-md), 1.4vw, var(--ds-text-lg));
  font-weight: var(--ds-weight-bold);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.06em;
  cursor: pointer;
  padding: var(--ds-space-2) var(--ds-space-3);
  border-radius: var(--ds-radius-md);
  transition: var(--app-transition-colors);
}

/* CSS/SCSS/Tailwind labels are several times longer than a HEX value and
   have to stay inside a swatch that is only a fraction of the strip. */
.swatch-hex--long {
  font-size: clamp(var(--ds-text-xs), 0.85vw, var(--ds-text-sm));
  letter-spacing: 0.02em;
}

.swatch-hex:hover {
  background: rgba(127, 127, 127, 0.18);
}

.swatch-hex:focus-visible {
  outline: none;
  box-shadow: var(--ds-focus-ring);
}

/* Responsive: stack swatches vertically on small screens */
@media (max-width: 700px) {
  .palette-strip {
    grid-template-columns: 1fr;
    grid-auto-rows: minmax(74px, 1fr);
    min-height: 0;
    /* The workspace column supplies the gutter now; `width: auto` inside its
       centred flex box collapsed the strip to its content width. */
    width: 100%;
    height: auto;
    margin: 0;
  }

  .swatch {
    flex-direction: row;
    justify-content: space-between;
    padding: var(--ds-space-3) var(--ds-space-5);
  }

  .swatch-actions {
    position: static;
    transform: none;
    opacity: 1;
  }

  .swatch-hex {
    font-size: var(--ds-text-lg);
  }
}
</style>
