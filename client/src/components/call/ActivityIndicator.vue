<script setup lang="ts">
  import { computed } from 'vue'
  import { Mic } from 'lucide-vue-next'

  interface ActiveUser {
    userId: string
    displayName: string
    isSpeaking: boolean
    audioLevel: number
    avatarUrl?: string
  }

  const props = defineProps<{
    users: ActiveUser[]
    maxVisible?: number
  }>()

  const visibleUsers = computed(() => {
    const max = props.maxVisible ?? 5
    // Sort: speaking first, then by audioLevel descending
    const sorted = [...props.users].sort((a, b) => {
      if (a.isSpeaking !== b.isSpeaking) return a.isSpeaking ? -1 : 1
      return b.audioLevel - a.audioLevel
    })
    return sorted.slice(0, max)
  })

  const hiddenCount = computed(() => {
    return Math.max(0, props.users.length - (props.maxVisible ?? 5))
  })
</script>

<template>
  <div v-if="users.length > 0" class="activity-indicator">
    <div class="active-users">
      <div
        v-for="user in visibleUsers"
        :key="user.userId"
        class="active-user"
        :class="{ speaking: user.isSpeaking }"
        :title="user.displayName"
      >
        <div class="user-avatar-wrap">
          <img
            v-if="user.avatarUrl"
            :src="user.avatarUrl"
            :alt="user.displayName"
            class="user-avatar"
          />
          <div v-else class="user-avatar placeholder">
            {{ user.displayName.charAt(0).toUpperCase() }}
          </div>
          <div v-if="user.isSpeaking" class="speaking-ring" />
        </div>
        <div class="user-info">
          <span class="user-name">{{ user.displayName }}</span>
          <div v-if="user.isSpeaking" class="level-indicator">
            <Mic :size="10" />
            <div class="mini-bars">
              <div
                v-for="i in 4"
                :key="i"
                class="mini-bar"
                :class="{ active: user.audioLevel >= (i / 4) * 100 }"
                :style="{ '--delay': `${i * 30}ms` }"
              />
            </div>
          </div>
        </div>
      </div>
      <div v-if="hiddenCount > 0" class="hidden-badge">
        +{{ hiddenCount }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.activity-indicator {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
  border-radius: 10px;
  padding: 8px 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.active-users {
  display: flex;
  align-items: center;
  gap: 12px;
}

.active-user {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  border-radius: 8px;
  transition: background 0.2s;
}

.active-user.speaking {
  background: rgba(139, 92, 246, 0.15);
}

.user-avatar-wrap {
  position: relative;
  flex-shrink: 0;
}

.user-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
}

.user-avatar.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #8b5cf6, #3b82f6);
  color: white;
  font-size: 12px;
  font-weight: 700;
}

.speaking-ring {
  position: absolute;
  inset: -2px;
  border-radius: 50%;
  border: 2px solid var(--accent-violet);
  animation: pulse-ring 1.5s ease-in-out infinite;
  pointer-events: none;
}

@keyframes pulse-ring {
  0% { opacity: 0.7; transform: scale(1); }
  50% { opacity: 0; transform: scale(1.3); }
  100% { opacity: 0; transform: scale(1.3); }
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.user-name {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 80px;
}

.level-indicator {
  display: flex;
  align-items: center;
  gap: 3px;
  color: var(--accent-violet);
}

.mini-bars {
  display: flex;
  align-items: flex-end;
  gap: 1.5px;
  height: 8px;
}

.mini-bar {
  width: 2px;
  border-radius: 1px;
  background: rgba(255, 255, 255, 0.2);
  height: 3px;
  transition: background 0.1s, height 0.15s;
}

.mini-bar.active {
  background: var(--accent-violet);
  animation: mini-bounce 0.5s ease-in-out infinite alternate;
  animation-delay: var(--delay);
}

.mini-bar:nth-child(1) { height: 4px; }
.mini-bar:nth-child(2) { height: 6px; }
.mini-bar:nth-child(3) { height: 8px; }
.mini-bar:nth-child(4) { height: 5px; }

@keyframes mini-bounce {
  from { transform: scaleY(1); }
  to { transform: scaleY(0.5); }
}

.hidden-badge {
  font-size: 11px;
  color: var(--text-muted);
  background: rgba(255, 255, 255, 0.06);
  padding: 4px 8px;
  border-radius: 6px;
  font-weight: 600;
  white-space: nowrap;
}
</style>
