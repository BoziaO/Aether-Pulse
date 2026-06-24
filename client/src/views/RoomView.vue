<script setup lang="ts">
  import { ref, onMounted, onUnmounted, computed, defineAsyncComponent } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { Phone, ArrowLeft, Link2, Settings, Users, Radio, PictureInPicture2, Loader2 } from 'lucide-vue-next'

  import { useAuthStore } from '@/stores/auth.store'
  import { useRoomStore } from '@/stores/room.store'
  import { useRtcStore } from '@/stores/rtc.store'

  // Lazy-loaded components for performance
  const VideoTile = defineAsyncComponent(() => import('@/components/call/VideoTile.vue'))
  const CallControls = defineAsyncComponent(() => import('@/components/call/CallControls.vue'))
  const ChatPanel = defineAsyncComponent(() => import('@/components/chat/ChatPanel.vue'))
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

  onMounted(async () => {
    if (!auth.user) return
    try {
      await roomStore.loadRoom(roomId.value)
      await rtc.joinRoom(roomId.value, auth.user.id)
    } catch (e) {
      console.error('Failed to join room:', e)
    }
  })

  onUnmounted(() => {
    if (auth.user) rtc.leaveRoom(auth.user.id)
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
      await rtc.startCall(true) // allowWithoutMicrophone = true
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
    <div class="room-main" :class="{ 'mobile-hidden': activeTab !== 'voice' }">
      <div class="room-header">
        <button class="back-btn" @click="goBack">
          <ArrowLeft :size="16" />
        </button>
        <div class="room-title">
          <span class="room-hash">#</span>
          <h2>{{ room?.name || 'Loading...' }}</h2>
          <span v-if="room?.isActive" class="live-badge">LIVE</span>
          <span class="room-users">{{ rtc.roomUsers.length }} online</span>
          <span v-if="inVoiceCount > 0" class="voice-badge">{{ inVoiceCount }} in voice</span>
        </div>
        <div class="room-actions">
          <!-- Mobile tab toggle button -->
          <button
            class="btn-primary header-btn mobile-tab-btn"
            @click="activeTab = activeTab === 'voice' ? 'chat' : 'voice'"
          >
            {{ activeTab === 'voice' ? 'Chat' : 'Voice' }}
          </button>

          <button class="btn-ghost header-btn desktop-only" @click="showMembers = !showMembers">
            <Users :size="14" />
          </button>
          <button class="btn-ghost header-btn" @click="showSettings = true">
            <Settings :size="14" />
          </button>
          <button class="btn-ghost header-btn desktop-only" @click="showInvite = true">
            <Link2 :size="14" />
            Invite
          </button>
        </div>
      </div>

      <div class="room-content">
        <div v-if="!rtc.inCall" class="join-call-screen">
          <div class="join-card">
            <div class="join-icon">🎙️</div>
            <h3>{{ room?.name }}</h3>
            <p>Dołącz do kanału głosowego — dźwięk przestrzenny, udostępnianie ekranu i HD video.</p>
            <p v-if="inVoiceCount > 0" class="voice-hint">
              {{ inVoiceCount }} {{ inVoiceCount === 1 ? 'osoba jest' : 'osoby są' }} już w
              rozmoowie
            </p>
            <p v-if="callError" class="error-msg">{{ callError }}</p>
            
            <div v-if="!showJoinWithoutMicrophone" class="join-options">
              <button 
                class="btn-primary join-btn"
                :disabled="isCheckingMicrophone"
                @click="handleJoinCall"
              >
                <Phone :size="18" />
                Dołącz z mikrofonem
              </button>
              
              <button 
                class="btn-outline join-btn-no-mic"
                @click="showJoinWithoutMicrophone = true"
              >
                Dołącz bez mikrofonu
              </button>
            </div>
            
            <div v-else class="confirm-no-microphone">
              <p class="no-microphone-warning">
                ⚠️ Będziesz mógł słuchać, ale nie mówić. 
                Inni użytkownicy będą widzieć, że dołączyłeś bez mikrofonu.
              </p>
              <div class="confirm-buttons">
                <button 
                  class="btn-primary"
                  :disabled="isCheckingMicrophone"
                  @click="handleJoinWithoutMicrophone"
                >
                  <Loader2 v-if="isCheckingMicrophone" class="loader" :size="18" />
                  <span v-else>Potwierdź i dołącz</span>
                </button>
                <button 
                  class="btn-ghost"
                  @click="showJoinWithoutMicrophone = false"
                >
                  Anuluj
                </button>
              </div>
            </div>
            
            <!-- Audio detection status -->
            <p v-if="rtc.noMicrophoneDetected" class="audio-status warning">
              ⚠️ Nie wykryto mikrofonu na tym urządzeniu
            </p>
            <p v-if="rtc.microphonePermissionDenied" class="audio-status error">
              ❌ Dostęp do mikrofonu został zablokowany
            </p>
          </div>
        </div>

        <div v-else class="call-area">
          <div class="stream-status">
            <span>
              <Radio :size="14" />
              {{ rtc.isScreenSharing ? 'Stream aktywny' : 'Voice live' }}
            </span>
            <span v-if="isAndroidNative">
              <PictureInPicture2 :size="14" />
              PiP po wyjściu z aplikacji
            </span>
          </div>
          <div class="video-grid" :class="`peers-${remoteEntries.length + 1}`">
            <VideoTile
              :stream="rtc.screenStream || rtc.localStream"
              :user="auth.user"
              :is-muted="rtc.isMuted"
              :is-local="true"
              label="You"
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
      :room-name="room?.name"
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
}
.room-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--bg-primary);
  min-width: 0;
}
.room-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
  background: var(--bg-secondary);
}
.back-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  display: flex;
  align-items: center;
}
.back-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}
.room-title {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  flex-wrap: wrap;
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
}
.live-badge {
  font-size: 10px;
  font-weight: 800;
  color: #fff;
  background: var(--danger);
  padding: 2px 6px;
  border-radius: 4px;
  letter-spacing: 0.5px;
}
.room-users,
.voice-badge {
  font-size: 12px;
  color: var(--success);
  background: rgba(34, 197, 94, 0.1);
  padding: 2px 8px;
  border-radius: 20px;
  font-weight: 600;
}
.voice-badge {
  color: var(--accent-violet);
  background: rgba(139, 92, 246, 0.12);
}
.room-actions {
  display: flex;
  gap: 6px;
}
.header-btn {
  font-size: 13px;
  padding: 6px 10px;
}
.room-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.join-call-screen {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(
    ellipse 60% 60% at 50% 50%,
    rgba(139, 92, 246, 0.08) 0%,
    transparent 70%
  );
  position: relative;
  overflow: hidden;
}
.join-card {
  text-align: center;
  padding: 32px 24px;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 20px;
  max-width: 420px;
  width: calc(100% - 32px);
  position: relative;
  z-index: 3;
}
.join-icon {
  font-size: 48px;
  margin-bottom: 16px;
}
.join-card h3 {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 8px;
}
.join-card p {
  font-size: 14px;
  color: var(--text-muted);
  line-height: 1.5;
}
.voice-hint {
  color: var(--accent-violet) !important;
  font-weight: 600;
  margin-top: 8px;
}
.join-btn {
  margin-top: 24px;
  width: 100%;
  padding: 14px;
  font-size: 16px;
  gap: 10px;
  touch-action: manipulation;
}
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
  padding: 8px 14px;
  border-bottom: 1px solid var(--border);
  background: rgba(139, 92, 246, 0.08);
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 700;
}
.stream-status span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}
.video-grid {
  flex: 1;
  display: grid;
  gap: 8px;
  padding: 12px;
  overflow: hidden;
  align-items: center;
}
.video-grid.peers-1 {
  grid-template-columns: 1fr;
  max-width: 700px;
  margin: 0 auto;
  width: 100%;
}
.video-grid.peers-2 {
  grid-template-columns: 1fr 1fr;
}
.video-grid.peers-3 {
  grid-template-columns: 1fr 1fr;
}
.video-grid.peers-4 {
  grid-template-columns: 1fr 1fr;
}

@media (max-width: 767px) {
  .video-grid {
    padding: 8px;
    gap: 6px;
  }
  .video-grid.peers-1 {
    max-width: 100%;
  }
  .video-grid.peers-2,
  .video-grid.peers-3,
  .video-grid.peers-4 {
    grid-template-columns: 1fr 1fr;
  }
}
.error-msg {
  font-size: 13px;
  color: var(--danger);
  background: rgba(239, 68, 68, 0.1);
  border-radius: 6px;
  padding: 8px 12px;
  margin-top: 8px;
}

.join-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 20px;
  width: 100%;
}

.join-btn-no-mic {
  background: transparent !important;
  border: 1px solid var(--border) !important;
  color: var(--text-secondary) !important;
}

.join-btn-no-mic:hover {
  border-color: var(--accent-violet) !important;
  color: var(--accent-violet) !important;
}

.confirm-no-microphone {
  margin-top: 16px;
  padding: 12px;
  background: rgba(255, 182, 0, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(255, 182, 0, 0.2);
}

.no-microphone-warning {
  font-size: 13px;
  color: #fbbf24;
  margin: 0 0 12px 0;
  text-align: center;
  line-height: 1.4;
}

.confirm-buttons {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.audio-status {
  font-size: 12px;
  padding: 6px 10px;
  border-radius: 6px;
  margin-top: 12px;
  text-align: center;
}

.audio-status.warning {
  color: #fbbf24;
  background: rgba(255, 182, 0, 0.1);
}

.audio-status.error {
  color: var(--danger);
  background: rgba(239, 68, 68, 0.1);
}

.loader {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Responsiveness overrides */
.mobile-tab-btn {
  display: none;
}

@media (max-width: 767px) {
  .mobile-tab-btn {
    display: inline-flex !important;
    font-size: 12px;
    padding: 6px 14px;
    touch-action: manipulation;
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
    padding: 9px 10px;
    gap: 8px;
    min-height: 54px;
  }
  .room-title {
    gap: 5px;
    min-width: 0;
  }
  .room-title h2 {
    max-width: 34vw;
    overflow: hidden;
    font-size: 14px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .room-users {
    display: none;
  }
  .voice-badge,
  .live-badge {
    font-size: 9px;
    padding: 2px 6px;
  }
  .stream-status {
    align-items: flex-start;
    flex-direction: column;
    gap: 5px;
    padding: 8px 10px;
  }
  .join-card {
    width: calc(100% - 20px);
    padding: 24px 18px;
    border-radius: 12px;
  }
  :deep(.chat-panel) {
    width: 100% !important;
    min-width: 100% !important;
    border-left: none !important;
    flex: 1 !important;
  }
}
</style>
