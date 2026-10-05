<script setup>
defineProps({
  /** Section heading, rendered as a small caps label. */
  title: { type: String, required: true },
  /** Drops the separator — use on the first section of a panel. */
  first: { type: Boolean, default: false },
})
</script>

<template>
  <section class="panel-section" :class="{ 'panel-section--first': first }">
    <div class="panel-section-head">
      <h2 class="panel-section-title">{{ title }}</h2>
      <div v-if="$slots.actions" class="panel-section-actions">
        <slot name="actions" />
      </div>
    </div>
    <div class="panel-section-body">
      <slot />
    </div>
  </section>
</template>

<style scoped>
/* One section rhythm for every sidebar panel: an eyebrow label, a hairline
   above it, and a fixed gap to the controls below. Both the extractor sidebar
   and the image panel use it so the two sides read as one system. */
.panel-section {
  padding-top: var(--ds-space-4);
  margin-top: var(--ds-space-4);
  border-top: var(--ds-border-width) solid var(--ds-border);
}

.panel-section--first {
  padding-top: 0;
  margin-top: 0;
  border-top: none;
}

.panel-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ds-space-2);
  margin-bottom: var(--ds-space-3);
  min-height: var(--ds-control-sm);
}

/* Eyebrow: 12 px, semibold, uppercase. */
.panel-section-title {
  margin: 0;
  font-size: var(--ds-text-xs);
  font-weight: var(--ds-weight-semibold);
  line-height: var(--ds-leading);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ds-text-2);
}

.panel-section-actions {
  display: flex;
  align-items: center;
  gap: var(--ds-space-1);
}

.panel-section-body {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-3);
}
</style>
