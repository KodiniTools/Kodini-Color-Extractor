<script setup>
import { useI18n } from '../composables/useI18n'
import { useColorGenerator } from '../composables/useColorGenerator'
import ToastContainer from '../components/ToastContainer.vue'
import ToolCrossLink from '../components/ToolCrossLink.vue'
import PanelSection from '../components/ui/PanelSection.vue'
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

// Changing the harmony updates the mode and regenerates in one go.
function onModeChange(event) {
  mode.value = event.target.value
  generate()
}
</script>

<template>
  <div class="app-page">
    <header class="app-header">
      <div class="header-left">
        <router-link to="/" class="back-link">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          <span>{{ t('navHome') }}</span>
        </router-link>
      </div>
      <div class="header-center">
        <h1 class="header-title">{{ t('genTitle') }}</h1>
      </div>
      <div class="header-right">
        <router-link to="/app" class="header-link">{{ t('navApp') }}</router-link>
        <router-link to="/faq" class="header-link">{{ t('navFaq') }}</router-link>
      </div>
    </header>

    <div class="app-container">
      <aside class="sidebar">
        <div class="panel-header">
          <h2 class="panel-title">{{ t('genPanelTitle') }}</h2>
        </div>

        <PanelSection :title="t('genSectionCreate')" first>
          <p class="sidebar-hint">{{ t('genSubtitle') }}</p>
          <button class="export-btn export-btn-primary" @click="generate">
            {{ t('genGenerate') }}
          </button>
          <p class="sidebar-note">{{ t('genSpaceHint') }}</p>
        </PanelSection>

        <PanelSection :title="t('sectionSettings')">
          <div class="field-row">
            <label for="gen-harmony">{{ t('genHarmony') }}</label>
            <select id="gen-harmony" :value="mode" class="field-select" @change="onModeChange">
              <option v-for="m in harmonyModes" :key="m" :value="m">
                {{ t('genMode_' + m) }}
              </option>
            </select>
          </div>

          <div class="field-row">
            <label for="gen-count">{{ t('genCount') }}</label>
            <select
              id="gen-count"
              :value="count"
              class="field-select"
              @change="setCount(Number($event.target.value))"
            >
              <option v-for="n in [3, 4, 5, 6, 7, 8]" :key="n" :value="n">{{ n }}</option>
            </select>
          </div>
        </PanelSection>

        <PanelSection :title="t('exportTitle')">
          <div class="field-row">
            <label for="gen-export-format">{{ t('genExportFormat') }}</label>
            <select
              id="gen-export-format"
              :value="exportFormat"
              class="field-select"
              @change="setExportFormat($event.target.value)"
            >
              <option v-for="f in EXPORT_FORMATS" :key="f.key" :value="f.key">
                {{ t(f.labelKey) }}
              </option>
            </select>
          </div>

          <div class="export-buttons">
            <button class="export-btn" @click="downloadPalette">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>{{ t('genDownload') }}</span>
            </button>
            <button class="export-btn" @click="copyAll">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              <span>{{ t('genCopyAll') }}</span>
            </button>
          </div>
        </PanelSection>

        <div class="sidebar-footer">
          <div class="cross-link-section">
            <ToolCrossLink
              to="/app"
              :text="t('crossLinkToAppText')"
              :link-text="t('crossLinkToAppCta')"
            />
          </div>
        </div>
      </aside>

      <main class="workspace-main">
        <PaletteStrip
          :palette="palette"
          :is-selected="isSelected"
          @select="selectScope"
          @toggle-lock="toggleLock"
          @copy="copyColor"
        />
      </main>

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

      <ToastContainer />
    </div>
  </div>
</template>

<style scoped>
/* The workspace shell itself lives in assets/main.css and is shared with the
   extractor; only what is specific to this page stays here. */
.sidebar-note {
  margin: 0;
  font-size: 12px;
  color: var(--text-tertiary);
  transition: color 0.3s ease;
}

.cross-link-section {
  padding-top: 18px;
  border-top: 1px solid var(--border-light);
  transition: border-color 0.3s ease;
}
</style>
