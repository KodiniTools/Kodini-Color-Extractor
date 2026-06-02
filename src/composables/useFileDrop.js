import { ref } from 'vue'

export function useFileDrop(store) {
  const isFileDragging = ref(false)

  function handleFileDragOver(e) {
    e.preventDefault()
    isFileDragging.value = true
  }

  function handleFileDragLeave(e) {
    e.preventDefault()
    isFileDragging.value = false
  }

  async function handleFileDrop(e) {
    e.preventDefault()
    isFileDragging.value = false

    const file = e.dataTransfer?.files?.[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = async (event) => {
        const imgSrc = event.target.result
        store.setImage(imgSrc)
        await store.extractColors(imgSrc)
      }
      reader.readAsDataURL(file)
    }
  }

  return { isFileDragging, handleFileDragOver, handleFileDragLeave, handleFileDrop }
}
