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
  const name = u?.displayName || (u && 'username' in u ? u.username : null) || '?'
  return name
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
})
const gradient = computed(() => {
  if (props.user?.profileGradient) return props.user.profileGradient
  const color = props.user?.accentColor || '#8b5cf6'
  return `linear-gradient(135deg, ${color}, #3b82f6)`
})
const statusClass = computed(() => props.user?.status || 'offline')
const frameClass = computed(() => {
  const f = props.user && 'avatarFrame' in props.user ? props.user.avatarFrame : null
  return f ? `frame-${f}` : ''
})
</script>

<template>
  <div class="avatar-wrap" :style="{ width: sz + 'px', height: sz + 'px' }" :class="frameClass">
    <div
      v-if="user && 'avatarFrame' in user && user.avatarFrame === 'gold-crown'"
      class="crown-icon"
      :style="{ fontSize: sz * 0.45 + 'px', top: -sz * 0.35 + 'px' }"
    >
      👑
    </div>
    <div class="avatar-inner">
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
    </div>
    <span class="status-indicator" :class="statusClass" />
  </div>
</template>

<style scoped>
.avatar-wrap {
  position: relative;
  flex-shrink: 0;
}
.avatar-inner {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  overflow: hidden;
  position: relative;
}
.avatar-img,
.avatar-fallback {
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
  z-index: 5;
}
.status-indicator.online {
  background: #23a55a;
}
.status-indicator.away {
  background: #f0b232;
}
.status-indicator.busy {
  background: #f23f42;
}
.status-indicator.offline {
  background: #80848e;
}

/* Avatar Frames */
.frame-neon-glow .avatar-inner {
  box-shadow:
    0 0 10px #d946ef,
    inset 0 0 6px #00ffff;
  border: 2px solid #d946ef;
}

.frame-rainbow-pulse .avatar-inner {
  padding: 3px;
  background: linear-gradient(45deg, #f87171, #fbbf24, #34d399, #60a5fa, #a78bfa, #f472b6);
  background-size: 300% 300%;
  animation: rainbow-anim 4s linear infinite;
}
.frame-rainbow-pulse .avatar-img,
.frame-rainbow-pulse .avatar-fallback {
  border: 2px solid var(--bg-surface);
}

@keyframes rainbow-anim {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

.frame-pixel-retro .avatar-inner {
  border: 3px double #39ff14;
  border-radius: 0px !important;
}
.frame-pixel-retro .avatar-img,
.frame-pixel-retro .avatar-fallback {
  border-radius: 0px !important;
}
.frame-pixel-retro .status-indicator {
  border-radius: 0px !important;
}

.frame-gold-crown .avatar-inner {
  border: 2px solid #fbbf24;
  box-shadow: 0 0 8px rgba(251, 191, 36, 0.5);
}
.crown-icon {
  position: absolute;
  left: 50%;
  transform: translateX(-50%) rotate(-5deg);
  z-index: 10;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4));
  animation: float-crown 3s ease-in-out infinite;
  pointer-events: none;
}
@keyframes float-crown {
  0%,
  100% {
    transform: translateX(-50%) translateY(0) rotate(-5deg);
  }
  50% {
    transform: translateX(-50%) translateY(-2px) rotate(5deg);
  }
}
</style>
