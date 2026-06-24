<script setup lang="ts">
  import { ref, computed } from 'vue'
  import {
    Mic, MicOff, Video, VideoOff, Monitor, MonitorOff,
    PhoneOff, Headphones, PictureInPicture2,
  } from 'lucide-vue-next'

  import { useRtcStore } from '@/stores/rtc.store'
  import { useSettingsStore } from '@/stores/settings.store'
  import type { ScreenShareQuality } from '@/services/rtc/screen-share'

  const rtc = useRtcStore()
  const settings = useSettingsStore()
  const showShareMenu = ref(false)

  const isAndroid =
    typeof (window as any).Capacitor !== 'undefined' &&
    (window as any).Capacitor.isNativePlatform()

  const pipSupported = computed(() =>
    !isAndroid && !!(document as any).pictureInPictureEnabled
  )

  const shareOptions: { quality: ScreenShareQuality; label: string }[] = [
    { quality: 'gaming',   label: '🎮 Gaming (1080p 60fps)' },
    { quality: 'movie',    label: '🎬 Movie (1080p 30fps)'  },
    { quality: 'standard', label: '🖥️ Standard (720p 30fps)' },
  ]

  async function handleShare(quality: ScreenShareQuality) {
    showShareMenu.value = false
    try { await rtc.shareScreen(quality) } catch {}
  }

  async function togglePiP() {
    if (rtc.isPiP) rtc.exitPiP()
    else await rtc.enterPiP()
  }
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
        :class="{ active: !rtc.isMuted, danger: rtc.isMuted }"
        :title="rtc.isMuted ? 'Unmute' : 'Mute'"
        @click="rtc.toggleMute()"
      >
        <MicOff v-if="rtc.isMuted" :size="20" />
        <Mic v-else :size="20" />
      </button>

      <!-- Camera -->
      <button
        class="ctrl-btn"
        :class="{ active: rtc.isVideoOn }"
        title="Toggle camera"
        @click="rtc.toggleVideo()"
      >
        <VideoOff v-if="!rtc.isVideoOn" :size="20" />
        <Video v-else :size="20" />
      </button>

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
      <button
        v-if="pipSupported"
        class="ctrl-btn"
        :class="{ active: rtc.isPiP }"
        title="Picture in Picture"
        @click="togglePiP"
      >
        <PictureInPicture2 :size="20" />
      </button>

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
.controls-right { flex: 1; }
.controls-right { text-align: right; }
.call-label { font-size: 12px; font-weight: 700; color: var(--danger); letter-spacing: 0.5px; }
.peers-count { font-size: 12px; color: var(--text-muted); }
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
.ctrl-btn:hover  { background: rgba(255,255,255,0.12); color: var(--text-primary); }
.ctrl-btn.active { background: rgba(139,92,246,0.2);   color: var(--accent-violet); }
.ctrl-btn.danger { background: rgba(239,68,68,0.15);   color: var(--danger); }
.ctrl-btn.end-call { background: var(--danger); color: white; }
.ctrl-btn.end-call:hover { background: #dc2626; }
.share-wrap { position: relative; }
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
  box-shadow: 0 8px 32px rgba(0,0,0,0.4);
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
.share-option:hover { background: var(--bg-hover); color: var(--text-primary); }

@media (max-width: 767px) {
  .call-controls { padding: 10px 12px; }
  .ctrl-btn { width: 48px; height: 48px; }
  .controls-left, .controls-right { display: none; }
  .controls-center { gap: 6px; }
}
</style>
