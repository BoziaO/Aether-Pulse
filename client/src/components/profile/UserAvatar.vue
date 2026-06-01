<script setup lang="ts">
import { computed } from 'vue'
import type { User } from '@/types/user.types'
import type { MessageUser } from '@/types/message.types'

const props = defineProps<{
  user: User | MessageUser | null | undefined
  size?: number
}>()

const sz = computed(() => props.size ?? 36)
const initials = computed(() => {
  const u = props.user
  const name =
    u?.displayName ||
    (u && 'username' in u ? u.username : null) ||
    '?'
  return name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
})
const gradient = computed(() => {
  if (props.user?.profileGradient) return props.user.profileGradient
  const color = props.user?.accentColor || '#8b5cf6'
  return `linear-gradient(135deg, ${color}, #3b82f6)`
})
const statusClass = computed(() => props.user?.status || 'offline')
</script>

<template>
  <div class="avatar-wrap" :style="{ width: sz + 'px', height: sz + 'px' }">
    <img
      v-if="user?.avatarUrl"
      :src="user.avatarUrl"
      :alt="user.displayName"
      class="avatar-img"
    />
    <div
      v-else
      class="avatar-fallback"
      :style="{ background: gradient, fontSize: sz * 0.38 + 'px' }"
    >
      {{ initials }}
    </div>
    <span class="status-indicator" :class="statusClass" />
  </div>
</template>

<style scoped>
.avatar-wrap {
  position: relative;
  flex-shrink: 0;
}
.avatar-img, .avatar-fallback {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: white;
  user-select: none;
}
.status-indicator {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 28%;
  height: 28%;
  min-width: 8px;
  min-height: 8px;
  border-radius: 50%;
  border: 2px solid var(--bg-secondary);
}
.status-indicator.online  { background: #23a55a; }
.status-indicator.away    { background: #f0b232; }
.status-indicator.busy    { background: #f23f42; }
.status-indicator.offline { background: #80848e; }
</style>
