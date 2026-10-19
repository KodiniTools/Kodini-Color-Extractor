<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '../composables/useI18n'
import { usePaletteLibrary } from '../composables/usePaletteLibrary'
import type { LibraryEntry, LibrarySource } from '../lib/core/paletteLibrary'
import ModalDialog from './ui/ModalDialog.vue'

const props = withDefaults(
  defineProps<{
    show?: boolean
    /** The palette currently on screen, as #RRGGBB. */
    colors?: string[]
    /** Which tool the current palette comes from. */
    source: LibrarySource
  }>(),
  { show: false, colors: () => [] }
)

const emit = defineEmits<{ close: []; open: [colors: string[]] }>()

const { t, locale } = useI18n()
const library = usePaletteLibrary()

const currentSaved = computed(() => library.isFavorite(props.colors))

const dateFormat = computed(
  () => new Intl.DateTimeFormat(locale.value, { dateStyle: 'medium', timeStyle: 'short' })
)

const sections = computed(() =>
  [
    { key: 'favorites', title: t('libraryFavorites'), items: library.favorites.value },
    { key: 'recent', title: t('libraryRecent'), items: library.recent.value },
  ].filter((s) => s.items.length)
)

function meta(entry: LibraryEntry) {
  return [
    t('libraryColors', { n: entry.colors.length }),
    t(`librarySource_${entry.source}`),
    entry.updatedAt ? dateFormat.value.format(entry.updatedAt) : '',
  ]
    .filter(Boolean)
    .join(' · ')
}

function saveCurrent() {
  library.saveFavorite(props.colors, props.source)
}
</script>

<template>
  <ModalDialog
    :show="show"
    :title="t('libraryTitle')"
    :close-label="t('libraryClose')"
    @close="emit('close')"
  >
    <p class="library-intro">{{ t('libraryIntro') }}</p>
    <p v-if="!library.persistent.value" class="library-note" role="status">
      {{ t('libraryNotPersistent') }}
    </p>

    <div v-if="colors.length" class="library-current">
      <div class="library-strip library-strip--current" aria-hidden="true">
        <span
          v-for="(hex, i) in colors"
          :key="`${hex}-${i}`"
          class="library-swatch"
          :style="{ background: hex }"
        ></span>
      </div>
      <button
        class="export-btn library-save"
        :disabled="currentSaved"
        data-testid="library-save-current"
        @click="saveCurrent"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
          <polygon
            points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
          />
        </svg>
        <span>{{ currentSaved ? t('librarySavedCurrent') : t('librarySaveCurrent') }}</span>
      </button>
    </div>

    <p v-if="!sections.length" class="library-intro">{{ t('libraryEmpty') }}</p>

    <section
      v-for="section in sections"
      :key="section.key"
      class="library-section"
      :data-testid="`library-${section.key}`"
    >
      <h3 class="library-heading">{{ section.title }}</h3>
      <ul class="library-list">
        <li
          v-for="entry in section.items"
          :key="entry.id"
          class="library-entry"
          data-testid="library-entry"
        >
          <div class="library-strip" :title="entry.colors.join(', ')">
            <span
              v-for="(hex, i) in entry.colors"
              :key="`${hex}-${i}`"
              class="library-swatch"
              :style="{ background: hex }"
            ></span>
          </div>
          <div class="library-row">
            <span class="library-meta">{{ meta(entry) }}</span>
            <div class="library-actions">
              <button
                class="library-icon-btn"
                :class="{ 'is-active': entry.favorite }"
                :aria-pressed="entry.favorite"
                :title="entry.favorite ? t('libraryUnfavorite') : t('libraryFavorite')"
                :aria-label="entry.favorite ? t('libraryUnfavorite') : t('libraryFavorite')"
                @click="library.toggleFavorite(entry.id)"
              >
                <svg
                  viewBox="0 0 24 24"
                  :fill="entry.favorite ? 'currentColor' : 'none'"
                  stroke="currentColor"
                  stroke-width="1.75"
                >
                  <polygon
                    points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
                  />
                </svg>
              </button>
              <button
                class="library-icon-btn library-icon-btn--danger"
                :title="t('libraryDelete')"
                :aria-label="t('libraryDelete')"
                @click="library.remove(entry.id)"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
                  <polyline points="3 6 5 6 21 6" />
                  <path
                    d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                  />
                </svg>
              </button>
              <button class="btn-history library-open" @click="emit('open', entry.colors)">
                {{ t('libraryOpenEntry') }}
              </button>
            </div>
          </div>
        </li>
      </ul>
    </section>
  </ModalDialog>
</template>

<style scoped>
.library-intro,
.library-note {
  margin: 0;
  color: var(--ds-text-2);
  line-height: var(--ds-leading);
}

.library-note {
  color: var(--ds-warning);
}

.library-current {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--ds-space-3);
}

.library-current .library-strip {
  flex: 1 1 200px;
}

.library-save {
  flex: 0 0 auto;
  width: auto;
}

.library-section {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-3);
}

.library-heading {
  margin: 0;
  font-size: var(--ds-text-xs);
  font-weight: var(--ds-weight-semibold);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ds-text-2);
}

.library-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: var(--ds-space-3);
}

.library-entry {
  display: flex;
  flex-direction: column;
  border: var(--ds-border-width) solid var(--ds-border);
  border-radius: var(--ds-radius-md);
  background: var(--ds-surface-2);
  overflow: hidden;
}

.library-strip {
  display: flex;
  height: var(--ds-control-lg);
  min-width: 0;
}

.library-strip--current {
  border: var(--ds-border-width) solid var(--ds-border);
  border-radius: var(--ds-radius-md);
  overflow: hidden;
}

.library-entry .library-strip {
  border-bottom: var(--ds-border-width) solid var(--ds-border);
}

.library-swatch {
  flex: 1;
  min-width: 0;
}

.library-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--ds-space-2);
  padding: var(--ds-space-2) var(--ds-space-3);
}

.library-meta {
  flex: 1 1 auto;
  font-size: var(--ds-text-xs);
  color: var(--ds-text-2);
}

.library-actions {
  display: flex;
  align-items: center;
  gap: var(--ds-space-1);
  margin-left: auto;
}

.library-open {
  flex: 0 0 auto;
}

.library-icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--ds-control-sm);
  height: var(--ds-control-sm);
  padding: 0;
  background: transparent;
  border: var(--ds-border-width) solid transparent;
  border-radius: var(--ds-radius-sm);
  color: var(--ds-text-2);
  cursor: pointer;
  transition: var(--app-transition-colors);
}

.library-icon-btn svg {
  width: var(--ds-icon-sm);
  height: var(--ds-icon-sm);
}

.library-icon-btn:hover {
  background: var(--ds-surface-3);
  color: var(--ds-text);
}

.library-icon-btn.is-active {
  color: var(--ds-warning);
}

.library-icon-btn--danger:hover {
  color: var(--ds-danger);
}

.library-icon-btn:focus-visible {
  outline: none;
  box-shadow: var(--ds-focus-ring);
}
</style>
