import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface HandoffImage {
  name: string
  dataUrl: string
  width: number
  height: number
}

/**
 * Images of the gallery tab: accepted from other Kodini tools or uploaded there.
 * Persists across route changes (gallery → app → gallery), not across reloads.
 */
export const useHandoffStore = defineStore('handoff', () => {
  const images = ref<HandoffImage[]>([])
  const source = ref('')

  function setImages(handoffImages: HandoffImage[], sourceTool?: string) {
    images.value = handoffImages
    source.value = sourceTool || ''
  }

  /** Appends images, keeping the ones already in the gallery. */
  function addImages(newImages: HandoffImage[]) {
    images.value = [...images.value, ...newImages]
  }

  function removeImage(index: number) {
    images.value = images.value.filter((_, i) => i !== index)
  }

  function clear() {
    images.value = []
    source.value = ''
  }

  const hasImages = () => images.value.length > 0

  return { images, source, setImages, addImages, removeImage, clear, hasImages }
})
