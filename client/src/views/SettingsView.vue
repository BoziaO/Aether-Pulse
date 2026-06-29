<script setup lang="ts">
  import { ref, computed, onMounted, onUnmounted } from 'vue'
  import {
    Headphones,
    Mic,
    Shield,
    Bell,
    Palette,
    Languages,
    Accessibility,
    Terminal,
    User,
    Lock,
    Check,
    AlertCircle,
    Loader2,
    Sparkles,
  } from 'lucide-vue-next'

  import { useSettingsStore } from '@/stores/settings.store'
  import { THEME_MODES, CHAT_LAYOUT_PRESETS, LOCALES, FONT_SIZES } from '@/types/settings.types'
  import { useAuthStore } from '@/stores/auth.store'
  import { authApi } from '@/services/api/auth.api'
  import { requestNotificationPermission } from '@/utils/notifications'

  const settings = useSettingsStore()
  const auth = useAuthStore()
  const activeSection = ref('voice')
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

  const pwCurrent = ref('')
  const pwNew = ref('')
  const pwConfirm = ref('')
  const pwLoading = ref(false)
  const pwError = ref('')
  const pwSuccess = ref(false)

  async function changePassword() {
    pwError.value = ''
    pwSuccess.value = false

    if (!pwCurrent.value) {
      pwError.value = 'Podaj obecne hasło'
      return
    }
    if (!pwNew.value) {
      pwError.value = 'Podaj nowe hasło'
      return
    }
    if (pwNew.value.length < 6) {
      pwError.value = 'Nowe hasło musi mieć minimum 6 znaków'
      return
    }
    if (pwNew.value !== pwConfirm.value) {
      pwError.value = 'Nowe hasła nie są zgodne'
      return
    }

    pwLoading.value = true
    try {
      await authApi.changePassword(pwCurrent.value, pwNew.value)
      pwSuccess.value = true
      pwCurrent.value = ''
      pwNew.value = ''
      pwConfirm.value = ''
    } catch (e: unknown) {
      pwError.value = e instanceof Error ? e.message : 'Nie udało się zmienić hasła'
    } finally {
      pwLoading.value = false
    }
  }

  async function onNotificationsToggle() {
    if (settings.messageNotifications) {
      const granted = await requestNotificationPermission()
      if (!granted) settings.messageNotifications = false
    }
  }

  const sections = [
    { id: 'voice', label: 'Voice & Video', icon: Mic },
    { id: 'audio', label: 'Audio', icon: Headphones },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'account', label: 'Account', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'language', label: 'Language', icon: Languages },
    { id: 'accessibility', label: 'Accessibility', icon: Accessibility },
    { id: 'developer', label: 'Developer', icon: Terminal },
  ]

  const soundstages = [
    { id: 'alternating', name: 'Alternating', desc: 'Left & Right' },
    { id: 'left', name: 'Left only', desc: 'All on the left' },
    { id: 'right', name: 'Right only', desc: 'All on the right' },
    { id: 'center', name: 'Center focus', desc: 'Spread around center' },
  ] as const

  const userAgent = navigator.userAgent
  const localStorageKeysCount = Object.keys(localStorage).length
  const sessionStorageKeysCount = Object.keys(sessionStorage).length
  const buildMode = import.meta.env.MODE

  const simulatedCallers = computed(() => {
    const mode = settings.spatialAudioDirectionMode
    const spreadAngle = settings.spatialAudioSpreadAngle
    const distance = settings.spatialAudioDistance

    const radiusPx = 30 + ((distance - 1) / 14) * 55

    return [0, 1, 2].map((index) => {
      let angleRad = 0
      if (mode === 'center') {
        if (index > 0) {
          const step = Math.ceil(index / 2)
          const sign = index % 2 === 1 ? -1 : 1
          angleRad = step * ((spreadAngle * Math.PI) / 180) * sign
        }
      } else if (mode === 'alternating') {
        if (index % 2 === 0) {
          const k = index / 2
          angleRad = -Math.PI / 2 + k * ((spreadAngle * Math.PI) / 180)
        } else {
          const k = (index - 1) / 2
          angleRad = Math.PI / 2 - k * ((spreadAngle * Math.PI) / 180)
        }
      } else if (mode === 'left') {
        angleRad = -Math.PI / 2 + index * ((spreadAngle * Math.PI) / 180)
      } else if (mode === 'right') {
        angleRad = Math.PI / 2 - index * ((spreadAngle * Math.PI) / 180)
      }

      const x = 100 + Math.sin(angleRad) * radiusPx
      const y = 100 - Math.cos(angleRad) * radiusPx

      return {
        id: index,
        label: `Call ${String.fromCharCode(65 + index)}`,
        style: {
          left: `${x}px`,
          top: `${y}px`,
        },
      }
    })
  })
</script>

<template>
  <div class="settings-view">
    <div class="settings-bg-orbs" aria-hidden="true">
      <div class="settings-orb settings-orb--violet" :style="{ transform: `translate(${mouse.x * 15}px, ${mouse.y * 15}px)` }"></div>
      <div class="settings-orb settings-orb--pink" :style="{ transform: `translate(${mouse.x * -10}px, ${mouse.y * -10}px)` }"></div>
      <div class="settings-orb settings-orb--blue" :style="{ transform: `translate(${mouse.x * 8}px, ${mouse.y * -12}px)` }"></div>
      <div class="settings-orb settings-orb--teal"></div>
    </div>

    <div class="settings-nav" role="tablist" aria-label="Settings sections">
      <div class="nav-label">
        <div class="badge badge-violet settings-badge">
          <Sparkles :size="12" />
          Ustawienia
        </div>
      </div>
      <button
        v-for="s in sections"
        :key="s.id"
        class="nav-item"
        role="tab"
        :class="{ active: activeSection === s.id }"
        :aria-selected="activeSection === s.id"
        @click="activeSection = s.id"
      >
        <component :is="s.icon" :size="16" />
        {{ s.label }}
      </button>
    </div>

    <div class="settings-content">
      <template v-if="activeSection === 'voice'">
        <div class="settings-section">
          <h2>Voice & Video</h2>

          <div class="setting-item card glass">
            <div class="setting-info">
              <div class="setting-title">Noise Suppression</div>
              <div class="setting-desc">Reduce background noise during calls</div>
            </div>
            <label class="toggle">
              <input v-model="settings.noiseSuppressionEnabled" type="checkbox" />
              <span class="toggle-slider" />
            </label>
          </div>

          <div class="setting-item card glass">
            <div class="setting-info">
              <div class="setting-title">Input Volume</div>
              <div class="setting-desc">Microphone sensitivity</div>
            </div>
            <div class="slider-wrap">
              <input
                v-model.number="settings.inputVolume"
                type="range"
                min="0"
                max="200"
                class="range"
              />
              <span class="slider-val">{{ settings.inputVolume }}%</span>
            </div>
          </div>

          <div class="setting-item card glass">
            <div class="setting-info">
              <div class="setting-title">Output Volume</div>
              <div class="setting-desc">Speaker volume for calls</div>
            </div>
            <div class="slider-wrap">
              <input
                v-model.number="settings.outputVolume"
                type="range"
                min="0"
                max="200"
                class="range"
              />
              <span class="slider-val">{{ settings.outputVolume }}%</span>
            </div>
          </div>
        </div>
      </template>

      <template v-if="activeSection === 'audio'">
        <div class="settings-section">
          <h2>Spatial Audio</h2>

          <div class="setting-item card glass highlight">
            <div class="setting-info">
              <div class="setting-title">🔊 Spatial Audio (HRTF)</div>
              <div class="setting-desc">
                Uses Head-Related Transfer Function to position other participants' voices in 3D
                space, creating an immersive acoustic experience.
              </div>
            </div>
            <label class="toggle">
              <input
                type="checkbox"
                :checked="settings.spatialAudioEnabled"
                @change="settings.toggleSpatialAudio()"
              />
              <span class="toggle-slider" />
            </label>
          </div>

          <div v-if="settings.spatialAudioEnabled" class="spatial-info-container">
            <div class="setting-item card glass">
              <div class="setting-info">
                <div class="setting-title">Distance Radius</div>
                <div class="setting-desc">Virtual space size between you and callers (1–15m)</div>
              </div>
              <div class="slider-wrap">
                <input
                  v-model.number="settings.spatialAudioDistance"
                  type="range"
                  min="1"
                  max="15"
                  class="range"
                />
                <span class="slider-val">{{ settings.spatialAudioDistance }}m</span>
              </div>
            </div>

            <div class="setting-item card glass">
              <div class="setting-info">
                <div class="setting-title">Separation Angle</div>
                <div class="setting-desc">Angle between adjacent callers (15°–90°)</div>
              </div>
              <div class="slider-wrap">
                <input
                  v-model.number="settings.spatialAudioSpreadAngle"
                  type="range"
                  min="15"
                  max="90"
                  class="range"
                />
                <span class="slider-val">{{ settings.spatialAudioSpreadAngle }}°</span>
              </div>
            </div>

            <div class="soundstage-selection card glass">
              <div class="setting-title" style="margin-bottom: 8px">Soundstage Direction Mode</div>
              <div class="soundstage-grid">
                <button
                  v-for="mode in soundstages"
                  :key="mode.id"
                  class="soundstage-card"
                  :class="{ active: settings.spatialAudioDirectionMode === mode.id }"
                  @click="settings.spatialAudioDirectionMode = mode.id"
                >
                  <div class="soundstage-name">{{ mode.name }}</div>
                  <div class="soundstage-desc">{{ mode.desc }}</div>
                </button>
              </div>
            </div>

            <div class="spatial-demo-premium card glass">
              <div class="spatial-label">Acoustic Layout Visualization</div>
              <div class="spatial-visual-box">
                <div class="spatial-center-you">
                  <div class="pulse-ring"></div>
                  <span>You</span>
                </div>
                <div
                  v-for="caller in simulatedCallers"
                  :key="caller.id"
                  class="spatial-caller-dot"
                  :style="caller.style"
                >
                  <div class="caller-inner">{{ caller.label }}</div>
                </div>
              </div>
              <p class="spatial-hint-premium">
                Drag the sliders above to see callers dynamically reposition.
              </p>
            </div>
          </div>
        </div>
      </template>

      <template v-if="activeSection === 'appearance'">
        <div class="settings-section">
          <h2>Appearance</h2>

          <div class="setting-item card glass">
            <div class="setting-info">
              <div class="setting-title">Theme mode</div>
              <div class="setting-desc">Light, dark, or follow your operating system</div>
            </div>
          </div>

          <div class="themes-grid">
            <button
              v-for="themeOption in THEME_MODES"
              :key="themeOption.id"
              class="theme-card card glass"
              :class="{ active: settings.theme === themeOption.id }"
              :title="themeOption.description"
              @click="settings.setTheme(themeOption.id)"
            >
              <div class="theme-preview">
                <div
                  v-for="(color, idx) in themeOption.colors"
                  :key="idx"
                  class="color-swatch"
                  :style="{ backgroundColor: color }"
                />
              </div>
              <span class="theme-name">{{ themeOption.name }}</span>
              <span class="theme-detail">{{ themeOption.description }}</span>
            </button>
          </div>

          <div class="setting-item card glass">
            <div class="setting-info">
              <div class="setting-title">Compact chat mode</div>
              <div class="setting-desc">Reduce message spacing and composer padding</div>
            </div>
            <label class="toggle">
              <input v-model="settings.compactChatMode" type="checkbox" />
              <span class="toggle-slider" />
            </label>
          </div>

          <div class="setting-item card glass">
            <div class="setting-info">
              <div class="setting-title">Chat layout preset</div>
              <div class="setting-desc">
                Pick how messages are presented in rooms and direct messages
              </div>
            </div>
          </div>

          <div class="layouts-grid">
            <button
              v-for="layoutOption in CHAT_LAYOUT_PRESETS"
              :key="layoutOption.id"
              class="layout-card card glass"
              :class="{ active: settings.chatLayout === layoutOption.id }"
              @click="settings.setChatLayout(layoutOption.id)"
            >
              <div class="layout-preview" :class="layoutOption.id">
                <template v-if="layoutOption.id === 'compact'">
                  <div class="layout-avatar compact" />
                  <div class="layout-stack compact">
                    <div class="layout-line compact short" />
                    <div class="layout-line compact long" />
                  </div>
                </template>
                <template v-else-if="layoutOption.id === 'bubble'">
                  <div class="layout-bubble-row">
                    <div class="layout-bubble incoming" />
                    <div class="layout-bubble outgoing" />
                  </div>
                  <div class="layout-line bubble long" />
                </template>
                <template v-else>
                  <div class="layout-avatar modern" />
                  <div class="layout-stack modern">
                    <div class="layout-line modern long" />
                    <div class="layout-line modern medium" />
                    <div class="layout-line modern short" />
                  </div>
                </template>
              </div>
              <span class="layout-name">{{ layoutOption.name }}</span>
              <span class="layout-detail">{{ layoutOption.description }}</span>
            </button>
          </div>
        </div>
      </template>

      <template v-if="activeSection === 'account'">
        <div class="settings-section">
          <h2>Account</h2>

          <div class="info-card card glass">
            <h3><User :size="16" /> {{ auth.user?.username }}</h3>
            <p v-if="auth.user?.email" class="account-email">{{ auth.user.email }}</p>
            <p v-else class="account-email muted">No email set</p>
          </div>

          <div class="setting-item card glass">
            <div class="setting-info">
              <div class="setting-title">Change password</div>
              <div class="setting-desc">Update your account password</div>
            </div>
          </div>

          <div class="password-change-form card glass">
            <div class="form-group">
              <label class="label" for="pwCurrent">Current password</label>
              <input
                id="pwCurrent"
                v-model="pwCurrent"
                class="input"
                type="password"
                placeholder="Enter current password"
                autocomplete="current-password"
              />
            </div>
            <div class="form-group">
              <label class="label" for="pwNew">New password</label>
              <input
                id="pwNew"
                v-model="pwNew"
                class="input"
                type="password"
                placeholder="Minimum 6 characters"
                autocomplete="new-password"
              />
            </div>
            <div class="form-group">
              <label class="label" for="pwConfirm">Confirm new password</label>
              <input
                id="pwConfirm"
                v-model="pwConfirm"
                class="input"
                type="password"
                placeholder="Repeat new password"
                autocomplete="new-password"
              />
            </div>

            <button class="btn btn-primary" :disabled="pwLoading" @click="changePassword">
              <Loader2 v-if="pwLoading" :size="16" class="spin" />
              <Lock v-else :size="16" />
              {{ pwLoading ? 'Changing…' : 'Change password' }}
            </button>

            <p v-if="pwError" class="form-error"><AlertCircle :size="14" /> {{ pwError }}</p>
            <p v-if="pwSuccess" class="form-success">
              <Check :size="14" /> Password changed successfully
            </p>
          </div>
        </div>
      </template>

      <template v-if="activeSection === 'notifications'">
        <div class="settings-section">
          <h2>Notifications</h2>
          <div class="setting-item card glass">
            <div class="setting-info">
              <div class="setting-title">Message Notifications</div>
              <div class="setting-desc">
                Desktop alerts when you receive messages while the tab is in background
              </div>
            </div>
            <label class="toggle">
              <input
                v-model="settings.messageNotifications"
                type="checkbox"
                @change="onNotificationsToggle"
              />
              <span class="toggle-slider" />
            </label>
          </div>
        </div>
      </template>

      <template v-if="activeSection === 'privacy'">
        <div class="settings-section">
          <h2>Privacy & Safety</h2>
          <div class="info-card card glass">
            <h3>🔒 End-to-End Encrypted Voice</h3>
            <p>
              All voice and video calls use WebRTC peer-to-peer connections. Your media streams
              never pass through our servers.
            </p>
          </div>
          <div class="info-card card glass">
            <h3>🍪 Session Authentication</h3>
            <p>
              Your session is stored in a secure, HttpOnly cookie. It cannot be accessed by
              JavaScript.
            </p>
          </div>
        </div>
      </template>

      <template v-if="activeSection === 'language'">
        <div class="settings-section">
          <h2>Language</h2>
          <div class="setting-item card glass">
            <div class="setting-info">
              <div class="setting-title">Application Language</div>
              <div class="setting-desc">Choose your preferred language for the interface</div>
            </div>
          </div>
          <div class="locale-grid">
            <button
              v-for="localeOption in LOCALES"
              :key="localeOption.id"
              class="locale-card card glass"
              :class="{ active: settings.locale === localeOption.id }"
              @click="settings.locale = localeOption.id"
            >
              <span class="locale-name">{{ localeOption.nativeName }}</span>
              <span class="locale-detail">{{ localeOption.name }}</span>
            </button>
          </div>
          <div class="info-card card glass">
            <h3>🌐 Translation Status</h3>
            <p>
              Translations are community contributed. Some languages may be incomplete. English (en)
              is used as fallback for any missing text.
            </p>
          </div>
        </div>
      </template>

      <template v-if="activeSection === 'accessibility'">
        <div class="settings-section">
          <h2>Accessibility</h2>

          <div class="setting-item card glass">
            <div class="setting-info">
              <div class="setting-title">Reduced Motion</div>
              <div class="setting-desc">Minimize animations and transitions throughout the app</div>
            </div>
            <label class="toggle">
              <input v-model="settings.reduceMotion" type="checkbox" />
              <span class="toggle-slider" />
            </label>
          </div>

          <div class="setting-item card glass">
            <div class="setting-info">
              <div class="setting-title">High Contrast</div>
              <div class="setting-desc">Increase contrast for better readability</div>
            </div>
            <label class="toggle">
              <input v-model="settings.highContrast" type="checkbox" />
              <span class="toggle-slider" />
            </label>
          </div>

          <div class="setting-item card glass">
            <div class="setting-info">
              <div class="setting-title">Font Size</div>
              <div class="setting-desc">Adjust the base text size across the interface</div>
            </div>
          </div>

          <div class="fonts-grid">
            <button
              v-for="fontOption in FONT_SIZES"
              :key="fontOption.id"
              class="font-card card glass"
              :class="{ active: settings.fontSize === fontOption.id }"
              @click="settings.fontSize = fontOption.id"
            >
              <span class="font-name">{{ fontOption.name }}</span>
              <span class="font-detail">{{ fontOption.description }}</span>
            </button>
          </div>
        </div>
      </template>

      <template v-if="activeSection === 'developer'">
        <div class="settings-section">
          <h2>Developer Mode</h2>

          <div class="setting-item card glass highlight">
            <div class="setting-info">
              <div class="setting-title">🛠️ Enable Developer Mode</div>
              <div class="setting-desc">
                Show debug information, WebRTC statistics, and development tools
              </div>
            </div>
            <label class="toggle">
              <input v-model="settings.developerMode" type="checkbox" />
              <span class="toggle-slider" />
            </label>
          </div>

          <div v-if="settings.developerMode" class="dev-info-container">
            <div class="info-card card glass">
              <h3>Debug Information</h3>
              <div class="debug-row">
                <span class="debug-label">App Version</span><code>1.0.0</code>
              </div>
              <div class="debug-row">
                <span class="debug-label">Build Target</span><code>{{ buildMode }}</code>
              </div>
              <div class="debug-row">
                <span class="debug-label">Vue Version</span><code>3.x</code>
              </div>
              <div class="debug-row">
                <span class="debug-label">User Agent</span
                ><code class="debug-wrap">{{ userAgent }}</code>
              </div>
            </div>

            <div class="info-card card glass">
              <h3>Storage</h3>
              <div class="debug-row">
                <span class="debug-label">Local Storage Keys</span
                ><code>{{ localStorageKeysCount }}</code>
              </div>
              <div class="debug-row">
                <span class="debug-label">Session Storage Keys</span
                ><code>{{ sessionStorageKeysCount }}</code>
              </div>
            </div>

            <div class="info-card card glass">
              <h3>⚠️ Caution</h3>
              <p>
                Developer mode exposes technical details that are useful for debugging. Some panels
                may show additional controls and data views throughout the app while this is
                enabled.
              </p>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.settings-view {
  flex: 1;
  display: flex;
  overflow: hidden;
  background: var(--bg-primary);
  position: relative;
}

/* BG ORBS */
.settings-bg-orbs {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}

.settings-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  will-change: transform;
  transition: transform 0.5s ease-out;
}

.settings-orb--violet {
  width: 500px;
  height: 500px;
  top: -15%;
  right: 5%;
  background: rgba(139, 92, 246, 0.06);
}

.settings-orb--pink {
  width: 400px;
  height: 400px;
  top: 40%;
  left: -10%;
  background: rgba(217, 70, 239, 0.04);
}

.settings-orb--blue {
  width: 350px;
  height: 350px;
  top: 60%;
  right: -5%;
  background: rgba(59, 130, 246, 0.04);
}

.settings-orb--teal {
  width: 300px;
  height: 300px;
  top: 10%;
  left: 30%;
  background: rgba(6, 182, 212, 0.03);
  animation: settingsOrbDrift 20s ease-in-out infinite;
}

@keyframes settingsOrbDrift {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(40px, -30px); }
}

.settings-nav {
  position: relative;
  z-index: 1;
  width: 220px;
  min-width: 220px;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border);
  padding: 24px 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.settings-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  width: fit-content;
}

.nav-label {
  padding: 0 8px 12px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s;
  text-align: left;
}

.nav-item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.nav-item.active {
  background: rgba(139, 92, 246, 0.15);
  color: var(--accent-violet);
  font-weight: 600;
}

.settings-content {
  position: relative;
  z-index: 1;
  flex: 1;
  overflow-y: auto;
  padding: 32px;
}

.settings-section {
  max-width: 600px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.settings-section h2 {
  font-size: 20px;
  font-weight: 800;
  color: var(--text-primary);
  margin-bottom: 8px;
  letter-spacing: -0.02em;
}

.setting-item {
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px;
  transition: all 0.2s;
}

.setting-item:hover {
  border-color: var(--border-accent);
}

.setting-item.highlight {
  border-color: var(--border-accent);
  background: rgba(139, 92, 246, 0.04);
}

.setting-info {
  flex: 1;
}

.setting-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 3px;
}

.setting-desc {
  font-size: 13px;
  color: var(--text-muted);
  line-height: 1.4;
}

.toggle {
  position: relative;
  width: 44px;
  height: 24px;
  flex-shrink: 0;
  cursor: pointer;
}

.toggle input {
  opacity: 0;
  width: 0;
  height: 0;
  position: absolute;
}

.toggle-slider {
  position: absolute;
  inset: 0;
  border-radius: 24px;
  background: var(--bg-hover);
  border: 1px solid var(--border);
  transition: all 0.2s;
}

.toggle-slider::before {
  content: '';
  position: absolute;
  width: 16px;
  height: 16px;
  left: 3px;
  top: 3px;
  border-radius: 50%;
  background: var(--text-muted);
  transition: all 0.2s;
}

.toggle input:checked + .toggle-slider {
  background: rgba(139, 92, 246, 0.3);
  border-color: var(--accent-violet);
}

.toggle input:checked + .toggle-slider::before {
  transform: translateX(20px);
  background: var(--accent-violet);
}

.slider-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}

.range {
  width: 120px;
  accent-color: var(--accent-violet);
}

.slider-val {
  font-size: 13px;
  color: var(--text-secondary);
  min-width: 40px;
  text-align: right;
}

.spatial-info-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  animation: fadeIn 0.2s ease-out;
}

.soundstage-selection {
  padding: 16px;
}

.soundstage-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.soundstage-card {
  padding: 12px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--bg-primary);
  color: var(--text-primary);
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
}

.soundstage-card:hover {
  background: var(--bg-hover);
  border-color: var(--text-muted);
}

.soundstage-card.active {
  background: rgba(139, 92, 246, 0.1);
  border-color: var(--accent-violet);
  box-shadow: 0 0 12px rgba(139, 92, 246, 0.15);
}

.soundstage-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.soundstage-desc {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 2px;
}

.spatial-demo-premium {
  padding: 24px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.spatial-visual-box {
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.03) 0%, rgba(0, 0, 0, 0.15) 100%);
  border: 2px dashed var(--border);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: visible;
}

.spatial-center-you {
  position: absolute;
  z-index: 10;
  background: var(--accent-violet);
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
  box-shadow: 0 0 15px rgba(139, 92, 246, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.pulse-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 20px;
  border: 2px solid var(--accent-violet);
  animation: pulse-ring-animation 2s infinite;
  opacity: 0.8;
}

@keyframes pulse-ring-animation {
  0% {
    transform: scale(1);
    opacity: 0.8;
  }
  100% {
    transform: scale(1.6);
    opacity: 0;
  }
}

.spatial-caller-dot {
  position: absolute;
  transform: translate(-50%, -50%);
  transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
  z-index: 5;
}

.caller-inner {
  font-size: 11px;
  font-weight: 700;
  color: var(--accent-blue);
  background: rgba(59, 130, 246, 0.15);
  border: 1px solid var(--accent-blue);
  padding: 4px 8px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  white-space: nowrap;
}

.spatial-hint-premium {
  font-size: 12px;
  color: var(--text-muted);
}

.themes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
  margin-top: 12px;
}

.theme-card {
  padding: 16px;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition:
    transform 0.2s,
    border-color 0.2s,
    background 0.2s;
  gap: 6px;
}

.theme-card:hover {
  transform: translateY(-2px);
}

.theme-card.active {
  border-color: var(--border-accent);
  background: rgba(139, 92, 246, 0.14);
}

.theme-preview {
  width: 100%;
  display: flex;
  gap: 6px;
  margin-bottom: 8px;
}

.color-swatch {
  flex: 1;
  height: 24px;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.theme-name {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  text-align: center;
}

.theme-detail {
  font-size: 11px;
  color: var(--text-muted);
  text-align: center;
  line-height: 1.35;
}

.info-card {
  padding: 16px;
}

.info-card h3 {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 6px;
}

.info-card p {
  font-size: 13px;
  color: var(--text-muted);
  line-height: 1.5;
}

.locale-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 10px;
  margin-bottom: 16px;
}

.locale-card {
  padding: 14px;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  transition:
    transform 0.2s,
    border-color 0.2s;
}

.locale-card:hover {
  transform: translateY(-2px);
  border-color: var(--text-muted);
}

.locale-card.active {
  border-color: var(--border-accent);
  background: rgba(139, 92, 246, 0.14);
}

.locale-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.locale-detail {
  font-size: 12px;
  color: var(--text-muted);
}

.fonts-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.font-card {
  padding: 14px;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  transition:
    transform 0.2s,
    border-color 0.2s;
}

.font-card:hover {
  transform: translateY(-2px);
  border-color: var(--text-muted);
}

.font-card.active {
  border-color: var(--border-accent);
  background: rgba(139, 92, 246, 0.14);
}

.font-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.font-detail {
  font-size: 11px;
  color: var(--text-muted);
  text-align: center;
}

.dev-info-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  animation: fadeIn 0.2s ease-out;
}

.debug-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid var(--border);
}

.debug-row:last-child {
  border-bottom: none;
}

.debug-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
}

.debug-row code {
  font-size: 12px;
  color: var(--accent-blue);
  background: rgba(59, 130, 246, 0.08);
  padding: 2px 8px;
  border-radius: 4px;
}

.debug-wrap {
  max-width: 280px;
  overflow-x: auto;
  white-space: nowrap;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
.spin {
  animation: spin 1s linear infinite;
}
.password-change-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
}
.password-change-form .form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.password-change-form .label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.password-change-form .input {
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}
.password-change-form .input:focus {
  border-color: var(--accent-violet);
}
.password-change-form .form-error {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--danger);
}
.password-change-form .form-success {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--success);
}
.account-email {
  font-size: 13px;
  color: var(--text-muted);
}
.account-email.muted {
  font-style: italic;
}

.layouts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}
.layout-card {
  padding: 16px;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition:
    transform 0.2s,
    border-color 0.2s,
    background 0.2s;
  gap: 12px;
}
.layout-card:hover {
  transform: translateY(-2px);
  border-color: var(--text-muted);
}
.layout-card.active {
  border-color: var(--border-accent);
  background: rgba(139, 92, 246, 0.14);
}
.layout-preview {
  width: 100%;
  min-height: 84px;
  border-radius: 6px;
  background: var(--bg-primary);
  border: 1px solid var(--border);
  display: flex;
  overflow: hidden;
  padding: 10px;
  gap: 8px;
  flex-direction: column;
  justify-content: center;
}
.layout-preview.compact {
  background: linear-gradient(180deg, var(--bg-primary), rgba(139, 92, 246, 0.05));
}
.layout-preview.bubble {
  background: linear-gradient(180deg, var(--bg-primary), rgba(59, 130, 246, 0.05));
}
.layout-preview.modern {
  background: linear-gradient(180deg, var(--bg-primary), rgba(14, 165, 233, 0.05));
}
.layout-avatar {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent-violet), var(--accent-blue));
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.03);
}
.layout-avatar.compact {
  width: 16px;
  height: 16px;
}
.layout-stack {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.layout-stack.compact {
  gap: 4px;
}
.layout-line {
  height: 6px;
  border-radius: 999px;
  background: var(--border);
}
.layout-line.compact {
  height: 4px;
}
.layout-line.modern {
  background: linear-gradient(90deg, var(--accent-violet), rgba(148, 163, 184, 0.7));
}
.layout-line.bubble {
  margin-top: 2px;
}
.layout-bubble-row {
  display: flex;
  gap: 6px;
  align-items: center;
}
.layout-bubble {
  height: 18px;
  border-radius: 999px;
  background: var(--bg-surface-2);
  border: 1px solid var(--border);
}
.layout-bubble.incoming {
  width: 42%;
}
.layout-bubble.outgoing {
  width: 28%;
  margin-left: auto;
  background: rgba(139, 92, 246, 0.14);
  border-color: var(--border-accent);
}
.short {
  width: 56%;
}
.long {
  width: 86%;
}
.medium {
  width: 70%;
}
.layout-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
}
.layout-detail {
  font-size: 11px;
  color: var(--text-muted);
  text-align: center;
  line-height: 1.35;
}

@media (max-width: 640px) {
  .settings-nav {
    width: 160px;
  }
  .settings-content {
    padding: 24px;
  }
  .themes-grid {
    grid-template-columns: repeat(1, minmax(0, 1fr));
  }
  .layouts-grid {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .settings-orb {
    animation: none !important;
  }
}
</style>
