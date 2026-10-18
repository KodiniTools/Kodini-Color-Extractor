<script setup>
import { nextTick, onUnmounted, ref, useId, watch } from 'vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  /** Heading of the dialog; also its accessible name. */
  title: { type: String, required: true },
  /** Label and tooltip of the close button. */
  closeLabel: { type: String, required: true },
})

const emit = defineEmits(['close'])

const titleId = useId()
const closeRef = ref(null)

function onKeydown(e) {
  if (e.key === 'Escape') emit('close')
}

// Listen for Escape only while open, and move focus into the dialog so
// keyboard users land on it.
watch(
  () => props.show,
  async (open) => {
    if (open) {
      document.addEventListener('keydown', onKeydown)
      await nextTick()
      closeRef.value?.focus()
    } else {
      document.removeEventListener('keydown', onKeydown)
    }
  },
  { immediate: true }
)

onUnmounted(() => document.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Teleport to="#app-layer">
    <Transition name="modal">
      <div v-if="show" class="modal-overlay" @click.self="emit('close')">
        <div class="modal-content" role="dialog" aria-modal="true" :aria-labelledby="titleId">
          <div class="modal-header">
            <h2 :id="titleId" class="modal-title">{{ title }}</h2>
            <button
              ref="closeRef"
              class="close-btn"
              :title="closeLabel"
              :aria-label="closeLabel"
              @click="emit('close')"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.75"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <div class="modal-body">
            <slot />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Shared dialog shell: scrim, flat panel, overlay shadow. The body is a
   column with a fixed rhythm; dialogs only bring their own content. */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: var(--app-scrim);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--ds-z-backdrop);
  padding: var(--ds-space-5);
}

.modal-content {
  background: var(--ds-surface-1);
  border: var(--ds-border-width) solid var(--ds-border);
  border-radius: var(--ds-radius-lg);
  width: min(960px, 100%);
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: var(--ds-shadow-overlay);
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ds-space-2);
  padding: var(--ds-space-3) var(--ds-space-5);
  border-bottom: var(--ds-border-width) solid var(--ds-border);
}

.modal-title {
  font-size: var(--ds-text-lg);
  font-weight: var(--ds-weight-semibold);
  line-height: var(--ds-leading);
  color: var(--ds-text);
  margin: 0;
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--ds-control-md);
  height: var(--ds-control-md);
  padding: 0;
  background: transparent;
  border: var(--ds-border-width) solid transparent;
  border-radius: var(--ds-radius-md);
  color: var(--ds-text-2);
  cursor: pointer;
  transition: var(--app-transition-colors);
}

.close-btn svg {
  width: var(--ds-icon-md);
  height: var(--ds-icon-md);
}

.close-btn:hover {
  background: var(--ds-surface-2);
  color: var(--ds-text);
}

.close-btn:focus-visible {
  outline: none;
  box-shadow: var(--ds-focus-ring);
}

.modal-body {
  padding: var(--ds-space-5);
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-5);
  color: var(--ds-text);
  font-size: var(--ds-text-sm);
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity var(--ds-duration-slow) var(--ds-ease);
}

.modal-enter-active .modal-content,
.modal-leave-active .modal-content {
  transition: transform var(--ds-duration-slow) var(--ds-ease);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-content,
.modal-leave-to .modal-content {
  transform: translateY(8px);
}

@media (max-width: 768px) {
  .modal-overlay {
    padding: var(--ds-space-2);
  }

  .modal-header {
    padding: var(--ds-space-3) var(--ds-space-4);
  }

  .modal-body {
    padding: var(--ds-space-3);
  }
}
</style>
