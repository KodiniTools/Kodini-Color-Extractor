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
    <span v-if="isProcessing" class="upload-text">{{ t('processingText') }}</span>
    <span v-else class="upload-text">{{ t('uploadText') }}</span>
  </div>
</template>

<style scoped>
.upload-area {
  background: #0F5CD4;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 16px 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 15px;
  font-weight: 500;
}

.upload-area:hover {
  background: #0D4DB8;
  transform: translateY(-1px);
}

.upload-area.dragging {
  background: #0D4DB8;
  box-shadow: 0 0 0 3px rgba(15, 92, 212, 0.3);
}

.upload-area.processing {
  background: #718096;
  cursor: wait;
}

.file-input {
  display: none;
}

.upload-text {
  display: block;
}
</style>
