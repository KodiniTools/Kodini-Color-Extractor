<script setup>
/**
 * Subtle cross-promotion hint between the Color Extractor (/app) and the
 * Color Generator (/generator). Renders a short lead-in text followed by a
 * router link with an arrow icon. Purely presentational.
 */
defineProps({
  /** Route target, e.g. "/generator" or "/app". */
  to: { type: String, required: true },
  /** Lead-in sentence shown before the link. */
  text: { type: String, required: true },
  /** Link label. */
  linkText: { type: String, required: true },
})
</script>

<template>
  <p class="tool-cross-link">
    <span class="tool-cross-link-text">{{ text }}</span>
    <router-link :to="to" class="tool-cross-link-anchor">
      <span>{{ linkText }}</span>
      <svg
        class="tool-cross-link-icon"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.75"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <line x1="5" y1="12" x2="19" y2="12"></line>
        <polyline points="12 5 19 12 12 19"></polyline>
      </svg>
    </router-link>
  </p>
</template>

<style scoped>
.tool-cross-link {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: var(--ds-space-1) var(--ds-space-2);
  margin: 0;
  font-size: var(--ds-text-sm);
  line-height: var(--ds-leading);
  color: var(--ds-text-2);
}

.tool-cross-link-anchor {
  display: inline-flex;
  align-items: center;
  gap: var(--ds-space-1);
  color: var(--ds-link);
  font-weight: var(--ds-weight-medium);
  text-decoration: none;
  border-bottom: var(--ds-border-width) solid transparent;
  transition: var(--app-transition-colors);
}

.tool-cross-link-anchor:hover {
  color: var(--ds-accent);
  border-bottom-color: currentColor;
}

.tool-cross-link-anchor:focus-visible {
  outline: none;
  border-radius: var(--ds-radius-sm);
  box-shadow: var(--ds-focus-ring);
}

.tool-cross-link-icon {
  width: var(--ds-icon-sm);
  height: var(--ds-icon-sm);
}
</style>
