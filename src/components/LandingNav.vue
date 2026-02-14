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
        <router-link to="/faq" class="nav-link">{{ t('navFaq') }}</router-link>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.landing-nav {
  position: relative;
  z-index: 50;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-light);
  transition: all 0.3s ease;
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 8px;
}

.nav-link {
  padding: 8px 16px;
  text-decoration: none;
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.nav-link:hover {
  color: var(--text-primary);
  background: var(--bg-hover);
}

.nav-link.router-link-active {
  color: var(--text-primary);
  background: var(--bg-hover);
}

@media (max-width: 768px) {
  .nav-container {
    padding: 12px 16px;
  }

  .nav-links {
    gap: 4px;
  }

  .nav-link {
    padding: 6px 10px;
    font-size: 13px;
  }

}

@media (max-width: 480px) {
  .nav-container {
    padding: 10px 12px;
  }

  .nav-link {
    padding: 8px 10px;
    font-size: 12px;
    min-height: 36px;
    display: flex;
    align-items: center;
  }
}
</style>
