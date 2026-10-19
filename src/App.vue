<script setup lang="ts">
import { useSeo } from './composables/useSeo'

// Keep <head> SEO tags (title, description, canonical, OG/Twitter, JSON-LD)
// in sync with the active route and UI language.
useSeo()
</script>

<template>
  <router-view />
</template>
