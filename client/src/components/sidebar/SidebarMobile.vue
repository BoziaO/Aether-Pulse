<script setup lang="ts">
import { X, Users, Hash, Plus, MessageCircle, Settings, LogOut } from 'lucide-vue-next'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { useRoomStore } from '@/stores/room.store'
import { useRtcStore } from '@/stores/rtc.store'
import { useFriendsStore } from '@/stores/friends.store'
import { useDmStore } from '@/stores/dm.store'
import UserAvatar from '@/components/profile/UserAvatar.vue'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const roomStore = useRoomStore()
const rtcStore = useRtcStore()
const friendsStore = useFriendsStore()
const dmStore = useDmStore()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'create-room'): void
}>()

function goToRoom(roomId: string) {
  router.push(`/room/${roomId}`)
  emit('close')
}

function goToDm(userId: number) {
  router.push({ name: 'dm', params: { userId: String(userId) } })
  emit('close')
}

function isActiveRoom(roomId: string) {
  return route.params.roomId === roomId
}

function isActiveDm(userId: number) {
  return route.name === 'dm' && Number(route.params.userId) === userId
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
  emit('close')
}
</script>

<template>
  <aside class="sidebar-mobile-overlay" @click.self="emit('close')">
    <div class="sidebar-mobile" @click.stop>
      <div class="mobile-header">
        <img src="/icons/logo.png" alt="AetherPulse" class="mobile-logo" />
        <span class="mobile-brand">AetherPulse</span>
        <button class="close-btn" @click="emit('close')" aria-label="Close menu">
          <X :size="20" />
        </button>
      </div>

      <nav class="mobile-nav">
        <div class="nav-section">
          <h3>Direct Messages</h3>
          <button
            class="nav-item"
            :class="{ active: route.path === '/friends' }"
            @click="
              router.push('/friends')
              emit('close')
            "
          >
            <Users :size="18" />
            <span>Friends</span>
            <span v-if="friendsStore.pendingCount" class="pending-badge">{{
              friendsStore.pendingCount
            }}</span>
          </button>
          <button
            v-for="conv in dmStore.conversations.slice(0, 5)"
            :key="conv.id"
            class="nav-item dm-item"
            :class="{ active: conv.otherUser && isActiveDm(conv.otherUser.id) }"
            @click="conv.otherUser && goToDm(conv.otherUser.id)"
          >
            <MessageCircle :size="18" />
            <div class="dm-content">
              <span class="dm-name">{{ conv.otherUser?.displayName || 'Unknown' }}</span>
              <span class="dm-preview">{{ dmPreview(conv) }}</span>
            </div>
          </button>
          <button
            v-if="dmStore.conversations.length > 5"
            class="nav-item see-all"
            @click="
              router.push('/friends')
              emit('close')
            "
          >
            <span>See all conversations...</span>
          </button>
        </div>

        <div class="nav-section">
          <h3>Rooms</h3>
          <button
            v-for="room in roomStore.rooms"
            :key="room.id"
            class="nav-item"
            :class="{ active: isActiveRoom(room.id) }"
            @click="goToRoom(room.id)"
          >
            <Hash :size="18" />
            <span>{{ room.name }}</span>
            <span v-if="room.isActive" class="active-dot" />
          </button>
          <button
            class="nav-item new-room"
            @click="
              emit('create-room')
              emit('close')
            "
          >
            <Plus :size="18" />
            <span>New Room</span>
          </button>
        </div>
      </nav>

      <div class="mobile-footer">
        <div v-if="rtcStore.inCall" class="call-indicator">
          <span class="call-dot pulse" />
          <span>Voice Connected</span>
        </div>
        <div
          class="user-item"
          @click="
            router.push('/profile')
            emit('close')
          "
        >
          <UserAvatar :user="auth.user" :size="32" />
          <div class="user-info">
            <span class="user-name">{{ auth.user?.displayName }}</span>
            <span class="user-status">{{ auth.user?.customStatus || auth.user?.status }}</span>
          </div>
        </div>
        <div class="footer-actions">
          <button
            class="footer-btn"
            @click="
              router.push('/settings')
              emit('close')
            "
            title="Settings"
          >
            <Settings :size="18" />
          </button>
          <button class="footer-btn" @click="handleLogout" title="Log out">
            <LogOut :size="18" />
          </button>
        </div>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.sidebar-mobile-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  z-index: 1000;
  padding: 20px;
}

.sidebar-mobile {
  width: 280px;
  max-width: 100%;
  max-height: 100vh;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  overflow-y: auto;
}

.mobile-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px;
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  background: var(--bg-secondary);
  z-index: 10;
}

.mobile-logo {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.mobile-brand {
  font-size: 16px;
  font-weight: 700;
  background: linear-gradient(135deg, var(--accent-violet), var(--accent-blue));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  flex: 1;
}

.close-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
}

.close-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.mobile-nav {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.nav-section {
  margin-bottom: 16px;
}

.nav-section h3 {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: var(--text-muted);
  padding: 8px 12px;
}

.nav-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s;
  text-align: left;
  border-radius: 8px;
}

.nav-item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.nav-item.active {
  background: rgba(139, 92, 246, 0.15);
  color: var(--text-primary);
}

.nav-item .pending-badge,
.nav-item .active-dot {
  margin-left: auto;
}

.pending-badge {
  font-size: 10px;
  font-weight: 700;
  background: var(--danger);
  color: white;
  padding: 1px 6px;
  border-radius: 999px;
}

.active-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--success);
}

.dm-item {
  flex-wrap: wrap;
}

.dm-content {
  flex: 1;
  min-width: 0;
}

.dm-name {
  display: block;
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

.see-all {
  justify-content: center;
  font-size: 13px;
  color: var(--text-muted);
}

.new-room {
  margin-top: 4px;
  border: 1px dashed var(--border);
}

.mobile-footer {
  border-top: 1px solid var(--border);
  padding: 12px;
}

.call-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(34, 197, 94, 0.1);
  border-radius: 8px;
  margin-bottom: 12px;
  font-size: 13px;
  color: var(--success);
  font-weight: 600;
}

.call-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--success);
}

.user-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
  margin-bottom: 8px;
}

.user-item:hover {
  background: var(--bg-hover);
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  display: block;
  font-size: 14px;
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

.footer-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.footer-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
}

.footer-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}
</style>
