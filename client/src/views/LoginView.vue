<script setup lang="ts">
  import { ref, computed, watch } from 'vue'
  import { useRouter } from 'vue-router'
  import {
    Eye,
    EyeOff,
    Check,
    X,
    AlertCircle,
    Loader2,
    ArrowLeft,
    MessageCircle,
    Users,
    Mic,
    Shield,
    Zap,
    Radio,
  } from 'lucide-vue-next'

  import { useAuthStore } from '@/stores/auth.store'

  const router = useRouter()
  const auth = useAuthStore()

  const tab = ref<'login' | 'register'>('login')
  const username = ref('')
  const password = ref('')
  const passwordConfirm = ref('')
  const displayName = ref('')
  const email = ref('')
  const showPw = ref(false)
  const showPwConfirm = ref(false)
  const loading = ref(false)
  const error = ref('')
  const rememberMe = ref(true)
  const touched = ref({ username: false, password: false, passwordConfirm: false })
  const submitted = ref(false)

  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
  const usernameError = computed(() => {
    if (!touched.value.username && !submitted.value) return ''
    if (!username.value) return 'Nazwa użytkownika jest wymagana'
    if (username.value.length < 3) return 'Minimum 3 znaki'
    if (username.value.length > 20) return 'Maksimum 20 znaków'
    if (!/^[a-zA-Z0-9_]/.test(username.value)) return 'Tylko litery, cyfry i podkreślenia'
    if (!/^[a-zA-Z0-9_]+$/.test(username.value)) return 'Tylko litery, cyfry i _'
    return ''
  })

  const passwordError = computed(() => {
    if (!touched.value.password && !submitted.value) return ''
    if (!password.value) return 'Hasło jest wymagane'
    if (password.value.length < 6) return 'Minimum 6 znaków'
    return ''
  })

  const passwordStrength = computed(() => {
    const pw = password.value
    if (!pw) return { score: 0, label: '', color: '', width: '0%' }

    let score = 0
    if (pw.length >= 6) score += 1
    if (pw.length >= 10) score += 1
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score += 1
    if (/\d/.test(pw)) score += 1
    if (/[^a-zA-Z0-9]/.test(pw)) score += 1

    const map = {
      0: { label: 'Bardzo słabe', color: 'var(--danger)', width: '10%' },
      1: { label: 'Słabe', color: 'var(--danger)', width: '25%' },
      2: { label: 'Średnie', color: 'var(--warning)', width: '50%' },
      3: { label: 'Dobre', color: 'var(--accent-teal)', width: '70%' },
      4: { label: 'Silne', color: 'var(--success)', width: '85%' },
      5: { label: 'Bardzo silne', color: 'var(--success)', width: '100%' },
    }

    return { score, ...map[score as keyof typeof map] }
  })

  const passwordConfirmError = computed(() => {
    if (tab.value === 'login') return ''
    if (!touched.value.passwordConfirm && !submitted.value) return ''
    if (!passwordConfirm.value && tab.value === 'register') return 'Potwierdź hasło'
    if (password.value !== passwordConfirm.value) return 'Hasła nie są zgodne'
    return ''
  })

  const isValid = computed(() => {
    const userOk = username.value && usernameRegex.test(username.value)
    const pwOk = password.value.length >= 6
    if (tab.value === 'login') return userOk && pwOk
    const pwConfirmOk = password.value === passwordConfirm.value && passwordConfirm.value.length > 0
    return userOk && pwOk && pwConfirmOk
  })

  function formatApiError(msg: string): string {
    const map: Record<string, string> = {
      'Invalid credentials': 'Nieprawidłowa nazwa użytkownika lub hasło',
      'Username already taken': 'Ta nazwa użytkownika jest już zajęta',
      'Email already in use': 'Ten email jest już używany',
      'AUTH_RATE_LIMIT_EXCEEDED': 'Zbyt wiele prób. Spróbuj ponownie za 15 minut.',
    }
    return map[msg] || msg
  }

  async function submit() {
    submitted.value = true
    if (!isValid.value) return

    error.value = ''
    loading.value = true
    try {
      if (tab.value === 'login') {
        await auth.login(username.value.trim(), password.value, rememberMe.value)
      } else {
        await auth.register(
          username.value.trim(),
          email.value.trim(),
          password.value,
          displayName.value.trim() || username.value.trim(),
          rememberMe.value
        )
      }
      router.push('/app')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Wystąpił błąd'
      error.value = formatApiError(msg)
    } finally {
      loading.value = false
    }
  }

  function switchTab(newTab: 'login' | 'register') {
    tab.value = newTab
    error.value = ''
    submitted.value = false
    touched.value = { username: false, password: false, passwordConfirm: false }
  }

  watch(tab, () => {
    error.value = ''
  })

  const features = [
    { icon: Mic, label: 'Pokoje głosowe z dźwiękiem 3D' },
    { icon: MessageCircle, label: 'Czat z Markdown i embedami' },
    { icon: Users, label: 'System znajomych i DM' },
    { icon: Radio, label: 'Streaming ekranu' },
    { icon: Shield, label: 'Open source (MIT)' },
    { icon: Zap, label: 'WebRTC peer-to-peer' },
  ]

  function goHome() {
    router.push('/')
  }
</script>

<template>
  <div class="auth-page">
    <div class="particle-bg">
      <div v-for="i in 24" :key="i" class="particle" :style="{
        '--x': `${Math.random() * 100}%`,
        '--y': `${Math.random() * 100}%`,
        '--s': `${Math.random() * 3 + 1}px`,
        '--d': `${Math.random() * 8 + 4}s`,
        '--delay': `${Math.random() * 5}s`,
        '--o': `${Math.random() * 0.3 + 0.05}`,
      }" />
    </div>
    <div class="auth-bg" />

    <div class="auth-container">
      <!-- Brand header (mobile) -->
      <div class="auth-header-mobile">
        <button class="back-btn" @click="goHome" aria-label="Strona główna">
          <ArrowLeft :size="18" />
        </button>
        <div class="auth-logo">
          <img src="/icons/logo.png" alt="AetherPulse" />
          <span>AetherPulse</span>
        </div>
      </div>

      <!-- Feature panel (desktop) -->
      <div class="auth-features">
        <button class="back-btn desktop-back" @click="goHome" aria-label="Strona główna">
          <ArrowLeft :size="18" />
          <span>Strona główna</span>
        </button>

        <div class="features-brand">
          <img src="/icons/logo.png" alt="AetherPulse" />
          <h1>AetherPulse</h1>
          <p class="features-tagline">Twoja prywatna przestrzeń<br>do rozmów</p>
        </div>

        <div class="features-list">
          <div v-for="f in features" :key="f.label" class="feature-row">
            <div class="feature-icon">
              <component :is="f.icon" :size="16" />
            </div>
            <span>{{ f.label }}</span>
          </div>
        </div>

        <div class="features-stats">
          <div class="stat">
            <strong>100%</strong>
            <span>Open source</span>
          </div>
          <div class="stat">
            <strong>Darmowe</strong>
            <span>Bez limitów</span>
          </div>
        </div>
      </div>

      <!-- Auth card -->
      <div class="auth-card">
        <div class="auth-card-header">
          <h2>{{ tab === 'login' ? 'Witaj ponownie' : 'Dołącz do nas' }}</h2>
          <p>{{ tab === 'login' ? 'Zaloguj się, aby kontynuować' : 'Utwórz konto i zacznij rozmawiać' }}</p>
        </div>

        <div class="auth-tabs">
          <button
            :class="{ active: tab === 'login' }"
            @click="switchTab('login')"
          >
            Logowanie
          </button>
          <button
            :class="{ active: tab === 'register' }"
            @click="switchTab('register')"
          >
            Rejestracja
          </button>
        </div>

        <form class="auth-form" @submit.prevent="submit" novalidate>
          <!-- Username -->
          <div class="form-group" :class="{ error: usernameError && submitted }">
            <label class="label" for="username">Nazwa użytkownika</label>
            <div class="input-wrap">
              <input
                id="username"
                v-model="username"
                class="input"
                type="text"
                placeholder="np. janek123"
                autocomplete="username"
                spellcheck="false"
                maxlength="20"
                @input="touched.username = true"
                @keydown.enter="submit"
              />
              <span v-if="username && !usernameError" class="input-icon valid">
                <Check :size="14" />
              </span>
              <span v-if="usernameError && submitted" class="input-icon invalid">
                <X :size="14" />
              </span>
            </div>
            <p v-if="usernameError && submitted" class="field-error">
              <AlertCircle :size="12" />
              {{ usernameError }}
            </p>
          </div>

          <!-- Display Name (register only) -->
          <div v-if="tab === 'register'" class="form-group">
            <label class="label" for="displayName">Wyświetlana nazwa <span class="optional">(opcjonalnie)</span></label>
            <div class="input-wrap">
              <input
                id="displayName"
                v-model="displayName"
                class="input"
                type="text"
                placeholder="Twój pseudonim"
                maxlength="32"
                @keydown.enter="submit"
              />
            </div>
          </div>

          <!-- Email (register only) -->
          <div v-if="tab === 'register'" class="form-group">
            <label class="label" for="email">Email <span class="optional">(opcjonalnie)</span></label>
            <div class="input-wrap">
              <input
                id="email"
                v-model="email"
                class="input"
                type="email"
                placeholder="twoj@email.com"
                autocomplete="email"
                @keydown.enter="submit"
              />
            </div>
          </div>

          <!-- Password -->
          <div class="form-group" :class="{ error: passwordError && submitted }">
            <label class="label" for="password">Hasło</label>
            <div class="pw-wrap">
              <input
                id="password"
                v-model="password"
                class="input"
                :type="showPw ? 'text' : 'password'"
                placeholder="Minimum 6 znaków"
                autocomplete="current-password"
                maxlength="128"
                @input="touched.password = true"
                @keydown.enter="submit"
              />
              <button class="pw-toggle" type="button" @click="showPw = !showPw" tabindex="-1" aria-label="Pokaż hasło">
                <EyeOff v-if="showPw" :size="16" />
                <Eye v-else :size="16" />
              </button>
            </div>
            <p v-if="passwordError && submitted" class="field-error">
              <AlertCircle :size="12" />
              {{ passwordError }}
            </p>

            <!-- Password strength (register only) -->
            <div v-if="tab === 'register' && password" class="strength-meter">
              <div class="strength-bar">
                <div class="strength-fill" :style="{ width: passwordStrength.width, background: passwordStrength.color }" />
              </div>
              <span class="strength-label" :style="{ color: passwordStrength.color }">
                {{ passwordStrength.label }}
              </span>
            </div>
          </div>

          <!-- Password Confirm (register only) -->
          <div v-if="tab === 'register'" class="form-group" :class="{ error: passwordConfirmError && submitted }">
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
                @input="touched.passwordConfirm = true"
                @keydown.enter="submit"
              />
              <button class="pw-toggle" type="button" @click="showPwConfirm = !showPwConfirm" tabindex="-1" aria-label="Pokaż hasło">
                <EyeOff v-if="showPwConfirm" :size="16" />
                <Eye v-else :size="16" />
              </button>
            </div>
            <p v-if="passwordConfirmError && submitted" class="field-error">
              <AlertCircle :size="12" />
              {{ passwordConfirmError }}
            </p>
          </div>

          <!-- Global error -->
          <transition name="fade">
            <div v-if="error" class="error-msg">
              <AlertCircle :size="14" />
              <span>{{ error }}</span>
            </div>
          </transition>

          <!-- Remember me -->
          <label class="remember-row">
            <input v-model="rememberMe" type="checkbox" class="remember-checkbox" />
            <span class="remember-label">Zapamiętaj mnie</span>
          </label>

          <!-- Submit button -->
          <button
            class="btn-primary submit-btn"
            :disabled="loading"
            type="submit"
          >
            <Loader2 v-if="loading" class="spin" :size="18" />
            <template v-else>
              {{ tab === 'login' ? 'Zaloguj się' : 'Utwórz konto' }}
            </template>
          </button>

          <p class="auth-footer">
            {{ tab === 'login' ? 'Nie masz konta?' : 'Masz już konto?' }}
            <button type="button" class="link-btn" @click="switchTab(tab === 'login' ? 'register' : 'login')">
              {{ tab === 'login' ? 'Zarejestruj się' : 'Zaloguj się' }}
            </button>
          </p>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ==========================================================================
   AUTH PAGE – Login / Register
   ========================================================================== */

.auth-page {
  --border-hover: rgba(255, 255, 255, 0.12);
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  background: var(--bg-primary);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Background gradient */
.auth-bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 70% 50% at 20% 30%, rgba(139, 92, 246, 0.10) 0%, transparent 70%),
    radial-gradient(ellipse 50% 50% at 80% 70%, rgba(59, 130, 246, 0.07) 0%, transparent 70%),
    radial-gradient(ellipse 40% 40% at 50% 50%, rgba(6, 182, 212, 0.04) 0%, transparent 70%);
  pointer-events: none;
  z-index: 0;
}

/* ==========================================================================
   Particles
   ========================================================================== */

.particle-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}

.particle {
  position: absolute;
  left: var(--x);
  top: var(--y);
  width: var(--s);
  height: var(--s);
  border-radius: 50%;
  background: var(--accent-violet);
  opacity: var(--o);
  animation: particle-float var(--d) ease-in-out infinite;
  animation-delay: var(--delay);
}

@keyframes particle-float {
  0%, 100% {
    transform: translateY(0) scale(1);
    opacity: var(--o);
  }
  50% {
    transform: translateY(-40px) scale(1.2);
    opacity: calc(var(--o) + 0.1);
  }
}

/* ==========================================================================
   Container
   ========================================================================== */

.auth-container {
  display: flex;
  align-items: stretch;
  gap: 0;
  width: 100%;
  max-width: 900px;
  padding: 24px;
  position: relative;
  z-index: 1;
  margin: 0 auto;
}

/* ==========================================================================
   Feature Panel (Desktop)
   ========================================================================== */

.auth-features {
  display: none;
  flex: 1;
  flex-direction: column;
  justify-content: center;
  gap: 36px;
  padding: 48px 48px 48px 0;
}

.desktop-back {
  display: flex !important;
  margin-bottom: auto;
}

.features-brand {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
}

.features-brand img {
  width: 52px;
  height: 52px;
  object-fit: contain;
}

.features-brand h1 {
  font-size: 32px;
  font-weight: 800;
  background: linear-gradient(135deg, var(--accent-violet), var(--accent-blue));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1.1;
}

.features-tagline {
  font-size: 16px;
  color: var(--text-muted);
  line-height: 1.5;
}

.features-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.feature-row {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: var(--text-secondary);
}

.feature-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(139, 92, 246, 0.12);
  border-radius: 8px;
  color: var(--accent-violet);
  flex-shrink: 0;
}

.features-stats {
  display: flex;
  gap: 24px;
  padding-top: 8px;
  border-top: 1px solid var(--border);
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat strong {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
}

.stat span {
  font-size: 12px;
  color: var(--text-muted);
}

/* ==========================================================================
   Auth Card
   ========================================================================== */

.auth-card {
  width: 100%;
  max-width: 420px;
  margin: 0 auto;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 32px;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.3);
  transition: border-color 0.2s ease;
  position: relative;
}

.auth-card:focus-within {
  border-color: var(--border-accent);
}

.auth-card-header {
  text-align: center;
  margin-bottom: 24px;
}

.auth-card-header h2 {
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 6px;
  color: var(--text-primary);
}

.auth-card-header p {
  font-size: 14px;
  color: var(--text-muted);
}

/* Mobile header */
.auth-header-mobile {
  display: none;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  width: 100%;
  max-width: 420px;
}

.auth-header-mobile .auth-logo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
}

.auth-header-mobile .auth-logo img {
  width: 28px;
  height: 28px;
  object-fit: contain;
}

/* ==========================================================================
   Back Button
   ========================================================================== */

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 13px;
  cursor: pointer;
  padding: 6px 8px;
  border-radius: 6px;
  transition: all 0.15s ease;
}

.back-btn:hover {
  color: var(--text-primary);
  background: var(--bg-hover);
}

/* ==========================================================================
   Tabs
   ========================================================================== */

.auth-tabs {
  display: flex;
  background: var(--bg-hover);
  border-radius: 10px;
  padding: 4px;
  margin-bottom: 24px;
}

.auth-tabs button {
  flex: 1;
  padding: 9px 16px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 500;
  border-radius: 7px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.auth-tabs button.active {
  background: var(--bg-surface-2);
  color: var(--text-primary);
  font-weight: 600;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
}

.auth-tabs button:not(.active):hover {
  color: var(--text-secondary);
}

/* ==========================================================================
   Form
   ========================================================================== */

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

.label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.optional {
  font-weight: 400;
  text-transform: none;
  color: var(--text-muted);
  font-size: 11px;
  letter-spacing: 0;
}

.input-wrap {
  position: relative;
}

.input-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  pointer-events: none;
}

.input-icon.valid {
  color: var(--success);
}

.input-icon.invalid {
  color: var(--danger);
}

/* Inputs */
.input {
  width: 100%;
  padding: 11px 14px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 10px;
  color: var(--text-primary);
  font-size: 14px;
  transition: all 0.2s ease;
  outline: none;
  box-sizing: border-box;
}

.input:hover {
  border-color: var(--border-hover);
}

.input:focus {
  border-color: var(--accent-violet);
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.12);
}

.input::placeholder {
  color: var(--text-muted);
  font-size: 13px;
}

.form-group.error .input {
  border-color: var(--danger);
}

.form-group.error .input:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.12);
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
  border-radius: 4px;
  transition: all 0.15s ease;
}

.pw-toggle:hover {
  color: var(--text-primary);
  background: var(--bg-hover);
}

/* Password strength */
.strength-meter {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 4px;
}

.strength-bar {
  flex: 1;
  height: 4px;
  background: var(--bg-hover);
  border-radius: 4px;
  overflow: hidden;
}

.strength-fill {
  height: 100%;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.strength-label {
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
  min-width: 90px;
  text-align: right;
  transition: color 0.3s ease;
}

/* Field error */
.field-error {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--danger);
  margin: 0;
  line-height: 1.3;
}

/* Global error */
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
  line-height: 1.4;
}

/* Remember me */
.remember-row {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
  padding: 2px 0;
}
.remember-checkbox {
  width: 16px;
  height: 16px;
  accent-color: var(--accent-violet);
  cursor: pointer;
}
.remember-label {
  font-size: 13px;
  color: var(--text-secondary);
}

/* Submit button */
.submit-btn {
  margin-top: 4px;
  width: 100%;
  padding: 12px 16px;
  font-size: 15px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: linear-gradient(135deg, var(--accent-violet), var(--accent-blue));
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 14px rgba(139, 92, 246, 0.35);
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(139, 92, 246, 0.45);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* Footer link */
.auth-footer {
  text-align: center;
  font-size: 13px;
  color: var(--text-muted);
  margin: 0;
}

.link-btn {
  background: none;
  border: none;
  color: var(--accent-violet);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  margin-left: 4px;
  transition: color 0.15s ease;
}

.link-btn:hover {
  color: var(--accent-blue);
  text-decoration: underline;
}

/* Loader animation */
.spin {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Transition */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* ==========================================================================
   Responsive
   ========================================================================== */

@media (min-width: 768px) {
  .auth-features {
    display: flex;
  }
  .auth-header-mobile {
    display: none;
  }
  .auth-container {
    gap: 0;
  }
  .auth-card {
    margin: 0;
  }
}

@media (max-width: 767px) {
  .auth-container {
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    min-height: 100dvh;
    padding: 16px;
  }
  .auth-header-mobile {
    display: flex;
  }
  .auth-features {
    display: none;
  }
  .auth-card {
    max-width: 100%;
    padding: 24px 20px;
    box-shadow: none;
    border-radius: 16px;
  }
  .auth-card-header h2 {
    font-size: 20px;
  }
}

@media (max-width: 400px) {
  .auth-card {
    padding: 20px 16px;
    border-radius: 14px;
  }
  .auth-card-header {
    margin-bottom: 20px;
  }
  .auth-card-header h2 {
    font-size: 18px;
  }
  .auth-tabs button {
    font-size: 12px;
    padding: 8px 12px;
  }
}
</style>
