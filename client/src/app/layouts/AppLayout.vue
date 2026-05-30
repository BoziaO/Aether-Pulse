<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import Sidebar from '@/components/sidebar/Sidebar.vue'
import { useAuthStore } from '@/stores/auth.store'
import { useRoomStore } from '@/stores/room.store'

const auth = useAuthStore()
const roomStore = useRoomStore()

onMounted(async () => {
  await roomStore.fetchRooms()
})
</script>

<template>
  <div class="app-layout">
    <Sidebar />
    <main class="app-main">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  height: 100vh;
  width: 100vw;
  background: var(--bg-primary);
  overflow: hidden;
}
.app-main {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
</style>
