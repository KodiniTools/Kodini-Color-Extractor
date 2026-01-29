<script setup>
import { useI18n } from '../composables/useI18n'
import { useTheme } from '../composables/useTheme'

const { t, locale } = useI18n()
const { theme, toggleTheme } = useTheme()

function toggleLocale() {
  locale.value = locale.value === 'de' ? 'en' : 'de'
}
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
        <router-link to="/app" class="nav-link nav-link-primary">{{ t('navApp') }}</router-link>
        <router-link to="/faq" class="nav-link">{{ t('navFaq') }}</router-link>
      </div>

      <div class="nav-controls">
        <button class="theme-toggle" @click="toggleTheme" :title="theme === 'dark' ? 'Light mode' : 'Dark mode'">
          <svg v-if="theme === 'dark'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="5"></circle>
            <line x1="12" y1="1" x2="12" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="23"></line>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
            <line x1="1" y1="12" x2="3" y2="12"></line>
            <line x1="21" y1="12" x2="23" y2="12"></line>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
          </svg>
          <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
          </svg>
        </button>
        <button class="locale-toggle" @click="toggleLocale">
          {{ locale.toUpperCase() }}
        </button>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.landing-nav {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-light);
  backdrop-filter: blur(8px);
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

.nav-link-primary {
  background: var(--btn-primary-bg);
  color: var(--btn-primary-text);
}

.nav-link-primary:hover {
  background: var(--btn-primary-hover);
  color: var(--btn-primary-text);
}

.nav-link-primary.router-link-active {
  background: var(--btn-primary-bg);
  color: var(--btn-primary-text);
}

.nav-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.theme-toggle {
  background: var(--btn-secondary-bg);
  border: none;
  border-radius: 6px;
  padding: 8px;
  cursor: pointer;
  color: var(--btn-secondary-text);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.theme-toggle:hover {
  background: var(--btn-secondary-hover);
  color: var(--btn-primary-text);
}

.locale-toggle {
  background: var(--btn-secondary-bg);
  border: none;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  color: var(--btn-secondary-text);
  transition: all 0.2s ease;
}

.locale-toggle:hover {
  background: var(--btn-secondary-hover);
  color: var(--btn-primary-text);
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
