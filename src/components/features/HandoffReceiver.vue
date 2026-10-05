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
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.75"
          >
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
/* A banner above the workspace: flat panel surface, one border below. */
.handoff-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ds-space-4);
  padding: var(--ds-space-3) var(--ds-space-5);
  background: var(--ds-surface-1);
  border-bottom: var(--ds-border-width) solid var(--ds-border);
  flex-wrap: wrap;
}

.handoff-content {
  display: flex;
  align-items: center;
  gap: var(--ds-space-3);
}

.handoff-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--ds-control-md);
  height: var(--ds-control-md);
  border-radius: var(--ds-radius-md);
  background: var(--ds-accent-soft);
  color: var(--ds-text);
  flex-shrink: 0;
}

.handoff-icon svg {
  width: var(--ds-icon-md);
  height: var(--ds-icon-md);
}

.handoff-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.handoff-title {
  font-size: var(--ds-text-md);
  font-weight: var(--ds-weight-semibold);
  line-height: var(--ds-leading);
  color: var(--ds-text);
}

.handoff-from {
  font-size: var(--ds-text-xs);
  line-height: var(--ds-leading);
  color: var(--ds-text-2);
}

.handoff-actions {
  display: flex;
  gap: var(--ds-space-2);
  flex-shrink: 0;
}

.handoff-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: var(--ds-control-md);
  padding: 0 var(--ds-space-4);
  border-radius: var(--ds-radius-md);
  font-size: var(--ds-text-md);
  font-weight: var(--ds-weight-medium);
  line-height: 1;
  cursor: pointer;
  transition: var(--app-transition-colors);
  border: var(--ds-border-width) solid transparent;
}

.handoff-btn:focus-visible {
  outline: none;
  box-shadow: var(--ds-focus-ring);
}

.handoff-btn-dismiss {
  background: var(--ds-surface-2);
  border-color: var(--ds-border-strong);
  color: var(--ds-text);
}

.handoff-btn-dismiss:hover {
  background: var(--ds-surface-3);
}

.handoff-btn-accept {
  background: var(--ds-accent);
  color: var(--ds-on-accent);
  font-weight: var(--ds-weight-semibold);
}

.handoff-btn-accept:hover {
  background: var(--ds-accent-hover);
}

/* Transition: fade plus 8 px from above. */
.handoff-banner-enter-active,
.handoff-banner-leave-active {
  transition:
    opacity var(--ds-duration-slow) var(--ds-ease),
    transform var(--ds-duration-slow) var(--ds-ease);
}

.handoff-banner-enter-from,
.handoff-banner-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

@media (max-width: 600px) {
  .handoff-banner {
    padding: var(--ds-space-2) var(--ds-space-3);
    gap: var(--ds-space-2);
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
