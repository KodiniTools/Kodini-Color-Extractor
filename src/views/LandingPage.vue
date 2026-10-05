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
  background: var(--ds-surface-0);
  transition: var(--app-transition-colors);
}

/* Hero Section */
.hero {
  max-width: var(--ds-container);
  margin: 0 auto;
  padding: var(--ds-space-16) var(--ds-space-6);
  text-align: center;
}

.hero-content {
  max-width: 700px;
  margin: 0 auto var(--ds-space-12);
}

/* The hero is the largest type in the system: 32 px, bold, tight. */
.hero-title {
  font-size: var(--ds-text-3xl);
  font-weight: var(--ds-weight-bold);
  letter-spacing: var(--ds-tracking-tight);
  color: var(--ds-text);
  line-height: var(--ds-leading-tight);
  margin-bottom: var(--ds-space-5);
}

.hero-subtitle {
  font-size: var(--ds-text-lg);
  color: var(--ds-text-2);
  line-height: var(--ds-leading);
  margin-bottom: var(--ds-space-8);
}

.hero-actions {
  display: flex;
  gap: var(--ds-space-3);
  justify-content: center;
  flex-wrap: wrap;
}

/* Primary button, large: the one gold surface of the hero. */
.hero-cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: var(--ds-control-lg);
  padding: 0 var(--ds-space-5);
  background: var(--ds-accent);
  color: var(--ds-on-accent);
  border: var(--ds-border-width) solid transparent;
  border-radius: var(--ds-radius-md);
  text-decoration: none;
  font-weight: var(--ds-weight-semibold);
  font-size: var(--ds-text-lg);
  line-height: 1;
  transition: var(--app-transition-colors);
}

.hero-cta:hover {
  background: var(--ds-accent-hover);
}

.hero-cta:focus-visible {
  outline: none;
  box-shadow: var(--ds-focus-ring);
}

.hero-cta-secondary {
  background: var(--ds-surface-2);
  color: var(--ds-text);
  border-color: var(--ds-border-strong);
  font-weight: var(--ds-weight-medium);
}

.hero-cta-secondary:hover {
  background: var(--ds-surface-3);
}

/* Feature Cards: flat panels, hover strengthens the border. */
.feature-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--ds-space-4);
  max-width: 1000px;
  margin: 0 auto;
}

.feature-card {
  background: var(--ds-surface-1);
  border: var(--ds-border-width) solid var(--ds-border);
  border-radius: var(--ds-radius-md);
  padding: var(--ds-space-5);
  text-align: center;
  transition: var(--app-transition-colors);
}

.feature-card:hover {
  border-color: var(--ds-border-strong);
}

/* The highlighted card is "selected": soft accent fill, accent border. */
.feature-card-highlight {
  background: var(--ds-accent-soft);
  border-color: var(--ds-accent);
}

.feature-card-highlight:hover {
  border-color: var(--ds-accent-hover);
}

.feature-title {
  font-size: var(--ds-text-xl);
  font-weight: var(--ds-weight-bold);
  line-height: var(--ds-leading-tight);
  color: var(--ds-text);
  margin-bottom: var(--ds-space-2);
}

.feature-description {
  font-size: var(--ds-text-md);
  color: var(--ds-text-2);
  line-height: var(--ds-leading);
}

/* Generator Showcase Section */
.generator-showcase {
  padding: var(--ds-space-16) var(--ds-space-6);
}

.showcase-inner {
  max-width: 1100px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--ds-space-12);
  align-items: center;
}

/* Badge: soft accent fill with an accent border, ink text. */
.showcase-tag {
  display: inline-flex;
  align-items: center;
  height: var(--ds-control-sm);
  padding: 0 var(--ds-space-3);
  font-size: var(--ds-text-xs);
  font-weight: var(--ds-weight-semibold);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ds-text);
  background: var(--ds-accent-soft);
  border: var(--ds-border-width) solid var(--ds-accent);
  border-radius: var(--ds-radius-full);
  margin-bottom: var(--ds-space-4);
}

.showcase-title {
  font-size: var(--ds-text-2xl);
  font-weight: var(--ds-weight-bold);
  letter-spacing: var(--ds-tracking-tight);
  color: var(--ds-text);
  line-height: var(--ds-leading-tight);
  margin-bottom: var(--ds-space-4);
}

.showcase-desc {
  font-size: var(--ds-text-lg);
  color: var(--ds-text-2);
  line-height: var(--ds-leading);
  margin-bottom: var(--ds-space-5);
}

.showcase-list {
  list-style: none;
  margin: 0 0 var(--ds-space-6);
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-3);
}

.showcase-list li {
  position: relative;
  padding-left: var(--ds-space-6);
  font-size: var(--ds-text-md);
  color: var(--ds-text-2);
  line-height: var(--ds-leading);
}

/* A quiet check: bordered circle in the input surface, ink tick. */
.showcase-list li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 2px;
  width: var(--ds-icon-sm);
  height: var(--ds-icon-sm);
  border-radius: 50%;
  background: var(--ds-surface-2);
  border: var(--ds-border-width) solid var(--ds-border-strong);
  box-sizing: border-box;
}

.showcase-list li::after {
  content: '';
  position: absolute;
  left: 5px;
  top: 5px;
  width: 4px;
  height: 7px;
  border: solid var(--ds-text);
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.showcase-cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: var(--ds-control-lg);
  padding: 0 var(--ds-space-5);
  background: var(--ds-accent);
  color: var(--ds-on-accent);
  border: var(--ds-border-width) solid transparent;
  border-radius: var(--ds-radius-md);
  text-decoration: none;
  font-weight: var(--ds-weight-semibold);
  font-size: var(--ds-text-lg);
  line-height: 1;
  transition: var(--app-transition-colors);
}

.showcase-cta:hover {
  background: var(--ds-accent-hover);
}

.showcase-cta:focus-visible {
  outline: none;
  box-shadow: var(--ds-focus-ring);
}

.showcase-image-link {
  display: block;
  border: var(--ds-border-width) solid var(--ds-border);
  border-radius: var(--ds-radius-lg);
  overflow: hidden;
  transition: var(--app-transition-colors);
}

.showcase-image-link:hover {
  border-color: var(--ds-border-strong);
}

.showcase-image-link:focus-visible {
  outline: none;
  box-shadow: var(--ds-focus-ring);
}

.showcase-image {
  display: block;
  width: 100%;
  height: auto;
}

/* Details Section */
.details-section {
  background: var(--ds-surface-1);
  padding: var(--ds-space-16) var(--ds-space-6);
  border-top: var(--ds-border-width) solid var(--ds-border);
  border-bottom: var(--ds-border-width) solid var(--ds-border);
  transition: var(--app-transition-colors);
}

.details-header {
  text-align: center;
  max-width: 600px;
  margin: 0 auto var(--ds-space-8);
}

.details-title {
  font-size: var(--ds-text-2xl);
  font-weight: var(--ds-weight-bold);
  letter-spacing: var(--ds-tracking-tight);
  line-height: var(--ds-leading-tight);
  color: var(--ds-text);
  margin-bottom: var(--ds-space-3);
}

.details-subtitle {
  font-size: var(--ds-text-lg);
  color: var(--ds-text-2);
  line-height: var(--ds-leading);
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--ds-space-6);
  max-width: 1000px;
  margin: 0 auto;
}

.detail-item {
  text-align: center;
  padding: var(--ds-space-5) var(--ds-space-4);
  background: var(--ds-surface-2);
  border: var(--ds-border-width) solid var(--ds-border);
  border-radius: var(--ds-radius-md);
  transition: var(--app-transition-colors);
}

.detail-item:hover {
  border-color: var(--ds-border-strong);
}

.detail-item h4 {
  font-size: var(--ds-text-lg);
  font-weight: var(--ds-weight-semibold);
  line-height: var(--ds-leading);
  color: var(--ds-text);
  margin-bottom: var(--ds-space-1);
}

.detail-item p {
  font-size: var(--ds-text-sm);
  color: var(--ds-text-2);
  line-height: var(--ds-leading);
}

/* CTA Section */
.cta-section {
  padding: var(--ds-space-16) var(--ds-space-6);
  text-align: center;
}

.cta-content {
  max-width: 500px;
  margin: 0 auto;
}

.cta-content h2 {
  font-size: var(--ds-text-2xl);
  font-weight: var(--ds-weight-bold);
  letter-spacing: var(--ds-tracking-tight);
  line-height: var(--ds-leading-tight);
  color: var(--ds-text);
  margin-bottom: var(--ds-space-3);
}

.cta-content p {
  font-size: var(--ds-text-lg);
  color: var(--ds-text-2);
  line-height: var(--ds-leading);
  margin-bottom: var(--ds-space-6);
}

.cta-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: var(--ds-control-lg);
  padding: 0 var(--ds-space-6);
  background: var(--ds-accent);
  color: var(--ds-on-accent);
  border: var(--ds-border-width) solid transparent;
  border-radius: var(--ds-radius-md);
  text-decoration: none;
  font-weight: var(--ds-weight-semibold);
  font-size: var(--ds-text-lg);
  line-height: 1;
  transition: var(--app-transition-colors);
}

.cta-button:hover {
  background: var(--ds-accent-hover);
}

.cta-button:focus-visible {
  outline: none;
  box-shadow: var(--ds-focus-ring);
}

/* Responsive */
@media (max-width: 900px) {
  .feature-cards {
    grid-template-columns: 1fr;
    max-width: 400px;
  }

  .details-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--ds-space-4);
  }

  .showcase-inner {
    grid-template-columns: 1fr;
    gap: var(--ds-space-8);
    max-width: 560px;
  }

  .showcase-media {
    order: -1;
  }
}

@media (max-width: 600px) {
  .hero {
    padding: var(--ds-space-12) var(--ds-space-4);
  }

  .details-section {
    padding: var(--ds-space-10) var(--ds-space-4);
  }

  .details-grid {
    grid-template-columns: 1fr;
  }

  .cta-section {
    padding: var(--ds-space-12) var(--ds-space-4);
  }

  .generator-showcase {
    padding: var(--ds-space-12) var(--ds-space-4);
  }
}

@media (max-width: 480px) {
  .hero {
    padding: var(--ds-space-8) var(--ds-space-3);
  }

  .hero-content {
    margin: 0 auto var(--ds-space-8);
  }

  .hero-title {
    font-size: var(--ds-text-2xl);
  }

  .hero-subtitle {
    font-size: var(--ds-text-md);
    margin-bottom: var(--ds-space-6);
  }

  .hero-cta {
    height: var(--ds-row-height);
    font-size: var(--ds-text-md);
  }

  .feature-cards {
    max-width: 100%;
    gap: var(--ds-space-3);
  }

  .feature-card {
    padding: var(--ds-space-4) var(--ds-space-3);
  }

  .feature-title {
    font-size: var(--ds-text-lg);
  }

  .feature-description {
    font-size: var(--ds-text-sm);
  }

  .details-section {
    padding: var(--ds-space-8) var(--ds-space-3);
  }

  .details-header {
    margin: 0 auto var(--ds-space-6);
  }

  .details-grid {
    gap: var(--ds-space-3);
  }

  .detail-item {
    padding: var(--ds-space-4) var(--ds-space-3);
  }

  .detail-item h4 {
    font-size: var(--ds-text-md);
  }

  .detail-item p {
    font-size: var(--ds-text-xs);
  }

  .cta-section {
    padding: var(--ds-space-8) var(--ds-space-3);
  }

  .generator-showcase {
    padding: var(--ds-space-8) var(--ds-space-3);
  }

  .cta-content h2 {
    font-size: var(--ds-text-xl);
  }

  .cta-content p {
    font-size: var(--ds-text-md);
  }

  .cta-button {
    height: var(--ds-row-height);
    font-size: var(--ds-text-md);
  }
}
</style>
