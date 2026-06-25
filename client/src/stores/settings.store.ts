import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'

import { spatialAudio } from '@/services/rtc/spatial-audio'
import { useAuthStore } from './auth.store'
import { useSystemTheme } from '@/composables/useSystemTheme'
import type { ChatLayoutPreset, FontSize, Locale, ResolvedThemeMode, ThemeMode } from '@/types/settings.types'
import { CHAT_LAYOUT_PRESETS, FONT_SIZES, LOCALES, THEME_MODES } from '@/types/settings.types'

const THEME_STORAGE_KEY = 'theme'
const CHAT_LAYOUT_STORAGE_KEY = 'chatLayout'
const COMPACT_CHAT_STORAGE_KEY = 'compactChatMode'

const VALID_THEMES = new Set<ThemeMode>(THEME_MODES.map((theme) => theme.id))
const VALID_CHAT_LAYOUTS = new Set<ChatLayoutPreset>(CHAT_LAYOUT_PRESETS.map((layout) => layout.id))

function readStoredTheme(): ThemeMode {
  const stored = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null
  return stored && VALID_THEMES.has(stored) ? stored : 'dark'
}

function readStoredChatLayout(): ChatLayoutPreset {
  const stored = localStorage.getItem(CHAT_LAYOUT_STORAGE_KEY) as ChatLayoutPreset | null
  return stored && VALID_CHAT_LAYOUTS.has(stored) ? stored : 'modern'
}

function readStoredCompactChatMode(): boolean {
  return localStorage.getItem(COMPACT_CHAT_STORAGE_KEY) === 'true'
}

export const useSettingsStore = defineStore('settings', () => {
  const theme = ref<ThemeMode>(readStoredTheme())
  const { systemTheme } = useSystemTheme()
  const resolvedTheme = computed<ResolvedThemeMode>(() =>
    theme.value === 'system' ? systemTheme.value : theme.value
  )
  const mobileSidebarOpen = ref(false)
  const chatLayout = ref<ChatLayoutPreset>(readStoredChatLayout())
  const compactChatMode = ref(readStoredCompactChatMode())
  const locale = ref<Locale>((localStorage.getItem('locale') as Locale) || 'en')
  const reduceMotion = ref(localStorage.getItem('reduceMotion') === 'true')
  const highContrast = ref(localStorage.getItem('highContrast') === 'true')
  const fontSize = ref<FontSize>((localStorage.getItem('fontSize') as FontSize) || 'medium')
  const developerMode = ref(localStorage.getItem('developerMode') === 'true')
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
    document.documentElement.dataset.theme = resolvedTheme.value
    document.documentElement.style.colorScheme = resolvedTheme.value
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

  function setChatLayout(next: ChatLayoutPreset) {
    if (!VALID_CHAT_LAYOUTS.has(next)) return
    chatLayout.value = next
  }

  function applyUserTheme(preferredTheme: string | null | undefined) {
    if (localStorage.getItem(THEME_STORAGE_KEY) !== null) return
    if (preferredTheme && VALID_THEMES.has(preferredTheme as ThemeMode)) {
      theme.value = preferredTheme as ThemeMode
    }
  }

  watch(
    theme,
    (v) => {
      localStorage.setItem(THEME_STORAGE_KEY, v)
      applyTheme()
    },
    { immediate: true }
  )

  watch(
    resolvedTheme,
    (v) => {
      document.documentElement.dataset.theme = v
      document.documentElement.style.colorScheme = v
    },
    { immediate: true }
  )

  watch(
    chatLayout,
    (v) => {
      localStorage.setItem(CHAT_LAYOUT_STORAGE_KEY, v)
      document.documentElement.dataset.chatLayout = v
    },
    { immediate: true }
  )

  watch(
    compactChatMode,
    (v) => {
      localStorage.setItem(COMPACT_CHAT_STORAGE_KEY, String(v))
      document.documentElement.dataset.chatDensity = v ? 'compact' : 'comfortable'
    },
    { immediate: true }
  )

  watch(locale, (v) => localStorage.setItem('locale', v), { immediate: true })
  watch(reduceMotion, (v) => {
    localStorage.setItem('reduceMotion', String(v))
    document.documentElement.dataset.reduceMotion = v ? 'true' : 'false'
  }, { immediate: true })
  watch(highContrast, (v) => {
    localStorage.setItem('highContrast', String(v))
    document.documentElement.dataset.highContrast = v ? 'true' : 'false'
  }, { immediate: true })
  watch(fontSize, (v) => {
    localStorage.setItem('fontSize', v)
    document.documentElement.dataset.fontSize = v
  }, { immediate: true })
  watch(developerMode, (v) => {
    localStorage.setItem('developerMode', String(v))
    document.documentElement.dataset.developerMode = v ? 'true' : 'false'
  }, { immediate: true })

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
    resolvedTheme,
    chatLayout,
    compactChatMode,
    locale,
    reduceMotion,
    highContrast,
    fontSize,
    developerMode,
    THEME_MODES,
    CHAT_LAYOUT_PRESETS,
    LOCALES,
    FONT_SIZES,
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
    setChatLayout,
    applyUserTheme,
    toggleSpatialAudio,
    mobileSidebarOpen,
  }
})

export type { ChatLayoutPreset, ResolvedThemeMode, ThemeMode } from '@/types/settings.types'
