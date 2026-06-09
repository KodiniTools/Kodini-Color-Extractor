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
.pixel-zoom {
  position: absolute;
  width: 120px;
  height: 120px;
  border: 3px solid white;
  border-radius: 50%;
  box-shadow: 0 4px 20px var(--shadow-medium);
  pointer-events: none;
  z-index: 1000;
  overflow: hidden;
  background: var(--bg-secondary);
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
  background: var(--text-primary);
  border: 1px solid white;
  transform: translate(-50%, -50%);
  border-radius: 1px;
}

@media (max-width: 480px) {
  .pixel-zoom {
    width: 80px;
    height: 80px;
  }
}
</style>
