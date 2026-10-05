<script setup>
import { ref } from 'vue'
import { useI18n } from '../composables/useI18n'
import LandingNav from '../components/LandingNav.vue'

const { t } = useI18n()

const openItems = ref([])

function toggleItem(index) {
  const pos = openItems.value.indexOf(index)
  if (pos === -1) {
    openItems.value.push(index)
  } else {
    openItems.value.splice(pos, 1)
  }
}

function isOpen(index) {
  return openItems.value.includes(index)
}

const faqCount = 10
</script>

<template>
  <div class="faq-page">
    <LandingNav />

    <section class="faq-hero">
      <h1 class="faq-title">{{ t('faqTitle') }}</h1>
      <p class="faq-subtitle">{{ t('faqSubtitle') }}</p>
    </section>

    <section class="faq-content">
      <div class="faq-list">
        <div
          v-for="i in faqCount"
          :key="i"
          class="faq-item"
          :class="{ 'faq-item-open': isOpen(i) }"
        >
          <button class="faq-question" @click="toggleItem(i)">
            <span>{{ t(`faq${i}Question`) }}</span>
            <svg
              class="faq-icon"
              :class="{ 'faq-icon-rotated': isOpen(i) }"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.75"
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
          <div class="faq-answer" v-show="isOpen(i)">
            <p>{{ t(`faq${i}Answer`) }}</p>
          </div>
        </div>
      </div>
    </section>

    <section class="faq-cta">
      <div class="faq-cta-content">
        <h2>{{ t('faqCtaTitle') }}</h2>
        <router-link to="/app" class="faq-cta-button">
          {{ t('faqCtaButton') }}
        </router-link>
      </div>
    </section>
  </div>
</template>

<style scoped>
.faq-page {
  min-height: 100vh;
  background: var(--ds-surface-0);
  transition: var(--app-transition-colors);
}

.faq-hero {
  text-align: center;
  padding: var(--ds-space-16) var(--ds-space-6) var(--ds-space-12);
  max-width: 700px;
  margin: 0 auto;
}

.faq-title {
  font-size: var(--ds-text-3xl);
  font-weight: var(--ds-weight-bold);
  letter-spacing: var(--ds-tracking-tight);
  line-height: var(--ds-leading-tight);
  color: var(--ds-text);
  margin-bottom: var(--ds-space-3);
}

.faq-subtitle {
  font-size: var(--ds-text-lg);
  color: var(--ds-text-2);
  line-height: var(--ds-leading);
}

.faq-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 var(--ds-space-6) var(--ds-space-16);
}

.faq-list {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-3);
}

/* Each question is a flat card; the open one wears the accent border. */
.faq-item {
  background: var(--ds-surface-1);
  border: var(--ds-border-width) solid var(--ds-border);
  border-radius: var(--ds-radius-md);
  overflow: hidden;
  transition: var(--app-transition-colors);
}

.faq-item:hover {
  border-color: var(--ds-border-strong);
}

.faq-item-open,
.faq-item-open:hover {
  border-color: var(--ds-accent);
}

.faq-question {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--ds-space-3);
  padding: var(--ds-space-4) var(--ds-space-5);
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  font-size: var(--ds-text-lg);
  font-weight: var(--ds-weight-medium);
  line-height: var(--ds-leading);
  color: var(--ds-text);
  transition: var(--app-transition-colors);
}

.faq-question:hover {
  background: var(--ds-surface-2);
}

.faq-question:focus-visible {
  outline: none;
  box-shadow: inset var(--ds-focus-ring);
}

.faq-icon {
  flex-shrink: 0;
  width: var(--ds-icon-md);
  height: var(--ds-icon-md);
  color: var(--ds-text-2);
  transition: transform var(--ds-duration) var(--ds-ease);
}

.faq-icon-rotated {
  transform: rotate(180deg);
}

.faq-answer {
  padding: 0 var(--ds-space-5) var(--ds-space-4);
}

.faq-answer p {
  font-size: var(--ds-text-md);
  color: var(--ds-text-2);
  line-height: var(--ds-leading);
}

.faq-cta {
  background: var(--ds-surface-1);
  border-top: var(--ds-border-width) solid var(--ds-border);
  padding: var(--ds-space-16) var(--ds-space-6);
  text-align: center;
  transition: var(--app-transition-colors);
}

.faq-cta-content h2 {
  font-size: var(--ds-text-xl);
  font-weight: var(--ds-weight-semibold);
  line-height: var(--ds-leading-tight);
  color: var(--ds-text);
  margin-bottom: var(--ds-space-5);
}

.faq-cta-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: var(--ds-control-md);
  padding: 0 var(--ds-space-4);
  background: var(--ds-accent);
  color: var(--ds-on-accent);
  border: var(--ds-border-width) solid transparent;
  border-radius: var(--ds-radius-md);
  text-decoration: none;
  font-weight: var(--ds-weight-semibold);
  font-size: var(--ds-text-md);
  line-height: 1;
  transition: var(--app-transition-colors);
}

.faq-cta-button:hover {
  background: var(--ds-accent-hover);
}

.faq-cta-button:focus-visible {
  outline: none;
  box-shadow: var(--ds-focus-ring);
}

@media (max-width: 600px) {
  .faq-hero {
    padding: var(--ds-space-10) var(--ds-space-4) var(--ds-space-8);
  }

  .faq-content {
    padding: 0 var(--ds-space-4) var(--ds-space-12);
  }

  .faq-question {
    padding: var(--ds-space-3) var(--ds-space-4);
    font-size: var(--ds-text-md);
  }

  .faq-answer {
    padding: 0 var(--ds-space-4) var(--ds-space-3);
  }

  .faq-cta {
    padding: var(--ds-space-12) var(--ds-space-4);
  }
}

@media (max-width: 480px) {
  .faq-hero {
    padding: var(--ds-space-6) var(--ds-space-3) var(--ds-space-5);
  }

  .faq-title {
    font-size: var(--ds-text-2xl);
    margin-bottom: var(--ds-space-2);
  }

  .faq-subtitle {
    font-size: var(--ds-text-md);
  }

  .faq-content {
    padding: 0 var(--ds-space-3) var(--ds-space-8);
  }

  .faq-list {
    gap: var(--ds-space-2);
  }

  .faq-question {
    padding: var(--ds-space-3);
    font-size: var(--ds-text-sm);
    min-height: var(--ds-row-height);
  }

  .faq-answer {
    padding: 0 var(--ds-space-3) var(--ds-space-3);
  }

  .faq-answer p {
    font-size: var(--ds-text-sm);
  }

  .faq-cta {
    padding: var(--ds-space-8) var(--ds-space-3);
  }

  .faq-cta-content h2 {
    font-size: var(--ds-text-lg);
    margin-bottom: var(--ds-space-4);
  }

  .faq-cta-button {
    min-height: var(--ds-row-height);
    font-size: var(--ds-text-md);
  }
}
</style>
