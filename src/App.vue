<script setup>
import { useTheme } from './composables/useTheme'

// Initialize theme on app load
useTheme()
</script>

<template>
  <router-view />
</template>

<style>
/* App-level styles are in main.css */
</style>
