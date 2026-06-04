<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { RouterView } from 'vue-router'
import Sidebar from '@/components/sidebar/Sidebar.vue'
import { useAuthStore } from '@/stores/auth.store'
import { useSettingsStore } from '@/stores/settings.store'
import { useRoomStore } from '@/stores/room.store'
import { useFriendsStore } from '@/stores/friends.store'
import { useDmStore } from '@/stores/dm.store'
import { connectSocket, getSocket } from '@/services/socket/socket'

const auth = useAuthStore()
const settings = useSettingsStore()
const roomStore = useRoomStore()
const friendsStore = useFriendsStore()
const dmStore = useDmStore()

const AUTO_AWAY_MS = 10 * 60 * 1000
const ACTIVITY_PING_MS = 2 * 60 * 1000
let awayTimer: ReturnType<typeof setTimeout> | null = null
let pingTimer: ReturnType<typeof setInterval> | null = null
let wasAutoAway = false

function pingActivity() {
  const user = auth.user
  if (!user) return
  try {
    getSocket().emit('ping-activity', { userId: user.id })
  } catch {}
}

function resetAwayTimer() {
  if (awayTimer) clearTimeout(awayTimer)
  if (wasAutoAway && auth.user?.status === 'away') {
    const socket = getSocket()
    socket.emit('user-status', { userId: auth.user.id, status: 'online' })
    if (auth.user) auth.user.status = 'online'
    wasAutoAway = false
  }
  awayTimer = setTimeout(() => {
    const user = auth.user
    if (!user || user.status !== 'online') return
    const socket = getSocket()
    socket.emit('user-status', { userId: user.id, status: 'away' })
    if (auth.user) auth.user.status = 'away'
    wasAutoAway = true
  }, AUTO_AWAY_MS)
}

const activityEvents = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll']

onMounted(async () => {
  // Always try to fetch current user first if we have tokens
  if (auth.accessToken && !auth.user) {
    await auth.fetchMe()
  }

  // Only proceed if logged in
  if (auth.isLoggedIn) {
    connectSocket()
    await Promise.all([
      roomStore.fetchRooms(),
      friendsStore.fetchFriends(),
      dmStore.fetchConversations(),
    ])
    friendsStore.bindSocketEvents()
    dmStore.bindGlobalDmListener()
  }

  if (auth.user?.preferredTheme) {
    settings.applyUserTheme(auth.user.preferredTheme)
  }

  activityEvents.forEach((evt) => document.addEventListener(evt, resetAwayTimer, { passive: true }))
  resetAwayTimer()
  pingTimer = setInterval(pingActivity, ACTIVITY_PING_MS)
})

onUnmounted(() => {
  activityEvents.forEach((evt) => document.removeEventListener(evt, resetAwayTimer))
  if (awayTimer) clearTimeout(awayTimer)
  if (pingTimer) clearInterval(pingTimer)
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
