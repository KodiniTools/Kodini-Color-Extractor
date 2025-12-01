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
          <svg v-if="toast.type === 'success'" class="toast-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <svg v-else-if="toast.type === 'error'" class="toast-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
          <svg v-else class="toast-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
  bottom: 24px;
  right: 24px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 8px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  box-shadow: 0 4px 20px var(--shadow-medium);
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 500;
  pointer-events: auto;
  cursor: pointer;
  max-width: 320px;
  transition: all 0.2s ease;
}

.toast:hover {
  transform: translateX(-4px);
}

.toast.success {
  background: var(--accent-bg);
  color: var(--accent-text);
  border-color: var(--accent-hover);
}

.toast.error {
  background: #fee2e2;
  color: #991b1b;
  border-color: #fecaca;
}

[data-theme="dark"] .toast.error {
  background: #450a0a;
  color: #fecaca;
  border-color: #7f1d1d;
}

.toast.info {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.toast-icon {
  flex-shrink: 0;
}

.toast-message {
  flex: 1;
}

/* Transitions */
.toast-enter-active {
  animation: toast-in 0.3s ease-out;
}

.toast-leave-active {
  animation: toast-out 0.2s ease-in forwards;
}

.toast-move {
  transition: transform 0.3s ease;
}

@keyframes toast-in {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes toast-out {
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(100%);
  }
}

@media (max-width: 480px) {
  .toast-container {
    bottom: 16px;
    right: 16px;
    left: 16px;
  }

  .toast {
    max-width: none;
  }
}
</style>
