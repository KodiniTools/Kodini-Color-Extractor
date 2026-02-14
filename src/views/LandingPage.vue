<script setup>
import { useI18n } from '../composables/useI18n'
import LandingNav from '../components/LandingNav.vue'

const { t } = useI18n()
</script>

<template>
  <div class="landing-page">
    <LandingNav />

    <!-- Hero Section -->
    <section class="hero">
      <div class="hero-content">
        <h1 class="hero-title">{{ t('heroTitle') }}</h1>
        <p class="hero-subtitle">{{ t('heroSubtitle') }}</p>
        <router-link to="/app" class="hero-cta">
          {{ t('heroCta') }}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </router-link>
      </div>

      <!-- Feature Cards Grid -->
      <div class="feature-cards">
        <div class="feature-card">
          <h3 class="feature-title">{{ t('feature1Title') }}</h3>
          <p class="feature-description">{{ t('feature1Desc') }}</p>
        </div>

        <div class="feature-card feature-card-highlight">
          <h3 class="feature-title">{{ t('feature2Title') }}</h3>
          <p class="feature-description">{{ t('feature2Desc') }}</p>
        </div>

        <div class="feature-card">
          <h3 class="feature-title">{{ t('feature3Title') }}</h3>
          <p class="feature-description">{{ t('feature3Desc') }}</p>
        </div>
      </div>
    </section>

    <!-- Details Section -->
    <section class="details-section">
      <div class="details-header">
        <h2 class="details-title">{{ t('detailsTitle') }}</h2>
        <p class="details-subtitle">{{ t('detailsSubtitle') }}</p>
      </div>

      <div class="details-grid">
        <div class="detail-item">
          <div class="detail-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
          </div>
          <div class="detail-content">
            <h4>{{ t('detail1Title') }}</h4>
            <p>{{ t('detail1Desc') }}</p>
          </div>
        </div>

        <div class="detail-item">
          <div class="detail-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="13.5" cy="6.5" r="2.5"></circle>
              <circle cx="6.5" cy="13.5" r="2.5"></circle>
              <circle cx="17.5" cy="17.5" r="2.5"></circle>
              <line x1="13.5" y1="9" x2="13.5" y2="14"></line>
              <line x1="6.5" y1="16" x2="6.5" y2="21"></line>
            </svg>
          </div>
          <div class="detail-content">
            <h4>{{ t('detail2Title') }}</h4>
            <p>{{ t('detail2Desc') }}</p>
          </div>
        </div>

        <div class="detail-item">
          <div class="detail-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
              <line x1="9" y1="9" x2="9.01" y2="9"></line>
              <line x1="15" y1="9" x2="15.01" y2="9"></line>
            </svg>
          </div>
          <div class="detail-content">
            <h4>{{ t('detail3Title') }}</h4>
            <p>{{ t('detail3Desc') }}</p>
          </div>
        </div>

        <div class="detail-item">
          <div class="detail-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
          </div>
          <div class="detail-content">
            <h4>{{ t('detail4Title') }}</h4>
            <p>{{ t('detail4Desc') }}</p>
          </div>
        </div>

        <div class="detail-item">
          <div class="detail-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="4 17 10 11 4 5"></polyline>
              <line x1="12" y1="19" x2="20" y2="19"></line>
            </svg>
          </div>
          <div class="detail-content">
            <h4>{{ t('detail5Title') }}</h4>
            <p>{{ t('detail5Desc') }}</p>
          </div>
        </div>

        <div class="detail-item">
          <div class="detail-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
              <line x1="8" y1="21" x2="16" y2="21"></line>
              <line x1="12" y1="17" x2="12" y2="21"></line>
            </svg>
          </div>
          <div class="detail-content">
            <h4>{{ t('detail6Title') }}</h4>
            <p>{{ t('detail6Desc') }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="cta-section">
      <div class="cta-content">
        <h2>{{ t('ctaTitle') }}</h2>
        <p>{{ t('ctaSubtitle') }}</p>
        <router-link to="/app" class="cta-button">
          {{ t('ctaButton') }}
        </router-link>
      </div>
    </section>
  </div>
</template>

<style scoped>
.landing-page {
  min-height: 100vh;
  background: var(--bg-primary);
  transition: background 0.3s ease;
}

/* Hero Section */
.hero {
  max-width: 1200px;
  margin: 0 auto;
  padding: 80px 24px;
  text-align: center;
}

.hero-content {
  max-width: 700px;
  margin: 0 auto 60px;
}

.hero-title {
  font-size: clamp(32px, 5vw, 48px);
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
  margin-bottom: 20px;
  transition: color 0.3s ease;
}

.hero-subtitle {
  font-size: clamp(16px, 2vw, 18px);
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 32px;
  transition: color 0.3s ease;
}

.hero-cta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--btn-primary-bg);
  color: var(--btn-primary-text);
  padding: 14px 28px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  font-size: 15px;
  transition: all 0.2s ease;
}

.hero-cta:hover {
  background: var(--btn-primary-hover);
  transform: translateY(-2px);
}

/* Feature Cards */
.feature-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  max-width: 1000px;
  margin: 0 auto;
}

.feature-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: 12px;
  padding: 20px 20px;
  text-align: center;
  transition: all 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px var(--shadow-soft);
}

.feature-card-highlight {
  background: var(--accent-bg);
  border-color: var(--accent-bg);
}

.feature-card-highlight .feature-title {
  color: var(--accent-text);
}

.feature-card-highlight .feature-description {
  color: var(--accent-text);
  opacity: 0.8;
}

.feature-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
  transition: color 0.3s ease;
}

.feature-description {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.5;
  transition: color 0.3s ease;
}

/* Details Section */
.details-section {
  background: var(--bg-secondary);
  padding: 80px 24px;
  border-top: 1px solid var(--border-light);
  border-bottom: 1px solid var(--border-light);
  transition: all 0.3s ease;
}

.details-header {
  text-align: center;
  max-width: 600px;
  margin: 0 auto 48px;
}

.details-title {
  font-size: clamp(24px, 4vw, 32px);
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 12px;
  transition: color 0.3s ease;
}

.details-subtitle {
  font-size: 16px;
  color: var(--text-secondary);
  transition: color 0.3s ease;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 32px;
  max-width: 1100px;
  margin: 0 auto;
}

.detail-item {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.detail-icon {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-primary);
  border-radius: 10px;
  color: var(--text-primary);
  transition: all 0.3s ease;
}

.detail-content h4 {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
  transition: color 0.3s ease;
}

.detail-content p {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.5;
  transition: color 0.3s ease;
}

/* CTA Section */
.cta-section {
  padding: 80px 24px;
  text-align: center;
}

.cta-content {
  max-width: 500px;
  margin: 0 auto;
}

.cta-content h2 {
  font-size: clamp(22px, 3vw, 28px);
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 12px;
  transition: color 0.3s ease;
}

.cta-content p {
  font-size: 15px;
  color: var(--text-secondary);
  margin-bottom: 24px;
  transition: color 0.3s ease;
}

.cta-button {
  display: inline-block;
  background: var(--accent-bg);
  color: var(--accent-text);
  padding: 14px 32px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  font-size: 15px;
  transition: all 0.2s ease;
}

.cta-button:hover {
  background: var(--accent-hover);
  transform: translateY(-2px);
}

/* Responsive */
@media (max-width: 900px) {
  .feature-cards {
    grid-template-columns: 1fr;
    max-width: 400px;
  }

  .details-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 24px;
  }
}

@media (max-width: 600px) {
  .hero {
    padding: 48px 16px;
  }

  .details-section {
    padding: 48px 16px;
  }

  .details-grid {
    grid-template-columns: 1fr;
  }

  .cta-section {
    padding: 48px 16px;
  }
}

@media (max-width: 480px) {
  .hero {
    padding: 32px 12px;
  }

  .hero-content {
    margin: 0 auto 36px;
  }

  .hero-title {
    font-size: 26px;
  }

  .hero-subtitle {
    font-size: 14px;
    margin-bottom: 24px;
  }

  .hero-cta {
    padding: 12px 24px;
    font-size: 14px;
  }

  .feature-cards {
    max-width: 100%;
    gap: 12px;
  }

  .feature-card {
    padding: 16px 14px;
  }

  .feature-title {
    font-size: 16px;
  }

  .feature-description {
    font-size: 13px;
  }

  .details-section {
    padding: 40px 12px;
  }

  .details-header {
    margin: 0 auto 32px;
  }

  .details-grid {
    gap: 16px;
  }

  .detail-item {
    gap: 12px;
  }

  .detail-icon {
    width: 40px;
    height: 40px;
    border-radius: 8px;
  }

  .detail-content h4 {
    font-size: 14px;
  }

  .detail-content p {
    font-size: 12px;
  }

  .cta-section {
    padding: 32px 12px;
  }

  .cta-content h2 {
    font-size: 20px;
  }

  .cta-content p {
    font-size: 14px;
  }

  .cta-button {
    padding: 12px 28px;
    font-size: 14px;
  }
}
</style>
