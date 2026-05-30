<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Phone, PhoneOff, ArrowLeft, Link2 } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth.store'
import { useRoomStore } from '@/stores/room.store'
import { useRtcStore } from '@/stores/rtc.store'
import VideoTile from '@/components/call/VideoTile.vue'
import CallControls from '@/components/call/CallControls.vue'
import ChatPanel from '@/components/chat/ChatPanel.vue'
import InviteModal from '@/components/modals/InviteModal.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const roomStore = useRoomStore()
const rtc = useRtcStore()

const showInvite = ref(false)
const callError = ref('')

const roomId = computed(() => route.params.roomId as string)
const room = computed(() => roomStore.currentRoom)

const remoteEntries = computed(() => [...rtc.remoteStreams.entries()])

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
  if (auth.user) {
    rtc.leaveRoom(auth.user.id)
  }
})

async function handleJoinCall() {
  callError.value = ''
  try {
    await rtc.startCall()
  } catch (e: unknown) {
    callError.value = e instanceof Error ? e.message : 'Could not access microphone'
  }
}

function goBack() {
  router.push('/')
}
</script>

<template>
  <div class="room-view">
    <div class="room-main">
      <div class="room-header">
        <button class="back-btn" @click="goBack">
          <ArrowLeft :size="16" />
        </button>
        <div class="room-title">
          <span class="room-hash">#</span>
          <h2>{{ room?.name || 'Loading...' }}</h2>
          <span class="room-users">{{ rtc.roomUsers.length }} online</span>
        </div>
        <div class="room-actions">
          <button class="btn-ghost" style="font-size:13px;padding:6px 12px" @click="showInvite = true">
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
            <p>Join the voice channel to communicate with others</p>
            <p v-if="callError" class="error-msg" style="margin-top:8px">{{ callError }}</p>
            <button class="btn-primary join-btn" @click="handleJoinCall">
              <Phone :size="18" />
              Join Voice
            </button>
          </div>
        </div>

        <div v-else class="call-area">
          <div class="video-grid" :class="`peers-${remoteEntries.length + 1}`">
            <VideoTile
              :stream="rtc.screenStream || rtc.localStream"
              :user="auth.user"
              :is-muted="true"
              :is-local="true"
              label="You"
            />
            <VideoTile
              v-for="[userId, stream] in remoteEntries"
              :key="userId"
              :stream="stream"
              :user="null"
              :label="`User ${userId}`"
            />
          </div>
          <CallControls />
        </div>
      </div>
    </div>

    <ChatPanel :room-id="roomId" />
  </div>

  <InviteModal v-if="room && showInvite" :room="room" @close="showInvite = false" />
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
.back-btn:hover { background: var(--bg-hover); color: var(--text-primary); }
.room-title {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
}
.room-hash { font-size: 18px; font-weight: 700; color: var(--text-muted); }
.room-title h2 { font-size: 16px; font-weight: 700; color: var(--text-primary); }
.room-users {
  font-size: 12px;
  color: var(--success);
  background: rgba(34, 197, 94, 0.1);
  padding: 2px 8px;
  border-radius: 20px;
  font-weight: 600;
}
.room-actions { display: flex; gap: 8px; }
.room-content { flex: 1; overflow: hidden; display: flex; flex-direction: column; }
.join-call-screen {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(ellipse 60% 60% at 50% 50%, rgba(139, 92, 246, 0.06) 0%, transparent 70%);
}
.join-card {
  text-align: center;
  padding: 48px;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 20px;
  max-width: 380px;
}
.join-icon { font-size: 48px; margin-bottom: 16px; }
.join-card h3 { font-size: 20px; font-weight: 700; color: var(--text-primary); margin-bottom: 8px; }
.join-card p { font-size: 14px; color: var(--text-muted); }
.join-btn { margin-top: 24px; width: 100%; padding: 12px; font-size: 15px; gap: 10px; }
.call-area { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.video-grid {
  flex: 1;
  display: grid;
  gap: 12px;
  padding: 16px;
  overflow: hidden;
  align-items: center;
}
.video-grid.peers-1 { grid-template-columns: 1fr; max-width: 700px; margin: 0 auto; width: 100%; }
.video-grid.peers-2 { grid-template-columns: 1fr 1fr; }
.video-grid.peers-3 { grid-template-columns: 1fr 1fr; grid-template-rows: auto auto; }
.video-grid.peers-4 { grid-template-columns: 1fr 1fr; }
.error-msg { font-size: 13px; color: var(--danger); background: rgba(239,68,68,0.1); border-radius: 6px; padding: 8px 12px; }
</style>
