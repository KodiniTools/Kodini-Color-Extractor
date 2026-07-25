<script setup>
import { useI18n } from '../composables/useI18n'
import LandingNav from '../components/LandingNav.vue'

const { t } = useI18n()

// Public asset served under the app base path (resolved at runtime, not
// bundled) so the URL stays correct on every route.
const generatorImage = import.meta.env.BASE_URL + 'color-palette-generator-example.png'
</script>

<template>
  <div class="landing-page">
    <LandingNav />

    <!-- Hero Section -->
    <section class="hero">
      <div class="hero-content">
        <h1 class="hero-title">{{ t('heroTitle') }}</h1>
        <p class="hero-subtitle">{{ t('heroSubtitle') }}</p>
        <div class="hero-actions">
          <router-link to="/app" class="hero-cta">
            {{ t('heroCta') }}
          </router-link>
          <router-link to="/generator" class="hero-cta hero-cta-secondary">
            {{ t('heroCtaSecondary') }}
          </router-link>
        </div>
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

    <!-- Generator Showcase Section -->
    <section class="generator-showcase">
      <div class="showcase-inner">
        <div class="showcase-text">
          <span class="showcase-tag">{{ t('genShowcaseTag') }}</span>
          <h2 class="showcase-title">{{ t('genShowcaseTitle') }}</h2>
          <p class="showcase-desc">{{ t('genShowcaseDesc') }}</p>
          <ul class="showcase-list">
            <li>{{ t('genShowcasePoint1') }}</li>
            <li>{{ t('genShowcasePoint2') }}</li>
            <li>{{ t('genShowcasePoint3') }}</li>
          </ul>
          <router-link to="/generator" class="showcase-cta">
            {{ t('genShowcaseCta') }}
          </router-link>
        </div>
        <div class="showcase-media">
          <router-link to="/generator" class="showcase-image-link">
            <img
              class="showcase-image"
              :src="generatorImage"
              :alt="t('genShowcaseImageAlt')"
              width="1800"
              height="1125"
              loading="lazy"
              decoding="async"
            />
          </router-link>
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
          <h4>{{ t('detail1Title') }}</h4>
          <p>{{ t('detail1Desc') }}</p>
        </div>

        <div class="detail-item">
          <h4>{{ t('detail2Title') }}</h4>
          <p>{{ t('detail2Desc') }}</p>
        </div>

        <div class="detail-item">
          <h4>{{ t('detail3Title') }}</h4>
          <p>{{ t('detail3Desc') }}</p>
        </div>

        <div class="detail-item">
          <h4>{{ t('detail4Title') }}</h4>
          <p>{{ t('detail4Desc') }}</p>
        </div>

        <div class="detail-item">
          <h4>{{ t('detail5Title') }}</h4>
          <p>{{ t('detail5Desc') }}</p>
        </div>

        <div class="detail-item">
          <h4>{{ t('detail6Title') }}</h4>
          <p>{{ t('detail6Desc') }}</p>
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

.hero-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

.hero-cta {
  display: inline-block;
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

.hero-cta-secondary {
  background: transparent;
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.hero-cta-secondary:hover {
  background: var(--bg-hover);
  border-color: var(--border-hover);
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

/* Generator Showcase Section */
.generator-showcase {
  padding: 72px 24px;
}

.showcase-inner {
  max-width: 1100px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 48px;
  align-items: center;
}

.showcase-tag {
  display: inline-block;
  font-size: 13px;
  font-weight: 600;
  color: var(--accent-text);
  background: var(--accent-bg);
  padding: 6px 14px;
  border-radius: 999px;
  margin-bottom: 16px;
}

.showcase-title {
  font-size: clamp(24px, 3.5vw, 34px);
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
  margin-bottom: 16px;
  transition: color 0.3s ease;
}

.showcase-desc {
  font-size: 16px;
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 20px;
  transition: color 0.3s ease;
}

.showcase-list {
  list-style: none;
  margin: 0 0 28px;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.showcase-list li {
  position: relative;
  padding-left: 28px;
  font-size: 15px;
  color: var(--text-secondary);
  line-height: 1.5;
  transition: color 0.3s ease;
}

.showcase-list li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 6px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--accent-bg);
}

.showcase-list li::after {
  content: '';
  position: absolute;
  left: 5px;
  top: 10px;
  width: 5px;
  height: 8px;
  border: solid var(--accent-text);
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.showcase-cta {
  display: inline-block;
  background: var(--btn-primary-bg);
  color: var(--btn-primary-text);
  padding: 14px 28px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  font-size: 15px;
  transition: all 0.2s ease;
}

.showcase-cta:hover {
  background: var(--btn-primary-hover);
  transform: translateY(-2px);
}

.showcase-image-link {
  display: block;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 20px 60px var(--shadow-medium);
  transition: transform 0.3s ease;
}

.showcase-image-link:hover {
  transform: translateY(-4px);
}

.showcase-image {
  display: block;
  width: 100%;
  height: auto;
}

/* Details Section */
.details-section {
  background: var(--bg-secondary);
  padding: 60px 24px;
  border-top: 1px solid var(--border-light);
  border-bottom: 1px solid var(--border-light);
  transition: all 0.3s ease;
}

.details-header {
  text-align: center;
  max-width: 600px;
  margin: 0 auto 36px;
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
  gap: 24px;
  max-width: 1000px;
  margin: 0 auto;
}

.detail-item {
  text-align: center;
  padding: 20px 16px;
  background: var(--bg-primary);
  border-radius: 10px;
  transition: all 0.3s ease;
}

.detail-item h4 {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 6px;
  transition: color 0.3s ease;
}

.detail-item p {
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
    gap: 16px;
  }

  .showcase-inner {
    grid-template-columns: 1fr;
    gap: 32px;
    max-width: 560px;
  }

  .showcase-media {
    order: -1;
  }
}

@media (max-width: 600px) {
  .hero {
    padding: 48px 16px;
  }

  .details-section {
    padding: 40px 16px;
  }

  .details-grid {
    grid-template-columns: 1fr;
  }

  .cta-section {
    padding: 48px 16px;
  }

  .generator-showcase {
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
    padding: 32px 12px;
  }

  .details-header {
    margin: 0 auto 24px;
  }

  .details-grid {
    gap: 12px;
  }

  .detail-item {
    padding: 16px 12px;
  }

  .detail-item h4 {
    font-size: 14px;
  }

  .detail-item p {
    font-size: 12px;
  }

  .cta-section {
    padding: 32px 12px;
  }

  .generator-showcase {
    padding: 36px 12px;
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
