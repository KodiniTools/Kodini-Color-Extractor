<script setup>
import { useI18n } from '../composables/useI18n'

const { t } = useI18n()
</script>

<template>
  <nav class="landing-nav">
    <div class="nav-container">
      <router-link to="/" class="nav-logo">
        <span class="logo-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <circle cx="12" cy="12" r="4" fill="var(--color-accent)"></circle>
          </svg>
        </span>
        <span class="logo-text">Kodini</span>
      </router-link>

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
  justify-content: space-between;
}

.nav-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: var(--text-primary);
  font-weight: 700;
  font-size: 18px;
  transition: color 0.2s ease;
}

.nav-logo:hover {
  color: var(--color-accent);
}

.logo-icon {
  display: flex;
  align-items: center;
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

  .logo-text {
    display: none;
  }
}
</style>
