<script setup lang="ts">
import { ref } from 'vue'
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  MonitorOff,
  PhoneOff,
  Headphones,
  Volume2,
} from 'lucide-vue-next'
import { useRtcStore } from '@/stores/rtc.store'
import { useSettingsStore } from '@/stores/settings.store'
import type { ScreenShareQuality } from '@/services/rtc/screen-share'

const rtc = useRtcStore()
const settings = useSettingsStore()
const showShareMenu = ref(false)

const shareOptions: { quality: ScreenShareQuality; label: string; icon: string }[] = [
  { quality: 'gaming', label: '🎮 Gaming (1080p 60fps)', icon: '🎮' },
  { quality: 'movie', label: '🎬 Movie (1080p 30fps)', icon: '🎬' },
  { quality: 'standard', label: '🖥️ Standard (720p 30fps)', icon: '🖥️' },
]

async function handleShare(quality: ScreenShareQuality) {
  showShareMenu.value = false
  try {
    await rtc.shareScreen(quality)
  } catch (e) {
    console.error('Screen share failed:', e)
  }
}
</script>

<template>
  <div class="call-controls">
    <div class="controls-left">
      <span class="call-label">🔴 Live</span>
    </div>
    <div class="controls-center">
      <button
        class="ctrl-btn"
        :class="{ active: !rtc.isMuted, danger: rtc.isMuted }"
        @click="rtc.toggleMute()"
        :title="rtc.isMuted ? 'Unmute' : 'Mute'"
      >
        <MicOff v-if="rtc.isMuted" :size="20" />
        <Mic v-else :size="20" />
      </button>

      <button
        class="ctrl-btn"
        :class="{ active: rtc.isVideoOn }"
        @click="rtc.toggleVideo()"
        title="Toggle camera"
      >
        <VideoOff v-if="!rtc.isVideoOn" :size="20" />
        <Video v-else :size="20" />
      </button>

      <div class="share-wrap" style="position: relative">
        <button
          v-if="!rtc.isScreenSharing"
          class="ctrl-btn"
          @click="showShareMenu = !showShareMenu"
          title="Share screen"
        >
          <Monitor :size="20" />
        </button>
        <button v-else class="ctrl-btn danger" @click="rtc.stopScreenShare()" title="Stop sharing">
          <MonitorOff :size="20" />
        </button>

        <div v-if="showShareMenu" class="share-menu">
          <button
            v-for="opt in shareOptions"
            :key="opt.quality"
            class="share-option"
            @click="handleShare(opt.quality)"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>

      <button
        class="ctrl-btn"
        :class="{ active: settings.spatialAudioEnabled }"
        @click="settings.toggleSpatialAudio()"
        title="Spatial audio"
      >
        <Headphones :size="20" />
      </button>

      <button class="ctrl-btn end-call" @click="rtc.endCall()" title="End call">
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
}
.controls-center {
  display: flex;
  align-items: center;
  gap: 8px;
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
.ctrl-btn.end-call {
  background: var(--danger);
  color: white;
}
.ctrl-btn.end-call:hover {
  background: #dc2626;
}
.share-menu {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 6px;
  min-width: 200px;
  z-index: 100;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}
.share-option {
  width: 100%;
  text-align: left;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-size: 13px;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
}
.share-option:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}
</style>
