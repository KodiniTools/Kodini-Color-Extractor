<script setup>
import { useI18n } from '../composables/useI18n'

const { t } = useI18n()
</script>

<template>
  <nav class="landing-nav">
    <div class="nav-container">
      <div class="nav-links">
        <router-link to="/" class="nav-link">{{ t('navHome') }}</router-link>
        <router-link to="/app" class="nav-link">{{ t('navApp') }}</router-link>
        <router-link to="/generator" class="nav-link">{{ t('navGenerator') }}</router-link>
        <router-link to="/faq" class="nav-link">{{ t('navFaq') }}</router-link>
        <a
          href="https://kodinitools.com/blog/farbextraktor-farbpalette/"
          class="nav-link"
          target="_blank"
          rel="noopener noreferrer"
          >{{ t('navBlog') }}</a
        >
      </div>
    </div>
  </nav>
</template>

<style scoped>
.landing-nav {
  position: relative;
  z-index: 50;
  background: var(--ds-surface-1);
  border-bottom: var(--ds-border-width) solid var(--ds-border);
  transition: var(--app-transition-colors);
}

.nav-container {
  max-width: var(--ds-container);
  margin: 0 auto;
  padding: var(--ds-space-3) var(--ds-space-6);
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: var(--ds-space-2);
}

.nav-link {
  display: inline-flex;
  align-items: center;
  height: var(--ds-control-md);
  padding: 0 var(--ds-space-4);
  text-decoration: none;
  color: var(--ds-text-2);
  font-size: var(--ds-text-md);
  font-weight: var(--ds-weight-medium);
  border-radius: var(--ds-radius-sm);
  transition: var(--app-transition-colors);
}

.nav-link:hover {
  color: var(--ds-text);
  background: var(--ds-surface-2);
}

.nav-link:focus-visible {
  outline: none;
  box-shadow: var(--ds-focus-ring);
}

.nav-link.router-link-active {
  color: var(--ds-text);
  background: var(--ds-surface-2);
}

@media (max-width: 768px) {
  .nav-container {
    padding: var(--ds-space-2) var(--ds-space-4);
  }

  .nav-links {
    gap: var(--ds-space-1);
  }

  .nav-link {
    padding: 0 var(--ds-space-3);
    font-size: var(--ds-text-sm);
  }
}

@media (max-width: 480px) {
  .nav-container {
    padding: var(--ds-space-2) var(--ds-space-3);
  }

  .nav-link {
    padding: 0 var(--ds-space-2);
    font-size: var(--ds-text-xs);
  }
}
</style>
