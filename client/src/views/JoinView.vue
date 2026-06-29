<script setup lang="ts">
  import { ref, onMounted, onUnmounted } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { UserPlus, ArrowLeft, Link2, Sparkles } from 'lucide-vue-next'

  import { useAuthStore } from '@/stores/auth.store'
  import { useRoomStore } from '@/stores/room.store'

  const route = useRoute()
  const router = useRouter()
  const auth = useAuthStore()
  const roomStore = useRoomStore()
  const inviteCode = ref('')
  const loading = ref(false)
  const error = ref('')
  const mouse = ref({ x: 0, y: 0 })

  let mouseFn: ((e: MouseEvent) => void) | null = null

  onMounted(async () => {
    mouseFn = (e: MouseEvent) => {
      mouse.value = {
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      }
    }
    window.addEventListener('mousemove', mouseFn, { passive: true })

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

  onUnmounted(() => {
    if (mouseFn) window.removeEventListener('mousemove', mouseFn)
  })

  async function joinRoom() {
    if (!inviteCode.value.trim()) return
    loading.value = true
    error.value = ''
    try {
      const room = await roomStore.joinByCode(inviteCode.value.trim())
      router.push(`/app/room/${room.id}`)
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Nieprawidłowy kod zaproszenia'
      loading.value = false
    }
  }
</script>

<template>
  <div class="join-page">
    <div class="join-bg-orbs" aria-hidden="true">
      <div class="join-orb join-orb--violet" :style="{ transform: `translate(${mouse.x * 15}px, ${mouse.y * 15}px)` }"></div>
      <div class="join-orb join-orb--pink" :style="{ transform: `translate(${mouse.x * -10}px, ${mouse.y * -10}px)` }"></div>
      <div class="join-orb join-orb--blue" :style="{ transform: `translate(${mouse.x * 8}px, ${mouse.y * -12}px)` }"></div>
      <div class="join-orb join-orb--teal"></div>
    </div>

    <div class="join-container">
      <div class="join-header">
        <img src="/icons/logo-simp.png" alt="Nicori" class="join-logo" />
        <h1 class="join-brand">Nicori</h1>
      </div>

      <div class="join-card card glass">
        <div class="join-icon-wrap">
          <Link2 :size="32" />
        </div>
        <div class="badge badge-violet join-badge">
          <Sparkles :size="12" />
          Dołącz do pokoju
        </div>
        <h2 class="join-title">Dołącz do pokoju</h2>
        <p class="join-desc">Wpisz kod zaproszenia, aby dołączyć do prywatnego pokoju</p>

        <div v-if="loading" class="join-loading">
          <div class="spinner"></div>
          <span>Dołączanie do pokoju...</span>
        </div>
        <template v-else>
          <div class="form-group">
            <label class="label">Kod zaproszenia</label>
            <input
              v-model="inviteCode"
              class="input code-input"
              placeholder="np. a1b2c3d4"
              maxlength="32"
              autofocus
              @keydown.enter="joinRoom"
            />
          </div>
          <p v-if="error" class="error-msg">{{ error }}</p>
          <button class="btn btn-primary join-btn" :disabled="!inviteCode.trim()" @click="joinRoom">
            <UserPlus :size="16" />
            Dołącz do pokoju
          </button>
        </template>

        <button class="back-link" @click="router.push(auth.user ? '/app' : '/auth')">
          <ArrowLeft :size="14" />
          {{ auth.user ? 'Powrót do strony głównej' : 'Powrót do logowania' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.join-page {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  position: relative;
  overflow: hidden;
}

/* BG ORBS */
.join-bg-orbs {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}

.join-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  will-change: transform;
  transition: transform 0.5s ease-out;
}

.join-orb--violet {
  width: 600px;
  height: 600px;
  top: -15%;
  right: 5%;
  background: rgba(139, 92, 246, 0.08);
}

.join-orb--pink {
  width: 500px;
  height: 500px;
  top: 40%;
  left: -10%;
  background: rgba(217, 70, 239, 0.06);
}

.join-orb--blue {
  width: 450px;
  height: 450px;
  top: 60%;
  right: -5%;
  background: rgba(59, 130, 246, 0.05);
}

.join-orb--teal {
  width: 350px;
  height: 350px;
  top: 10%;
  left: 30%;
  background: rgba(6, 182, 212, 0.04);
  animation: joinOrbDrift 20s ease-in-out infinite;
}

@keyframes joinOrbDrift {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(40px, -30px); }
}

/* CONTAINER */
.join-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 28px;
  padding: 24px;
  position: relative;
  z-index: 1;
}

/* HEADER */
.join-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.join-logo {
  width: 48px;
  height: 48px;
  object-fit: contain;
}

.join-brand {
  font-size: 24px;
  font-weight: 800;
  letter-spacing: -0.02em;
  background: linear-gradient(135deg, var(--accent-violet), var(--accent-blue));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
}

/* CARD */
.join-card {
  width: 100%;
  max-width: 400px;
  padding: 40px 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  text-align: center;
}

.join-icon-wrap {
  width: 72px;
  height: 72px;
  border-radius: 18px;
  background: rgba(59, 130, 246, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent-blue);
  margin-bottom: 8px;
}

.join-badge {
  margin-bottom: 8px;
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

/* FORM */
.form-group {
  width: 100%;
  text-align: left;
  margin-top: 8px;
}

.label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: block;
  margin-bottom: 6px;
}

.input {
  width: 100%;
  padding: 12px 14px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 10px;
  color: var(--text-primary);
  font-size: 14px;
  transition: all 0.2s;
  outline: none;
  box-sizing: border-box;
}

.input:focus {
  border-color: var(--accent-violet);
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.12);
}

.input::placeholder {
  color: var(--text-muted);
}

.code-input {
  font-family: monospace;
  font-size: 18px;
  letter-spacing: 2px;
  text-align: center;
  padding: 14px;
}

.error-msg {
  font-size: 13px;
  color: var(--danger);
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 10px;
  padding: 10px 14px;
  width: 100%;
  margin: 0;
}

.join-btn {
  width: 100%;
  padding: 14px;
  font-size: 15px;
  margin-top: 8px;
  gap: 8px;
}

.join-loading {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px 0;
  color: var(--text-muted);
  font-size: 14px;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(139, 92, 246, 0.2);
  border-top-color: var(--accent-violet);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

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
  padding: 0;
}

.back-link:hover {
  color: var(--text-primary);
}

@media (max-width: 480px) {
  .join-card {
    padding: 28px 20px;
    border-radius: 16px;
  }

  .join-brand {
    font-size: 20px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .join-orb {
    animation: none !important;
  }
}
</style>
