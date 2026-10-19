import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from './useI18n'
import { useToast } from './useToast'
import { usePaletteLibrary } from './usePaletteLibrary'
import {
  ADJUST_FIELDS,
  clampAdjust,
  harmonyModes,
  harmonyGroups,
  harmonyColors,
  makeColor,
  neutralAdjust,
  hexToRgb,
  rgbToHex,
  displayHex,
  displayRgb,
  type Adjust,
  type AdjustKey,
  type GenColor,
} from '../lib/core/colorGenerator'
import {
  DEFAULT_EXPORT_FORMAT,
  EXPORT_FORMATS,
  buildPaletteExport,
  downloadPaletteFile,
  formatColor,
  paletteEntry,
} from '../lib/core/paletteExport'
import { decodePaletteHash, encodePaletteHash } from '../lib/core/paletteLink'

// Palette sizes the generator offers (the count select renders these).
const COUNT_OPTIONS = [3, 4, 5, 6, 7, 8]
const MIN_COUNT = COUNT_OPTIONS[0]
const MAX_COUNT = COUNT_OPTIONS[COUNT_OPTIONS.length - 1]

/** What the sliders edit: every color, or the selected indices (never empty). */
export type GeneratorScope = 'all' | number[]

interface GeneratorSnapshot {
  palette: GenColor[]
  scope: GeneratorScope
  master: Adjust
}

// Reactive state and behaviour for the palette generator. Keeps the view
// components thin: they render props and emit intent, this owns the logic.
export function useColorGenerator() {
  const { t } = useI18n()
  const toast = useToast()
  const library = usePaletteLibrary()

  // Copying, downloading and sharing count as using a palette: it goes into
  // the recently used list.
  function recordUse() {
    library.record(palette.value.map(displayHex), 'generator')
  }

  const mode = ref('random')
  const count = ref(5)
  const palette = ref<GenColor[]>([])

  // Which color(s) the adjustment sliders control: the string 'all', or a
  // non-empty array of selected color indices (multi-select). An empty
  // selection is never stored — it collapses back to 'all'.
  const scope = ref<GeneratorScope>('all')

  // Normalize a set of indices to a sorted, unique, in-range array — or 'all'
  // when nothing valid remains.
  function normalizeScope(indices: readonly number[]): GeneratorScope {
    const next = [...new Set(indices)]
      .filter((i) => i >= 0 && i < palette.value.length)
      .sort((a, b) => a - b)
    return next.length ? next : 'all'
  }

  // True when the given color index is part of the current selection.
  function isSelected(index: number) {
    return scope.value !== 'all' && scope.value.includes(index)
  }
  // Slider values shown when editing all colors at once.
  const masterAdjust = reactive<Adjust>(neutralAdjust())

  // ─── Undo / redo history ───
  // Each snapshot captures the palette (base color, per-color adjustments and
  // lock state), the current selection and the master sliders, so stepping
  // back or forward restores a fully coherent editing state.
  const history = ref<GeneratorSnapshot[]>([])
  const historyIndex = ref(-1)
  const MAX_HISTORY = 60

  // Consecutive drags of the same slider collapse into a single history step.
  let coalesceKey: string | null = null
  let coalesceTime = 0

  function snapshot(): GeneratorSnapshot {
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

  function restore(snap: GeneratorSnapshot) {
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

  function toggleLock(index: number) {
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
  function unlockColor(c: GenColor) {
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
  function selectScope(index: number) {
    if (palette.value[index]?.locked) return
    const current: number[] = scope.value === 'all' ? [] : scope.value
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
  function setColorFromHex(hex: string) {
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
  function setAdjust(key: string, value: unknown) {
    // The value can come from the slider or the number spinner, so it is
    // normalized here: out-of-range or non-numeric input never reaches the
    // palette.
    const v = clampAdjust(key, value)
    if (v === null) return
    // clampAdjust accepts known fields only.
    const field = key as AdjustKey
    const single = scope.value !== 'all' && scope.value.length === 1
    if (!single) masterAdjust[field] = v
    scopeIndices.value.forEach((i) => {
      const c = palette.value[i]
      if (c && !c.locked) c.adj[field] = v
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

  // Reset a single adjustment (one slider/spinner row) back to its neutral
  // value for the current scope. Locked colors keep their state.
  function resetAdjustField(key: string) {
    const neutral = neutralAdjust()
    if (!(key in neutral)) return
    const field = key as AdjustKey
    const def = neutral[field]
    const single = scope.value !== 'all' && scope.value.length === 1
    if (!single) masterAdjust[field] = def
    scopeIndices.value.forEach((i) => {
      const c = palette.value[i]
      if (c && !c.locked) c.adj[field] = def
    })
    endCoalesce()
    commit()
  }

  // True when the active scope differs from neutral (enables the reset button).
  const hasActiveAdjust = computed(() => {
    const a = activeAdjust.value
    return a.brightness !== 100 || a.contrast !== 100 || a.saturation !== 100 || a.hue !== 0
  })

  // Copies exactly what the swatch shows: the color in the selected format.
  async function copyColor(color: GenColor) {
    const index = palette.value.indexOf(color)
    const value = formatColor(
      paletteEntry(displayHex(color), displayRgb(color)),
      exportFormatKey.value,
      index < 0 ? 0 : index
    )
    try {
      await navigator.clipboard.writeText(value)
      toast.success(t('genCopied', { hex: value }))
    } catch {
      toast.error(t('clipboardError'))
    }
  }

  async function copyAll() {
    const text = palette.value.map((c) => displayHex(c)).join(', ')
    try {
      await navigator.clipboard.writeText(text)
      toast.success(t('genCopiedAll'))
      recordUse()
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
      toast.success(t('genCopiedSelected', { n: hexes.length }))
    } catch {
      toast.error(t('clipboardError'))
    }
  }

  // ─── Export ───
  // The format the download uses; the palette is exported with the adjusted
  // (displayed) colors, never the untouched base values.
  const exportFormatKey = ref(DEFAULT_EXPORT_FORMAT)

  function setExportFormat(key: string) {
    if (EXPORT_FORMATS.some((f) => f.key === key)) exportFormatKey.value = key
  }

  function exportEntries() {
    return palette.value.map((c) => {
      const rgb = displayRgb(c)
      return paletteEntry(rgbToHex(rgb), rgb)
    })
  }

  function downloadPalette() {
    const file = buildPaletteExport(exportFormatKey.value, exportEntries())
    if (!file || !downloadPaletteFile(file)) return
    toast.success(t('genDownloaded', { file: file.filename }))
    recordUse()
  }

  function setCount(n: number) {
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
  function onKeydown(e: KeyboardEvent) {
    const tag = (e.target as HTMLElement | null)?.tagName || ''
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

  // ─── Shareable links ───
  // A link (/generator#p=...) or the extractor's "Edit in generator" button
  // opens the generator with those colors locked, so regenerating builds on
  // them instead of replacing them. Up to MAX_COUNT colors are taken over.
  function loadFromLink() {
    const hexes = decodePaletteHash(window.location.hash)
    if (!hexes.length) return false
    // The hash only seeds the palette; drop it so a reload starts fresh and the
    // address bar does not show colors the user has since changed.
    window.history.replaceState(
      window.history.state,
      '',
      window.location.pathname + window.location.search
    )
    loadPalette(hexes, t('genLinkLoaded'))
    return true
  }

  /**
   * Replaces the palette with these colors (#RRGGBB), locked, as one undo
   * step. `message` is the toast shown when all colors fit.
   */
  function loadPalette(hexes: readonly string[], message: string) {
    const kept = hexes.flatMap((hex) => hexToRgb(hex) ?? []).slice(0, MAX_COUNT)
    if (!kept.length) return
    count.value = Math.max(MIN_COUNT, kept.length)
    palette.value = kept.map((base) => ({ base, adj: neutralAdjust(), locked: true }))
    if (scope.value !== 'all') scope.value = 'all'
    endCoalesce()
    // Fills any missing slots (fewer than MIN_COUNT colors) and records the
    // history step; locked colors stay as they are.
    generate()
    toast.success(hexes.length > MAX_COUNT ? t('genLinkTruncated', { n: MAX_COUNT }) : message)
  }

  // Copy a link that reopens the generator with the displayed colors.
  async function copyLink() {
    const hash = encodePaletteHash(palette.value.map((c) => displayHex(c)))
    const url = `${window.location.origin}${import.meta.env.BASE_URL}generator#${hash}`
    try {
      await navigator.clipboard.writeText(url)
      toast.success(t('genLinkCopied'))
      recordUse()
    } catch {
      toast.error(t('clipboardError'))
    }
  }

  onMounted(() => {
    if (!loadFromLink()) generate()
    window.addEventListener('keydown', onKeydown)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', onKeydown)
  })

  return {
    // constants
    harmonyModes,
    harmonyGroups,
    ADJUST_FIELDS,
    COUNT_OPTIONS,
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
    resetAdjustField,
    copyColor,
    copyAll,
    copySelected,
    copyLink,
    setCount,
    EXPORT_FORMATS,
    exportFormat: exportFormatKey,
    setExportFormat,
    downloadPalette,
    loadPalette,
    undo,
    redo,
  }
}
