<script setup>
import { useI18n } from '../composables/useI18n'
import { useColorGenerator } from '../composables/useColorGenerator'
import LandingNav from '../components/LandingNav.vue'
import ToastContainer from '../components/ToastContainer.vue'
import ToolCrossLink from '../components/ToolCrossLink.vue'
import GeneratorHeader from '../components/features/generator/GeneratorHeader.vue'
import AdjustmentsPanel from '../components/features/generator/AdjustmentsPanel.vue'
import PaletteStrip from '../components/features/generator/PaletteStrip.vue'

const { t } = useI18n()

// All generator state and behaviour lives in the composable; this view only
// wires the sub-components together.
const {
  harmonyModes,
  ADJUST_FIELDS,
  mode,
  count,
  palette,
  scope,
  anyLocked,
  canPick,
  pickerHex,
  activeAdjust,
  activeLocked,
  hasActiveAdjust,
  selectedCount,
  isSelected,
  canUndo,
  canRedo,
  generate,
  toggleLock,
  selectScope,
  onAllScope,
  clearScope,
  setColorFromHex,
  setAdjust,
  resetAdjust,
  resetAdjustField,
  copyColor,
  copyAll,
  copySelected,
  setCount,
  EXPORT_FORMATS,
  exportFormat,
  setExportFormat,
  downloadPalette,
  undo,
  redo,
} = useColorGenerator()
</script>

<template>
  <div class="generator-page">
    <LandingNav />

    <GeneratorHeader
      v-model:mode="mode"
      :count="count"
      :harmony-modes="harmonyModes"
      :export-format="exportFormat"
      :export-formats="EXPORT_FORMATS"
      @generate="generate"
      @set-count="setCount"
      @copy-all="copyAll"
      @set-export-format="setExportFormat"
      @download="downloadPalette"
    />

    <p class="gen-hint">{{ t('genSpaceHint') }}</p>

    <AdjustmentsPanel
      :palette="palette"
      :scope="scope"
      :selected-count="selectedCount"
      :any-locked="anyLocked"
      :active-adjust="activeAdjust"
      :active-locked="activeLocked"
      :can-pick="canPick"
      :picker-hex="pickerHex"
      :has-active-adjust="hasActiveAdjust"
      :adjust-fields="ADJUST_FIELDS"
      :is-selected="isSelected"
      :can-undo="canUndo"
      :can-redo="canRedo"
      @all-scope="onAllScope"
      @select-scope="selectScope"
      @clear-scope="clearScope"
      @copy-selected="copySelected"
      @reset="resetAdjust"
      @reset-field="resetAdjustField"
      @pick="setColorFromHex"
      @set-adjust="setAdjust"
      @undo="undo"
      @redo="redo"
    />

    <PaletteStrip
      :palette="palette"
      :is-selected="isSelected"
      @select="selectScope"
      @toggle-lock="toggleLock"
      @copy="copyColor"
    />

    <div class="gen-cross-link">
      <ToolCrossLink
        to="/app"
        :text="t('crossLinkToAppText')"
        :link-text="t('crossLinkToAppCta')"
      />
    </div>

    <ToastContainer />
  </div>
</template>

<style scoped>
.generator-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  transition: background 0.3s ease;
}

.gen-hint {
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 0 24px 16px;
  font-size: 13px;
  text-align: center;
  color: var(--text-tertiary);
  transition: color 0.3s ease;
}

.gen-cross-link {
  max-width: 1200px;
  width: 100%;
  margin: -16px auto 0;
  padding: 0 24px 40px;
}

@media (max-width: 700px) {
  .gen-hint {
    padding: 0 16px 12px;
  }

  .gen-cross-link {
    padding: 0 16px 32px;
  }
}
</style>
