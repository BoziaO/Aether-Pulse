<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { Hash, Plus, Settings, LogOut, Mic, MicOff, Users, MessageCircle } from 'lucide-vue-next'

  import { useAuthStore } from '@/stores/auth.store'
  import { useRoomStore } from '@/stores/room.store'
  import { useRtcStore } from '@/stores/rtc.store'
  import { useFriendsStore } from '@/stores/friends.store'
  import { useDmStore } from '@/stores/dm.store'
  import UserAvatar from '@/components/profile/UserAvatar.vue'
  import CreateRoomModal from '@/components/rooms/CreateRoomModal.vue'

  const router = useRouter()
  const route = useRoute()
  const auth = useAuthStore()
  const roomStore = useRoomStore()
  const rtcStore = useRtcStore()
  const friendsStore = useFriendsStore()
  const dmStore = useDmStore()

  const showCreateModal = ref(false)

  function goToRoom(roomId: string) {
    router.push(`/app/room/${roomId}`)
  }

  function goToDm(userId: string) {
    router.push({ name: 'dm', params: { userId } })
  }

  function isActiveRoom(roomId: string) {
    return route.params.roomId === roomId
  }

  function isActiveDm(userId: string) {
    return route.name === 'dm' && route.params.userId === userId
  }

  function dmPreview(conv: import('@/types/dm.types').DmConversation) {
    const lm = conv.lastMessage
    if (!lm) return 'No messages yet'
    if (lm.type === 'file') return lm.attachmentName || 'Attachment'
    const text = lm.content
    const snippet = text.length > 36 ? `${text.slice(0, 36)}…` : text
    return lm.userId === auth.user?.id ? `You: ${snippet}` : snippet
  }

  async function handleLogout() {
    await auth.logout()
    router.push('/auth')
  }

  onMounted(() => {
    friendsStore.bindSocketEvents()
  })
</script>

<template>
  <aside class="sidebar">
    <div class="sidebar-header">
      <img src="/icons/logo.png" alt="AetherPulse" class="sidebar-logo" />
      <span class="sidebar-brand">AetherPulse</span>
    </div>

    <div class="sidebar-section-label">Direct Messages</div>
    <div class="sidebar-dms">
      <button
        class="room-item friends-link"
        :class="{ active: route.path === '/app/friends' }"
        @click="router.push('/app/friends')"
      >
        <Users :size="16" />
        <span>Friends</span>
        <span v-if="friendsStore.pendingCount" class="pending-badge">{{
          friendsStore.pendingCount
        }}</span>
      </button>
      <button
        v-for="conv in dmStore.conversations"
        :key="conv.id"
        class="room-item"
        :class="{ active: conv.otherUser && isActiveDm(conv.otherUser.id) }"
        @click="conv.otherUser && goToDm(conv.otherUser.id)"
      >
        <MessageCircle :size="16" class="room-icon" />
        <div class="dm-label">
          <span class="room-name">{{ conv.otherUser?.displayName || 'Unknown' }}</span>
          <span class="dm-preview">{{ dmPreview(conv) }}</span>
        </div>
      </button>
    </div>

    <div class="sidebar-section-label">Rooms</div>
    <div class="sidebar-rooms">
      <button
        v-for="room in roomStore.rooms"
        :key="room.id"
        class="room-item"
        :class="{ active: isActiveRoom(room.id) }"
        @click="goToRoom(room.id)"
      >
        <Hash :size="16" class="room-icon" />
        <span class="room-name">{{ room.name }}</span>
        <span v-if="room.isActive" class="room-active-dot" />
      </button>
      <button class="room-item add-room" @click="showCreateModal = true">
        <Plus :size="16" />
        <span>New Room</span>
      </button>
    </div>

    <div class="sidebar-spacer" />

    <div v-if="rtcStore.inCall" class="call-status">
      <div class="call-status-label">
        <span class="call-dot pulse" />
        <span>Voice Connected</span>
      </div>
      <div class="call-controls">
        <button
          class="call-btn"
          :title="rtcStore.isMuted ? 'Unmute' : 'Mute'"
          @click="rtcStore.toggleMute()"
        >
          <MicOff v-if="rtcStore.isMuted" :size="14" />
          <Mic v-else :size="14" />
        </button>
      </div>
    </div>

    <div class="sidebar-user">
      <div class="user-info" style="cursor: pointer" @click="router.push('/app/profile')">
        <UserAvatar :user="auth.user" :size="32" />
        <div class="user-details">
          <div class="user-name">{{ auth.user?.displayName }}</div>
          <div class="user-status">{{ auth.user?.customStatus || auth.user?.status }}</div>
        </div>
      </div>
      <div class="user-actions">
        <button class="icon-btn" title="Settings" @click="router.push('/app/settings')">
          <Settings :size="16" />
        </button>
        <button class="icon-btn danger" title="Log out" @click="handleLogout">
          <LogOut :size="16" />
        </button>
      </div>
    </div>
  </aside>

  <CreateRoomModal v-if="showCreateModal" @close="showCreateModal = false" />
</template>

<style scoped>
.sidebar {
  width: 240px;
  min-width: 240px;
  background: var(--bg-secondary);
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
}
.sidebar-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 16px 12px;
  border-bottom: 1px solid var(--border);
}
.sidebar-logo {
  width: 28px;
  height: 28px;
  object-fit: contain;
}
.sidebar-brand {
  font-size: 15px;
  font-weight: 700;
  background: linear-gradient(135deg, var(--accent-violet), var(--accent-blue));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.sidebar-section-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: var(--text-muted);
  padding: 16px 16px 6px;
}
.sidebar-dms,
.sidebar-rooms {
  overflow-y: auto;
  padding: 0 8px;
  max-height: 180px;
}
.sidebar-rooms {
  flex: 1;
  max-height: none;
}
.room-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s;
  text-align: left;
  position: relative;
}
.room-item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}
.room-item.active {
  background: rgba(139, 92, 246, 0.15);
  color: var(--text-primary);
}
.room-item.active .room-icon {
  color: var(--accent-violet);
}
.dm-label {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.room-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dm-preview {
  font-size: 11px;
  color: var(--text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.room-item .room-name {
  flex: 1;
}
.room-active-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--success);
  flex-shrink: 0;
}
.pending-badge {
  font-size: 11px;
  font-weight: 700;
  background: var(--danger);
  color: white;
  padding: 1px 6px;
  border-radius: 999px;
}
.add-room {
  color: var(--text-muted);
  border: 1px dashed var(--border);
  margin-top: 6px;
}
.add-room:hover {
  border-color: var(--accent-violet);
  color: var(--accent-violet);
  background: rgba(139, 92, 246, 0.08);
}
.sidebar-spacer {
  flex: 1;
  min-height: 8px;
  max-height: 32px;
}
.call-status {
  margin: 0 8px 8px;
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.2);
  border-radius: 8px;
  padding: 8px 10px;
}
.call-status-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--success);
  font-weight: 600;
}
.call-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--success);
}
.call-controls {
  display: flex;
  gap: 4px;
  margin-top: 6px;
}
.call-btn {
  background: rgba(255, 255, 255, 0.08);
  border: none;
  border-radius: 6px;
  padding: 4px 8px;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
}
.call-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  color: var(--text-primary);
}
.sidebar-user {
  border-top: 1px solid var(--border);
  padding: 10px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}
.user-details {
  min-width: 0;
}
.user-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.user-status {
  font-size: 11px;
  color: var(--text-muted);
  text-transform: capitalize;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.user-actions {
  display: flex;
  gap: 2px;
}
.icon-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  display: flex;
}
.icon-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}
.icon-btn.danger:hover {
  background: rgba(239, 68, 68, 0.1);
  color: var(--danger);
}
</style>
