<script setup lang="ts">
  import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
  import {
    Mic,
    MicOff,
    Video,
    VideoOff,
    Monitor,
    MonitorOff,
    PhoneOff,
    Headphones,
    PictureInPicture2,
    Camera,
    Volume2,
    VolumeX,
  } from 'lucide-vue-next'

  import { useRtcStore } from '@/stores/rtc.store'
  import { useSettingsStore } from '@/stores/settings.store'
  import SpeakingIndicator from './SpeakingIndicator.vue'
  import type { ScreenShareQuality } from '@/services/rtc/screen-share'
  import ScreenPicker from './picker/ScreenPicker.vue'
  import type { DesktopSource } from './picker/ScreenPicker.vue'

  const rtc = useRtcStore()
  const settings = useSettingsStore()
  const showShareMenu = ref(false)
  const showPicker = ref(false)
  const pickerQuality = ref<ScreenShareQuality | null>(null)
  const pickerSources = ref<DesktopSource[]>([])

  const showCameraMenu = ref(false)
  const availableCameras = ref<MediaDeviceInfo[]>([])
  const selectedCameraId = ref<string | null>(null)

  const showAudioMenu = ref(false)
  const pipAudioEnabled = ref(false)

  const isElectron = !!(window as any).electronAPI?.getDesktopSources

  const isAndroid =
    typeof (window as any).Capacitor !== 'undefined' && (window as any).Capacitor.isNativePlatform()

  const pipSupported = computed(() => !isAndroid && !!(document as any).pictureInPictureEnabled)

  const shareOptions: { quality: ScreenShareQuality; label: string; icon: string }[] = [
    { quality: 'gaming', label: 'Gaming', icon: '🎮' },
    { quality: 'movie', label: 'Movie', icon: '🎬' },
    { quality: 'standard', label: 'Standard', icon: '🖥️' },
  ]

  async function loadCameras() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      availableCameras.value = devices.filter((d) => d.kind === 'videoinput')
      if (availableCameras.value.length > 0 && !selectedCameraId.value) {
        selectedCameraId.value = availableCameras.value[0].deviceId
      }
    } catch (e) {
      console.warn('Failed to enumerate cameras:', e)
    }
  }

  onMounted(() => {
    loadCameras()
  })

  async function handleShare(quality: ScreenShareQuality) {
    showShareMenu.value = false
    if (isElectron) {
      try {
        const sources: DesktopSource[] = await (window as any).electronAPI!.getDesktopSources()
        pickerSources.value = sources
        pickerQuality.value = quality
        showPicker.value = true
      } catch (e) {
        console.error('Failed to get desktop sources:', e)
      }
    } else {
      try {
        await rtc.shareScreen(quality)
      } catch {
      /* empty */
      }
    }
  }

  function onPickerSelect(source: DesktopSource) {
    showPicker.value = false
    const q = pickerQuality.value!
    pickerQuality.value = null
    rtc.shareScreen(q, source.id)
  }

  function onPickerCancel() {
    showPicker.value = false
    pickerQuality.value = null
  }

  async function togglePiP() {
    if (rtc.isPiP) rtc.exitPiP()
    else await rtc.enterPiP()
  }

  function toggleCameraMenu() {
    showCameraMenu.value = !showCameraMenu.value
    if (showCameraMenu.value) {
      loadCameras()
    }
  }

  async function selectCamera(deviceId: string) {
    selectedCameraId.value = deviceId
    showCameraMenu.value = false
    await rtc.switchCamera(deviceId)
  }

  function togglePipAudio() {
    pipAudioEnabled.value = !pipAudioEnabled.value
    rtc.setPipAudio(pipAudioEnabled.value)
  }

  function handleClickOutside(e: MouseEvent) {
    const target = e.target as HTMLElement
    if (!target.closest('.camera-wrap') && !target.closest('.audio-wrap')) {
      showCameraMenu.value = false
      showAudioMenu.value = false
    }
  }

  onMounted(() => {
    document.addEventListener('click', handleClickOutside)
  })

  onBeforeUnmount(() => {
    document.removeEventListener('click', handleClickOutside)
  })
</script>

<template>
  <div class="call-controls">
    <div class="controls-left">
      <span class="call-label">🔴 Live</span>
    </div>

    <div class="controls-center">
      <!-- Mute -->
      <button
        class="ctrl-btn"
        :class="{
          active: !rtc.isMuted && !rtc.isSpeaking,
          danger: rtc.isMuted,
          speaking: rtc.isSpeaking && !rtc.isMuted,
        }"
        :title="rtc.isMuted ? 'Unmute' : 'Mute'"
        @click="rtc.toggleMute()"
      >
        <SpeakingIndicator
          v-if="rtc.isSpeaking && !rtc.isMuted"
          :is-speaking="true"
          :audio-level="rtc.currentAudioLevel"
          size="md"
        />
        <template v-else>
          <MicOff v-if="rtc.isMuted" :size="20" />
          <Mic v-else :size="20" />
        </template>
      </button>

      <!-- Camera with selection -->
      <div class="camera-wrap">
        <button
          class="ctrl-btn"
          :class="{ active: rtc.isVideoOn }"
          title="Toggle camera"
          @click="rtc.toggleVideo()"
        >
          <VideoOff v-if="!rtc.isVideoOn" :size="20" />
          <Video v-else :size="20" />
        </button>
        <button
          v-if="availableCameras.length > 1 && rtc.isVideoOn"
          class="ctrl-btn-small"
          title="Select camera"
          @click.stop="toggleCameraMenu"
        >
          <Camera :size="14" />
        </button>
        <div v-if="showCameraMenu && availableCameras.length > 0" class="dropdown-menu camera-menu">
          <button
            v-for="camera in availableCameras"
            :key="camera.deviceId"
            class="dropdown-item"
            :class="{ selected: camera.deviceId === selectedCameraId }"
            @click.stop="selectCamera(camera.deviceId)"
          >
            {{ camera.label || `Camera ${availableCameras.indexOf(camera) + 1}` }}
          </button>
        </div>
      </div>

      <ScreenPicker
        v-if="showPicker && pickerSources.length"
        :sources="pickerSources"
        @select="onPickerSelect"
        @cancel="onPickerCancel"
      />

      <!-- Screen share — hidden on Android (no getDisplayMedia support) -->
      <div v-if="!isAndroid" class="share-wrap">
        <button
          v-if="!rtc.isScreenSharing"
          class="ctrl-btn"
          title="Share screen"
          @click="showShareMenu = !showShareMenu"
        >
          <Monitor :size="20" />
        </button>
        <button v-else class="ctrl-btn danger" title="Stop sharing" @click="rtc.stopScreenShare()">
          <MonitorOff :size="20" />
        </button>
        <div v-if="showShareMenu" class="dropdown-menu share-menu">
          <div class="menu-header">Screen Share Quality</div>
          <button
            v-for="opt in shareOptions"
            :key="opt.quality"
            class="dropdown-item"
            @click="handleShare(opt.quality)"
          >
            <span class="item-icon">{{ opt.icon }}</span>
            <span class="item-label">{{ opt.label }}</span>
          </button>
        </div>
      </div>

      <!-- Camera share on Android (shares back camera as stream) -->
      <button
        v-if="isAndroid"
        class="ctrl-btn"
        :class="{ danger: rtc.isScreenSharing }"
        title="Share camera"
        @click="rtc.isScreenSharing ? rtc.stopScreenShare() : handleShare('standard')"
      >
        <MonitorOff v-if="rtc.isScreenSharing" :size="20" />
        <Monitor v-else :size="20" />
      </button>

      <!-- Spatial audio -->
      <button
        class="ctrl-btn"
        :class="{ active: settings.spatialAudioEnabled }"
        title="Spatial audio"
        @click="settings.toggleSpatialAudio()"
      >
        <Headphones :size="20" />
      </button>

      <!-- Picture-in-Picture (browser/Electron only) -->
      <div v-if="pipSupported" class="audio-wrap">
        <button
          class="ctrl-btn"
          :class="{ active: rtc.isPiP }"
          title="Picture in Picture"
          @click="togglePiP"
        >
          <PictureInPicture2 :size="20" />
        </button>
        <button
          v-if="rtc.isPiP"
          class="ctrl-btn-small"
          :class="{ active: pipAudioEnabled }"
          title="Toggle stream audio"
          @click.stop="togglePipAudio"
        >
          <VolumeX v-if="!pipAudioEnabled" :size="14" />
          <Volume2 v-else :size="14" />
        </button>
      </div>

      <!-- End call -->
      <button class="ctrl-btn end-call" title="End call" @click="rtc.endCall()">
        <PhoneOff :size="20" />
      </button>
    </div>

    <div class="controls-right">
      <span class="peers-count">{{ rtc.roomUsers.length }} in room</span>
    </div>
  </div>
</template>

<style scoped>
.call-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: var(--bg-surface);
  border-top: 1px solid var(--border);
  flex-shrink: 0;
}
.controls-center {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
}
.controls-left,
.controls-right {
  flex: 1;
}
.controls-right {
  text-align: right;
}
.call-label {
  font-size: 12px;
  font-weight: 700;
  color: var(--danger);
  letter-spacing: 0.5px;
}
.peers-count {
  font-size: 12px;
  color: var(--text-muted);
}
.ctrl-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: none;
  background: var(--bg-hover);
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
  touch-action: manipulation;
}
.ctrl-btn:hover {
  background: rgba(255, 255, 255, 0.12);
  color: var(--text-primary);
}
.ctrl-btn.active {
  background: rgba(139, 92, 246, 0.2);
  color: var(--accent-violet);
}
.ctrl-btn.danger {
  background: rgba(239, 68, 68, 0.15);
  color: var(--danger);
}
.ctrl-btn.speaking {
  background: rgba(139, 92, 246, 0.2);
  color: var(--accent-violet);
  box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.3);
  animation: speaking-pulse 2s ease-in-out infinite alternate;
}

@keyframes speaking-pulse {
  from { box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.2); }
  to { box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.45), 0 0 12px rgba(139, 92, 246, 0.2); }
}
.ctrl-btn.end-call {
  background: var(--danger);
  color: white;
}
.ctrl-btn.end-call:hover {
  background: #dc2626;
}

/* Small action buttons */
.ctrl-btn-small {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.4);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  bottom: -2px;
  right: -2px;
  transition: all 0.15s;
}

.ctrl-btn-small:hover {
  background: rgba(0, 0, 0, 0.6);
}

.ctrl-btn-small.active {
  background: var(--accent-violet);
}

/* Wrappers for relative positioning */
.camera-wrap,
.audio-wrap,
.share-wrap {
  position: relative;
}

/* Dropdown menus */
.dropdown-menu {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 6px;
  min-width: 180px;
  z-index: 100;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.menu-header {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-muted);
  padding: 6px 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.dropdown-item {
  width: 100%;
  text-align: left;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-size: 13px;
  padding: 8px 10px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
}

.dropdown-item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.dropdown-item.selected {
  background: rgba(139, 92, 246, 0.15);
  color: var(--accent-violet);
}

.item-icon {
  font-size: 14px;
}

.item-label {
  flex: 1;
}

.share-menu {
  min-width: 200px;
}

@media (max-width: 767px) {
  .call-controls {
    padding: 10px 12px;
  }
  .ctrl-btn {
    width: 48px;
    height: 48px;
  }
  .controls-left,
  .controls-right {
    display: none;
  }
  .controls-center {
    gap: 6px;
  }
  .dropdown-menu {
    position: fixed;
    bottom: 80px;
    left: 50%;
    transform: translateX(-50%);
  }
}
</style>
