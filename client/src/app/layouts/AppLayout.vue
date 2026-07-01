<script setup lang="ts">
  import { onMounted, onUnmounted, ref } from 'vue'
  import { RouterView } from 'vue-router'
  import { Menu } from 'lucide-vue-next'

  import Sidebar from '@/components/sidebar/Sidebar.vue'
  import SidebarMobile from '@/components/sidebar/SidebarMobile.vue'
  import BottomNav from '@/components/navigation/BottomNav.vue'
  import CreateRoomModal from '@/components/rooms/CreateRoomModal.vue'
  import UserAvatar from '@/components/profile/UserAvatar.vue'
  import { useAuthStore } from '@/stores/auth.store'
  import { TokenManager } from '@/services/auth.token-manager'
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

  const showCreateRoomModal = ref(false)

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
    } catch {
    /* empty */
    }
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
    document.body.classList.add('app-layout-active')
    // Always try to fetch current user first if we have tokens
    if (TokenManager.getAccessToken() && !auth.user) {
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

      // Bind real-time profile propagation updates cascade
      getSocket().on('user-profile-updated', (updatedUser: any) => {
        // 1. If it is the current user, update auth.user and apply preferred theme if changed
        if (auth.user && auth.user.id === updatedUser.id) {
          const oldTheme = auth.user.preferredTheme
          auth.user = { ...auth.user, ...updatedUser }
          if (updatedUser.preferredTheme && updatedUser.preferredTheme !== oldTheme) {
            settings.applyUserTheme(updatedUser.preferredTheme)
          }
        }

        // 2. Cascade down to room members lists
        if (roomStore.currentRoom?.members) {
          const idx = roomStore.currentRoom.members.findIndex((m) => m.id === updatedUser.id)
          if (idx >= 0) {
            roomStore.currentRoom.members[idx] = {
              ...roomStore.currentRoom.members[idx],
              ...updatedUser,
            }
          }
        }

        // 3. Update friends list user references
        friendsStore.friends.forEach((f) => {
          if (f.user.id === updatedUser.id) {
            f.user = { ...f.user, ...updatedUser }
          }
        })
        friendsStore.incoming.forEach((f) => {
          if (f.user.id === updatedUser.id) {
            f.user = { ...f.user, ...updatedUser }
          }
        })
        friendsStore.outgoing.forEach((f) => {
          if (f.user.id === updatedUser.id) {
            f.user = { ...f.user, ...updatedUser }
          }
        })

        // 4. Update DM conversations otherUser records
        dmStore.conversations.forEach((c) => {
          if (c.otherUser?.id === updatedUser.id) {
            c.otherUser = { ...c.otherUser, ...updatedUser }
          }
        })

        // 5. Update active DM messages lists (sender user details)
        dmStore.messages.forEach((m) => {
          if (m.userId === updatedUser.id && m.user) {
            m.user = { ...m.user, ...updatedUser }
          }
        })
      })
    }

    if (auth.user?.preferredTheme) {
      settings.applyUserTheme(auth.user.preferredTheme)
    }

    activityEvents.forEach((evt) => document.addEventListener(evt, resetAwayTimer, { passive: true }))
    resetAwayTimer()
    pingTimer = setInterval(pingActivity, ACTIVITY_PING_MS)
  })

  onUnmounted(() => {
    document.body.classList.remove('app-layout-active')
    activityEvents.forEach((evt) => document.removeEventListener(evt, resetAwayTimer))
    if (awayTimer) clearTimeout(awayTimer)
    if (pingTimer) clearInterval(pingTimer)
    try {
      getSocket().off('user-profile-updated')
    } catch {
    /* empty */
    }
  })
</script>

<template>
  <div class="app-layout">
    <!-- Ambient glowing orbs backdrop -->
    <div class="ambient-orbs">
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
      <div class="orb orb-3"></div>
    </div>

    <!-- Mobile Top Header Bar -->
    <header class="mobile-top-bar glass">
      <button
        class="hamburger-btn"
        aria-label="Open menu"
        @click="settings.mobileSidebarOpen = true"
      >
        <Menu :size="22" />
      </button>
      <div class="mobile-brand-container">
        <img src="/icons/logo.png" alt="Nicori" class="mobile-logo" />
        <span class="mobile-title">Nicori</span>
      </div>
      <button class="mobile-user-avatar" style="cursor: pointer; background: none; border: none; padding: 8px; border-radius: 8px; display: flex; align-items: center;" @click="$router.push('/app/profile')">
        <UserAvatar :user="auth.user" :size="28" />
      </button>
    </header>

    <!-- Mobile Sidebar Drawer Overlay -->
    <div
      v-if="settings.mobileSidebarOpen"
      class="mobile-backdrop"
      @click="settings.mobileSidebarOpen = false"
    />

    <SidebarMobile
      v-if="settings.mobileSidebarOpen"
      @close="settings.mobileSidebarOpen = false"
      @create-room="showCreateRoomModal = true"
    />

    <CreateRoomModal v-if="showCreateRoomModal" @close="showCreateRoomModal = false" />

    <Sidebar class="desktop-sidebar" />
    <main class="app-main">
      <RouterView v-slot="{ Component }">
        <Transition name="page" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>
    <BottomNav />
  </div>
</template>

<style scoped>
/* Ambient glowing orbs background wrapper */
.ambient-orbs {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
}

.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(140px);
  opacity: 0.15;
  mix-blend-mode: screen;
  animation: floatOrb 25s infinite alternate ease-in-out;
  transition: opacity 0.5s ease;
}

.orb-1 {
  width: 450px;
  height: 450px;
  background: var(--accent-violet);
  top: -10%;
  left: -10%;
  animation-duration: 20s;
}

.orb-2 {
  width: 500px;
  height: 500px;
  background: var(--accent-blue);
  bottom: -15%;
  right: -10%;
  animation-duration: 28s;
  animation-delay: -5s;
}

.orb-3 {
  width: 350px;
  height: 350px;
  background: var(--accent-teal);
  top: 40%;
  left: 45%;
  animation-duration: 24s;
  animation-delay: -10s;
}

:root[data-theme='light'] .orb {
  opacity: 0.08;
}

@keyframes floatOrb {
  0% {
    transform: translate(0, 0) scale(1) rotate(0deg);
  }
  50% {
    transform: translate(60px, 90px) scale(1.15) rotate(180deg);
  }
  100% {
    transform: translate(-40px, -50px) scale(0.85) rotate(360deg);
  }
}

/* Mobile styling */
.mobile-top-bar {
  display: none;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  padding-top: calc(10px + env(safe-area-inset-top, 0px));
  height: 56px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 99;
  box-sizing: border-box;
}

.hamburger-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 12px;
  min-width: 48px;
  min-height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hamburger-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.mobile-brand-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mobile-logo {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.mobile-title {
  font-size: 15px;
  font-weight: 700;
  background: linear-gradient(135deg, var(--accent-violet), var(--accent-blue));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.mobile-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 999;
}

@media (max-width: 767px) {
  .mobile-top-bar {
    display: flex;
  }
}

/* ===== Page transitions ===== */
.page-enter-active,
.page-leave-active {
  transition: opacity 0.12s ease;
}
.page-enter-from,
.page-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .page-enter-active,
  .page-leave-active {
    transition: none;
  }
}
</style>
