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

const faqCount = 8
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
              stroke-width="2"
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
  background: var(--bg-primary);
  transition: background 0.3s ease;
}

.faq-hero {
  text-align: center;
  padding: 64px 24px 48px;
  max-width: 700px;
  margin: 0 auto;
}

.faq-title {
  font-size: clamp(28px, 4vw, 40px);
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 12px;
  transition: color 0.3s ease;
}

.faq-subtitle {
  font-size: 16px;
  color: var(--text-secondary);
  transition: color 0.3s ease;
}

.faq-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 24px 64px;
}

.faq-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.faq-item {
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: 10px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.faq-item:hover {
  border-color: var(--border-hover);
}

.faq-item-open {
  border-color: var(--selection-color);
}

.faq-question {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 20px;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  font-size: 15px;
  font-weight: 500;
  color: var(--text-primary);
  transition: all 0.2s ease;
}

.faq-question:hover {
  background: var(--bg-hover);
}

.faq-icon {
  flex-shrink: 0;
  color: var(--text-secondary);
  transition: transform 0.2s ease;
}

.faq-icon-rotated {
  transform: rotate(180deg);
}

.faq-answer {
  padding: 0 20px 18px;
}

.faq-answer p {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.6;
  transition: color 0.3s ease;
}

.faq-cta {
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-light);
  padding: 64px 24px;
  text-align: center;
  transition: all 0.3s ease;
}

.faq-cta-content h2 {
  font-size: 22px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 20px;
  transition: color 0.3s ease;
}

.faq-cta-button {
  display: inline-block;
  background: var(--btn-primary-bg);
  color: var(--btn-primary-text);
  padding: 12px 24px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.2s ease;
}

.faq-cta-button:hover {
  background: var(--btn-primary-hover);
  transform: translateY(-2px);
}

@media (max-width: 600px) {
  .faq-hero {
    padding: 40px 16px 32px;
  }

  .faq-content {
    padding: 0 16px 48px;
  }

  .faq-question {
    padding: 14px 16px;
    font-size: 14px;
  }

  .faq-answer {
    padding: 0 16px 14px;
  }

  .faq-cta {
    padding: 48px 16px;
  }
}
</style>
