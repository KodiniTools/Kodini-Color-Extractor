import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * Store for handoff gallery images.
 * Persists received images across route changes (gallery → app → gallery).
 */
export const useHandoffStore = defineStore('handoff', () => {
  // Array of { name, dataUrl, width, height }
  const images = ref([])
  const source = ref('')

  function setImages(handoffImages, sourceTool) {
    images.value = handoffImages
    source.value = sourceTool || ''
  }

  function clear() {
    images.value = []
    source.value = ''
  }

  const hasImages = () => images.value.length > 0

  return { images, source, setImages, clear, hasImages }
})
