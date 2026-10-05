<script setup>
import { ref } from 'vue'

defineProps({
  show: Boolean,
  x: Number,
  y: Number,
})

const canvas = ref(null)

defineExpose({ canvas })
</script>

<template>
  <div v-show="show" class="pixel-zoom" :style="{ left: x + 'px', top: y + 'px' }">
    <canvas ref="canvas" width="24" height="24"></canvas>
  </div>
</template>

<style scoped>
/* The magnifier floats over the photo: white ring, overlay shadow. */
.pixel-zoom {
  position: absolute;
  width: 120px;
  height: 120px;
  border: 3px solid #ffffff;
  border-radius: 50%;
  box-shadow: var(--ds-shadow-overlay);
  pointer-events: none;
  z-index: var(--ds-z-backdrop);
  overflow: hidden;
  background: var(--ds-surface-1);
}

.pixel-zoom canvas {
  width: 100%;
  height: 100%;
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
}

.pixel-zoom::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 4px;
  height: 4px;
  background: var(--ds-text);
  border: 1px solid #ffffff;
  transform: translate(-50%, -50%);
}

@media (max-width: 480px) {
  .pixel-zoom {
    width: 80px;
    height: 80px;
  }
}
</style>
