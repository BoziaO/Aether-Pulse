<script setup lang="ts">
  import { ref, onMounted, onUnmounted } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { Hash, Plus, Settings, LogOut, Mic, MicOff, Users, MessageCircle, Sparkles } from 'lucide-vue-next'

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
  const mouse = ref({ x: 0, y: 0 })

  let mouseFn: ((e: MouseEvent) => void) | null = null

  onMounted(() => {
    mouseFn = (e: MouseEvent) => {
      mouse.value = {
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      }
    }
    window.addEventListener('mousemove', mouseFn, { passive: true })
    friendsStore.bindSocketEvents()
  })

  onUnmounted(() => {
    if (mouseFn) window.removeEventListener('mousemove', mouseFn)
  })

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
    if (!lm) return 'Brak wiadomości'
    if (lm.type === 'file') return lm.attachmentName || 'Załącznik'
    const text = lm.content
    const snippet = text.length > 36 ? `${text.slice(0, 36)}…` : text
    return lm.userId === auth.user?.id ? `Ty: ${snippet}` : snippet
  }

  async function handleLogout() {
    await auth.logout()
    router.push('/auth')
  }
</script>

<template>
  <div class="sidebar-wrapper">
    <div class="sidebar-bg-orbs" aria-hidden="true">
      <div class="sidebar-orb sidebar-orb--violet" :style="{ transform: `translate(${mouse.x * 8}px, ${mouse.y * 8}px)` }"></div>
      <div class="sidebar-orb sidebar-orb--pink" :style="{ transform: `translate(${mouse.x * -6}px, ${mouse.y * -6}px)` }"></div>
      <div class="sidebar-orb sidebar-orb--teal"></div>
    </div>

    <aside class="sidebar" role="navigation" aria-label="Nawigacja główna">
      <div class="sidebar-header">
        <div class="sidebar-brand">
          <img src="/icons/logo-simp.png" alt="" class="sidebar-logo" />
          <span class="sidebar-name">Nicori</span>
        </div>
        <div class="badge badge-violet sidebar-badge">
          <Sparkles :size="10" />
          APP
        </div>
      </div>

      <div class="sidebar-section">
        <div class="sidebar-section-label">Wiadomości</div>
        <div class="sidebar-dms">
          <button
            class="sidebar-item"
            :class="{ active: route.path === '/app/friends' }"
            :aria-selected="route.path === '/app/friends'"
            @click="router.push('/app/friends')"
          >
            <div class="sidebar-item-icon">
              <Users :size="16" />
            </div>
            <span class="sidebar-item-label">Znajomi</span>
            <span v-if="friendsStore.pendingCount" class="sidebar-pending-badge">{{
              friendsStore.pendingCount
            }}</span>
          </button>
          <button
            v-for="conv in dmStore.conversations"
            :key="conv.id"
            class="sidebar-item"
            :class="{ active: conv.otherUser && isActiveDm(conv.otherUser.id) }"
            :aria-selected="conv.otherUser ? isActiveDm(conv.otherUser.id) : false"
            @click="conv.otherUser && goToDm(conv.otherUser.id)"
          >
            <div class="sidebar-item-icon">
              <MessageCircle :size="16" />
            </div>
            <div class="sidebar-dm-label">
              <span class="sidebar-item-label">{{ conv.otherUser?.displayName || 'Nieznany' }}</span>
              <span class="sidebar-dm-preview">{{ dmPreview(conv) }}</span>
            </div>
          </button>
        </div>
      </div>

      <div class="sidebar-section sidebar-rooms-section">
        <div class="sidebar-section-label">Pokoje</div>
        <div class="sidebar-rooms">
          <button
            v-for="room in roomStore.rooms"
            :key="room.id"
            class="sidebar-item"
            :class="{ active: isActiveRoom(room.id) }"
            :aria-selected="isActiveRoom(room.id)"
            @click="goToRoom(room.id)"
          >
            <div class="sidebar-item-icon">
              <Hash :size="16" />
            </div>
            <span class="sidebar-item-label">{{ room.name }}</span>
            <span v-if="room.isActive" class="sidebar-active-dot" />
          </button>
          <button class="sidebar-item sidebar-add-room" @click="showCreateModal = true">
            <div class="sidebar-item-icon sidebar-item-icon--add">
              <Plus :size="16" />
            </div>
            <span class="sidebar-item-label">Nowy pokój</span>
          </button>
        </div>
      </div>

      <div class="sidebar-spacer" />

      <div v-if="rtcStore.inCall" class="sidebar-call-status">
        <div class="call-status-header">
          <span class="call-dot pulse" />
          <span>Połączono</span>
        </div>
        <button
          class="call-btn"
          :title="rtcStore.isMuted ? 'Włącz mikrofon' : 'Wyłącz mikrofon'"
          @click="rtcStore.toggleMute()"
        >
          <MicOff v-if="rtcStore.isMuted" :size="14" />
          <Mic v-else :size="14" />
        </button>
      </div>

      <div class="sidebar-user">
        <div class="sidebar-user-info" @click="router.push('/app/profile')">
          <UserAvatar :user="auth.user" :size="36" />
          <div class="sidebar-user-details">
            <div class="sidebar-user-name">{{ auth.user?.displayName }}</div>
            <div v-if="auth.user?.richPresence" class="sidebar-user-status sidebar-rp">
              <span class="sidebar-rp-icon">{{ auth.user.richPresence.icon || '🎮' }}</span>
              {{ auth.user.richPresence.label }}
            </div>
            <div v-else class="sidebar-user-status">{{ auth.user?.customStatus || auth.user?.status }}</div>
          </div>
        </div>
        <div class="sidebar-user-actions">
          <button class="sidebar-icon-btn" title="Ustawienia" @click="router.push('/app/settings')">
            <Settings :size="16" />
          </button>
          <button class="sidebar-icon-btn sidebar-icon-btn--danger" title="Wyloguj się" @click="handleLogout">
            <LogOut :size="16" />
          </button>
        </div>
      </div>
    </aside>

    <CreateRoomModal v-if="showCreateModal" @close="showCreateModal = false" />
  </div>
</template>

<style scoped>
.sidebar-wrapper {
  position: relative;
  width: 260px;
  min-width: 260px;
  height: 100vh;
  overflow: hidden;
}

/* BG ORBS (same as landing/login) */
.sidebar-bg-orbs {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}

.sidebar-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  will-change: transform;
  transition: transform 0.5s ease-out;
}

.sidebar-orb--violet {
  width: 300px;
  height: 300px;
  top: -20%;
  right: -30%;
  background: rgba(139, 92, 246, 0.06);
}

.sidebar-orb--pink {
  width: 250px;
  height: 250px;
  bottom: 10%;
  left: -40%;
  background: rgba(217, 70, 239, 0.04);
}

.sidebar-orb--teal {
  width: 200px;
  height: 200px;
  top: 50%;
  right: -20%;
  background: rgba(6, 182, 212, 0.03);
  animation: sidebarOrbDrift 20s ease-in-out infinite;
}

@keyframes sidebarOrbDrift {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(20px, -15px); }
}

/* SIDEBAR */
.sidebar {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  background: rgba(13, 16, 23, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* HEADER */
.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 16px 14px;
  border-bottom: 1px solid var(--border);
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.sidebar-logo {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  object-fit: contain;
}

.sidebar-name {
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.02em;
  background: linear-gradient(135deg, var(--accent-violet), var(--accent-blue));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.sidebar-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  font-size: 10px;
}

/* SECTIONS */
.sidebar-section {
  padding: 0 8px;
}

.sidebar-rooms-section {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.sidebar-section-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: var(--text-muted);
  padding: 14px 8px 6px;
}

.sidebar-dms {
  overflow-y: auto;
  max-height: 160px;
}

.sidebar-rooms {
  overflow-y: auto;
  flex: 1;
}

/* ITEMS */
.sidebar-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
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

.sidebar-item:hover {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-primary);
}

.sidebar-item.active {
  background: rgba(139, 92, 246, 0.12);
  color: var(--text-primary);
}

.sidebar-item.active .sidebar-item-icon {
  background: rgba(139, 92, 246, 0.2);
  color: var(--accent-violet);
}

.sidebar-item-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  flex-shrink: 0;
  transition: all 0.15s;
}

.sidebar-item:hover .sidebar-item-icon {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-primary);
}

.sidebar-item-icon--add {
  border: 1px dashed var(--border);
  background: transparent;
}

.sidebar-item:hover .sidebar-item-icon--add {
  border-color: var(--accent-violet);
  color: var(--accent-violet);
  background: rgba(139, 92, 246, 0.08);
}

.sidebar-item-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sidebar-dm-label {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sidebar-dm-preview {
  font-size: 11px;
  color: var(--text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sidebar-active-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--success);
  flex-shrink: 0;
  box-shadow: 0 0 8px rgba(34, 197, 94, 0.4);
}

.sidebar-pending-badge {
  font-size: 11px;
  font-weight: 700;
  background: linear-gradient(135deg, var(--danger), #f97316);
  color: white;
  padding: 2px 7px;
  border-radius: 999px;
  line-height: 1;
}

.sidebar-add-room {
  margin-top: 4px;
}

.sidebar-spacer {
  flex: 1;
  min-height: 8px;
}

/* CALL STATUS */
.sidebar-call-status {
  margin: 0 8px 8px;
  padding: 10px 12px;
  background: rgba(34, 197, 94, 0.08);
  border: 1px solid rgba(34, 197, 94, 0.15);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.call-status-header {
  display: flex;
  align-items: center;
  gap: 8px;
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

.call-dot.pulse {
  animation: callPulse 2s ease-in-out infinite;
}

@keyframes callPulse {
  0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
  50% { opacity: 0.8; box-shadow: 0 0 0 6px rgba(34, 197, 94, 0); }
}

.call-btn {
  background: rgba(255, 255, 255, 0.08);
  border: none;
  border-radius: 6px;
  padding: 6px 10px;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: all 0.15s;
}

.call-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  color: var(--text-primary);
}

/* USER */
.sidebar-user {
  border-top: 1px solid var(--border);
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.sidebar-user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
  cursor: pointer;
  padding: 6px 8px;
  border-radius: 8px;
  transition: background 0.15s;
}

.sidebar-user-info:hover {
  background: rgba(255, 255, 255, 0.05);
}

.sidebar-user-details {
  min-width: 0;
}

.sidebar-user-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sidebar-user-status {
  font-size: 12px;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar-rp {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--accent-violet);
}

.sidebar-rp-icon {
  font-size: 12px;
}

.sidebar-user-actions {
  display: flex;
  gap: 2px;
}

.sidebar-icon-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  transition: all 0.15s;
}

.sidebar-icon-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-primary);
}

.sidebar-icon-btn--danger:hover {
  background: rgba(239, 68, 68, 0.1);
  color: var(--danger);
}

/* SCROLLBAR */
.sidebar-dms::-webkit-scrollbar,
.sidebar-rooms::-webkit-scrollbar {
  width: 4px;
}

.sidebar-dms::-webkit-scrollbar-track,
.sidebar-rooms::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar-dms::-webkit-scrollbar-thumb,
.sidebar-rooms::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 4px;
}

.sidebar-dms::-webkit-scrollbar-thumb:hover,
.sidebar-rooms::-webkit-scrollbar-thumb:hover {
  background: var(--text-muted);
}
</style>
