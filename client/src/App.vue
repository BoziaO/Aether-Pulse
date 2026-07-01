<script setup lang="ts">
  import { RouterView } from 'vue-router'

  import ToastContainer from '@/components/ui/ToastContainer.vue'
  import CookieConsent from '@/components/ui/CookieConsent.vue'
  import DebugPanel from '@/components/debug/DebugPanel.vue'
</script>

<template>
  <RouterView />
  <ToastContainer />
  <CookieConsent />
  <DebugPanel />
</template>
