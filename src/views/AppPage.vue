<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
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
import ContrastDialog from '../components/ContrastDialog.vue'
import ColorVisionDialog from '../components/ColorVisionDialog.vue'
import PaletteLibraryDialog from '../components/PaletteLibraryDialog.vue'
import { usePaletteLibrary } from '../composables/usePaletteLibrary'
import { encodePaletteHash } from '../lib/core/paletteLink'
import { sendToCollageMaker } from '../lib/core/collageHandoff'

const store = usePaletteStore()
const router = useRouter()
const { t } = useI18n()
const toast = useToast()
const library = usePaletteLibrary()

// Initialize keyboard shortcuts
useKeyboard()

// Preview modal state
const showPreviewModal = ref(false)
const showContrast = ref(false)
const showVision = ref(false)
const showLibrary = ref(false)
const paletteHexes = computed(() => store.colors.map((c) => c.hex))

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
    recordUse()
  } else {
    toast.show(t('clipboardError'), 'error')
  }
}

function handleDownloadTxt() {
  store.downloadPalette()
  toast.show(t('downloadStarted'), 'success')
  recordUse()
}

// Copying, downloading and handing over count as using a palette: it goes
// into the recently used list.
function recordUse() {
  library.record(paletteHexes.value, 'extractor')
}

function openSaved(hexes) {
  showLibrary.value = false
  router.push({ name: 'generator', hash: `#${encodePaletteHash(hexes)}` })
}

// Hands the extracted colors to the generator, which opens them locked.
function openInGenerator() {
  const hash = encodePaletteHash(paletteHexes.value)
  recordUse()
  router.push({ name: 'generator', hash: `#${hash}` })
}

// The Collage Maker is another app on the same site, so this is a full page
// load; the image and the palette card travel through localStorage.
function sendToCollage() {
  const url = sendToCollageMaker(store.handoffCanvases())
  if (!url) {
    toast.show(t('sendToCollageError'), 'error')
    return
  }
  recordUse()
  window.location.assign(url)
}

function handleDownloadImage() {
  store.downloadImage()
  toast.show(t('downloadStarted'), 'success')
  recordUse()
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
            <button class="export-btn" @click="handleDownloadImage">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.75"
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
                stroke-width="1.75"
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
                stroke-width="1.75"
              >
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              <span>{{ t('copyPalette') }}</span>
            </button>
            <button class="export-btn" @click="openInGenerator">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.75"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
              <span>{{ t('openInGenerator') }}</span>
            </button>
            <button class="export-btn" data-testid="send-to-collage" @click="sendToCollage">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.75"
                stroke-linejoin="round"
              >
                <rect x="3" y="3" width="8" height="10" rx="1" />
                <rect x="13" y="3" width="8" height="6" rx="1" />
                <rect x="13" y="11" width="8" height="10" rx="1" />
                <rect x="3" y="15" width="8" height="6" rx="1" />
              </svg>
              <span>{{ t('sendToCollage') }}</span>
            </button>
            <button class="export-btn" @click="showContrast = true">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.75"
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" />
              </svg>
              <span>{{ t('contrastOpen') }}</span>
            </button>
            <button class="export-btn" @click="showVision = true">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.75"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <span>{{ t('visionOpen') }}</span>
            </button>
            <button class="export-btn" @click="showLibrary = true">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.75"
                stroke-linejoin="round"
              >
                <polygon
                  points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
                />
              </svg>
              <span>{{ t('libraryOpen') }}</span>
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
        </div>
      </aside>

      <MainContent />
      <ImageEditPanel @open-preview="showPreviewModal = true" />
      <ImagePreviewModal :show="showPreviewModal" @close="showPreviewModal = false" />
      <ContrastDialog :show="showContrast" :colors="paletteHexes" @close="showContrast = false" />
      <ColorVisionDialog :show="showVision" :colors="paletteHexes" @close="showVision = false" />
      <PaletteLibraryDialog
        :show="showLibrary"
        :colors="paletteHexes"
        source="extractor"
        @close="showLibrary = false"
        @open="openSaved"
      />
      <ToastContainer />
    </div>
  </div>
</template>

<style scoped>
.cross-link-section {
  padding-top: var(--ds-space-4);
  border-top: var(--ds-border-width) solid var(--ds-border);
}
</style>
