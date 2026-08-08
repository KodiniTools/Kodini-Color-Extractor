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

  // Which color(s) the adjustment sliders control: the string 'all', or a
  // non-empty array of selected color indices (multi-select). An empty
  // selection is never stored — it collapses back to 'all'.
  const scope = ref('all')

  // Normalize a set of indices to a sorted, unique, in-range array — or 'all'
  // when nothing valid remains.
  function normalizeScope(indices) {
    const next = [...new Set(indices)]
      .filter((i) => i >= 0 && i < palette.value.length)
      .sort((a, b) => a - b)
    return next.length ? next : 'all'
  }

  // True when the given color index is part of the current selection.
  function isSelected(index) {
    return scope.value !== 'all' && scope.value.includes(index)
  }
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
    if (scope.value !== 'all') scope.value = normalizeScope(scope.value)
  }

  function toggleLock(index) {
    const c = palette.value[index]
    if (!c) return
    if (c.locked) {
      unlockColor(c)
    } else {
      c.locked = true
      // Locking a color drops it from the selection (locked colors can't be
      // edited); an emptied selection returns the sliders to "all colors".
      if (scope.value !== 'all') {
        scope.value = normalizeScope(scope.value.filter((i) => i !== index))
      }
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

  // Toggle a color in or out of the selection. Clicking an unselected color
  // adds it; clicking a selected one removes it — so several colors can be
  // edited together. Locked colors are protected and can't be selected.
  function selectScope(index) {
    if (palette.value[index]?.locked) return
    const current = scope.value === 'all' ? [] : scope.value
    const next = current.includes(index) ? current.filter((i) => i !== index) : [...current, index]
    scope.value = normalizeScope(next)
  }

  // Clear the current selection and return the sliders to "all colors".
  function clearScope() {
    scope.value = 'all'
  }

  // How many colors are currently selected (0 in "all" mode).
  const selectedCount = computed(() => (scope.value === 'all' ? 0 : scope.value.length))

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

  // The single selected colour object, used by the picker. Null unless exactly
  // one colour is selected (the eyedropper can only act on one at a time).
  const selectedColor = computed(() =>
    scope.value !== 'all' && scope.value.length === 1 ? palette.value[scope.value[0]] || null : null
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

  // The color indices the sliders currently target: every color in "all" mode,
  // otherwise the selected ones.
  const scopeIndices = computed(() =>
    scope.value === 'all' ? palette.value.map((_, i) => i) : scope.value
  )

  // The adjustment object bound to the sliders. A single selected color edits
  // its own values directly; "all" mode and multi-select share the master
  // sliders (which then fan out to every targeted color).
  const activeAdjust = computed(() => {
    if (scope.value !== 'all' && scope.value.length === 1) {
      return palette.value[scope.value[0]]?.adj || masterAdjust
    }
    return masterAdjust
  })

  // True when the sliders should be inert: every targeted color is locked.
  // Locked colors never react to the sliders.
  const activeLocked = computed(() => {
    const cols = scopeIndices.value.map((i) => palette.value[i]).filter(Boolean)
    return cols.length > 0 && cols.every((c) => c.locked)
  })

  // Move a slider: the value is applied to every targeted, unlocked color.
  // In "all" or multi-select mode the master sliders track the shared value.
  function setAdjust(key, value) {
    const v = Number(value)
    const single = scope.value !== 'all' && scope.value.length === 1
    if (!single) masterAdjust[key] = v
    scopeIndices.value.forEach((i) => {
      const c = palette.value[i]
      if (c && !c.locked) c.adj[key] = v
    })
  }

  // Reset the adjustments for the current scope back to neutral (locked colors
  // keep their state).
  function resetAdjust() {
    const single = scope.value !== 'all' && scope.value.length === 1
    if (!single) Object.assign(masterAdjust, neutralAdjust())
    scopeIndices.value.forEach((i) => {
      const c = palette.value[i]
      if (c && !c.locked) Object.assign(c.adj, neutralAdjust())
    })
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

  // Copy the HEX values of just the selected colors (in palette order).
  async function copySelected() {
    if (scope.value === 'all' || scope.value.length === 0) return
    const hexes = scope.value
      .map((i) => palette.value[i])
      .filter(Boolean)
      .map(displayHex)
    if (!hexes.length) return
    try {
      await navigator.clipboard.writeText(hexes.join(', '))
      toast.success(t('genCopiedSelected').replace('{n}', hexes.length))
    } catch {
      toast.error(t('clipboardError'))
    }
  }

  function setCount(n) {
    count.value = n
    // Trim or extend while keeping existing (and locked) colors.
    if (palette.value.length > n) {
      palette.value = palette.value.slice(0, n)
      if (scope.value !== 'all') scope.value = normalizeScope(scope.value)
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
    selectedCount,
    isSelected,
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
    copySelected,
    setCount,
  }
}
