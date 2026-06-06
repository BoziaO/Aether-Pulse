import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { spatialAudio } from '@/services/rtc/spatial-audio'
import { useAuthStore } from './auth.store'

export type ThemeMode = 'dark' | 'light' | 'mistral' | 'apple-music' | 'neon-cyber' | 'sakura'

export type LayoutMode = 'maximalist' | 'minimalist'

export const AVAILABLE_THEMES: Array<{ id: ThemeMode; name: string; colors: string[] }> = [
  { id: 'dark', name: 'Dark (Default)', colors: ['#070a13', '#8b5cf6', '#e2e8f0'] },
  { id: 'light', name: 'Light', colors: ['#f6f7fb', '#6d28d9', '#0f172a'] },
  { id: 'mistral', name: 'Mistral AI', colors: ['#111111', '#ff5a1f', '#f5f5f7'] },
  { id: 'apple-music', name: 'Apple Music', colors: ['#0d0d0d', '#fa2356', '#ffffff'] },
  { id: 'neon-cyber', name: 'Neon Cyber', colors: ['#05050d', '#00f0ff', '#ff007f'] },
  { id: 'sakura', name: 'Midnight Sakura', colors: ['#0f0913', '#ff75a0', '#a5f3fc'] },
]

const VALID_THEMES = new Set<ThemeMode>(AVAILABLE_THEMES.map((t) => t.id))

function readStoredTheme(): ThemeMode {
  const stored = localStorage.getItem('theme') as ThemeMode | null
  return stored && VALID_THEMES.has(stored) ? stored : 'dark'
}

export const useSettingsStore = defineStore('settings', () => {
  const theme = ref<ThemeMode>(readStoredTheme())
  const mobileSidebarOpen = ref(false)
  const layout = ref<LayoutMode>((localStorage.getItem('layout') as LayoutMode) || 'maximalist')
  const spatialAudioEnabled = ref(false)
  const spatialAudioDistance = ref<number>(
    localStorage.getItem('spatialAudioDistance')
      ? Number(localStorage.getItem('spatialAudioDistance'))
      : 5
  )
  const spatialAudioDirectionMode = ref<'alternating' | 'left' | 'right' | 'center'>(
    (localStorage.getItem('spatialAudioDirectionMode') as any) || 'alternating'
  )
  const spatialAudioSpreadAngle = ref<number>(
    localStorage.getItem('spatialAudioSpreadAngle')
      ? Number(localStorage.getItem('spatialAudioSpreadAngle'))
      : 45
  )
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
      try {
        const auth = useAuthStore()
        if (auth.user && auth.user.customTheme !== next) {
          auth.updateProfile({ customTheme: next })
        }
      } catch (e) {
        // Safe fallback if authStore is not ready
      }
    }
  }

  function applyUserTheme(preferredTheme: string | null | undefined) {
    if (preferredTheme && VALID_THEMES.has(preferredTheme as ThemeMode)) {
      theme.value = preferredTheme as ThemeMode
    }
  }

  watch(
    theme,
    (v) => {
      localStorage.setItem('theme', v)
      applyTheme()
    },
    { immediate: true }
  )

  watch(
    layout,
    (v) => {
      localStorage.setItem('layout', v)
      document.documentElement.dataset.layout = v
    },
    { immediate: true }
  )

  watch(
    spatialAudioDistance,
    (v) => {
      localStorage.setItem('spatialAudioDistance', String(v))
    },
    { immediate: true }
  )

  watch(
    spatialAudioDirectionMode,
    (v) => {
      localStorage.setItem('spatialAudioDirectionMode', v)
    },
    { immediate: true }
  )

  watch(
    spatialAudioSpreadAngle,
    (v) => {
      localStorage.setItem('spatialAudioSpreadAngle', String(v))
    },
    { immediate: true }
  )

  watch(
    outputVolume,
    (v) => {
      if (spatialAudio.enabled) spatialAudio.setOutputVolume(v)
    },
    { immediate: true }
  )

  watch(
    noiseSuppressionEnabled,
    (v) => {
      localStorage.setItem('noiseSuppression', String(v))
    },
    { immediate: true }
  )

  watch(
    messageNotifications,
    (v) => {
      localStorage.setItem('messageNotifications', String(v))
    },
    { immediate: true }
  )

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
    layout,
    AVAILABLE_THEMES,
    VALID_THEMES,
    spatialAudioEnabled,
    spatialAudioDistance,
    spatialAudioDirectionMode,
    spatialAudioSpreadAngle,
    inputVolume,
    outputVolume,
    noiseSuppressionEnabled,
    messageNotifications,
    applyTheme,
    setTheme,
    applyUserTheme,
    toggleSpatialAudio,
    mobileSidebarOpen,
  }
})
