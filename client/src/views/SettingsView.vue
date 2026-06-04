<script setup lang="ts">
import { ref } from 'vue'
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
              <input type="checkbox" v-model="settings.noiseSuppressionEnabled" />
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
                type="range"
                v-model.number="settings.inputVolume"
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
                type="range"
                v-model.number="settings.outputVolume"
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
                Uses Head-Related Transfer Function to position the other person's voice in 3D
                space. Creates an immersive experience during calls.
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

          <div v-if="settings.spatialAudioEnabled" class="spatial-info">
            <div class="spatial-demo">
              <div class="spatial-label">Audio Position Demo</div>
              <div class="spatial-ring">
                <div class="spatial-you">You</div>
                <div class="spatial-other">Other</div>
              </div>
              <p class="spatial-hint">
                The other person's voice will appear to come from the right side
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
              <div class="setting-title">Theme</div>
              <div class="setting-desc">Change the interface color scheme</div>
            </div>
          </div>
          <div class="themes-grid">
            <button
              v-for="themeOption in settings.AVAILABLE_THEMES"
              :key="themeOption.id"
              class="theme-card"
              :class="{ active: settings.theme === themeOption.id }"
              @click="settings.setTheme(themeOption.id)"
              :title="themeOption.name"
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
                type="checkbox"
                v-model="settings.messageNotifications"
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
.spatial-info {
  margin-top: -8px;
}
.spatial-demo {
  padding: 20px;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  text-align: center;
}
.spatial-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  margin-bottom: 16px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.spatial-ring {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: 2px solid var(--border-accent);
  margin: 0 auto 12px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}
.spatial-you {
  font-size: 12px;
  font-weight: 700;
  color: var(--accent-violet);
  background: rgba(139, 92, 246, 0.15);
  padding: 4px 8px;
  border-radius: 20px;
}
.spatial-other {
  position: absolute;
  right: -20px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  font-weight: 700;
  color: var(--accent-blue);
  background: rgba(59, 130, 246, 0.15);
  padding: 4px 8px;
  border-radius: 20px;
}
.spatial-hint {
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
  transition: transform 0.2s;
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

@media (max-width: 640px) {
  .settings-nav {
    width: 160px;
  }
  .settings-content {
    padding: 24px;
  }
  .themes-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
