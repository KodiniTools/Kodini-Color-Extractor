<script setup>
import { useToast } from '../composables/useToast'

const { toasts, remove } = useToast()
</script>

<template>
  <Teleport to="body">
    <div class="toast-container">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="toast"
          :class="toast.type"
          @click="remove(toast.id)"
        >
          <svg
            v-if="toast.type === 'success'"
            class="toast-icon"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <svg
            v-else-if="toast.type === 'error'"
            class="toast-icon"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
          <svg
            v-else
            class="toast-icon"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
          <span class="toast-message">{{ toast.message }}</span>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-container {
  position: fixed;
  bottom: var(--ds-space-4);
  right: var(--ds-space-4);
  z-index: var(--ds-z-toast);
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-2);
  pointer-events: none;
}

/* A notification: flat surface, status as a 3 px line and the icon's colour,
   the only shadow outside of modals. */
.toast {
  display: flex;
  align-items: center;
  gap: var(--ds-space-3);
  max-width: 400px;
  padding: var(--ds-space-3) var(--ds-space-4);
  border: var(--ds-border-width) solid var(--ds-border);
  border-left: 3px solid var(--ds-info);
  border-radius: var(--ds-radius-md);
  background: var(--ds-surface-1);
  color: var(--ds-text);
  font-size: var(--ds-text-sm);
  font-weight: var(--ds-weight-medium);
  line-height: var(--ds-leading);
  box-shadow: var(--ds-shadow-overlay);
  pointer-events: auto;
  cursor: pointer;
  transition: var(--app-transition-colors);
}

.toast:hover {
  background: var(--ds-surface-2);
}

.toast-icon {
  flex-shrink: 0;
  width: var(--ds-icon-sm);
  height: var(--ds-icon-sm);
  color: var(--ds-info);
}

.toast.success {
  border-left-color: var(--ds-success);
}

.toast.success .toast-icon {
  color: var(--ds-success);
}

.toast.error {
  border-left-color: var(--ds-danger);
}

.toast.error .toast-icon {
  color: var(--ds-danger);
}

.toast-message {
  flex: 1;
  min-width: 0;
}

/* Transitions: fade plus 16 px from the right. */
.toast-enter-active,
.toast-leave-active {
  transition:
    opacity var(--ds-duration-slow) var(--ds-ease),
    transform var(--ds-duration-slow) var(--ds-ease);
}

.toast-move {
  transition: transform var(--ds-duration-slow) var(--ds-ease);
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(16px);
}

@media (max-width: 480px) {
  .toast-container {
    bottom: var(--ds-space-2);
    right: var(--ds-space-2);
    left: var(--ds-space-2);
  }

  .toast {
    max-width: none;
  }
}
</style>
