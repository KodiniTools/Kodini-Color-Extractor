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
/* One section rhythm for every sidebar panel: a quiet caps label, a hairline
   above it, and a fixed gap to the controls below. Both the extractor sidebar
   and the image panel use it so the two sides read as one system. */
.panel-section {
  padding-top: 18px;
  margin-top: 18px;
  border-top: 1px solid var(--border-light);
  transition: border-color 0.3s ease;
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
  gap: 8px;
  margin-bottom: 12px;
  min-height: 24px;
}

.panel-section-title {
  margin: 0;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: var(--text-tertiary);
  transition: color 0.3s ease;
}

.panel-section-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.panel-section-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
