<script setup lang="ts">
  import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
  import { MicOff, Maximize2, Minimize2 } from 'lucide-vue-next'

  import AnimatedProfile from '@/components/profile/AnimatedProfile.vue'
  import { userApi } from '@/services/api/user.api'
  import { useSettingsStore } from '@/stores/settings.store'
  import type { User } from '@/types/user.types'

  const settings = useSettingsStore()

  const props = defineProps<{
    stream: MediaStream | null
    user?: User | null
    label?: string
    isMuted?: boolean
    isLocal?: boolean
    userId?: string
  }>()

  const emit = defineEmits<{
    (e: 'profile-click', userId: string): void
  }>()

  const isFullscreen = ref(false)
  const tileRef = ref<HTMLElement | null>(null)

  async function toggleFullscreen() {
    if (!tileRef.value) return
    if (!document.fullscreenElement) {
      try {
        await tileRef.value.requestFullscreen()
        isFullscreen.value = true
      } catch {
        isFullscreen.value = false
      }
    } else {
      await document.exitFullscreen()
      isFullscreen.value = false
    }
  }

  function onFullscreenChange() {
    isFullscreen.value = !!document.fullscreenElement
  }

  onMounted(() => {
    document.addEventListener('fullscreenchange', onFullscreenChange)
  })

  onBeforeUnmount(() => {
    document.removeEventListener('fullscreenchange', onFullscreenChange)
  })

  const videoEl = ref<HTMLVideoElement | null>(null)
  const remoteUser = ref<User | null>(null)

  const displayUser = computed(() => props.user ?? remoteUser.value)

  function attachStream() {
    if (videoEl.value && props.stream) {
      videoEl.value.srcObject = props.stream
      if (!props.isLocal) {
        videoEl.value.volume = settings.outputVolume / 100
      }
    }
  }

  watch(
    () => settings.outputVolume,
    (v) => {
      if (videoEl.value && !props.isLocal) {
        videoEl.value.volume = v / 100
      }
    }
  )

  let boundStream: MediaStream | null = null
  function onTracksChanged() {
    attachStream()
  }

  function bindStreamEvents(stream: MediaStream | null) {
    if (boundStream) {
      boundStream.removeEventListener('addtrack', onTracksChanged)
      boundStream.removeEventListener('removetrack', onTracksChanged)
    }
    boundStream = stream
    if (boundStream) {
      boundStream.addEventListener('addtrack', onTracksChanged)
      boundStream.addEventListener('removetrack', onTracksChanged)
    }
  }

  async function loadRemoteUser() {
    if (props.user || !props.userId || props.isLocal) return
    try {
      remoteUser.value = await userApi.get(props.userId)
    } catch {
      remoteUser.value = null
    }
  }

  function handleClick() {
    if (props.userId && !props.isLocal) {
      emit('profile-click', props.userId)
    }
  }

  watch(() => props.userId, loadRemoteUser, { immediate: true })

  onMounted(() => {
    bindStreamEvents(props.stream ?? null)
    attachStream()
  })

  onBeforeUnmount(() => bindStreamEvents(null))

  watch(
    () => props.stream,
    (next) => {
      bindStreamEvents(next ?? null)
      attachStream()
    }
  )
</script>

<template>
  <div
    ref="tileRef"
    class="video-tile"
    :class="{ clickable: userId && !isLocal, 'is-fullscreen': isFullscreen }"
    @click="handleClick"
  >
    <video
      ref="videoEl"
      class="video-el"
      :class="{ hidden: !stream }"
      :muted="isLocal"
      autoplay
      playsinline
    />
    <div class="video-overlay">
      <span class="video-label">{{ label || displayUser?.displayName || 'Unknown' }}</span>
      <div class="overlay-right">
        <MicOff v-if="isMuted" :size="14" class="muted-icon" />
        <button class="fullscreen-btn" title="Fullscreen" @click.stop="toggleFullscreen">
          <Maximize2 v-if="!isFullscreen" :size="14" />
          <Minimize2 v-else :size="14" />
        </button>
      </div>
    </div>
    <div v-if="!stream" class="video-placeholder">
      <AnimatedProfile v-if="displayUser" :user="displayUser" :size="72" :show-animation="true" />
      <div
        v-else
        class="placeholder-avatar"
        :style="{ background: `linear-gradient(135deg, #8b5cf6, #3b82f6)` }"
      >
        {{ (label || '?').charAt(0).toUpperCase() }}
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
.video-tile.is-fullscreen {
  aspect-ratio: auto;
  border-radius: 0;
  border: none;
  min-height: 100vh;
}
.video-tile.clickable {
  cursor: pointer;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
}
.video-tile.clickable:hover {
  border-color: var(--border-accent);
  box-shadow: 0 0 0 1px rgba(139, 92, 246, 0.25);
}
.video-el {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.video-el.hidden {
  visibility: hidden;
}
.video-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 8px 12px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.6));
  display: flex;
  align-items: center;
  justify-content: space-between;
  pointer-events: auto;
}
.overlay-right {
  display: flex;
  align-items: center;
  gap: 8px;
}
.video-label {
  font-size: 13px;
  font-weight: 600;
  color: white;
}
.muted-icon {
  color: var(--danger);
}
.fullscreen-btn {
  background: rgba(0, 0, 0, 0.4);
  border: none;
  color: white;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.6;
  transition: opacity 0.15s;
}
.fullscreen-btn:hover {
  opacity: 1;
  background: rgba(0, 0, 0, 0.6);
}
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
