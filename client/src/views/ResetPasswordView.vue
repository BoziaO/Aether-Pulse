<script setup lang="ts">
  import { ref, onMounted, onUnmounted } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { ArrowLeft, Eye, EyeOff, Loader2, CheckCircle, Sparkles, AlertCircle } from 'lucide-vue-next'

  import { useAuthStore } from '@/stores/auth.store'

  const route = useRoute()
  const router = useRouter()
  const auth = useAuthStore()
  const password = ref('')
  const passwordConfirm = ref('')
  const showPw = ref(false)
  const showPwConfirm = ref(false)
  const loading = ref(false)
  const done = ref(false)
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

  const token = route.params.token as string

  async function submit() {
    if (password.value.length < 6) {
      error.value = 'Hasło musi mieć minimum 6 znaków'
      return
    }
    if (password.value !== passwordConfirm.value) {
      error.value = 'Hasła nie są zgodne'
      return
    }
    error.value = ''
    loading.value = true
    try {
      await auth.resetPassword(token, password.value)
      done.value = true
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Wystąpił błąd'
    } finally {
      loading.value = false
    }
  }
</script>

<template>
  <div class="rp-page">
    <div class="rp-bg-orbs" aria-hidden="true">
      <div class="rp-orb rp-orb--violet" :style="{ transform: `translate(${mouse.x * 15}px, ${mouse.y * 15}px)` }"></div>
      <div class="rp-orb rp-orb--pink" :style="{ transform: `translate(${mouse.x * -10}px, ${mouse.y * -10}px)` }"></div>
      <div class="rp-orb rp-orb--blue" :style="{ transform: `translate(${mouse.x * 8}px, ${mouse.y * -12}px)` }"></div>
      <div class="rp-orb rp-orb--teal"></div>
    </div>

    <div class="rp-container">
      <div class="rp-card card glass">
        <div class="rp-card-header">
          <div class="badge badge-violet rp-badge">
            <Sparkles :size="12" />
            Nowe hasło
          </div>
          <h1 class="rp-title">Ustaw nowe hasło</h1>
          <p class="rp-desc">Wprowadź nowe hasło dla swojego konta.</p>
        </div>

        <template v-if="!done">
          <form class="rp-form" @submit.prevent="submit">
            <div class="form-group">
              <label class="label" for="password">Nowe hasło</label>
              <div class="pw-wrap">
                <input
                  id="password"
                  v-model="password"
                  class="input"
                  :type="showPw ? 'text' : 'password'"
                  placeholder="Minimum 6 znaków"
                  autocomplete="new-password"
                  maxlength="128"
                  autofocus
                  @keydown.enter="submit"
                />
                <button class="pw-toggle" type="button" tabindex="-1" @click="showPw = !showPw">
                  <EyeOff v-if="showPw" :size="16" />
                  <Eye v-else :size="16" />
                </button>
              </div>
            </div>

            <div class="form-group">
              <label class="label" for="passwordConfirm">Potwierdź hasło</label>
              <div class="pw-wrap">
                <input
                  id="passwordConfirm"
                  v-model="passwordConfirm"
                  class="input"
                  :type="showPwConfirm ? 'text' : 'password'"
                  placeholder="Wpisz hasło ponownie"
                  autocomplete="new-password"
                  maxlength="128"
                  @keydown.enter="submit"
                />
                <button class="pw-toggle" type="button" tabindex="-1" @click="showPwConfirm = !showPwConfirm">
                  <EyeOff v-if="showPwConfirm" :size="16" />
                  <Eye v-else :size="16" />
                </button>
              </div>
            </div>

            <p v-if="error" class="error-msg">
              <AlertCircle :size="14" />
              {{ error }}
            </p>

            <button class="btn btn-primary rp-btn" :disabled="loading" type="submit">
              <Loader2 v-if="loading" class="spin" :size="18" />
              <template v-else>Ustaw nowe hasło</template>
            </button>
          </form>
        </template>

        <template v-else>
          <div class="rp-success">
            <div class="rp-success-icon">
              <CheckCircle :size="48" />
            </div>
            <h2>Hasło zmienione</h2>
            <p>Twoje hasło zostało pomyślnie zmienione. Możesz się teraz zalogować.</p>
            <button class="btn btn-primary rp-btn" @click="router.push('/auth')">
              Zaloguj się
            </button>
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
.rp-page {
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

.rp-bg-orbs {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}

.rp-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  will-change: transform;
  transition: transform 0.5s ease-out;
}

.rp-orb--violet {
  width: 600px;
  height: 600px;
  top: -15%;
  right: 5%;
  background: rgba(139, 92, 246, 0.08);
}

.rp-orb--pink {
  width: 500px;
  height: 500px;
  top: 40%;
  left: -10%;
  background: rgba(217, 70, 239, 0.06);
}

.rp-orb--blue {
  width: 450px;
  height: 450px;
  top: 60%;
  right: -5%;
  background: rgba(59, 130, 246, 0.05);
}

.rp-orb--teal {
  width: 350px;
  height: 350px;
  top: 10%;
  left: 30%;
  background: rgba(6, 182, 212, 0.04);
  animation: rpOrbDrift 20s ease-in-out infinite;
}

@keyframes rpOrbDrift {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(40px, -30px); }
}

.rp-container {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 420px;
  padding: 24px;
}

.rp-card {
  padding: 32px;
}

.rp-card-header {
  text-align: center;
  margin-bottom: 24px;
}

.rp-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 16px;
}

.rp-title {
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

.rp-desc {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0;
}

.rp-form {
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

.pw-wrap {
  position: relative;
}

.pw-wrap .input {
  padding-right: 44px;
}

.pw-toggle {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 6px;
  border-radius: 6px;
  transition: all 0.15s;
}

.pw-toggle:hover {
  color: var(--text-primary);
  background: var(--bg-hover);
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

.rp-btn {
  width: 100%;
  padding: 12px 16px;
  font-size: 15px;
  font-weight: 600;
}

.rp-success {
  text-align: center;
  padding: 24px 0;
}

.rp-success-icon {
  color: var(--success);
  margin-bottom: 16px;
}

.rp-success h2 {
  font-size: 20px;
  font-weight: 700;
  margin: 0 0 8px;
}

.rp-success p {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.5;
  margin: 0 0 16px;
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
  .rp-card {
    padding: 24px 20px;
    border-radius: 16px;
  }

  .rp-title {
    font-size: 24px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .rp-orb {
    animation: none !important;
  }
}
</style>
