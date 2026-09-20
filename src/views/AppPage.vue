<script setup>
import { ref, computed } from 'vue'
import { usePaletteStore } from '../stores/palette'
import { useI18n } from '../composables/useI18n'
import { useKeyboard } from '../composables/useKeyboard'
import { useToast } from '../composables/useToast'
import ColorList from '../components/ColorList.vue'
import LandingNav from '../components/LandingNav.vue'
import PanelSection from '../components/ui/PanelSection.vue'
import ImageUploader from '../components/ImageUploader.vue'
import MainContent from '../components/MainContent.vue'
import ImageEditPanel from '../components/ImageEditPanel.vue'
import ImagePreviewModal from '../components/ImagePreviewModal.vue'
import ToastContainer from '../components/ToastContainer.vue'
import ToolCrossLink from '../components/ToolCrossLink.vue'

const store = usePaletteStore()
const { t } = useI18n()
const toast = useToast()

// Initialize keyboard shortcuts
useKeyboard()

// Preview modal state
const showPreviewModal = ref(false)

const count = computed({
  get: () => store.colorCount,
  set: (val) => {
    store.setColorCount(val)
    if (store.currentImage) store.extractColors(store.currentImage)
  },
})

const format = computed({
  get: () => store.downloadFormat,
  set: (val) => store.setDownloadFormat(val),
})

const imageFormat = computed({
  get: () => store.imageExportFormat,
  set: (val) => store.setImageExportFormat(val),
})

const imageSize = computed({
  get: () => store.imageExportSize,
  set: (val) => store.setImageExportSize(val),
})

async function handleCopy() {
  const success = await store.copyPalette()
  if (success) {
    toast.show(t('paletteCopied'), 'success')
  } else {
    toast.show(t('clipboardError'), 'error')
  }
}

function handleDownloadTxt() {
  store.downloadPalette()
  toast.show(t('downloadStarted'), 'success')
}

function handleDownloadImage() {
  store.downloadImage()
  toast.show(t('downloadStarted'), 'success')
}
</script>

<template>
  <div class="app-page">
    <!-- App Header Navigation -->
    <LandingNav />

    <div class="app-container">
      <aside class="sidebar">
        <div class="panel-header">
          <h1 class="panel-title">{{ t('extractorPanelTitle') }}</h1>
        </div>

        <PanelSection :title="t('sectionImage')" first>
          <p class="sidebar-hint">{{ t('subtitle') }}</p>
          <ImageUploader />
        </PanelSection>

        <PanelSection :title="t('sectionSettings')">
          <div class="field-row">
            <label for="app-color-count">{{ t('colorCountLabel') }}</label>
            <select id="app-color-count" v-model.number="count" class="field-select">
              <option v-for="n in 20" :key="n" :value="n">{{ n }}</option>
            </select>
          </div>

          <div class="field-row">
            <label for="app-format">{{ t('formatLabel') }}</label>
            <select id="app-format" v-model="format" class="field-select format-select">
              <option v-for="f in store.EXPORT_FORMATS" :key="f.key" :value="f.key">
                {{ t(f.labelKey) }}
              </option>
            </select>
          </div>
        </PanelSection>

        <PanelSection :title="t('paletteTitle')">
          <ColorList />
        </PanelSection>

        <PanelSection v-if="store.hasColors" :title="t('exportTitle')">
          <div class="field-row">
            <label for="app-image-format">{{ t('imageFormatLabel') }}</label>
            <select id="app-image-format" v-model="imageFormat" class="field-select">
              <option value="png">PNG</option>
              <option value="jpeg">JPG</option>
              <option value="webp">WebP</option>
            </select>
          </div>

          <div class="field-row">
            <label for="app-image-size">{{ t('imageSizeLabel') }}</label>
            <select id="app-image-size" v-model="imageSize" class="field-select">
              <option value="small">400px</option>
              <option value="medium">800px</option>
              <option value="large">1200px</option>
              <option value="xlarge">1600px</option>
            </select>
          </div>

          <div class="export-buttons">
            <button class="export-btn export-btn-primary" @click="handleDownloadImage">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
              <span>{{ t('downloadImage') }}</span>
            </button>
            <button class="export-btn" @click="handleDownloadTxt">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>{{ t('downloadPalette') }}</span>
            </button>
            <button class="export-btn" @click="handleCopy">
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
              <span>{{ t('copyPalette') }}</span>
            </button>
          </div>
        </PanelSection>

        <!-- Secondary links, kept visually quiet at the foot of the panel -->
        <div class="sidebar-footer">
          <div class="cross-link-section">
            <ToolCrossLink
              to="/generator"
              :text="t('crossLinkToGeneratorText')"
              :link-text="t('crossLinkToGeneratorCta')"
            />
          </div>

          <div class="donate-section">
            <form
              action="https://www.paypal.com/donate"
              method="post"
              target="_blank"
              class="donate-form"
            >
              <input type="hidden" name="hosted_button_id" value="8RGLGQ2BFMHU6" />
              <button type="submit" class="donate-btn" :title="t('donateTitle')">
                <svg
                  class="paypal-icon"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path
                    d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.77.77 0 0 1 .757-.64h6.406c2.612 0 4.52.64 5.67 1.903.482.53.832 1.132 1.04 1.79.218.693.27 1.506.153 2.418l-.013.082v.738l.575.326c.46.248.833.548 1.118.902.483.6.793 1.363.918 2.265.13.938.07 2.055-.178 3.32-.286 1.457-.758 2.724-1.4 3.762a6.41 6.41 0 0 1-2.073 2.085 7.99 7.99 0 0 1-2.6 1.06c-.926.208-1.96.312-3.07.312H11.1a.947.947 0 0 0-.935.796l-.048.3-.61 3.865-.038.188a.946.946 0 0 1-.935.796H7.076z"
                  />
                </svg>
                <span>{{ t('donate') }}</span>
              </button>
            </form>
          </div>
        </div>
      </aside>

      <MainContent />
      <ImageEditPanel @open-preview="showPreviewModal = true" />
      <ImagePreviewModal :show="showPreviewModal" @close="showPreviewModal = false" />
      <ToastContainer />
    </div>
  </div>
</template>

<style scoped>
.cross-link-section {
  padding-top: 18px;
  border-top: 1px solid var(--border-light);
  transition: border-color 0.3s ease;
}

.donate-section {
  margin-top: 14px;
}

.donate-form {
  display: flex;
}

.donate-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 10px 16px;
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.donate-btn:hover {
  background: var(--bg-hover);
  border-color: #0070ba;
  color: #0070ba;
}

.donate-btn:hover .paypal-icon {
  color: #0070ba;
}

.paypal-icon {
  transition: color 0.2s ease;
}

/* Wide screens: spend some of the empty canvas margin on the panel so the
   colour cards and settings breathe instead of wrapping. */
@media (max-width: 480px) {
  .donate-btn {
    padding: 12px 16px;
    font-size: 14px;
    min-height: 44px;
  }
}
</style>
