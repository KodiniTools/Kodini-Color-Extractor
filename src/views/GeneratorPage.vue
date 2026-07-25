<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from '../composables/useI18n'
import { useToast } from '../composables/useToast'
import LandingNav from '../components/LandingNav.vue'
import ToastContainer from '../components/ToastContainer.vue'

const { t } = useI18n()
const toast = useToast()

// ─── Color utilities (self-contained; the generator creates colors from
// scratch rather than extracting them from an image) ───

// Convert HSL (h: 0-360, s/l: 0-100) to an { r, g, b } object (0-255).
function hslToRgb(h, s, l) {
  h = ((h % 360) + 360) % 360
  s = Math.max(0, Math.min(100, s)) / 100
  l = Math.max(0, Math.min(100, l)) / 100
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  let r, g, b
  if (h < 60) [r, g, b] = [c, x, 0]
  else if (h < 120) [r, g, b] = [x, c, 0]
  else if (h < 180) [r, g, b] = [0, c, x]
  else if (h < 240) [r, g, b] = [0, x, c]
  else if (h < 300) [r, g, b] = [x, 0, c]
  else [r, g, b] = [c, 0, x]
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  }
}

// Convert an { r, g, b } object (0-255) to HSL (h: 0-360, s/l: 0-100).
function rgbToHsl({ r, g, b }) {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  let h = 0
  const l = (max + min) / 2
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1))
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h *= 60
    if (h < 0) h += 360
  }
  return { h, s: s * 100, l: l * 100 }
}

function rgbToHex({ r, g, b }) {
  const toHex = (n) => n.toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase()
}

// Parse a #RRGGBB string into an { r, g, b } object, or null if invalid.
function hexToRgb(hex) {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(String(hex).trim())
  if (!m) return null
  const n = parseInt(m[1], 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

// Relative luminance → pick readable overlay text (dark vs light).
function isLightColor({ r, g, b }) {
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return lum > 0.6
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// ─── Filter adjustments (brightness / contrast / saturation / hue) ───
// Mirrors the CSS-filter semantics used by the image editor: percentages
// default to 100 (identity), hue is a rotation in degrees (0 = identity).
function neutralAdjust() {
  return { brightness: 100, contrast: 100, saturation: 100, hue: 0 }
}

const ADJUST_FIELDS = [
  { key: 'brightness', min: 0, max: 200 },
  { key: 'contrast', min: 0, max: 200 },
  { key: 'saturation', min: 0, max: 200 },
  { key: 'hue', min: 0, max: 360 },
]

// Apply an adjustment set to a base RGB color and return the resulting RGB.
function applyAdjust(rgb, adj) {
  const clamp = (n) => Math.max(0, Math.min(255, n))
  const bf = adj.brightness / 100
  let r = rgb.r * bf
  let g = rgb.g * bf
  let b = rgb.b * bf
  const cf = adj.contrast / 100
  r = clamp((r - 128) * cf + 128)
  g = clamp((g - 128) * cf + 128)
  b = clamp((b - 128) * cf + 128)
  let { h, s, l } = rgbToHsl({ r, g, b })
  h = (h + adj.hue) % 360
  s = Math.max(0, Math.min(100, s * (adj.saturation / 100)))
  return hslToRgb(h, s, l)
}

// Build a single color descriptor from HSL values. `base` is the generated
// color; `adj` holds the per-color filter values applied on top of it.
function makeColor(h, s, l, locked = false) {
  return { base: hslToRgb(h, s, l), adj: neutralAdjust(), locked }
}

// Displayed (adjusted) values used throughout the template.
function displayRgb(color) {
  return applyAdjust(color.base, color.adj)
}
function displayHex(color) {
  return rgbToHex(displayRgb(color))
}
function displayLight(color) {
  return isLightColor(displayRgb(color))
}

// ─── Harmony generators ───
// Each returns an array of {h,s,l} of the requested length, derived from a
// random base hue. Locked colors are re-applied by the caller afterwards.

function harmonyColors(mode, count) {
  const base = randInt(0, 359)
  const out = []

  const push = (h, s, l) => out.push({ h: ((h % 360) + 360) % 360, s, l })

  if (mode === 'monochromatic') {
    const s = randInt(45, 75)
    for (let i = 0; i < count; i++) {
      const l = Math.round(24 + (60 * i) / Math.max(1, count - 1))
      push(base + randInt(-6, 6), s, l)
    }
  } else if (mode === 'analogous') {
    const step = 28
    const start = base - (step * (count - 1)) / 2
    for (let i = 0; i < count; i++) {
      push(start + step * i, randInt(55, 80), randInt(45, 68))
    }
  } else if (mode === 'complementary') {
    for (let i = 0; i < count; i++) {
      const h = i % 2 === 0 ? base : base + 180
      push(h + randInt(-10, 10), randInt(50, 80), randInt(40, 70))
    }
  } else if (mode === 'triadic') {
    const wheel = [base, base + 120, base + 240]
    for (let i = 0; i < count; i++) {
      push(wheel[i % 3] + randInt(-8, 8), randInt(55, 80), randInt(42, 68))
    }
  } else {
    // 'random' — pleasant but unconstrained
    for (let i = 0; i < count; i++) {
      push(randInt(0, 359), randInt(45, 85), randInt(38, 72))
    }
  }
  return out
}

// ─── Reactive state ───
const harmonyModes = ['random', 'monochromatic', 'analogous', 'complementary', 'triadic']
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
</script>

<template>
  <div class="generator-page">
    <LandingNav />

    <header class="gen-header">
      <div class="gen-header-text">
        <h1 class="gen-title">{{ t('genTitle') }}</h1>
        <p class="gen-subtitle">{{ t('genSubtitle') }}</p>
      </div>

      <div class="gen-controls">
        <div class="gen-control">
          <label class="gen-label">{{ t('genHarmony') }}</label>
          <select v-model="mode" class="gen-select" @change="generate">
            <option v-for="m in harmonyModes" :key="m" :value="m">
              {{ t('genMode_' + m) }}
            </option>
          </select>
        </div>

        <div class="gen-control">
          <label class="gen-label">{{ t('genCount') }}</label>
          <select :value="count" class="gen-select" @change="setCount(Number($event.target.value))">
            <option v-for="n in [3, 4, 5, 6, 7, 8]" :key="n" :value="n">{{ n }}</option>
          </select>
        </div>

        <button class="gen-btn gen-btn-primary" @click="generate">
          {{ t('genGenerate') }}
        </button>
        <button class="gen-btn" @click="copyAll">
          {{ t('genCopyAll') }}
        </button>
      </div>
    </header>

    <p class="gen-hint">{{ t('genSpaceHint') }}</p>

    <!-- Filter adjustments: edit a single color or all of them together -->
    <section class="gen-adjust">
      <div class="adjust-bar">
        <div class="adjust-scope">
          <span class="adjust-title">{{ t('genAdjustments') }}</span>
          <div class="scope-tabs" role="group" :aria-label="t('genAdjustScope')">
            <button
              class="scope-tab"
              :class="{
                'scope-tab--active': scope === 'all',
                'scope-tab--muted': anyLocked,
              }"
              :title="anyLocked ? t('genUnlockAllHint') : null"
              @click="onAllScope"
            >
              {{ t('genScopeAll') }}
            </button>
            <button
              v-for="(color, index) in palette"
              :key="index"
              class="scope-dot"
              :class="{
                'scope-dot--active': scope === index,
                'scope-dot--locked': color.locked,
              }"
              :style="{ background: displayHex(color) }"
              :disabled="color.locked"
              :title="
                color.locked ? t('genLockedHint') : t('genScopeColor').replace('{n}', index + 1)
              "
              :aria-label="t('genScopeColor').replace('{n}', index + 1)"
              @click="selectScope(index)"
            ></button>
          </div>
        </div>
        <button
          class="adjust-reset"
          :disabled="!hasActiveAdjust || activeLocked"
          @click="resetAdjust"
        >
          {{ t('reset') }}
        </button>
      </div>

      <p v-if="activeLocked" class="adjust-locked-note">{{ t('genLockedHint') }}</p>

      <!-- Colour picker (native input includes the browser's eyedropper).
           Always visible; enabled once a single colour field is selected
           (disabled with a hint in "all" mode). -->
      <div class="adjust-picker">
        <span class="adjust-picker-label">{{ t('genPickColor') }}</span>
        <label
          class="color-well"
          :class="{ 'color-well--disabled': !canPick }"
          :style="canPick ? { background: pickerHex } : null"
          :title="canPick ? t('genPickColor') : t('genPickHint')"
        >
          <input
            type="color"
            :value="canPick ? pickerHex : '#000000'"
            :disabled="!canPick"
            @input="setColorFromHex($event.target.value)"
          />
        </label>
        <span class="adjust-picker-hex">{{ canPick ? pickerHex : '—' }}</span>
        <span v-if="!canPick" class="adjust-picker-hint">{{ t('genPickHint') }}</span>
      </div>

      <div class="adjust-sliders" :class="{ 'adjust-sliders--disabled': activeLocked }">
        <div v-for="f in ADJUST_FIELDS" :key="f.key" class="adjust-field">
          <div class="adjust-field-head">
            <label class="adjust-field-label">{{ t(f.key) }}</label>
            <span class="adjust-field-value">
              {{ activeAdjust[f.key] }}{{ f.key === 'hue' ? '°' : '%' }}
            </span>
          </div>
          <input
            class="adjust-slider"
            type="range"
            :min="f.min"
            :max="f.max"
            :value="activeAdjust[f.key]"
            :disabled="activeLocked"
            @input="setAdjust(f.key, $event.target.value)"
          />
        </div>
      </div>
    </section>

    <main class="palette-strip" :style="{ '--cols': palette.length }">
      <div
        v-for="(color, index) in palette"
        :key="index"
        class="swatch"
        :class="{
          'swatch--light': displayLight(color),
          'swatch--locked': color.locked,
          'swatch--selected': scope === index,
        }"
        :style="{ background: displayHex(color) }"
        @click="selectScope(index)"
      >
        <div class="swatch-actions">
          <button
            class="swatch-action"
            :class="{ 'is-active': color.locked }"
            :title="color.locked ? t('genUnlock') : t('genLock')"
            @click.stop="toggleLock(index)"
          >
            <svg
              v-if="color.locked"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            <svg
              v-else
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 9.9-1"></path>
            </svg>
          </button>
        </div>

        <button class="swatch-hex" :title="t('genClickCopy')" @click.stop="copyColor(color)">
          {{ displayHex(color) }}
        </button>
      </div>
    </main>

    <ToastContainer />
  </div>
</template>

<style scoped>
.generator-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  transition: background 0.3s ease;
}

/* Header */
.gen-header {
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 40px 24px 16px;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  flex-wrap: wrap;
}

.gen-title {
  font-size: clamp(26px, 4vw, 38px);
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
  transition: color 0.3s ease;
}

.gen-subtitle {
  margin-top: 8px;
  font-size: 15px;
  color: var(--text-secondary);
  max-width: 520px;
  line-height: 1.5;
  transition: color 0.3s ease;
}

.gen-controls {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  flex-wrap: wrap;
}

.gen-control {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.gen-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  transition: color 0.3s ease;
}

.gen-select {
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 14px;
  background: var(--bg-input);
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.gen-select:hover {
  border-color: var(--border-hover);
}

.gen-select:focus {
  outline: none;
  border-color: var(--selection-color);
  box-shadow: 0 0 0 3px var(--selection-glow);
}

.gen-btn {
  padding: 11px 20px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-input);
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.gen-btn:hover {
  background: var(--bg-hover);
  border-color: var(--border-hover);
  transform: translateY(-1px);
}

.gen-btn-primary {
  background: var(--btn-primary-bg);
  border-color: var(--btn-primary-bg);
  color: var(--btn-primary-text);
}

.gen-btn-primary:hover {
  background: var(--btn-primary-hover);
  border-color: var(--btn-primary-hover);
}

.gen-hint {
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 0 24px 16px;
  font-size: 13px;
  color: var(--text-tertiary);
  transition: color 0.3s ease;
}

/* Adjustments panel — a compact, centered control card */
.gen-adjust {
  max-width: 720px;
  width: 100%;
  margin: 0 auto 20px;
  padding: 14px 18px;
  border: 1px solid var(--border-light);
  border-radius: 12px;
  background: var(--bg-secondary);
  box-shadow: 0 6px 24px var(--shadow-soft);
  transition: all 0.3s ease;
}

.adjust-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}

.adjust-scope {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.adjust-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
}

.scope-tabs {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.scope-tab {
  padding: 7px 14px;
  border: 1px solid var(--border-color);
  border-radius: 999px;
  background: var(--bg-input);
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.scope-tab:hover {
  border-color: var(--border-hover);
  color: var(--text-primary);
}

.scope-tab--active {
  background: var(--btn-primary-bg);
  border-color: var(--btn-primary-bg);
  color: var(--btn-primary-text);
}

/* Keep the filled button's light label readable on hover (the generic
   .scope-tab:hover would otherwise darken the text onto the dark fill). */
.scope-tab--active:not(.scope-tab--muted):hover {
  background: var(--btn-primary-hover);
  border-color: var(--btn-primary-hover);
  color: var(--btn-primary-text);
}

/* "All colors" looks deactivated while individual colors are locked.
   Kept as an unfilled toggle so the label stays high-contrast in light mode. */
.scope-tab--muted {
  background: var(--bg-hover);
  border-color: var(--border-color);
  border-style: dashed;
  color: var(--text-secondary);
}

.scope-tab--muted:hover {
  color: var(--text-primary);
  border-color: var(--border-hover);
}

.scope-dot {
  width: 26px;
  height: 26px;
  padding: 0;
  border: 2px solid transparent;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 0 0 1px var(--border-light);
  transition:
    transform 0.15s ease,
    border-color 0.15s ease;
}

.scope-dot:hover {
  transform: scale(1.12);
}

.scope-dot--active {
  border-color: var(--text-primary);
  transform: scale(1.12);
}

.scope-dot--locked {
  opacity: 0.4;
  cursor: not-allowed;
}

.scope-dot--locked:hover {
  transform: none;
}

.adjust-reset {
  padding: 7px 16px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-input);
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.adjust-reset:hover:not(:disabled) {
  background: var(--bg-hover);
  border-color: var(--border-hover);
  color: var(--text-primary);
}

.adjust-reset:disabled {
  opacity: 0.45;
  cursor: default;
}

.adjust-sliders {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px 22px;
}

.adjust-sliders--disabled {
  opacity: 0.5;
}

.adjust-locked-note {
  margin: 0 0 12px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-tertiary);
}

/* Colour picker row */
.adjust-picker {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  min-height: 34px;
  margin-bottom: 14px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--border-light);
}

.adjust-picker-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

/* Native colour input rendered as a small square swatch */
.color-well {
  position: relative;
  display: inline-block;
  width: 34px;
  height: 34px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  box-shadow: inset 0 0 0 2px var(--bg-secondary);
  cursor: pointer;
  overflow: hidden;
}

.color-well input[type='color'] {
  position: absolute;
  inset: -4px;
  width: calc(100% + 8px);
  height: calc(100% + 8px);
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  opacity: 0;
}

/* No colour selected yet: show the well as an inert, striped placeholder */
.color-well--disabled {
  cursor: not-allowed;
  background: repeating-linear-gradient(
    45deg,
    var(--bg-hover),
    var(--bg-hover) 5px,
    var(--bg-secondary) 5px,
    var(--bg-secondary) 10px
  );
}

.color-well--disabled input[type='color'] {
  cursor: not-allowed;
}

.adjust-picker-hex {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.04em;
}

.adjust-picker-hint {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-tertiary);
}

.adjust-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.adjust-field-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

.adjust-field-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
}

.adjust-field-value {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-tertiary);
  font-variant-numeric: tabular-nums;
}

.adjust-slider {
  width: 100%;
  height: 6px;
  -webkit-appearance: none;
  appearance: none;
  border-radius: 999px;
  background: var(--bg-hover);
  cursor: pointer;
  outline: none;
}

.adjust-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--btn-primary-bg);
  border: 2px solid var(--bg-secondary);
  box-shadow: 0 1px 4px var(--shadow-medium);
  cursor: pointer;
}

.adjust-slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--btn-primary-bg);
  border: 2px solid var(--bg-secondary);
  cursor: pointer;
}

.adjust-slider:focus-visible {
  box-shadow: 0 0 0 3px var(--selection-glow);
}

.adjust-slider:disabled {
  cursor: not-allowed;
}

/* Palette strip */
.palette-strip {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(var(--cols), 1fr);
  min-height: 60vh;
  gap: 0;
}

.swatch {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  padding: 20px 8px 32px;
  color: #ffffff;
  cursor: pointer;
  transition: background 0.35s ease;
}

.swatch--light {
  color: #1a1a2e;
}

/* Selected color: inset ring using the swatch's own text color for contrast */
.swatch--selected {
  box-shadow: inset 0 0 0 4px currentColor;
}

/* Locked colors are protected from the sliders and are not selectable */
.swatch--locked {
  cursor: default;
}

.swatch-actions {
  position: absolute;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.swatch:hover .swatch-actions,
.swatch:focus-within .swatch-actions,
.swatch--locked .swatch-actions {
  opacity: 1;
}

.swatch-action {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: inherit;
  cursor: pointer;
  transition: background 0.2s ease;
}

.swatch-action:hover {
  background: rgba(127, 127, 127, 0.22);
}

.swatch-action.is-active {
  background: rgba(127, 127, 127, 0.22);
}

.swatch-hex {
  border: none;
  background: transparent;
  color: inherit;
  font-family: inherit;
  font-size: clamp(14px, 1.4vw, 18px);
  font-weight: 700;
  letter-spacing: 0.06em;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 8px;
  transition: background 0.2s ease;
}

.swatch-hex:hover {
  background: rgba(127, 127, 127, 0.18);
}

/* Responsive: stack swatches vertically on small screens */
@media (max-width: 700px) {
  .gen-header {
    padding: 24px 16px 12px;
    align-items: flex-start;
    flex-direction: column;
  }

  .gen-controls {
    width: 100%;
  }

  .gen-hint {
    padding: 0 16px 12px;
  }

  .gen-adjust {
    margin: 0 16px 16px;
    width: auto;
    padding: 14px 16px;
  }

  .adjust-sliders {
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }

  .palette-strip {
    grid-template-columns: 1fr;
    grid-auto-rows: minmax(74px, 1fr);
  }

  .swatch {
    flex-direction: row;
    justify-content: space-between;
    padding: 14px 20px;
  }

  .swatch-actions {
    position: static;
    transform: none;
    opacity: 1;
  }

  .swatch-hex {
    font-size: 16px;
  }
}
</style>
