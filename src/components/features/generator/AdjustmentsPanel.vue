<script setup>
import { useI18n } from '../../../composables/useI18n'
import { displayHex } from '../../../lib/core/colorGenerator'
import SliderField from '../../ui/SliderField.vue'
import PanelSection from '../../ui/PanelSection.vue'

const { t } = useI18n()

const props = defineProps({
  palette: { type: Array, required: true },
  scope: { type: [String, Array], required: true },
  selectedCount: { type: Number, required: true },
  anyLocked: { type: Boolean, required: true },
  activeAdjust: { type: Object, required: true },
  activeLocked: { type: Boolean, required: true },
  canPick: { type: Boolean, required: true },
  pickerHex: { type: String, required: true },
  hasActiveAdjust: { type: Boolean, required: true },
  adjustFields: { type: Array, required: true },
  isSelected: { type: Function, required: true },
  canUndo: { type: Boolean, required: true },
  canRedo: { type: Boolean, required: true },
})

const emit = defineEmits([
  'all-scope',
  'select-scope',
  'clear-scope',
  'copy-selected',
  'reset',
  'reset-field',
  'pick',
  'set-adjust',
  'undo',
  'redo',
])

/** Translated name of an adjustment field, used in labels and titles. */
function fieldLabel(f) {
  return t(f.key)
}

/** Current value of a field, falling back to its neutral default. */
function fieldValue(f) {
  const v = Number(props.activeAdjust[f.key])
  return Number.isFinite(v) ? v : f.def
}
</script>

<template>
  <!-- Filter adjustments: edit a single color or all of them together -->
  <aside class="gen-adjust">
    <div class="panel-header">
      <h2 class="panel-title">{{ t('genAdjustments') }}</h2>
    </div>

    <div class="history-actions">
      <button
        class="btn-history"
        :disabled="!canUndo"
        :title="t('undoTitle')"
        @click="emit('undo')"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
          <path d="M3 7v6h6" />
          <path d="M3 13C5.33 7.5 10 4 16 4a9 9 0 0 1 0 18H8" />
        </svg>
        {{ t('undo') }}
      </button>
      <button
        class="btn-history"
        :disabled="!canRedo"
        :title="t('redoTitle')"
        @click="emit('redo')"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
          <path d="M21 7v6h-6" />
          <path d="M21 13C18.67 7.5 14 4 8 4a9 9 0 0 0 0 18h8" />
        </svg>
        {{ t('redo') }}
      </button>
      <button
        class="btn-history btn-reset"
        :disabled="!hasActiveAdjust || activeLocked"
        :title="t('reset')"
        @click="emit('reset')"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
        </svg>
        {{ t('reset') }}
      </button>
    </div>

    <p v-if="activeLocked" class="adjust-locked-note">{{ t('genLockedHint') }}</p>

    <PanelSection :title="t('genSectionPick')" first>
      <div class="adjust-scope">
        <div class="scope-tabs" role="group" :aria-label="t('genAdjustScope')">
          <button
            class="scope-tab"
            :class="{
              'scope-tab--active': scope === 'all',
              'scope-tab--muted': anyLocked,
            }"
            :title="anyLocked ? t('genUnlockAllHint') : null"
            @click="emit('all-scope')"
          >
            {{ t('genScopeAll') }}
          </button>
          <button
            v-for="(color, index) in palette"
            :key="index"
            class="scope-dot"
            :class="{
              'scope-dot--active': isSelected(index),
              'scope-dot--locked': color.locked,
            }"
            :style="{ background: displayHex(color) }"
            :disabled="color.locked"
            :title="
              color.locked ? t('genLockedHint') : t('genScopeColor').replace('{n}', index + 1)
            "
            :aria-label="t('genScopeColor').replace('{n}', index + 1)"
            @click="emit('select-scope', index)"
          ></button>
        </div>
        <span v-if="selectedCount > 0" class="scope-count" aria-live="polite">
          {{ t('genSelectedCount').replace('{n}', selectedCount) }}
        </span>
      </div>

      <!-- Colour picker (native input includes the browser's eyedropper).
         Always visible; enabled once a single colour field is selected
         (disabled with a hint in "all" mode). -->
      <div class="adjust-picker">
        <span class="adjust-picker-label">{{ t('genPickColor') }}</span>
        <label
          class="color-well"
          :class="{ 'color-well--disabled': !canPick }"
          :style="canPick ? { background: pickerHex } : null"
          :title="canPick ? t('genPickColor') : t('genPickHint')"
        >
          <input
            type="color"
            :value="canPick ? pickerHex : '#000000'"
            :disabled="!canPick"
            @input="emit('pick', $event.target.value)"
          />
        </label>
        <span class="adjust-picker-hex">{{ canPick ? pickerHex : '—' }}</span>
        <span v-if="selectedCount > 1" class="adjust-picker-hint">{{ t('genMultiHint') }}</span>
        <span v-else-if="!canPick" class="adjust-picker-hint">{{ t('genPickHint') }}</span>

        <!-- Selection actions: copy just the chosen colors, or clear the selection.
           Only shown while at least one color is selected. -->
        <div v-if="scope !== 'all'" class="adjust-actions">
          <button
            class="adjust-action-btn adjust-action-btn--primary"
            :title="t('genCopySelected')"
            @click="emit('copy-selected')"
          >
            {{ t('genCopySelected') }} ({{ selectedCount }})
          </button>
          <button
            class="adjust-action-btn"
            :title="t('genClearScope')"
            @click="emit('clear-scope')"
          >
            {{ t('genClearScope') }}
          </button>
        </div>
      </div>
    </PanelSection>

    <PanelSection :title="t('genSectionFilters')">
      <div class="adjust-sliders">
        <!-- Slider, number spinner (type or hold the arrows) and a reset to
           this control's neutral value only -->
        <SliderField
          v-for="f in adjustFields"
          :key="f.key"
          class="adjust-field"
          :model-value="fieldValue(f)"
          :min="f.min"
          :max="f.max"
          :step="f.step || 1"
          :unit="f.unit"
          :default-value="f.def"
          :disabled="activeLocked"
          :label="fieldLabel(f)"
          :input-id="`adjust-slider-${f.key}`"
          :variant="f.key === 'hue' ? 'hue' : 'default'"
          @update:model-value="emit('set-adjust', f.key, $event)"
          @reset="emit('reset-field', f.key)"
        />
      </div>
    </PanelSection>
  </aside>
</template>

<style scoped>
/* Right-hand panel of the workspace, matching the extractor's image panel:
   flat surface, one border, sticky beside the canvas. */
.gen-adjust {
  width: 320px;
  min-width: 320px;
  background: var(--ds-surface-1);
  padding: var(--ds-space-5);
  display: flex;
  flex-direction: column;
  border-left: var(--ds-border-width) solid var(--ds-border);
  overflow-y: auto;
  position: sticky;
  top: var(--workspace-top, 60px);
  height: calc(100vh - var(--workspace-top, 60px));
  align-self: flex-start;
  transition: var(--app-transition-colors);
}

.adjust-scope {
  display: flex;
  align-items: center;
  gap: var(--ds-space-3);
  flex-wrap: wrap;
}

.scope-tabs {
  display: flex;
  align-items: center;
  gap: var(--ds-space-2);
  flex-wrap: wrap;
}

/* Live count of selected colors, updates as the selection changes */
.scope-count {
  display: inline-flex;
  align-items: center;
  height: 20px;
  padding: 0 calc(var(--ds-space-2) - 1px);
  border-radius: var(--ds-radius-full);
  background: var(--ds-surface-2);
  color: var(--ds-text-2);
  font-size: var(--ds-text-xs);
  font-weight: var(--ds-weight-semibold);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

/* Scope toggle: a pill; "on" shows as the primary surface. */
.scope-tab {
  display: inline-flex;
  align-items: center;
  height: var(--ds-control-sm);
  padding: 0 var(--ds-space-3);
  border: var(--ds-border-width) solid var(--ds-border-strong);
  border-radius: var(--ds-radius-full);
  background: var(--ds-surface-2);
  color: var(--ds-text-2);
  font-size: var(--ds-text-sm);
  font-weight: var(--ds-weight-medium);
  line-height: 1;
  cursor: pointer;
  transition: var(--app-transition-colors);
}

.scope-tab:hover {
  background: var(--ds-surface-3);
  color: var(--ds-text);
}

.scope-tab:focus-visible {
  outline: none;
  box-shadow: var(--ds-focus-ring);
}

.scope-tab--active {
  background: var(--ds-accent);
  border-color: transparent;
  color: var(--ds-on-accent);
  font-weight: var(--ds-weight-semibold);
}

.scope-tab--active:not(.scope-tab--muted):hover {
  background: var(--ds-accent-hover);
  color: var(--ds-on-accent);
}

/* "All colors" looks deactivated while individual colors are locked:
   an unfilled, dashed toggle. */
.scope-tab--muted {
  background: var(--ds-surface-2);
  border-color: var(--ds-border-strong);
  border-style: dashed;
  color: var(--ds-text-2);
  font-weight: var(--ds-weight-medium);
}

.scope-tab--muted:hover {
  color: var(--ds-text);
  background: var(--ds-surface-3);
}

/* Color dots: a 1 px ring in rest, the ink colour when active. */
.scope-dot {
  width: 26px;
  height: 26px;
  padding: 0;
  border: 2px solid var(--ds-surface-1);
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 0 0 1px var(--ds-border-strong);
  transition:
    border-color var(--ds-duration) var(--ds-ease),
    box-shadow var(--ds-duration) var(--ds-ease);
}

.scope-dot:hover {
  box-shadow: 0 0 0 1px var(--ds-text-3);
}

.scope-dot:focus-visible {
  outline: none;
  box-shadow: var(--ds-focus-ring);
}

.scope-dot--active {
  box-shadow: 0 0 0 2px var(--ds-text);
}

.scope-dot--locked {
  opacity: 0.4;
  cursor: not-allowed;
}

.adjust-sliders {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--ds-space-3);
}

.adjust-locked-note {
  margin: 0 0 var(--ds-space-3);
  font-size: var(--ds-text-sm);
  line-height: var(--ds-leading);
  color: var(--ds-text-3);
}

/* Colour picker row */
.adjust-picker {
  display: flex;
  align-items: center;
  gap: var(--ds-space-2);
  flex-wrap: wrap;
  min-height: var(--ds-control-md);
}

.adjust-picker-label {
  font-size: var(--ds-text-sm);
  font-weight: var(--ds-weight-medium);
  color: var(--ds-text-2);
}

/* Native colour input rendered as a small square swatch */
.color-well {
  position: relative;
  display: inline-block;
  width: var(--ds-control-md);
  height: var(--ds-control-md);
  border-radius: var(--ds-radius-md);
  border: var(--ds-border-width) solid var(--ds-border-strong);
  box-shadow: inset 0 0 0 2px var(--ds-surface-1);
  cursor: pointer;
  overflow: hidden;
  transition: border-color var(--ds-duration) var(--ds-ease);
}

.color-well:hover {
  border-color: var(--ds-text-3);
}

.color-well:focus-within {
  border-color: var(--ds-accent);
  box-shadow:
    inset 0 0 0 2px var(--ds-surface-1),
    var(--ds-focus-ring);
}

.color-well input[type='color'] {
  position: absolute;
  inset: -4px;
  width: calc(100% + 8px);
  height: calc(100% + 8px);
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  opacity: 0;
}

/* No colour selected yet: the well is an inert, striped placeholder */
.color-well--disabled {
  cursor: not-allowed;
  background: repeating-linear-gradient(
    45deg,
    var(--ds-surface-3),
    var(--ds-surface-3) 5px,
    var(--ds-surface-1) 5px,
    var(--ds-surface-1) 10px
  );
}

.color-well--disabled input[type='color'] {
  cursor: not-allowed;
}

.adjust-picker-hex {
  font-size: var(--ds-text-sm);
  font-weight: var(--ds-weight-semibold);
  color: var(--ds-text);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.04em;
}

.adjust-picker-hint {
  font-size: var(--ds-text-sm);
  color: var(--ds-text-3);
}

/* Selection actions: "Copy selected" and "Clear selection". Pushed to the
   far right of the picker row; only shown while colors are selected. */
.adjust-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: var(--ds-space-2);
  flex-wrap: wrap;
}

/* Secondary pills: the scope toggle already holds the view's gold. */
.adjust-action-btn {
  display: inline-flex;
  align-items: center;
  height: var(--ds-control-sm);
  padding: 0 var(--ds-space-3);
  border: var(--ds-border-width) solid var(--ds-border-strong);
  border-radius: var(--ds-radius-full);
  background: var(--ds-surface-2);
  color: var(--ds-text);
  font-size: var(--ds-text-sm);
  font-weight: var(--ds-weight-medium);
  line-height: 1;
  cursor: pointer;
  transition: var(--app-transition-colors);
}

.adjust-action-btn:hover {
  background: var(--ds-surface-3);
}

.adjust-action-btn:focus-visible {
  outline: none;
  box-shadow: var(--ds-focus-ring);
}

.adjust-action-btn--primary {
  font-weight: var(--ds-weight-semibold);
}

/* Wide screens: a wider panel gives the sliders a longer, finer track. */
@media (min-width: 1600px) {
  .gen-adjust {
    width: 400px;
    min-width: 400px;
  }
}

/* Stacked layout: a normal full-width block again, not a viewport-height
   frame pinned to the side of the workspace. */
@media (max-width: 1200px) {
  .gen-adjust {
    width: 100%;
    min-width: 100%;
    position: static;
    height: auto;
    max-height: none;
    overflow-y: visible;
    border-left: none;
    border-top: var(--ds-border-width) solid var(--ds-border);
  }
}

@media (max-width: 700px) {
  .gen-adjust {
    padding: var(--ds-space-4);
  }
}
</style>
