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

  // ─── Undo / redo history ───
  // Each snapshot captures the palette (base color, per-color adjustments and
  // lock state), the current selection and the master sliders, so stepping
  // back or forward restores a fully coherent editing state.
  const history = ref([])
  const historyIndex = ref(-1)
  const MAX_HISTORY = 60

  // Consecutive drags of the same slider collapse into a single history step.
  let coalesceKey = null
  let coalesceTime = 0

  function snapshot() {
    return {
      palette: palette.value.map((c) => ({
        base: { ...c.base },
        adj: { ...c.adj },
        locked: c.locked,
      })),
      scope: scope.value === 'all' ? 'all' : [...scope.value],
      master: { ...masterAdjust },
    }
  }

  // Record the current state. `replace` overwrites the latest entry (used while
  // a single slider is dragged) instead of pushing a new one.
  function commit(replace = false) {
    const snap = snapshot()
    if (replace && historyIndex.value >= 0) {
      history.value[historyIndex.value] = snap
      history.value.length = historyIndex.value + 1
      return
    }
    history.value = history.value.slice(0, historyIndex.value + 1)
    history.value.push(snap)
    if (history.value.length > MAX_HISTORY) history.value.shift()
    historyIndex.value = history.value.length - 1
  }

  // End any in-progress slider coalescing so the next change starts a new step.
  function endCoalesce() {
    coalesceKey = null
  }

  function restore(snap) {
    palette.value = snap.palette.map((c) => ({
      base: { ...c.base },
      adj: { ...c.adj },
      locked: c.locked,
    }))
    scope.value = snap.scope === 'all' ? 'all' : [...snap.scope]
    Object.assign(masterAdjust, snap.master)
  }

  const canUndo = computed(() => historyIndex.value > 0)
  const canRedo = computed(() => historyIndex.value < history.value.length - 1)

  function undo() {
    if (!canUndo.value) return
    endCoalesce()
    historyIndex.value -= 1
    restore(history.value[historyIndex.value])
  }

  function redo() {
    if (!canRedo.value) return
    endCoalesce()
    historyIndex.value += 1
    restore(history.value[historyIndex.value])
  }

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
    endCoalesce()
    commit()
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
    endCoalesce()
    commit()
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
    endCoalesce()
    commit()
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
    // Collapse a continuous drag of the same slider into one undo step: the
    // first move pushes a new entry, later moves replace it until the user
    // pauses or grabs a different control.
    const sig = `${JSON.stringify(scope.value)}:${key}`
    const now = Date.now()
    const continuation = sig === coalesceKey && now - coalesceTime < 700
    coalesceKey = sig
    coalesceTime = now
    commit(continuation)
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
    endCoalesce()
    commit()
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
      endCoalesce()
      commit()
    } else {
      // generate() records its own history entry.
      generate()
    }
  }

  // Keyboard shortcuts: spacebar generates a fresh palette, Ctrl/Cmd+Z undoes
  // and Ctrl/Cmd+Shift+Z (or Ctrl/Cmd+Y) redoes — all ignored while typing in
  // a form control.
  function onKeydown(e) {
    const tag = (e.target && e.target.tagName) || ''
    const typing = tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA'
    if (typing) return

    const key = e.key.toLowerCase()
    if ((e.ctrlKey || e.metaKey) && key === 'z') {
      e.preventDefault()
      if (e.shiftKey) redo()
      else undo()
      return
    }
    if ((e.ctrlKey || e.metaKey) && key === 'y') {
      e.preventDefault()
      redo()
      return
    }
    if (e.code === 'Space') {
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
    canUndo,
    canRedo,
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
    undo,
    redo,
  }
}
