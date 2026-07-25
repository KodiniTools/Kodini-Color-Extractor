<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
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

function rgbToHex({ r, g, b }) {
  const toHex = (n) => n.toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase()
}

// Relative luminance → pick readable overlay text (dark vs light).
function isLightColor({ r, g, b }) {
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return lum > 0.6
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// Build a single color descriptor from HSL values.
function makeColor(h, s, l, locked = false) {
  const rgb = hslToRgb(h, s, l)
  const hex = rgbToHex(rgb)
  return { h, s, l, rgb, hex, locked, light: isLightColor(rgb) }
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

// Regenerate the palette, preserving any locked swatches in place.
function generate() {
  const colors = harmonyColors(mode.value, count.value)
  palette.value = colors.map((c, i) => {
    const existing = palette.value[i]
    if (existing && existing.locked) return existing
    return makeColor(c.h, c.s, c.l, false)
  })
}

function toggleLock(index) {
  const c = palette.value[index]
  if (c) c.locked = !c.locked
}

async function copyColor(hex) {
  try {
    await navigator.clipboard.writeText(hex)
    toast.success(t('genCopied').replace('{hex}', hex))
  } catch {
    toast.error(t('clipboardError'))
  }
}

async function copyAll() {
  const text = palette.value.map((c) => c.hex).join(', ')
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

    <main class="palette-strip" :style="{ '--cols': palette.length }">
      <div
        v-for="(color, index) in palette"
        :key="index"
        class="swatch"
        :class="{ 'swatch--light': color.light, 'swatch--locked': color.locked }"
        :style="{ background: color.hex }"
      >
        <div class="swatch-actions">
          <button
            class="swatch-action"
            :class="{ 'is-active': color.locked }"
            :title="color.locked ? t('genUnlock') : t('genLock')"
            @click="toggleLock(index)"
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

        <button class="swatch-hex" :title="t('genClickCopy')" @click="copyColor(color.hex)">
          {{ color.hex }}
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
  transition: background 0.35s ease;
}

.swatch--light {
  color: #1a1a2e;
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
