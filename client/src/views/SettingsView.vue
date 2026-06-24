<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { Headphones, Mic, Shield, Bell, Palette } from 'lucide-vue-next'

  import { useSettingsStore } from '@/stores/settings.store'
  import { requestNotificationPermission } from '@/utils/notifications'

  const settings = useSettingsStore()
  const activeSection = ref('voice')

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
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Shield },
  ]

  const soundstages = [
    { id: 'alternating', name: 'Alternating', desc: 'Left & Right' },
    { id: 'left', name: 'Left only', desc: 'All on the left' },
    { id: 'right', name: 'Right only', desc: 'All on the right' },
    { id: 'center', name: 'Center focus', desc: 'Spread around center' },
  ] as const

  const simulatedCallers = computed(() => {
    const mode = settings.spatialAudioDirectionMode
    const spreadAngle = settings.spatialAudioSpreadAngle
    const distance = settings.spatialAudioDistance

    // Center of visual container is (100, 100)
    // Scaling radius: map distance (1-15m) to (30-85px)
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
    <div class="settings-nav">
      <div class="nav-label">Settings</div>
      <button
        v-for="s in sections"
        :key="s.id"
        class="nav-item"
        :class="{ active: activeSection === s.id }"
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

          <div class="setting-item">
            <div class="setting-info">
              <div class="setting-title">Noise Suppression</div>
              <div class="setting-desc">Reduce background noise during calls</div>
            </div>
            <label class="toggle">
              <input v-model="settings.noiseSuppressionEnabled" type="checkbox" />
              <span class="toggle-slider" />
            </label>
          </div>

          <div class="setting-item">
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

          <div class="setting-item">
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

          <div class="setting-item highlight">
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
            <div class="setting-item">
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

            <div class="setting-item">
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

            <div class="soundstage-selection">
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

            <div class="spatial-demo-premium">
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

          <div class="setting-item">
            <div class="setting-info">
              <div class="setting-title">Theme mode</div>
              <div class="setting-desc">Light, dark, or follow your operating system</div>
            </div>
          </div>

          <div class="themes-grid">
            <button
              v-for="themeOption in settings.THEME_MODES"
              :key="themeOption.id"
              class="theme-card"
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

          <div class="setting-item">
            <div class="setting-info">
              <div class="setting-title">Compact chat mode</div>
              <div class="setting-desc">Reduce message spacing and composer padding</div>
            </div>
            <label class="toggle">
              <input v-model="settings.compactChatMode" type="checkbox" />
              <span class="toggle-slider" />
            </label>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <div class="setting-title">Chat layout preset</div>
              <div class="setting-desc">
                Pick how messages are presented in rooms and direct messages
              </div>
            </div>
          </div>

          <div class="layouts-grid">
            <button
              v-for="layoutOption in settings.CHAT_LAYOUT_PRESETS"
              :key="layoutOption.id"
              class="layout-card"
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

      <template v-if="activeSection === 'notifications'">
        <div class="settings-section">
          <h2>Notifications</h2>
          <div class="setting-item">
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
          <div class="info-card">
            <h3>🔒 End-to-End Encrypted Voice</h3>
            <p>
              All voice and video calls use WebRTC peer-to-peer connections. Your media streams
              never pass through our servers.
            </p>
          </div>
          <div class="info-card">
            <h3>🍪 Session Authentication</h3>
            <p>
              Your session is stored in a secure, HttpOnly cookie. It cannot be accessed by
              JavaScript.
            </p>
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
}
.settings-nav {
  width: 220px;
  min-width: 220px;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border);
  padding: 24px 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.nav-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: var(--text-muted);
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
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 8px;
}
.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 10px;
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
  background: var(--bg-surface);
  border: 1px solid var(--border);
  padding: 16px;
  border-radius: 10px;
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
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 10px;
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
  border: 1px solid var(--border);
  background: var(--bg-surface);
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
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 10px;
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

.layouts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}
.layout-card {
  padding: 16px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--bg-surface);
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
</style>
