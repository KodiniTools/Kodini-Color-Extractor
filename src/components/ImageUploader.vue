<script setup>
import { ref } from 'vue'
import { usePaletteStore } from '../stores/palette'

const store = usePaletteStore()
const fileInput = ref(null)
const isDragging = ref(false)
const isProcessing = ref(false)

function triggerUpload() {
  fileInput.value?.click()
}

async function handleFile(e) {
  const file = e.target.files?.[0]
  if (file) await processFile(file)
}

async function handleDrop(e) {
  isDragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file && file.type.startsWith('image/')) {
    await processFile(file)
  }
}

async function processFile(file) {
  if (!file.type.startsWith('image/')) return

  isProcessing.value = true

  const reader = new FileReader()
  reader.onload = async (e) => {
    const imgSrc = e.target.result
    store.setImage(imgSrc)
    await store.extractColors(imgSrc)
    isProcessing.value = false
  }
  reader.onerror = () => {
    isProcessing.value = false
  }
  reader.readAsDataURL(file)
}
</script>

<template>
  <div
    class="upload-area"
    :class="{ dragging: isDragging, processing: isProcessing }"
    @click="triggerUpload"
    @dragover.prevent="isDragging = true"
    @dragleave="isDragging = false"
    @drop.prevent="handleDrop"
  >
    <input ref="fileInput" type="file" accept="image/*" class="file-input" @change="handleFile" />
    <span v-if="isProcessing" class="upload-content">
      <svg
        class="upload-icon spinning"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.75"
      >
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </svg>
    </span>
    <span v-else class="upload-content">
      <svg
        class="upload-icon"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.75"
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>
    </span>
  </div>
</template>

<style scoped>
/* The primary action of the extractor panel: the one gold surface. */
.upload-area {
  display: flex;
  align-items: center;
  justify-content: center;
  height: var(--ds-control-lg);
  background: var(--ds-accent);
  color: var(--ds-on-accent);
  border: var(--ds-border-width) solid transparent;
  border-radius: var(--ds-radius-md);
  padding: 0 var(--ds-space-5);
  text-align: center;
  cursor: pointer;
  transition: var(--app-transition-colors);
}

.upload-area:hover {
  background: var(--ds-accent-hover);
}

.upload-area:focus-visible {
  outline: none;
  box-shadow: var(--ds-focus-ring);
}

.upload-area.dragging {
  background: var(--ds-accent-hover);
  box-shadow: var(--ds-focus-ring);
}

.upload-area.processing {
  background: var(--ds-surface-3);
  color: var(--ds-text-3);
  cursor: wait;
}

.file-input {
  display: none;
}

.upload-content {
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-icon {
  width: var(--ds-icon-md);
  height: var(--ds-icon-md);
}

/* The loading icon is the only thing that keeps moving. */
.upload-icon.spinning {
  animation: spin 1s linear infinite;
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
  .upload-area {
    min-height: var(--ds-row-height);
  }
}
</style>
