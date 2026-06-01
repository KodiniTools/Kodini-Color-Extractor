import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface HandoffImage {
  name: string
  dataUrl: string
  width: number
  height: number
}

/**
 * Store for handoff gallery images.
 * Persists received images across route changes (gallery → app → gallery).
 */
export const useHandoffStore = defineStore('handoff', () => {
  const images = ref<HandoffImage[]>([])
  const source = ref<string>('')

  function setImages(handoffImages: HandoffImage[], sourceTool?: string) {
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
