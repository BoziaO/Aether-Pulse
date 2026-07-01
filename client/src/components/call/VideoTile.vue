<script setup lang="ts">
  import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
  import { MicOff, Maximize2, Minimize2, Volume2, VolumeX } from 'lucide-vue-next'

  import AnimatedProfile from '@/components/profile/AnimatedProfile.vue'
  import SpeakingIndicator from './SpeakingIndicator.vue'
  import AudioLevelBar from './AudioLevelBar.vue'
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
    isSpeaking?: boolean
    audioLevel?: number
  }>()

  const emit = defineEmits<{
    (e: 'profile-click', userId: string): void
    (e: 'volume-change', userId: string, volume: number): void
  }>()

  const isFullscreen = ref(false)
  const tileRef = ref<HTMLElement | null>(null)
  const showVolumeSlider = ref(false)
  const localVolume = ref(100)
  const isDeafened = ref(false)

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
        videoEl.value.volume = isDeafened.value ? 0 : localVolume.value / 100
      }
    }
  }

  watch(
    () => settings.outputVolume,
    (v) => {
      if (videoEl.value && !props.isLocal && !isDeafened.value) {
        videoEl.value.volume = v / 100
        localVolume.value = v
      }
    }
  )

  function onVolumeChange(event: Event) {
    const target = event.target as HTMLInputElement
    const vol = parseInt(target.value, 10)
    localVolume.value = vol
    isDeafened.value = vol === 0
    if (videoEl.value && !props.isLocal) {
      videoEl.value.volume = vol / 100
    }
    if (props.userId) {
      emit('volume-change', props.userId, vol)
    }
  }

  function toggleDeafen() {
    isDeafened.value = !isDeafened.value
    if (videoEl.value && !props.isLocal) {
      videoEl.value.volume = isDeafened.value ? 0 : localVolume.value / 100
    }
  }

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

  function showVolume() {
    if (!props.isLocal) {
      showVolumeSlider.value = true
    }
  }

  function hideVolume() {
    showVolumeSlider.value = false
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
    :class="{
      clickable: userId && !isLocal,
      'is-fullscreen': isFullscreen,
      'is-speaking': isSpeaking,
    }"
    @click="handleClick"
    @mouseenter="showVolume"
    @mouseleave="hideVolume"
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
        <!-- Speaking indicator with audio level -->
        <SpeakingIndicator
          v-if="isSpeaking && !isMuted"
          :is-speaking="true"
          :audio-level="audioLevel ?? 0"
          size="sm"
        />
        <MicOff v-else-if="isMuted" :size="14" class="muted-icon" />

        <!-- Volume control for remote users -->
        <div
          v-if="!isLocal && showVolumeSlider && stream"
          class="volume-control"
          @click.stop
        >
          <button class="volume-btn" @click.stop="toggleDeafen">
            <VolumeX v-if="isDeafened" :size="12" />
            <Volume2 v-else :size="12" />
          </button>
          <input
            type="range"
            class="volume-slider"
            min="0"
            max="100"
            :value="isDeafened ? 0 : localVolume"
            @input="onVolumeChange"
          />
          <span class="volume-value">{{ isDeafened ? 0 : localVolume }}</span>
        </div>

        <button class="fullscreen-btn" title="Fullscreen" @click.stop="toggleFullscreen">
          <Maximize2 v-if="!isFullscreen" :size="14" />
          <Minimize2 v-else :size="14" />
        </button>
      </div>
    </div>

    <!-- Audio level bar on the left side -->
    <div v-if="isSpeaking && audioLevel != null && !isMuted" class="audio-level-side">
      <AudioLevelBar :level="audioLevel" :max-bars="8" />
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
.video-tile.is-speaking {
  border-color: var(--accent-violet);
  box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.4), 0 0 16px rgba(139, 92, 246, 0.2);
  animation: speaking-glow 2s ease-in-out infinite alternate;
}

@keyframes speaking-glow {
  from {
    box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.3), 0 0 12px rgba(139, 92, 246, 0.15);
  }
  to {
    box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.5), 0 0 20px rgba(139, 92, 246, 0.3);
  }
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

/* Volume Control */
.volume-control {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 6px;
  padding: 4px 8px;
  animation: fadeIn 0.15s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.volume-btn {
  background: transparent;
  border: none;
  color: white;
  cursor: pointer;
  padding: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.volume-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.volume-slider {
  width: 80px;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  outline: none;
  cursor: pointer;
}

.volume-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: white;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.volume-slider::-moz-range-thumb {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: white;
  cursor: pointer;
  border: none;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.volume-value {
  font-size: 10px;
  color: white;
  min-width: 24px;
  text-align: right;
  font-weight: 500;
}

/* Audio level bar on left side */
.audio-level-side {
  position: absolute;
  left: 8px;
  top: 50%;
  transform: translateY(-50%);
  height: 40px;
  width: 4px;
  border-radius: 2px;
  overflow: hidden;
}
</style>
