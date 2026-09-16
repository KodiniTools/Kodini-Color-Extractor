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
        stroke-width="2"
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
  gap: 4px 8px;
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  color: var(--text-tertiary);
  transition: color 0.3s ease;
}

.tool-cross-link-anchor {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--text-secondary);
  font-weight: 500;
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: all 0.2s ease;
}

.tool-cross-link-anchor:hover,
.tool-cross-link-anchor:focus-visible {
  color: var(--text-primary);
  border-bottom-color: currentColor;
  outline: none;
}

.tool-cross-link-icon {
  transition: transform 0.2s ease;
}

.tool-cross-link-anchor:hover .tool-cross-link-icon {
  transform: translateX(2px);
}
</style>
