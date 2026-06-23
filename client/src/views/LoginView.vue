<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Eye, EyeOff } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth.store'

const router = useRouter()
const auth = useAuthStore()
const tab = ref<'login' | 'register'>('login')
const username = ref('')
const password = ref('')
const displayName = ref('')
const showPw = ref(false)
const loading = ref(false)
const error = ref('')

async function submit() {
  error.value = ''
  loading.value = true
  try {
    if (tab.value === 'login') {
      await auth.login(username.value, password.value)
    } else {
      await auth.register(username.value, password.value, displayName.value || username.value)
    }
    router.push('/app')
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Something went wrong'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-bg" />
    <div class="auth-container">
      <div class="auth-logo">
        <img src="/icons/logo.png" alt="AetherPulse" />
        <h1>AetherPulse</h1>
        <p>Your private digital space</p>
      </div>

      <div class="auth-card">
        <div class="auth-tabs">
          <button :class="{ active: tab === 'login' }" @click="tab = 'login'">Log In</button>
          <button :class="{ active: tab === 'register' }" @click="tab = 'register'">
            Register
          </button>
        </div>

        <div class="auth-form">
          <div class="form-group">
            <label class="label">Username</label>
            <input
              v-model="username"
              class="input"
              type="text"
              placeholder="Enter your username"
              @keydown.enter="submit"
              autocomplete="username"
            />
          </div>

          <div v-if="tab === 'register'" class="form-group">
            <label class="label">Display Name</label>
            <input
              v-model="displayName"
              class="input"
              type="text"
              placeholder="Your name (optional)"
              @keydown.enter="submit"
            />
          </div>

          <div class="form-group">
            <label class="label">Password</label>
            <div class="pw-wrap">
              <input
                v-model="password"
                class="input"
                :type="showPw ? 'text' : 'password'"
                placeholder="Enter your password"
                @keydown.enter="submit"
                autocomplete="current-password"
              />
              <button class="pw-toggle" @click="showPw = !showPw" type="button">
                <EyeOff v-if="showPw" :size="16" />
                <Eye v-else :size="16" />
              </button>
            </div>
          </div>

          <p v-if="error" class="error-msg">{{ error }}</p>

          <button
            class="btn-primary submit-btn"
            :disabled="loading || !username || !password"
            @click="submit"
          >
            <span v-if="loading" class="pulse">Loading...</span>
            <span v-else>{{ tab === 'login' ? 'Enter Workspace' : 'Create Account' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  background: var(--bg-primary);
}
.auth-bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 60% 50% at 30% 40%, rgba(139, 92, 246, 0.12) 0%, transparent 70%),
    radial-gradient(ellipse 50% 40% at 70% 60%, rgba(59, 130, 246, 0.08) 0%, transparent 70%);
  pointer-events: none;
}
.auth-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32px;
  width: 100%;
  max-width: 420px;
  padding: 24px;
  position: relative;
  z-index: 1;
}
.auth-logo {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.auth-logo img {
  width: 52px;
  height: 52px;
  object-fit: contain;
}
.auth-logo h1 {
  font-size: 28px;
  font-weight: 800;
  background: linear-gradient(135deg, var(--accent-violet), var(--accent-blue));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.auth-logo p {
  font-size: 14px;
  color: var(--text-muted);
}
.auth-card {
  width: 100%;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 28px;
  backdrop-filter: blur(10px);
}
.auth-tabs {
  display: flex;
  background: var(--bg-hover);
  border-radius: 10px;
  padding: 4px;
  margin-bottom: 24px;
}
.auth-tabs button {
  flex: 1;
  padding: 8px 16px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-size: 14px;
  font-weight: 500;
  border-radius: 7px;
  cursor: pointer;
  transition: all 0.15s;
}
.auth-tabs button.active {
  background: var(--bg-surface-2);
  color: var(--text-primary);
  font-weight: 600;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
}
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.pw-wrap {
  position: relative;
}
.pw-wrap .input {
  padding-right: 44px;
}
.pw-toggle {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 4px;
}
.pw-toggle:hover {
  color: var(--text-primary);
}
.error-msg {
  font-size: 13px;
  color: var(--danger);
  padding: 8px 12px;
  background: rgba(239, 68, 68, 0.1);
  border-radius: 8px;
  border: 1px solid rgba(239, 68, 68, 0.2);
}
.submit-btn {
  margin-top: 8px;
  width: 100%;
  padding: 12px;
  font-size: 15px;
}
</style>
