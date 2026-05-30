<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { UserPlus, ArrowLeft } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth.store'
import { useRoomStore } from '@/stores/room.store'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const roomStore = useRoomStore()
const inviteCode = ref('')
const loading = ref(false)
const error = ref('')

onMounted(async () => {
  if (route.params.code) {
    inviteCode.value = route.params.code as string
  }
  if (!auth.user) {
    await auth.fetchMe()
    if (!auth.user) {
      router.push('/auth')
      return
    }
  }
  if (inviteCode.value) {
    await joinRoom()
  }
})

async function joinRoom() {
  if (!inviteCode.value.trim()) return
  loading.value = true
  error.value = ''
  try {
    const room = await roomStore.joinByCode(inviteCode.value.trim())
    router.push(`/room/${room.id}`)
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Invalid invite code'
    loading.value = false
  }
}
</script>

<template>
  <div class="join-page">
    <div class="join-bg" />
    <div class="join-container">
      <div class="join-header">
        <img src="/icons/logo.png" alt="AetherPulse" class="join-logo" />
        <h1>AetherPulse</h1>
      </div>
      <div class="join-card">
        <div class="join-icon-wrap">
          <UserPlus :size="32" />
        </div>
        <h2>Join a Room</h2>
        <p>Enter an invite code to join a private room</p>

        <div v-if="loading" class="join-loading">
          <div class="pulse">Joining room...</div>
        </div>
        <template v-else>
          <div class="form-group">
            <label class="label">Invite Code</label>
            <input
              v-model="inviteCode"
              class="input code-input"
              placeholder="e.g. a1b2c3d4"
              @keydown.enter="joinRoom"
              maxlength="32"
              autofocus
            />
          </div>
          <p v-if="error" class="error-msg">{{ error }}</p>
          <button class="btn-primary join-btn" :disabled="!inviteCode.trim()" @click="joinRoom">
            Join Room
          </button>
        </template>

        <button class="back-link" @click="router.push(auth.user ? '/' : '/auth')">
          <ArrowLeft :size="14" />
          {{ auth.user ? 'Back to Home' : 'Back to Login' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.join-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-primary);
  position: relative;
  overflow: hidden;
}
.join-bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 50% 50% at 50% 40%, rgba(59, 130, 246, 0.1) 0%, transparent 70%);
}
.join-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 28px;
  padding: 24px;
  position: relative;
  z-index: 1;
}
.join-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.join-logo { width: 44px; height: 44px; object-fit: contain; }
.join-header h1 {
  font-size: 22px;
  font-weight: 800;
  background: linear-gradient(135deg, var(--accent-violet), var(--accent-blue));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.join-card {
  width: 100%;
  max-width: 380px;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  text-align: center;
}
.join-icon-wrap {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(59, 130, 246, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent-blue);
  margin-bottom: 4px;
}
.join-card h2 { font-size: 20px; font-weight: 700; color: var(--text-primary); }
.join-card p { font-size: 14px; color: var(--text-muted); }
.form-group { width: 100%; text-align: left; margin-top: 8px; }
.code-input { font-family: monospace; font-size: 16px; letter-spacing: 1px; text-align: center; }
.error-msg { font-size: 13px; color: var(--danger); background: rgba(239,68,68,0.1); border-radius: 8px; padding: 8px 14px; width: 100%; }
.join-btn { width: 100%; padding: 12px; font-size: 15px; margin-top: 4px; }
.join-loading { padding: 20px 0; color: var(--text-muted); font-size: 14px; }
.back-link {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text-muted);
  background: transparent;
  border: none;
  cursor: pointer;
  margin-top: 8px;
  transition: color 0.15s;
}
.back-link:hover { color: var(--text-secondary); }
</style>
