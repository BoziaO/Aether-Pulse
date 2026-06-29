<script setup lang="ts">
  import { ref, onMounted, onUnmounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { ArrowLeft, Mail, Loader2, CheckCircle, Sparkles } from 'lucide-vue-next'

  import { useAuthStore } from '@/stores/auth.store'

  const router = useRouter()
  const auth = useAuthStore()
  const email = ref('')
  const loading = ref(false)
  const sent = ref(false)
  const error = ref('')
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

  function isValidEmail(e: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)
  }

  async function submit() {
    if (!isValidEmail(email.value)) {
      error.value = 'Podaj prawidłowy adres email'
      return
    }
    error.value = ''
    loading.value = true
    try {
      await auth.forgotPassword(email.value.trim())
      sent.value = true
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Wystąpił błąd'
    } finally {
      loading.value = false
    }
  }
</script>

<template>
  <div class="fp-page">
    <div class="fp-bg-orbs" aria-hidden="true">
      <div class="fp-orb fp-orb--violet" :style="{ transform: `translate(${mouse.x * 15}px, ${mouse.y * 15}px)` }"></div>
      <div class="fp-orb fp-orb--pink" :style="{ transform: `translate(${mouse.x * -10}px, ${mouse.y * -10}px)` }"></div>
      <div class="fp-orb fp-orb--blue" :style="{ transform: `translate(${mouse.x * 8}px, ${mouse.y * -12}px)` }"></div>
      <div class="fp-orb fp-orb--teal"></div>
    </div>

    <div class="fp-container">
      <div class="fp-card card glass">
        <div class="fp-card-header">
          <div class="badge badge-violet fp-badge">
            <Sparkles :size="12" />
            Reset hasła
          </div>
          <h1 class="fp-title">Zapomniałeś hasła?</h1>
          <p class="fp-desc">Podaj adres email powiązany z kontem, a wyślemy Ci link do resetowania hasła.</p>
        </div>

        <template v-if="!sent">
          <form class="fp-form" @submit.prevent="submit">
            <div class="form-group">
              <label class="label" for="email">Email</label>
              <div class="input-wrap">
                <Mail :size="16" class="input-icon-left" />
                <input
                  id="email"
                  v-model="email"
                  class="input with-icon-left"
                  type="email"
                  placeholder="twoj@email.com"
                  autocomplete="email"
                  autofocus
                  @keydown.enter="submit"
                />
              </div>
            </div>

            <p v-if="error" class="error-msg">
              <AlertCircle :size="14" />
              {{ error }}
            </p>

            <button class="btn btn-primary fp-btn" :disabled="loading" type="submit">
              <Loader2 v-if="loading" class="spin" :size="18" />
              <template v-else>Wyślij link resetujący</template>
            </button>
          </form>
        </template>

        <template v-else>
          <div class="fp-success">
            <div class="fp-success-icon">
              <CheckCircle :size="48" />
            </div>
            <h2>Wysłano email</h2>
            <p>Jeśli konto {{ email }} istnieje, otrzymasz link do resetowania hasła.</p>
          </div>
        </template>

        <button class="back-link" @click="router.push('/auth')">
          <ArrowLeft :size="14" />
          Powrót do logowania
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fp-page {
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

.fp-bg-orbs {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}

.fp-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  will-change: transform;
  transition: transform 0.5s ease-out;
}

.fp-orb--violet {
  width: 600px;
  height: 600px;
  top: -15%;
  right: 5%;
  background: rgba(139, 92, 246, 0.08);
}

.fp-orb--pink {
  width: 500px;
  height: 500px;
  top: 40%;
  left: -10%;
  background: rgba(217, 70, 239, 0.06);
}

.fp-orb--blue {
  width: 450px;
  height: 450px;
  top: 60%;
  right: -5%;
  background: rgba(59, 130, 246, 0.05);
}

.fp-orb--teal {
  width: 350px;
  height: 350px;
  top: 10%;
  left: 30%;
  background: rgba(6, 182, 212, 0.04);
  animation: fpOrbDrift 20s ease-in-out infinite;
}

@keyframes fpOrbDrift {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(40px, -30px); }
}

.fp-container {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 420px;
  padding: 24px;
}

.fp-card {
  padding: 32px;
}

.fp-card-header {
  text-align: center;
  margin-bottom: 24px;
}

.fp-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 16px;
}

.fp-title {
  font-size: 28px;
  font-weight: 800;
  line-height: 1.15;
  letter-spacing: -0.02em;
  margin: 0 0 8px;
  background: linear-gradient(135deg, var(--accent-violet), var(--accent-blue), var(--accent-teal));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.fp-desc {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0;
}

.fp-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.input-wrap {
  position: relative;
}

.input-icon-left {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  pointer-events: none;
}

.input.with-icon-left {
  padding-left: 38px;
}

.input {
  width: 100%;
  padding: 11px 14px;
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
  font-size: 13px;
}

.error-msg {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--danger);
  padding: 10px 14px;
  background: rgba(239, 68, 68, 0.1);
  border-radius: 10px;
  border: 1px solid rgba(239, 68, 68, 0.2);
  margin: 0;
}

.fp-btn {
  width: 100%;
  padding: 12px 16px;
  font-size: 15px;
  font-weight: 600;
}

.fp-success {
  text-align: center;
  padding: 24px 0;
}

.fp-success-icon {
  color: var(--success);
  margin-bottom: 16px;
}

.fp-success h2 {
  font-size: 20px;
  font-weight: 700;
  margin: 0 0 8px;
}

.fp-success p {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.5;
  margin: 0;
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
  margin-top: 16px;
  transition: color 0.15s;
  padding: 0;
  width: 100%;
  justify-content: center;
}

.back-link:hover {
  color: var(--text-primary);
}

.spin {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media (max-width: 480px) {
  .fp-card {
    padding: 24px 20px;
    border-radius: 16px;
  }

  .fp-title {
    font-size: 24px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .fp-orb {
    animation: none !important;
  }
}
</style>
