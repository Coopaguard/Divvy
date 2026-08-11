<script setup lang="ts">
// Divvy — root component
// All modules: Vue Router, Pinia, Vue I18n registered in main.ts
import AppShell from '@/ui/layouts/AppShell.vue'
</script>

<template>
  <AppShell>
    <RouterView />
  </AppShell>
</template>
