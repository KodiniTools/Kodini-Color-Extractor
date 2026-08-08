import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from './useI18n'
import { useToast } from './useToast'
import {
  ADJUST_FIELDS,
  harmonyModes,
  harmonyColors,
  makeColor,
  neutralAdjust,
  hexToRgb,
  displayHex,
} from '../lib/core/colorGenerator'

// Reactive state and behaviour for the palette generator. Keeps the view
// components thin: they render props and emit intent, this owns the logic.
export function useColorGenerator() {
  const { t } = useI18n()
  const toast = useToast()

  const mode = ref('random')
  const count = ref(5)
  const palette = ref([])

  // Which color the adjustment sliders control: 'all' or a color index.
  const scope = ref('all')
  // Slider values shown when editing all colors at once.
  const masterAdjust = reactive(neutralAdjust())

  // Regenerate the palette, preserving any locked swatches in place.
  function generate() {
    const colors = harmonyColors(mode.value, count.value)
    palette.value = colors.map((c, i) => {
      const existing = palette.value[i]
      if (existing && existing.locked) return existing
      return makeColor(c.h, c.s, c.l, false)
    })
    // Fresh (unlocked) colors start neutral; reset the shared "all" sliders too.
    Object.assign(masterAdjust, neutralAdjust())
    if (scope.value !== 'all' && scope.value >= palette.value.length) scope.value = 'all'
  }

  function toggleLock(index) {
    const c = palette.value[index]
    if (!c) return
    if (c.locked) {
      unlockColor(c)
    } else {
      c.locked = true
      // Locking the color you're editing returns the sliders to "all colors".
      if (scope.value === index) scope.value = 'all'
    }
  }

  // Unlock a color and let it adopt the current "all colors" slider state, so
  // it rejoins the rest of the palette instead of keeping its frozen values.
  function unlockColor(c) {
    c.locked = false
    Object.assign(c.adj, { ...masterAdjust })
  }

  // True when at least one color is locked.
  const anyLocked = computed(() => palette.value.some((c) => c.locked))

  // Unlock every locked color at once (adopting the current slider state).
  function unlockAll() {
    palette.value.forEach((c) => {
      if (c.locked) unlockColor(c)
    })
  }

  // Select which color(s) the sliders affect. Locked colors are protected and
  // cannot be selected for editing until they are unlocked.
  function selectScope(value) {
    if (value !== 'all' && palette.value[value]?.locked) return
    scope.value = value
  }

  // Clear a single-color selection and return the sliders to "all colors".
  function clearScope() {
    scope.value = 'all'
  }

  // Clicking "All colors": switch to all-colors mode, or — if already there and
  // some colors are locked — unlock them all with a repeated click.
  function onAllScope() {
    if (scope.value === 'all' && anyLocked.value) {
      unlockAll()
    } else {
      scope.value = 'all'
    }
  }

  // ─── Colour picker ───
  // The native colour input (which includes the browser's built-in eyedropper)
  // operates on the single selected colour and stays in sync with its swatch
  // and sliders.

  // The currently selected colour object (null while editing all colours).
  const selectedColor = computed(() =>
    scope.value === 'all' ? null : palette.value[scope.value] || null
  )

  // Whether the picker can act right now (a single, unlocked colour is chosen).
  const canPick = computed(() => !!selectedColor.value && !selectedColor.value.locked)

  // The picker reflects the selected colour's displayed (adjusted) value.
  const pickerHex = computed(() =>
    selectedColor.value ? displayHex(selectedColor.value) : '#000000'
  )

  // Apply a picked colour: it becomes the swatch's new base with neutral
  // adjustments, so the swatch, the hex and the sliders all resync to it.
  function setColorFromHex(hex) {
    const c = selectedColor.value
    if (!c || c.locked) return
    const rgb = hexToRgb(hex)
    if (!rgb) return
    c.base = rgb
    Object.assign(c.adj, neutralAdjust())
  }

  // The adjustment object currently bound to the sliders.
  const activeAdjust = computed(() =>
    scope.value === 'all' ? masterAdjust : palette.value[scope.value]?.adj || masterAdjust
  )

  // True when the sliders should be inert: a single locked color, or "all"
  // mode when every color is locked. Locked colors never react to the sliders.
  const activeLocked = computed(() => {
    if (scope.value === 'all') {
      return palette.value.length > 0 && palette.value.every((c) => c.locked)
    }
    return !!palette.value[scope.value]?.locked
  })

  // Move a slider: in "all" mode the value is applied to every unlocked color,
  // otherwise only to the selected color. Locked colors are always skipped.
  function setAdjust(key, value) {
    const v = Number(value)
    if (scope.value === 'all') {
      masterAdjust[key] = v
      palette.value.forEach((c) => {
        if (!c.locked) c.adj[key] = v
      })
    } else {
      const c = palette.value[scope.value]
      if (c && !c.locked) c.adj[key] = v
    }
  }

  // Reset the adjustments for the current scope back to neutral (locked colors
  // keep their state).
  function resetAdjust() {
    if (scope.value === 'all') {
      Object.assign(masterAdjust, neutralAdjust())
      palette.value.forEach((c) => {
        if (!c.locked) Object.assign(c.adj, neutralAdjust())
      })
    } else {
      const c = palette.value[scope.value]
      if (c && !c.locked) Object.assign(c.adj, neutralAdjust())
    }
  }

  // True when the active scope differs from neutral (enables the reset button).
  const hasActiveAdjust = computed(() => {
    const a = activeAdjust.value
    return a.brightness !== 100 || a.contrast !== 100 || a.saturation !== 100 || a.hue !== 0
  })

  async function copyColor(color) {
    const hex = displayHex(color)
    try {
      await navigator.clipboard.writeText(hex)
      toast.success(t('genCopied').replace('{hex}', hex))
    } catch {
      toast.error(t('clipboardError'))
    }
  }

  async function copyAll() {
    const text = palette.value.map((c) => displayHex(c)).join(', ')
    try {
      await navigator.clipboard.writeText(text)
      toast.success(t('genCopiedAll'))
    } catch {
      toast.error(t('clipboardError'))
    }
  }

  function setCount(n) {
    count.value = n
    // Trim or extend while keeping existing (and locked) colors.
    if (palette.value.length > n) {
      palette.value = palette.value.slice(0, n)
      if (scope.value !== 'all' && scope.value >= n) scope.value = 'all'
    } else {
      generate()
    }
  }

  // Spacebar generates a new palette (unless the user is typing in a control).
  function onKeydown(e) {
    const tag = (e.target && e.target.tagName) || ''
    if (e.code === 'Space' && tag !== 'INPUT' && tag !== 'SELECT' && tag !== 'TEXTAREA') {
      e.preventDefault()
      generate()
    }
  }

  onMounted(() => {
    generate()
    window.addEventListener('keydown', onKeydown)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', onKeydown)
  })

  return {
    // constants
    harmonyModes,
    ADJUST_FIELDS,
    // state
    mode,
    count,
    palette,
    scope,
    // derived
    anyLocked,
    canPick,
    pickerHex,
    activeAdjust,
    activeLocked,
    hasActiveAdjust,
    // actions
    generate,
    toggleLock,
    selectScope,
    onAllScope,
    clearScope,
    setColorFromHex,
    setAdjust,
    resetAdjust,
    copyColor,
    copyAll,
    setCount,
  }
}
