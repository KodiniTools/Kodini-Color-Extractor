<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from '../../composables/useI18n'
import { checkHandoff, consumeHandoff, clearHandoff } from '../../lib/core/handoff'

const emit = defineEmits(['accept', 'dismiss'])
const { t } = useI18n()

const handoffData = ref(null)

onMounted(() => {
  const data = checkHandoff()
  if (data) {
    handoffData.value = data
  }
})

function accept() {
  const data = consumeHandoff()
  if (data) {
    emit('accept', data.images)
  }
  handoffData.value = null
  removeHandoffParam()
}

function dismiss() {
  clearHandoff()
  handoffData.value = null
  emit('dismiss')
  removeHandoffParam()
}

function removeHandoffParam() {
  const url = new URL(window.location.href)
  url.searchParams.delete('handoff')
  window.history.replaceState({}, '', url.toString())
}
</script>

<template>
  <Transition name="handoff-banner">
    <div v-if="handoffData" class="handoff-banner">
      <div class="handoff-content">
        <div class="handoff-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
          </svg>
        </div>
        <div class="handoff-text">
          <span class="handoff-title">
            {{ t('handoffTitle').replace('{count}', handoffData.images.length) }}
          </span>
          <span class="handoff-from">
            {{ t('handoffFrom').replace('{tool}', handoffData.source) }}
          </span>
        </div>
      </div>
      <div class="handoff-actions">
        <button class="handoff-btn handoff-btn-dismiss" @click="dismiss">
          {{ t('handoffDismiss') }}
        </button>
        <button class="handoff-btn handoff-btn-accept" @click="accept">
          {{ t('handoffAccept') }}
        </button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.handoff-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 20px;
  background: var(--bg-sidebar, #f8f9fa);
  border-bottom: 2px solid var(--selection-color, #014f99);
  flex-wrap: wrap;
}

.handoff-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.handoff-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: var(--selection-glow, rgba(1, 79, 153, 0.1));
  color: var(--selection-color, #014f99);
  flex-shrink: 0;
}

.handoff-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.handoff-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary, #003971);
}

.handoff-from {
  font-size: 12px;
  color: var(--text-secondary, #6b7280);
}

.handoff-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.handoff-btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.handoff-btn-dismiss {
  background: transparent;
  border-color: var(--border-color, #d1d5db);
  color: var(--text-secondary, #6b7280);
}

.handoff-btn-dismiss:hover {
  background: var(--bg-hover, #f3f4f6);
  border-color: var(--border-hover, #9ca3af);
}

.handoff-btn-accept {
  background: var(--btn-primary-bg, #014f99);
  color: var(--btn-primary-text, #ffffff);
}

.handoff-btn-accept:hover {
  background: var(--btn-primary-hover, #013d77);
}

/* Transition */
.handoff-banner-enter-active {
  transition: all 0.3s ease-out;
}

.handoff-banner-leave-active {
  transition: all 0.2s ease-in;
}

.handoff-banner-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.handoff-banner-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

@media (max-width: 600px) {
  .handoff-banner {
    padding: 10px 12px;
    gap: 10px;
  }

  .handoff-actions {
    width: 100%;
  }

  .handoff-btn {
    flex: 1;
    text-align: center;
  }
}
</style>
