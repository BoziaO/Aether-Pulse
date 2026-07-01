<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { Home, Users, Hash, MessageCircle } from 'lucide-vue-next'
import { useFriendsStore } from '@/stores/friends.store'

const route = useRoute()
const router = useRouter()
const friendsStore = useFriendsStore()

const tabs = [
  { path: '/app', icon: Home, label: 'Home' },
  { path: '/app/friends', icon: Users, label: 'Znajomi' },
  { path: '/app/rooms', icon: Hash, label: 'Pokoje' },
  { path: '/app/dm', icon: MessageCircle, label: 'DM' },
]

function isActive(tab: { path: string }) {
  if (tab.path === '/app') return route.path === '/app'
  if (tab.path === '/app/rooms') return route.path.startsWith('/app/room/')
  return route.path.startsWith(tab.path)
}

function navigate(path: string) {
  router.push(path)
}
</script>

<template>
  <nav class="bottom-nav" role="navigation" aria-label="Nawigacja mobilna">
    <button
      v-for="tab in tabs"
      :key="tab.path"
      class="bottom-nav-item"
      :class="{ active: isActive(tab) }"
      @click="navigate(tab.path)"
    >
      <div class="bottom-nav-icon-wrap">
        <component :is="tab.icon" :size="20" />
        <span
          v-if="tab.path === '/app/friends' && friendsStore.pendingCount"
          class="bottom-nav-badge"
        >
          {{ friendsStore.pendingCount }}
        </span>
      </div>
      <span class="bottom-nav-label">{{ tab.label }}</span>
    </button>
  </nav>
</template>

<style scoped>
.bottom-nav {
  display: none;
}

@media (max-width: 767px) {
  .bottom-nav {
    display: flex;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 56px;
    padding-bottom: env(safe-area-inset-bottom, 0px);
    background: var(--bg-secondary);
    border-top: 1px solid var(--border);
    z-index: 98;
    align-items: center;
    justify-content: space-around;
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
  }

  .bottom-nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    flex: 1;
    height: 100%;
    border: none;
    background: transparent;
    color: var(--text-muted);
    cursor: pointer;
    transition: color 0.15s;
    padding: 4px 0;
    -webkit-tap-highlight-color: transparent;
  }

  .bottom-nav-item:active {
    opacity: 0.7;
  }

  .bottom-nav-item.active {
    color: var(--accent-violet);
  }

  .bottom-nav-icon-wrap {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .bottom-nav-badge {
    position: absolute;
    top: -4px;
    right: -8px;
    min-width: 16px;
    height: 16px;
    padding: 0 4px;
    border-radius: 8px;
    background: var(--danger);
    color: #fff;
    font-size: 10px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
  }

  .bottom-nav-label {
    font-size: 10px;
    font-weight: 500;
    line-height: 1;
  }
}
</style>
