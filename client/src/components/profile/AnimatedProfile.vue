<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import type { User } from '@/types/user.types'

const props = withDefaults(
  defineProps<{
    user?: User | null
    avatarUrl?: string | null
    displayName?: string
    status?: 'online' | 'away' | 'busy' | 'offline'
    accentColor?: string | null
    profileTheme?: string | null
    showAnimation?: boolean
    size?: number
  }>(),
  {
    showAnimation: true,
    size: 80,
  }
)

const isHovered = ref(false)
const time = ref(0)
let animFrame: number | null = null

const resolvedAvatarUrl = computed(() => props.user?.avatarUrl ?? props.avatarUrl ?? null)
const resolvedDisplayName = computed(() => props.user?.displayName ?? props.displayName ?? '')
const resolvedStatus = computed(() => props.user?.status ?? props.status ?? 'offline')
const resolvedAccentColor = computed(() => props.user?.accentColor ?? props.accentColor ?? null)
const resolvedProfileTheme = computed(() => props.user?.profileTheme ?? props.profileTheme ?? null)
const avatarSize = computed(() => props.size)

function animate() {
  time.value = Date.now() / 1000
  animFrame = requestAnimationFrame(animate)
}

onMounted(() => {
  if (props.showAnimation) {
    animate()
  }
})

onUnmounted(() => {
  if (animFrame) cancelAnimationFrame(animFrame)
})

const statusColors: Record<string, string> = {
  online: '#22c55e',
  away: '#f59e0b',
  busy: '#ef4444',
  offline: '#6b7280',
}

const glowColor = computed(() => resolvedAccentColor.value || '#B7A7FF')
const statusColor = computed(() => statusColors[resolvedStatus.value] || statusColors.offline)

const floatStyle = computed(() => {
  if (!props.showAnimation) return {}
  const y = Math.sin(time.value * 2) * 3
  const rotate = Math.sin(time.value * 1.5) * 2
  return {
    transform: `translateY(${y}px) rotate(${rotate}deg)`,
  }
})

const shimmerStyle = computed(() => {
  if (!props.showAnimation) return {}
  const x = (time.value * 50) % 300 - 100
  return {
    background: `linear-gradient(105deg, transparent ${x - 50}%, rgba(255,255,255,0.15) ${x}%, transparent ${x + 50}%)`,
  }
})
</script>

<template>
  <div
    class="animated-profile"
    :class="[`theme-${resolvedProfileTheme || 'default'}`]"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <div class="avatar-wrapper" :style="{ ...floatStyle, width: `${avatarSize}px`, height: `${avatarSize}px` }">
      <div class="avatar-ring" :style="{ borderColor: glowColor }" />
      <img
        :src="resolvedAvatarUrl || '/icons/logo.png'"
        :alt="resolvedDisplayName"
        class="avatar-img"
        :style="{ width: `${avatarSize}px`, height: `${avatarSize}px` }"
      />
      <div
        class="status-dot"
        :style="{
          backgroundColor: statusColor,
          boxShadow: `0 0 8px ${statusColor}`,
          width: `${Math.max(10, avatarSize * 0.18)}px`,
          height: `${Math.max(10, avatarSize * 0.18)}px`,
        }"
      />
      <div class="shimmer-overlay" :style="shimmerStyle" />
    </div>

    <div v-if="$slots.default || resolvedDisplayName" class="profile-info">
      <slot>
        <span class="display-name" :style="{ color: glowColor }">{{ resolvedDisplayName }}</span>
      </slot>
    </div>

    <div v-if="isHovered" class="glow-effect" :style="{ background: `radial-gradient(circle, ${glowColor}22 0%, transparent 70%)` }" />
  </div>
</template>

<style scoped>
.animated-profile {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  border-radius: 16px;
  transition: transform 0.3s ease;
}

.animated-profile:hover {
  transform: scale(1.02);
}

.avatar-wrapper {
  position: relative;
  will-change: transform;
}

.avatar-ring {
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  border: 2px solid;
  animation: ring-pulse 3s ease-in-out infinite;
}

@keyframes ring-pulse {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.05); }
}

.avatar-img {
  border-radius: 50%;
  object-fit: cover;
  position: relative;
  z-index: 1;
}

.status-dot {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid var(--bg-primary, #0F1018);
  z-index: 2;
}

.shimmer-overlay {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  z-index: 3;
  pointer-events: none;
}

.profile-info {
  text-align: center;
}

.display-name {
  font-weight: 700;
  font-size: 14px;
}

.glow-effect {
  position: absolute;
  inset: -20px;
  border-radius: 24px;
  pointer-events: none;
  z-index: -1;
  transition: opacity 0.3s ease;
}

.theme-glass .avatar-img {
  border: 2px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(8px);
}

.theme-neon .avatar-ring {
  box-shadow: 0 0 20px var(--glow, #B7A7FF);
}

.theme-pixel .avatar-img {
  border-radius: 4px;
  image-rendering: pixelated;
}

.theme-pixel .avatar-ring {
  border-radius: 6px;
}
</style>
