<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { MicOff } from 'lucide-vue-next'
import type { User } from '@/types/user.types'

const props = defineProps<{
  stream: MediaStream | null
  user?: User | null
  label?: string
  isMuted?: boolean
  isLocal?: boolean
}>()

const videoEl = ref<HTMLVideoElement | null>(null)

function attachStream() {
  if (videoEl.value && props.stream) {
    videoEl.value.srcObject = props.stream
  }
}

onMounted(attachStream)
watch(() => props.stream, attachStream)
</script>

<template>
  <div class="video-tile">
    <video
      ref="videoEl"
      class="video-el"
      :muted="isLocal"
      autoplay
      playsinline
    />
    <div class="video-overlay">
      <span class="video-label">{{ label || user?.displayName || 'Unknown' }}</span>
      <MicOff v-if="isMuted" :size="14" class="muted-icon" />
    </div>
    <div v-if="!stream" class="video-placeholder">
      <div
        class="placeholder-avatar"
        :style="{ background: user?.profileGradient || `linear-gradient(135deg, ${user?.accentColor || '#8b5cf6'}, #3b82f6)` }"
      >
        {{ (user?.displayName || label || '?').charAt(0).toUpperCase() }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.video-tile {
  position: relative;
  background: var(--bg-surface);
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--border);
  aspect-ratio: 16/9;
  min-height: 160px;
}
.video-el { width: 100%; height: 100%; object-fit: cover; display: block; }
.video-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 8px 12px;
  background: linear-gradient(transparent, rgba(0,0,0,0.6));
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.video-label { font-size: 13px; font-weight: 600; color: white; }
.muted-icon { color: var(--danger); }
.video-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-surface);
}
.placeholder-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: 700;
  color: white;
}
</style>
