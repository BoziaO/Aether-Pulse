<script setup lang="ts">
import { ref, defineAsyncComponent } from 'vue'
import { Hash, Plus, UserPlus } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth.store'
import { useRoomStore } from '@/stores/room.store'
import RoomCardSkeleton from '@/components/rooms/RoomCardSkeleton.vue'

// Lazy-loaded components for performance
const RoomCard = defineAsyncComponent(() => import('@/components/rooms/RoomCard.vue'))
const CreateRoomModal = defineAsyncComponent(() => import('@/components/rooms/CreateRoomModal.vue'))

const auth = useAuthStore()
const roomStore = useRoomStore()
const showCreate = ref(false)
</script>

<template>
  <div class="home-view">
    <div class="home-header">
      <div class="greeting">
        <h1>
          Welcome back, <span class="name">{{ auth.user?.displayName }}</span> 👋
        </h1>
        <p>Your private digital space is ready</p>
      </div>
      <div class="header-actions">
        <button class="btn-ghost" @click="$router.push('/join')">
          <UserPlus :size="16" />
          Join Room
        </button>
        <button class="btn-primary" @click="showCreate = true">
          <Plus :size="16" />
          New Room
        </button>
      </div>
    </div>

    <div class="section">
      <div class="section-header">
        <h2>Your Rooms</h2>
        <span class="section-count">{{ roomStore.rooms.length }}</span>
      </div>

      <div v-if="roomStore.loading" class="rooms-grid">
        <RoomCardSkeleton v-for="i in 3" :key="i" />
      </div>

      <div v-else-if="roomStore.rooms.length === 0" class="empty-state">
        <div class="empty-icon"><Hash :size="40" /></div>
        <h3>No rooms yet</h3>
        <p>Create your first room to start chatting and calling</p>
        <button class="btn-primary" style="margin-top: 16px" @click="showCreate = true">
          <Plus :size="16" />
          Create Room
        </button>
      </div>

      <div v-else class="rooms-grid">
        <RoomCard v-for="room in roomStore.rooms" :key="room.id" :room="room" />
      </div>
    </div>

    <div class="features-bar">
      <div class="feature">
        <span class="feature-icon">🎙️</span>
        <span>Voice & Video</span>
      </div>
      <div class="feature">
        <span class="feature-icon">🖥️</span>
        <span>Screen Share</span>
      </div>
      <div class="feature">
        <span class="feature-icon">🔊</span>
        <span>Spatial Audio</span>
      </div>
      <div class="feature">
        <span class="feature-icon">💬</span>
        <span>Real-time Chat</span>
      </div>
    </div>
  </div>

  <CreateRoomModal v-if="showCreate" @close="showCreate = false" />
</template>

<style scoped>
.home-view {
  flex: 1;
  overflow-y: auto;
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 32px;
  background: var(--bg-primary);
}
.home-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 16px;
}
.greeting h1 {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 4px;
}
.greeting p {
  font-size: 14px;
  color: var(--text-muted);
}
.name {
  background: linear-gradient(135deg, var(--accent-violet), var(--accent-blue));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}
.section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
}
.section-header h2 {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
}
.section-count {
  background: rgba(139, 92, 246, 0.15);
  color: var(--accent-violet);
  font-size: 12px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 20px;
}
.rooms-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}
.empty-state {
  text-align: center;
  padding: 48px 24px;
  background: var(--bg-surface);
  border: 1px dashed var(--border);
  border-radius: 16px;
  color: var(--text-muted);
}
.empty-icon {
  color: var(--border-accent);
  margin-bottom: 12px;
  display: flex;
  justify-content: center;
}
.empty-state h3 {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 6px;
}
.empty-state p {
  font-size: 14px;
}
.features-bar {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
  padding: 16px 20px;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 12px;
}
.feature {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-secondary);
}
.feature-icon {
  font-size: 16px;
}
</style>
