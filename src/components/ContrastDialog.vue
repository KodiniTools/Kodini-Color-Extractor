<script setup>
import { computed } from 'vue'
import { useI18n } from '../composables/useI18n'
import ModalDialog from './ui/ModalDialog.vue'
import { bestPairs, contrastMatrix, formatRatio, textSuggestions } from '../lib/core/contrast'

const props = defineProps({
  show: { type: Boolean, default: false },
  /** Palette colors as #RRGGBB, in palette order. */
  colors: { type: Array, default: () => [] },
})

const emit = defineEmits(['close'])

const { t } = useI18n()

const matrix = computed(() => contrastMatrix(props.colors))
const pairs = computed(() => bestPairs(props.colors))
const suggestions = computed(() => textSuggestions(props.colors))

const LEVEL_KEYS = {
  AAA: 'contrastLevelAAA',
  AA: 'contrastLevelAA',
  AA18: 'contrastLevelAA18',
  fail: 'contrastLevelFail',
}

function levelLabel(level) {
  return t(LEVEL_KEYS[level])
}

function cellLabel(cell) {
  return `${cell.text} / ${cell.background}: ${formatRatio(cell.ratio)}:1, ${levelLabel(cell.level)}`
}
</script>

<template>
  <ModalDialog
    :show="show"
    :title="t('contrastTitle')"
    :close-label="t('contrastClose')"
    @close="emit('close')"
  >
    <p class="contrast-intro">{{ t('contrastIntro') }}</p>
    <ul class="contrast-legend">
      <li v-for="level in ['AAA', 'AA', 'AA18', 'fail']" :key="level">
        <span class="level-badge" :class="`level-badge--${level}`">
          {{ levelLabel(level) }}
        </span>
        <span>{{ t(`contrastLegend${level}`) }}</span>
      </li>
    </ul>

    <p v-if="matrix.colors.length < 2" class="contrast-empty">
      {{ t('contrastNeedTwo') }}
    </p>

    <template v-else>
      <section class="contrast-section">
        <h3 class="contrast-heading">{{ t('contrastBestPairs') }}</h3>
        <p v-if="pairs.length === 0" class="contrast-empty">
          {{ t('contrastNoPairs') }}
        </p>
        <ul v-else class="pair-list">
          <li
            v-for="p in pairs"
            :key="`${p.text}-${p.background}`"
            class="pair-card"
            data-testid="contrast-pair"
          >
            <div class="pair-preview" :style="{ background: p.background, color: p.text }">
              <span class="pair-sample">{{ t('contrastSample') }}</span>
            </div>
            <div class="pair-meta">
              <span class="pair-hex">{{ p.text }} / {{ p.background }}</span>
              <span class="pair-ratio">{{ formatRatio(p.ratio) }}:1</span>
              <span class="level-badge" :class="`level-badge--${p.level}`">
                {{ levelLabel(p.level) }}
              </span>
            </div>
          </li>
        </ul>
      </section>

      <section class="contrast-section">
        <h3 class="contrast-heading">{{ t('contrastPerColor') }}</h3>
        <ul class="suggest-list">
          <li
            v-for="s in suggestions"
            :key="s.background"
            class="suggest-row"
            data-testid="contrast-suggestion"
          >
            <span
              class="suggest-swatch"
              :style="{ background: s.background, color: s.text }"
              aria-hidden="true"
              >Aa</span
            >
            <span class="suggest-hex">{{ s.background }}</span>
            <span class="suggest-text">
              {{ t('contrastTextLabel') }} {{ s.text }}
              <span v-if="!s.fromPalette" class="suggest-note"> ({{ t('contrastNeutral') }}) </span>
            </span>
            <span class="pair-ratio">{{ formatRatio(s.ratio) }}:1</span>
            <span class="level-badge" :class="`level-badge--${s.level}`">
              {{ levelLabel(s.level) }}
            </span>
          </li>
        </ul>
      </section>

      <section class="contrast-section">
        <h3 class="contrast-heading">{{ t('contrastMatrix') }}</h3>
        <p class="contrast-hint">{{ t('contrastMatrixHint') }}</p>
        <div class="matrix-scroll">
          <table class="matrix">
            <thead>
              <tr>
                <th scope="col" class="matrix-corner">
                  <span class="visually-hidden">{{ t('contrastMatrixCorner') }}</span>
                </th>
                <th v-for="bg in matrix.colors" :key="bg" scope="col" class="matrix-head">
                  <span class="head-swatch" :style="{ background: bg }"></span>
                  <span class="head-hex">{{ bg }}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, i) in matrix.rows" :key="matrix.colors[i]">
                <th scope="row" class="matrix-head matrix-head--row">
                  <span class="head-swatch" :style="{ background: matrix.colors[i] }"></span>
                  <span class="head-hex">{{ matrix.colors[i] }}</span>
                </th>
                <template v-for="(cell, j) in row" :key="j">
                  <td v-if="cell === null" class="matrix-cell matrix-cell--self"></td>
                  <td
                    v-else
                    class="matrix-cell"
                    :style="{ background: cell.background, color: cell.text }"
                    :aria-label="cellLabel(cell)"
                    :title="cellLabel(cell)"
                    data-testid="contrast-cell"
                  >
                    <span class="cell-sample" aria-hidden="true">Aa</span>
                    <span class="cell-ratio" aria-hidden="true">{{ formatRatio(cell.ratio) }}</span>
                    <span
                      class="level-badge level-badge--sm"
                      :class="`level-badge--${cell.level}`"
                      aria-hidden="true"
                    >
                      {{ cell.level === 'fail' ? '✕' : levelLabel(cell.level) }}
                    </span>
                  </td>
                </template>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>
  </ModalDialog>
</template>

<style scoped>
.contrast-intro,
.contrast-hint,
.contrast-empty {
  margin: 0;
  color: var(--ds-text-2);
  line-height: var(--ds-leading);
}

.contrast-legend {
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: var(--ds-space-2) var(--ds-space-4);
  margin: 0;
  padding: 0;
  color: var(--ds-text-2);
}

.contrast-legend li {
  display: flex;
  align-items: center;
  gap: var(--ds-space-2);
}

.contrast-section {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-3);
}

.contrast-heading {
  margin: 0;
  font-size: var(--ds-text-xs);
  font-weight: var(--ds-weight-semibold);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ds-text-2);
}

/* WCAG level badge: status token on its own surface, so it stays legible
   on top of any palette color. */
.level-badge {
  display: inline-flex;
  align-items: center;
  padding: 0 var(--ds-space-2);
  border: var(--ds-border-width) solid currentColor;
  border-radius: var(--ds-radius-full);
  background: var(--ds-surface-1);
  font-size: var(--ds-text-xs);
  font-weight: var(--ds-weight-semibold);
  line-height: var(--ds-leading);
  white-space: nowrap;
}

.level-badge--sm {
  padding: 0 var(--ds-space-1);
}

.level-badge--AAA,
.level-badge--AA {
  color: var(--ds-success);
}

.level-badge--AA18 {
  color: var(--ds-warning);
}

.level-badge--fail {
  color: var(--ds-danger);
}

.pair-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--ds-space-3);
}

.pair-card {
  border: var(--ds-border-width) solid var(--ds-border);
  border-radius: var(--ds-radius-md);
  overflow: hidden;
  background: var(--ds-surface-2);
}

.pair-preview {
  padding: var(--ds-space-4);
  border-bottom: var(--ds-border-width) solid var(--ds-border);
}

.pair-sample {
  font-size: var(--ds-text-lg);
  font-weight: var(--ds-weight-semibold);
}

.pair-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--ds-space-2);
  padding: var(--ds-space-2) var(--ds-space-3);
}

.pair-hex,
.suggest-hex,
.head-hex {
  font-family: var(--ds-font-mono);
  font-size: var(--ds-text-xs);
  color: var(--ds-text-2);
}

.pair-ratio {
  font-family: var(--ds-font-mono);
  font-weight: var(--ds-weight-semibold);
  margin-left: auto;
}

.suggest-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-2);
}

.suggest-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--ds-space-3);
}

.suggest-swatch {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--ds-control-md);
  height: var(--ds-control-md);
  border: var(--ds-border-width) solid var(--ds-border);
  border-radius: var(--ds-radius-sm);
  font-weight: var(--ds-weight-semibold);
  flex-shrink: 0;
}

.suggest-text {
  font-family: var(--ds-font-mono);
  font-size: var(--ds-text-xs);
}

.suggest-note {
  font-family: var(--ds-font-sans);
  color: var(--ds-text-2);
}

.matrix-scroll {
  overflow-x: auto;
  border: var(--ds-border-width) solid var(--ds-border);
  border-radius: var(--ds-radius-md);
}

.matrix {
  border-collapse: collapse;
  min-width: 100%;
}

.matrix-corner,
.matrix-head {
  background: var(--ds-surface-2);
  padding: var(--ds-space-2);
  font-weight: var(--ds-weight-regular);
}

.matrix-head {
  text-align: center;
  white-space: nowrap;
}

.matrix-head--row {
  text-align: left;
  position: sticky;
  left: 0;
  z-index: 1;
}

.matrix-head--row .head-swatch {
  margin-right: var(--ds-space-2);
}

.head-swatch {
  display: inline-block;
  width: var(--ds-space-4);
  height: var(--ds-space-4);
  border: var(--ds-border-width) solid var(--ds-border-strong);
  border-radius: var(--ds-radius-sm);
  vertical-align: middle;
}

.matrix-head:not(.matrix-head--row) .head-hex {
  display: block;
  margin-top: var(--ds-space-1);
}

.matrix-cell {
  min-width: 72px;
  height: 72px;
  padding: var(--ds-space-1);
  text-align: center;
  vertical-align: middle;
  border: var(--ds-border-width) solid var(--ds-border);
}

.matrix-cell--self {
  background: var(--ds-surface-2);
}

.cell-sample {
  display: block;
  font-size: var(--ds-text-lg);
  font-weight: var(--ds-weight-semibold);
  line-height: var(--ds-leading-tight);
}

/* The ratio sits on its own surface: on a failing pair the cell's text
   color is unreadable by definition, but the number must not be. */
.cell-ratio {
  display: inline-block;
  margin: var(--ds-space-1) 0;
  padding: 0 var(--ds-space-1);
  border-radius: var(--ds-radius-sm);
  background: var(--ds-surface-1);
  color: var(--ds-text);
  font-family: var(--ds-font-mono);
  font-size: var(--ds-text-xs);
  line-height: var(--ds-leading);
}

.cell-ratio + .level-badge {
  display: flex;
  width: fit-content;
  margin: 0 auto;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (max-width: 768px) {
  .matrix-cell {
    min-width: 60px;
    height: 60px;
  }
}
</style>
