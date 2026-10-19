<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '../composables/useI18n'
import ModalDialog from './ui/ModalDialog.vue'
import { colorVisionReport, type VisionReport } from '../lib/core/colorVision'

const props = withDefaults(
  defineProps<{
    show?: boolean
    /** Palette colors as #RRGGBB, in palette order. */
    colors?: string[]
  }>(),
  { show: false, colors: () => [] }
)

const emit = defineEmits<{ close: [] }>()

const { t } = useI18n()

const report = computed(() => colorVisionReport(props.colors))
// Normal vision first, as the reference row.
const normal = computed(() => report.value[0]?.colors.map((c) => c.hex) ?? [])

function issuesLabel(row: VisionReport) {
  return t('visionIssues', { n: row.confusable.length })
}
</script>

<template>
  <ModalDialog
    :show="show"
    :title="t('visionTitle')"
    :close-label="t('visionClose')"
    @close="emit('close')"
  >
    <p class="vision-intro">{{ t('visionIntro') }}</p>

    <p v-if="normal.length < 2" class="vision-intro">{{ t('contrastNeedTwo') }}</p>

    <template v-else>
      <section class="vision-row">
        <h3 class="vision-heading">{{ t('visionNormal') }}</h3>
        <div class="vision-strip">
          <span
            v-for="hex in normal"
            :key="hex"
            class="vision-swatch"
            :style="{ background: hex }"
            :title="hex"
          ></span>
        </div>
      </section>

      <section
        v-for="row in report"
        :key="row.type"
        class="vision-row"
        :data-testid="`vision-${row.type}`"
      >
        <div class="vision-row-head">
          <h3 class="vision-heading">{{ t(`vision_${row.type}`) }}</h3>
          <span class="vision-desc">{{ t(`vision_${row.type}_desc`) }}</span>
          <span
            class="vision-badge"
            :class="row.confusable.length ? 'vision-badge--warn' : 'vision-badge--ok'"
          >
            {{ row.confusable.length ? issuesLabel(row) : t('visionAllDistinct') }}
          </span>
        </div>
        <div class="vision-strip">
          <span
            v-for="c in row.colors"
            :key="c.hex"
            class="vision-swatch"
            :style="{ background: c.simulated }"
            :title="`${c.hex} → ${c.simulated}`"
          ></span>
        </div>
        <ul v-if="row.confusable.length" class="vision-pairs">
          <li
            v-for="[a, b] in row.confusable"
            :key="`${a}-${b}`"
            class="vision-pair"
            data-testid="vision-pair"
          >
            <span class="pair-dot" :style="{ background: a }" aria-hidden="true"></span>
            <span class="pair-dot" :style="{ background: b }" aria-hidden="true"></span>
            <span class="pair-hex">{{ a }} / {{ b }}</span>
          </li>
        </ul>
      </section>
    </template>
  </ModalDialog>
</template>

<style scoped>
.vision-intro {
  margin: 0;
  color: var(--ds-text-2);
  line-height: var(--ds-leading);
}

.vision-row {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-2);
}

.vision-row-head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--ds-space-1) var(--ds-space-3);
}

.vision-heading {
  margin: 0;
  font-size: var(--ds-text-xs);
  font-weight: var(--ds-weight-semibold);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ds-text-2);
}

.vision-desc {
  color: var(--ds-text-2);
}

.vision-badge {
  margin-left: auto;
  padding: 0 var(--ds-space-2);
  border: var(--ds-border-width) solid currentColor;
  border-radius: var(--ds-radius-full);
  font-size: var(--ds-text-xs);
  font-weight: var(--ds-weight-semibold);
  line-height: var(--ds-leading);
  white-space: nowrap;
}

.vision-badge--ok {
  color: var(--ds-success);
}

.vision-badge--warn {
  color: var(--ds-warning);
}

.vision-strip {
  display: flex;
  height: var(--ds-control-lg);
  border: var(--ds-border-width) solid var(--ds-border);
  border-radius: var(--ds-radius-md);
  overflow: hidden;
}

.vision-swatch {
  flex: 1;
  min-width: 0;
}

.vision-pairs {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: var(--ds-space-2) var(--ds-space-4);
}

.vision-pair {
  display: flex;
  align-items: center;
  gap: var(--ds-space-1);
}

.pair-dot {
  width: var(--ds-space-4);
  height: var(--ds-space-4);
  border: var(--ds-border-width) solid var(--ds-border-strong);
  border-radius: var(--ds-radius-full);
}

.pair-hex {
  margin-left: var(--ds-space-1);
  font-family: var(--ds-font-mono);
  font-size: var(--ds-text-xs);
  color: var(--ds-text-2);
}
</style>
