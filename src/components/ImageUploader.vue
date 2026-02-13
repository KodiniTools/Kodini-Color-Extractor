<script setup>
import { ref } from 'vue'
import { usePaletteStore } from '../stores/palette'
import { useI18n } from '../composables/useI18n'

const store = usePaletteStore()
const { t } = useI18n()
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
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      class="file-input"
      @change="handleFile"
    >
    <span v-if="isProcessing" class="upload-content">
      <svg class="upload-icon spinning" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
      </svg>
    </span>
    <span v-else class="upload-content">
      <svg class="upload-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="17 8 12 3 7 8"/>
        <line x1="12" y1="3" x2="12" y2="15"/>
      </svg>
    </span>
  </div>
</template>

<style scoped>
.upload-area {
  background: var(--accent-bg);
  color: var(--accent-text);
  border: none;
  border-radius: 8px;
  padding: 16px 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-area:hover {
  background: var(--accent-hover);
  transform: translateY(-1px);
}

.upload-area.dragging {
  background: var(--accent-hover);
  box-shadow: 0 0 0 3px var(--selection-glow);
}

.upload-area.processing {
  background: var(--text-tertiary);
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
  width: 24px;
  height: 24px;
}

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
    padding: 14px 18px;
    min-height: 44px;
  }
}
</style>
