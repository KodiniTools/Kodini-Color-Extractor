import { ref } from 'vue'
import type { PaletteStore } from '../stores/palette'

export function useFileDrop(store: Pick<PaletteStore, 'setImage' | 'extractColors'>) {
  const isFileDragging = ref(false)

  function handleFileDragOver(e: DragEvent) {
    e.preventDefault()
    isFileDragging.value = true
  }

  function handleFileDragLeave(e: DragEvent) {
    e.preventDefault()
    isFileDragging.value = false
  }

  async function handleFileDrop(e: DragEvent) {
    e.preventDefault()
    isFileDragging.value = false

    const file = e.dataTransfer?.files?.[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = async () => {
        // readAsDataURL always yields a string.
        const imgSrc = reader.result as string
        store.setImage(imgSrc)
        await store.extractColors(imgSrc)
      }
      reader.readAsDataURL(file)
    }
  }

  return { isFileDragging, handleFileDragOver, handleFileDragLeave, handleFileDrop }
}
