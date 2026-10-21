<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from '../../composables/useI18n'
import { filesToGalleryImages } from '../../lib/core/galleryUpload'
import type { HandoffImage } from '../../stores/handoff'

const emit = defineEmits<{ add: [images: HandoffImage[], skipped: number] }>()
const { t } = useI18n()

const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const isProcessing = ref(false)

function openPicker() {
  if (!isProcessing.value) fileInput.value?.click()
}

async function addFiles(files: FileList | null | undefined) {
  if (!files || files.length === 0 || isProcessing.value) return
  isProcessing.value = true
  try {
    const { images, skipped } = await filesToGalleryImages(files)
    emit('add', images, skipped)
  } finally {
    isProcessing.value = false
  }
}

async function handleChange(e: Event) {
  const input = e.target as HTMLInputElement
  await addFiles(input.files)
  // Same file again must trigger change once more.
  input.value = ''
}

async function handleDrop(e: DragEvent) {
  isDragging.value = false
  await addFiles(e.dataTransfer?.files)
}
</script>

<template>
  <div
    class="gallery-upload"
    :class="{ dragging: isDragging, processing: isProcessing }"
    role="button"
    tabindex="0"
    :aria-busy="isProcessing"
    :aria-label="t('galleryUploadTitle')"
    data-testid="gallery-upload"
    @click="openPicker"
    @keydown.enter.prevent="openPicker"
    @keydown.space.prevent="openPicker"
    @dragover.prevent="isDragging = true"
    @dragleave="isDragging = false"
    @drop.prevent="handleDrop"
  >
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      multiple
      class="file-input"
      @change="handleChange"
    />
    <svg
      class="upload-icon"
      :class="{ spinning: isProcessing }"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.75"
      aria-hidden="true"
    >
      <path v-if="isProcessing" d="M21 12a9 9 0 1 1-6.219-8.56" />
      <template v-else>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </template>
    </svg>
    <span class="upload-title">{{ t('galleryUploadTitle') }}</span>
    <span class="upload-hint">{{ t('galleryUploadHint') }}</span>
  </div>
</template>

<style scoped>
/* A dashed drop zone on the page surface; dragging strengthens border and fill. */
.gallery-upload {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--ds-space-1);
  padding: var(--ds-space-6) var(--ds-space-5);
  background: var(--ds-surface-1);
  border: var(--ds-border-width) dashed var(--ds-border-strong);
  border-radius: var(--ds-radius-md);
  color: var(--ds-text-2);
  text-align: center;
  cursor: pointer;
  transition: var(--app-transition-colors);
}

.gallery-upload:hover,
.gallery-upload.dragging {
  background: var(--ds-surface-2);
  border-color: var(--ds-accent);
}

.gallery-upload:focus-visible {
  outline: none;
  box-shadow: var(--ds-focus-ring);
}

.gallery-upload.processing {
  cursor: wait;
}

.file-input {
  display: none;
}

.upload-icon {
  width: var(--ds-icon-md);
  height: var(--ds-icon-md);
  color: var(--ds-text);
  margin-bottom: var(--ds-space-1);
}

.upload-icon.spinning {
  animation: spin 1s linear infinite;
}

.upload-title {
  font-size: var(--ds-text-md);
  font-weight: var(--ds-weight-semibold);
  color: var(--ds-text);
}

.upload-hint {
  font-size: var(--ds-text-sm);
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 480px) {
  .gallery-upload {
    padding: var(--ds-space-5) var(--ds-space-4);
  }
}
</style>
