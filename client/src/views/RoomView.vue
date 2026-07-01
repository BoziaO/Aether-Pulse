<script setup lang="ts">
  import { ref, onMounted, onUnmounted, computed, watch, defineAsyncComponent } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import {
    Phone,
    ArrowLeft,
    Link2,
    Settings,
    Users,
    Radio,
    PictureInPicture2,
    Loader2,
    Sparkles,
  } from 'lucide-vue-next'

  import { useAuthStore } from '@/stores/auth.store'
  import { useRoomStore } from '@/stores/room.store'
  import { useRtcStore } from '@/stores/rtc.store'

  const VideoTile = defineAsyncComponent(() => import('@/components/call/VideoTile.vue'))
  const CallControls = defineAsyncComponent(() => import('@/components/call/CallControls.vue'))
  const ChatPanel = defineAsyncComponent(() => import('@/modules/chat/components/ChatView.vue'))
  const MemberSidebar = defineAsyncComponent(() => import('@/components/rooms/MemberSidebar.vue'))
  const InviteModal = defineAsyncComponent(() => import('@/components/modals/InviteModal.vue'))
  const RoomSettingsModal = defineAsyncComponent(
    () => import('@/components/rooms/RoomSettingsModal.vue')
  )
  const UserProfileModal = defineAsyncComponent(
    () => import('@/components/profile/UserProfileModal.vue')
  )

  const route = useRoute()
  const router = useRouter()
  const auth = useAuthStore()
  const roomStore = useRoomStore()
  const rtc = useRtcStore()

  const showInvite = ref(false)
  const showSettings = ref(false)
  const showMembers = ref(true)
  const callError = ref('')
  const showJoinWithoutMicrophone = ref(false)
  const isCheckingMicrophone = ref(false)
  const selectedUserId = ref<string | null>(null)
  const activeTab = ref<'voice' | 'chat'>('voice')
  const mouse = ref({ x: 0, y: 0 })

  let mouseFn: ((e: MouseEvent) => void) | null = null

  onMounted(() => {
    mouseFn = (e: MouseEvent) => {
      mouse.value = {
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      }
    }
    window.addEventListener('mousemove', mouseFn, { passive: true })
  })

  onUnmounted(() => {
    if (mouseFn) window.removeEventListener('mousemove', mouseFn)
  })

  const roomId = computed(() => route.params.roomId as string)
  const room = computed(() => roomStore.currentRoom)
  const membersForChat = computed(() =>
    (room.value?.members ?? []).map((m) => ({
      id: m.id,
      displayName: m.displayName,
      status: m.status,
    }))
  )
  const members = computed(() => room.value?.members ?? [])
  const remoteEntries = computed(() => [...rtc.remoteStreams.entries()])
  const inVoiceCount = computed(() => rtc.callUsers.size + (rtc.inCall ? 1 : 0))
  const isAndroidNative = computed(
    () =>
      typeof (window as any).Capacitor !== 'undefined' && (window as any).Capacitor.isNativePlatform()
  )

  async function enterRoom(id: string) {
    if (!auth.user || !id) return
    try {
      await roomStore.loadRoom(id)
      await rtc.joinRoom(id, auth.user.id)
    } catch (e) {
      console.error('Failed to join room:', e)
    }
  }

  function leaveCurrentRoom() {
    if (auth.user && roomId.value) {
      rtc.leaveRoom(auth.user.id)
    }
  }

  watch(
    roomId,
    (newId, oldId) => {
      if (oldId) {
        leaveCurrentRoom()
        activeTab.value = 'voice'
      }
      if (newId) {
        enterRoom(newId)
      }
    },
    { immediate: true }
  )

  onUnmounted(() => {
    leaveCurrentRoom()
  })

  async function handleJoinCall() {
    callError.value = ''
    try {
      await rtc.startCall()
    } catch (e: unknown) {
      callError.value = e instanceof Error ? e.message : 'Nie można uzyskać dostępu do mikrofonu'
    }
  }

  async function handleJoinWithoutMicrophone() {
    callError.value = ''
    try {
      isCheckingMicrophone.value = true
      await rtc.startCall(true)
      showJoinWithoutMicrophone.value = false
    } catch (e: unknown) {
      callError.value = e instanceof Error ? e.message : 'Nie można dołączyć bez mikrofonu'
    } finally {
      isCheckingMicrophone.value = false
    }
  }

  function goBack() {
    router.push('/app')
  }

  function openUserProfile(userId: string) {
    selectedUserId.value = userId
  }

  function handleLeftRoom() {
    showSettings.value = false
    router.push('/app')
  }

  function handleDeletedRoom() {
    showSettings.value = false
    router.push('/')
  }
</script>

<template>
  <div class="room-view">
    <div class="room-bg-orbs" aria-hidden="true">
      <div class="room-orb room-orb--violet" :style="{ transform: `translate(${mouse.x * 15}px, ${mouse.y * 15}px)` }"></div>
      <div class="room-orb room-orb--pink" :style="{ transform: `translate(${mouse.x * -10}px, ${mouse.y * -10}px)` }"></div>
      <div class="room-orb room-orb--blue" :style="{ transform: `translate(${mouse.x * 8}px, ${mouse.y * -12}px)` }"></div>
      <div class="room-orb room-orb--teal"></div>
    </div>

    <div class="room-main" :class="{ 'mobile-hidden': activeTab !== 'voice' }">
      <div class="room-header">
        <button class="room-back-btn" @click="goBack">
          <ArrowLeft :size="18" />
        </button>
        <div class="room-title">
          <span class="room-hash">#</span>
          <h2>{{ room?.name || 'Ładowanie...' }}</h2>
          <span v-if="room?.isActive" class="room-live-badge">
            <Radio :size="10" />
            LIVE
          </span>
          <span class="room-users-badge">
            <Users :size="12" />
            {{ rtc.roomUsers.length }}
          </span>
          <span v-if="inVoiceCount > 0" class="room-voice-badge">
            <Phone :size="12" />
            {{ inVoiceCount }} w głosie
          </span>
        </div>
        <div class="room-actions">
          <button
            class="room-tab-btn mobile-tab-btn"
            @click="activeTab = activeTab === 'voice' ? 'chat' : 'voice'"
          >
            {{ activeTab === 'voice' ? 'Czat' : 'Głos' }}
          </button>
          <button class="room-action-btn desktop-only" @click="showMembers = !showMembers">
            <Users :size="16" />
          </button>
          <button class="room-action-btn" @click="showSettings = true">
            <Settings :size="16" />
          </button>
          <button class="room-action-btn desktop-only" @click="showInvite = true">
            <Link2 :size="16" />
            Zaproś
          </button>
        </div>
      </div>

      <div class="room-content">
        <div v-if="!rtc.inCall" class="join-call-screen">
          <div class="join-call-glow"></div>
          <div class="join-card card glass">
            <div class="join-icon-wrap">
              <Phone :size="32" />
            </div>
            <div class="badge badge-violet join-badge">
              <Sparkles :size="12" />
              Połączenie głosowe
            </div>
            <h3 class="join-title">{{ room?.name }}</h3>
            <p class="join-desc">
              Dołącz do kanału głosowego — dźwięk przestrzenny, udostępnianie ekranu i HD video.
            </p>
            <p v-if="inVoiceCount > 0" class="voice-hint">
              {{ inVoiceCount }} {{ inVoiceCount === 1 ? 'osoba jest' : 'osoby są' }} już w rozmowie
            </p>
            <p v-if="callError" class="error-msg">{{ callError }}</p>

            <div v-if="!showJoinWithoutMicrophone" class="join-options">
              <button
                class="btn btn-primary join-btn"
                :disabled="isCheckingMicrophone"
                @click="handleJoinCall"
              >
                <Phone :size="18" />
                Dołącz z mikrofonem
              </button>
              <button class="btn btn-ghost join-btn-no-mic" @click="showJoinWithoutMicrophone = true">
                Dołącz bez mikrofonu
              </button>
            </div>

            <div v-else class="confirm-no-microphone">
              <p class="no-microphone-warning">
                Będziesz mógł słuchać, ale nie mówić. Inni użytkownicy będą widzieć, że dołączyłeś bez mikrofonu.
              </p>
              <div class="confirm-buttons">
                <button
                  class="btn btn-primary"
                  :disabled="isCheckingMicrophone"
                  @click="handleJoinWithoutMicrophone"
                >
                  <Loader2 v-if="isCheckingMicrophone" class="spin" :size="18" />
                  <span v-else>Potwierdź i dołącz</span>
                </button>
                <button class="btn btn-ghost" @click="showJoinWithoutMicrophone = false">Anuluj</button>
              </div>
            </div>

            <p v-if="rtc.noMicrophoneDetected" class="audio-status warning">
              Nie wykryto mikrofonu na tym urządzeniu
            </p>
            <p v-if="rtc.microphonePermissionDenied" class="audio-status error">
              Dostęp do mikrofonu został zablokowany
            </p>
          </div>
        </div>

        <div v-else class="call-area">
          <div class="stream-status">
            <span class="stream-status-item">
              <Radio :size="14" />
              {{ rtc.isScreenSharing ? 'Stream aktywny' : 'Voice live' }}
            </span>
            <span v-if="isAndroidNative" class="stream-status-item">
              <PictureInPicture2 :size="14" />
              PiP po wyjściu
            </span>
          </div>
          <div class="video-grid" :class="`peers-${remoteEntries.length + 1}`">
            <VideoTile
              :stream="rtc.screenStream || rtc.localStream"
              :user="auth.user"
              :is-muted="rtc.isMuted"
              :is-local="true"
              :is-speaking="rtc.isSpeaking"
              :audio-level="rtc.currentAudioLevel"
              label="Ty"
            />
            <VideoTile
              v-for="[userId, stream] in remoteEntries"
              :key="userId"
              :stream="stream"
              :user-id="userId"
              @profile-click="openUserProfile"
            />
          </div>
          <CallControls />
        </div>
      </div>
    </div>

    <ChatPanel
      :room-id="roomId"
      :room-name="room?.name ?? ''"
      :members="membersForChat"
      :class="{ 'mobile-hidden': activeTab !== 'chat' }"
      @toggle-members="showMembers = !showMembers"
    />

    <MemberSidebar
      v-if="showMembers && members.length"
      :members="members"
      class="desktop-only"
      @open-profile="openUserProfile"
    />
  </div>

  <InviteModal v-if="room && showInvite" :room="room" @close="showInvite = false" />
  <RoomSettingsModal
    v-if="room && showSettings"
    :room="room"
    @close="showSettings = false"
    @left="handleLeftRoom"
    @deleted="handleDeletedRoom"
  />
  <UserProfileModal
    v-if="selectedUserId"
    :user-id="selectedUserId"
    @close="selectedUserId = null"
  />
</template>

<style scoped>
.room-view {
  display: flex;
  height: 100%;
  overflow: hidden;
  position: relative;
}

/* BG ORBS */
.room-bg-orbs {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}

.room-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  will-change: transform;
  transition: transform 0.5s ease-out;
}

.room-orb--violet {
  width: 500px;
  height: 500px;
  top: -15%;
  right: 5%;
  background: rgba(139, 92, 246, 0.06);
}

.room-orb--pink {
  width: 400px;
  height: 400px;
  top: 40%;
  left: -10%;
  background: rgba(217, 70, 239, 0.04);
}

.room-orb--blue {
  width: 350px;
  height: 350px;
  top: 60%;
  right: -5%;
  background: rgba(59, 130, 246, 0.04);
}

.room-orb--teal {
  width: 300px;
  height: 300px;
  top: 10%;
  left: 30%;
  background: rgba(6, 182, 212, 0.03);
  animation: roomOrbDrift 20s ease-in-out infinite;
}

@keyframes roomOrbDrift {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(40px, -30px); }
}

.room-main {
  position: relative;
  z-index: 1;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}

/* HEADER */
.room-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(13, 16, 23, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border);
}

.room-back-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  transition: all 0.15s;
}

.room-back-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.room-title {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  flex-wrap: wrap;
  min-width: 0;
}

.room-hash {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-muted);
}

.room-title h2 {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.room-live-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  font-weight: 700;
  color: white;
  background: linear-gradient(135deg, var(--danger), #f97316);
  padding: 3px 8px;
  border-radius: 20px;
  letter-spacing: 0.5px;
}

.room-users-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 600;
  color: var(--success);
  background: rgba(34, 197, 94, 0.1);
  padding: 3px 10px;
  border-radius: 20px;
}

.room-voice-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 600;
  color: var(--accent-violet);
  background: rgba(139, 92, 246, 0.12);
  padding: 3px 10px;
  border-radius: 20px;
}

.room-actions {
  display: flex;
  gap: 6px;
}

.room-action-btn {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-secondary);
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.15s;
}

.room-action-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
  border-color: var(--border-accent);
}

.room-tab-btn {
  display: none;
}

/* CONTENT */
.room-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* JOIN CALL */
.join-call-screen {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.join-call-glow {
  position: absolute;
  width: 400px;
  height: 400px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.1), transparent 70%);
  pointer-events: none;
}

.join-card {
  text-align: center;
  padding: 40px 32px;
  max-width: 440px;
  width: calc(100% - 32px);
  position: relative;
  z-index: 3;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.join-icon-wrap {
  width: 80px;
  height: 80px;
  border-radius: 22px;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(59, 130, 246, 0.1));
  border: 1px solid rgba(139, 92, 246, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent-violet);
  margin-bottom: 8px;
  box-shadow: 0 0 30px rgba(139, 92, 246, 0.12);
}

.join-badge {
  margin-bottom: 8px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.join-title {
  font-size: 22px;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0;
}

.join-desc {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0;
}

.voice-hint {
  color: var(--accent-violet) !important;
  font-weight: 600;
  font-size: 13px;
  margin: 0;
}

.join-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 20px;
  width: 100%;
}

.join-btn {
  width: 100%;
  padding: 14px;
  font-size: 15px;
  gap: 10px;
}

.join-btn-no-mic {
  width: 100%;
}

.confirm-no-microphone {
  margin-top: 16px;
  padding: 14px;
  background: rgba(251, 191, 36, 0.06);
  border-radius: 12px;
  border: 1px solid rgba(251, 191, 36, 0.2);
  width: 100%;
}

.no-microphone-warning {
  font-size: 13px;
  color: #fbbf24;
  margin: 0 0 12px 0;
  text-align: center;
  line-height: 1.5;
}

.confirm-buttons {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.error-msg {
  font-size: 13px;
  color: var(--danger);
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 10px;
  padding: 10px 14px;
  width: 100%;
}

.audio-status {
  font-size: 12px;
  padding: 8px 12px;
  border-radius: 8px;
  text-align: center;
}

.audio-status.warning {
  color: #fbbf24;
  background: rgba(251, 191, 36, 0.1);
  border: 1px solid rgba(251, 191, 36, 0.2);
}

.audio-status.error {
  color: var(--danger);
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
}

/* CALL AREA */
.call-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.stream-status {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 16px;
  border-bottom: 1px solid var(--border);
  background: rgba(139, 92, 246, 0.06);
  font-size: 12px;
  font-weight: 600;
}

.stream-status-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--text-secondary);
}

.video-grid {
  flex: 1;
  display: grid;
  gap: 10px;
  padding: 16px;
  overflow: hidden;
  align-items: center;
}

.video-grid.peers-1 {
  grid-template-columns: 1fr;
  max-width: 700px;
  margin: 0 auto;
  width: 100%;
}

.video-grid.peers-2,
.video-grid.peers-3,
.video-grid.peers-4 {
  grid-template-columns: 1fr 1fr;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media (max-width: 767px) {
  .room-tab-btn {
    display: inline-flex !important;
    font-size: 12px;
    padding: 6px 14px;
  }

  .desktop-only {
    display: none !important;
  }

  .mobile-hidden {
    display: none !important;
  }

  .room-view {
    flex-direction: column;
  }

  .room-header {
    padding: 10px 12px;
    gap: 8px;
    min-height: 54px;
  }

  .room-title h2 {
    max-width: 34vw;
    font-size: 14px;
  }

  .room-users-badge {
    display: none;
  }

  .room-voice-badge,
  .room-live-badge {
    font-size: 9px;
    padding: 2px 6px;
  }

  .stream-status {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
    padding: 8px 12px;
  }

  .join-card {
    width: calc(100% - 24px);
    padding: 28px 20px;
    border-radius: 16px;
  }

  .video-grid {
    padding: 10px;
    gap: 8px;
  }

  .video-grid.peers-1 {
    max-width: 100%;
  }

  :deep(.chat-panel) {
    width: 100% !important;
    min-width: 100% !important;
    border-left: none !important;
    flex: 1 !important;
  }
}

@media (prefers-reduced-motion: reduce) {
  .room-orb {
    animation: none !important;
  }
}
</style>
