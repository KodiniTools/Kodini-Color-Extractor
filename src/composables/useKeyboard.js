import { onMounted, onUnmounted } from 'vue'
import { usePaletteStore } from '../stores/palette'
import { useToast } from './useToast'
import { useI18n } from './useI18n'

export function useKeyboard() {
  const store = usePaletteStore()
  const toast = useToast()
  const { t } = useI18n()

  async function handleKeydown(e) {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
    const modKey = isMac ? e.metaKey : e.ctrlKey

    // Ignore if typing in an input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      return
    }

    // Ctrl/Cmd + C - Copy selected color
    if (modKey && e.key === 'c' && !e.shiftKey) {
      if (store.hasColors && store.selectedColorIndex >= 0) {
        e.preventDefault()
        const color = store.colors[store.selectedColorIndex]
        const text = store.getFormatted(color, store.selectedColorIndex)
        await copyToClipboard(text)
        toast.success(t('copiedToClipboard'))
      }
    }

    // Ctrl/Cmd + V - Paste image from clipboard
    if (modKey && e.key === 'v' && !e.shiftKey) {
      e.preventDefault()
      await pasteImageFromClipboard()
    }

    // Arrow Up - Select previous color
    if (e.key === 'ArrowUp' && store.hasColors) {
      e.preventDefault()
      const newIndex = store.selectedColorIndex > 0
        ? store.selectedColorIndex - 1
        : store.colors.length - 1
      store.setSelectedColor(newIndex)
    }

    // Arrow Down - Select next color
    if (e.key === 'ArrowDown' && store.hasColors) {
      e.preventDefault()
      const newIndex = store.selectedColorIndex < store.colors.length - 1
        ? store.selectedColorIndex + 1
        : 0
      store.setSelectedColor(newIndex)
    }

    // Enter - Copy selected color (alternative)
    if (e.key === 'Enter' && store.hasColors && store.selectedColorIndex >= 0) {
      e.preventDefault()
      const color = store.colors[store.selectedColorIndex]
      const text = store.getFormatted(color, store.selectedColorIndex)
      await copyToClipboard(text)
      toast.success(t('copiedToClipboard'))
    }
  }

  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
  }

  async function pasteImageFromClipboard() {
    try {
      const items = await navigator.clipboard.read()
      for (const item of items) {
        for (const type of item.types) {
          if (type.startsWith('image/')) {
            const blob = await item.getType(type)
            const reader = new FileReader()
            reader.onload = async (e) => {
              const imgSrc = e.target.result
              store.setImage(imgSrc)
              await store.extractColors(imgSrc)
              toast.success(t('imagePasted'))
            }
            reader.readAsDataURL(blob)
            return
          }
        }
      }
      toast.info(t('noImageInClipboard'))
    } catch (err) {
      // Clipboard API not supported or permission denied
      toast.error(t('clipboardError'))
    }
  }

  function init() {
    document.addEventListener('keydown', handleKeydown)
  }

  function destroy() {
    document.removeEventListener('keydown', handleKeydown)
  }

  onMounted(init)
  onUnmounted(destroy)

  return {
    init,
    destroy
  }
}
