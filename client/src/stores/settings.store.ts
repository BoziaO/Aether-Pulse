import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { spatialAudio } from '@/services/rtc/spatial-audio'

export type ThemeMode = 'dark' | 'light' | 'nord' | 'dracula' | 'solarized-dark' | 'cyberpunk' | 'monokai'

export const AVAILABLE_THEMES: Array<{ id: ThemeMode; name: string; colors: string[] }> = [
  { id: 'dark', name: 'Dark (Default)', colors: ['#070a13', '#8b5cf6', '#e2e8f0'] },
  { id: 'light', name: 'Light', colors: ['#f6f7fb', '#6d28d9', '#0f172a'] },
  { id: 'nord', name: 'Nord', colors: ['#2e3440', '#b48ead', '#eceff4'] },
  { id: 'dracula', name: 'Dracula', colors: ['#282a36', '#bd93f9', '#f8f8f2'] },
  { id: 'solarized-dark', name: 'Solarized Dark', colors: ['#002b36', '#6c71c4', '#fdf6e3'] },
  { id: 'cyberpunk', name: 'Cyberpunk', colors: ['#0a0a12', '#ff00ff', '#f0f0ff'] },
  { id: 'monokai', name: 'Monokai', colors: ['#272822', '#ae81ff', '#f8f8f2'] },
]

const VALID_THEMES = new Set<ThemeMode>(AVAILABLE_THEMES.map(t => t.id))

function readStoredTheme(): ThemeMode {
  const stored = localStorage.getItem('theme') as ThemeMode | null
  return stored && VALID_THEMES.has(stored) ? stored : 'dark'
}

export const useSettingsStore = defineStore('settings', () => {
  const theme = ref<ThemeMode>(readStoredTheme())
  const spatialAudioEnabled = ref(false)
  const inputVolume = ref(100)
  const outputVolume = ref(100)
  const noiseSuppressionEnabled = ref(localStorage.getItem('noiseSuppression') !== 'false')
  const messageNotifications = ref(localStorage.getItem('messageNotifications') !== 'false')

  function applyTheme() {
    if (theme.value === 'dark') {
      delete document.documentElement.dataset.theme
    } else {
      document.documentElement.dataset.theme = theme.value
    }
  }

  function setTheme(next: ThemeMode) {
    if (VALID_THEMES.has(next)) {
      theme.value = next
    }
  }

  function applyUserTheme(preferredTheme: string | null | undefined) {
    if (preferredTheme && VALID_THEMES.has(preferredTheme as ThemeMode)) {
      theme.value = preferredTheme as ThemeMode
    }
  }

  watch(theme, (v) => {
    localStorage.setItem('theme', v)
    applyTheme()
  }, { immediate: true })

  watch(outputVolume, (v) => {
    if (spatialAudio.enabled) spatialAudio.setOutputVolume(v)
  }, { immediate: true })

  watch(noiseSuppressionEnabled, (v) => {
    localStorage.setItem('noiseSuppression', String(v))
  }, { immediate: true })

  watch(messageNotifications, (v) => {
    localStorage.setItem('messageNotifications', String(v))
  }, { immediate: true })

  function toggleSpatialAudio() {
    spatialAudioEnabled.value = !spatialAudioEnabled.value
    if (spatialAudioEnabled.value) {
      spatialAudio.enable()
      spatialAudio.setOutputVolume(outputVolume.value)
    } else {
      spatialAudio.disable()
    }
  }

  return {
    theme,
    AVAILABLE_THEMES,
    VALID_THEMES,
    spatialAudioEnabled,
    inputVolume,
    outputVolume,
    noiseSuppressionEnabled,
    messageNotifications,
    applyTheme,
    setTheme,
    applyUserTheme,
    toggleSpatialAudio,
  }
})
