<script setup lang="ts">
  import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
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
    Sparkles,
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
      AUTH_RATE_LIMIT_EXCEEDED: 'Zbyt wiele prób. Spróbuj ponownie za 15 minut.',
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

  async function handleOAuth(provider: 'google' | 'github') {
    try {
      const res = await auth.getOAuthUrl(provider)
      window.location.href = res.url
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Nie udało się uruchomić OAuth'
    }
  }
</script>

<template>
  <div class="lp">
    <div class="bg-orbs" aria-hidden="true">
      <div class="bg-orb bg-orb--violet" :style="{ transform: `translate(${mouse.x * 15}px, ${mouse.y * 15}px)` }"></div>
      <div class="bg-orb bg-orb--pink" :style="{ transform: `translate(${mouse.x * -10}px, ${mouse.y * -10}px)` }"></div>
      <div class="bg-orb bg-orb--blue" :style="{ transform: `translate(${mouse.x * 8}px, ${mouse.y * -12}px)` }"></div>
      <div class="bg-orb bg-orb--teal"></div>
    </div>

    <div class="auth-container">
      <!-- Feature panel (desktop) -->
      <div class="auth-features">
        <button class="back-btn desktop-back" aria-label="Strona główna" @click="goHome">
          <ArrowLeft :size="18" />
          <span>Strona główna</span>
        </button>

        <div class="features-brand">
          <img src="/icons/logo-simp.png" alt="Nicori" />
          <h1>Nicori</h1>
          <p class="features-tagline">Twoja prywatna przestrzeń<br />do rozmów</p>
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
      <div class="auth-card card glass">
        <div class="auth-card-header">
          <div class="badge badge-violet auth-badge">
            <Sparkles :size="12" />
            {{ tab === 'login' ? 'Logowanie' : 'Rejestracja' }}
          </div>
          <h2 class="auth-title">
            {{ tab === 'login' ? 'Witaj ponownie' : 'Dołącz do nas' }}
          </h2>
          <p class="auth-desc">
            {{ tab === 'login' ? 'Zaloguj się, aby kontynuować' : 'Utwórz konto i zacznij rozmawiać' }}
          </p>
        </div>

        <div class="auth-tabs">
          <button :class="{ active: tab === 'login' }" @click="switchTab('login')">
            Logowanie
          </button>
          <button :class="{ active: tab === 'register' }" @click="switchTab('register')">
            Rejestracja
          </button>
        </div>

        <form class="auth-form" novalidate @submit.prevent="submit">
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
            <label class="label" for="displayName"
            >Wyświetlana nazwa <span class="optional">(opcjonalnie)</span></label
            >
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
            <label class="label" for="email"
            >Email <span class="optional">(opcjonalnie)</span></label
            >
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
              <button
                class="pw-toggle"
                type="button"
                tabindex="-1"
                aria-label="Pokaż hasło"
                @click="showPw = !showPw"
              >
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
                <div
                  class="strength-fill"
                  :style="{ width: passwordStrength.width, background: passwordStrength.color }"
                />
              </div>
              <span class="strength-label" :style="{ color: passwordStrength.color }">
                {{ passwordStrength.label }}
              </span>
            </div>
          </div>

          <!-- Password Confirm (register only) -->
          <div
            v-if="tab === 'register'"
            class="form-group"
            :class="{ error: passwordConfirmError && submitted }"
          >
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
              <button
                class="pw-toggle"
                type="button"
                tabindex="-1"
                aria-label="Pokaż hasło"
                @click="showPwConfirm = !showPwConfirm"
              >
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
          <Transition name="fade">
            <div v-if="error" class="error-msg">
              <AlertCircle :size="14" />
              <span>{{ error }}</span>
            </div>
          </Transition>

          <!-- Remember me -->
          <div class="remember-forgot-row">
            <label class="remember-row">
              <input v-model="rememberMe" type="checkbox" class="remember-checkbox" />
              <span class="remember-label">Zapamiętaj mnie</span>
            </label>
            <button
              v-if="tab === 'login'"
              type="button"
              class="forgot-link"
              @click="router.push('/auth/forgot-password')"
            >
              Zapomniałeś hasła?
            </button>
          </div>

          <!-- Submit button -->
          <button class="btn btn-primary submit-btn" :disabled="loading" type="submit">
            <Loader2 v-if="loading" class="spin" :size="18" />
            <template v-else>
              {{ tab === 'login' ? 'Zaloguj się' : 'Utwórz konto' }}
            </template>
          </button>

          <!-- OAuth divider -->
          <div class="oauth-divider">
            <span>lub</span>
          </div>

          <!-- OAuth buttons -->
          <div class="oauth-buttons">
            <button type="button" class="oauth-btn" @click="handleOAuth('google')">
              <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
              Google
            </button>
            <button type="button" class="oauth-btn" @click="handleOAuth('github')">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
              GitHub
            </button>
          </div>

          <p class="auth-footer">
            {{ tab === 'login' ? 'Nie masz konta?' : 'Masz już konto?' }}
            <button
              type="button"
              class="link-btn"
              @click="switchTab(tab === 'login' ? 'register' : 'login')"
            >
              {{ tab === 'login' ? 'Zarejestruj się' : 'Zaloguj się' }}
            </button>
          </p>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ========== BASE (same as landing) ========== */
.lp {
  min-height: 100dvh;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  overflow-x: hidden;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ========== BG ORBS (same as landing) ========== */
.bg-orbs {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}

.bg-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  will-change: transform;
  transition: transform 0.5s ease-out;
}

.bg-orb--violet {
  width: 600px;
  height: 600px;
  top: -15%;
  right: 5%;
  background: rgba(139, 92, 246, 0.08);
}

.bg-orb--pink {
  width: 500px;
  height: 500px;
  top: 40%;
  left: -10%;
  background: rgba(217, 70, 239, 0.06);
}

.bg-orb--blue {
  width: 450px;
  height: 450px;
  top: 60%;
  right: -5%;
  background: rgba(59, 130, 246, 0.05);
}

.bg-orb--teal {
  width: 350px;
  height: 350px;
  top: 10%;
  left: 30%;
  background: rgba(6, 182, 212, 0.04);
  animation: orbDrift 20s ease-in-out infinite;
}

@keyframes orbDrift {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(40px, -30px); }
}

/* ========== CONTAINER ========== */
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

/* ========== FEATURE PANEL (Desktop) ========== */
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

/* ========== AUTH CARD ========== */
.auth-card {
  width: 100%;
  max-width: 420px;
  margin: 0 auto;
  padding: 32px;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  transition: border-color 0.2s;
  position: relative;
}

.auth-card:focus-within {
  border-color: var(--border-accent);
}

/* Badge */
.auth-badge {
  margin-bottom: 16px;
  display: inline-flex;
  align-self: center;
}

.auth-card-header {
  text-align: center;
  margin-bottom: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.auth-title {
  font-size: 28px;
  font-weight: 800;
  line-height: 1.15;
  letter-spacing: -0.02em;
  margin-bottom: 8px;
  background: linear-gradient(135deg, var(--accent-violet), var(--accent-blue), var(--accent-teal));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.auth-desc {
  font-size: 16px;
  color: var(--text-secondary);
  line-height: 1.6;
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

/* ========== BACK BUTTON ========== */
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
  border-radius: 8px;
  transition: all 0.15s;
}

.back-btn:hover {
  color: var(--text-primary);
  background: var(--bg-hover);
}

/* ========== TABS ========== */
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
  transition: all 0.2s;
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

/* ========== FORM ========== */
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
  transition: all 0.2s;
  outline: none;
  box-sizing: border-box;
}

.input:hover {
  border-color: rgba(255, 255, 255, 0.12);
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
  border-radius: 6px;
  transition: all 0.15s;
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
  transition: all 0.3s;
}

.strength-label {
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
  min-width: 90px;
  text-align: right;
  transition: color 0.3s;
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
.remember-forgot-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

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

.forgot-link {
  background: none;
  border: none;
  color: var(--accent-violet);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  padding: 0;
  transition: color 0.15s;
}

.forgot-link:hover {
  color: var(--accent-blue);
  text-decoration: underline;
}

/* OAuth */
.oauth-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--text-muted);
  font-size: 12px;
}

.oauth-divider::before,
.oauth-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border);
}

.oauth-buttons {
  display: flex;
  gap: 10px;
}

.oauth-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.oauth-btn:hover {
  border-color: var(--border-accent);
  background: var(--bg-hover);
}

/* Submit button */
.submit-btn {
  margin-top: 4px;
  width: 100%;
  padding: 12px 16px;
  font-size: 15px;
  font-weight: 600;
  border-radius: 10px;
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
  transition: color 0.15s;
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
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* ========== RESPONSIVE ========== */
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
  .auth-title {
    font-size: 24px;
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
  .auth-title {
    font-size: 20px;
  }
  .auth-tabs button {
    font-size: 12px;
    padding: 8px 12px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .bg-orb {
    animation: none !important;
  }
}
</style>
