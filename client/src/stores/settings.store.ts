import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'

import { spatialAudio } from '@/services/rtc/spatial-audio'
import { useAuthStore } from './auth.store'
import { useSystemTheme } from '@/composables/useSystemTheme'
import type {
  ChatLayoutPreset,
  FontSize,
  Locale,
  ResolvedThemeMode,
  ThemeMode,
} from '@/types/settings.types'
import { CHAT_LAYOUT_PRESETS, THEME_MODES } from '@/types/settings.types'

const SETTINGS_STORAGE_KEY = 'nicori_settings'

const VALID_THEMES = new Set<ThemeMode>(THEME_MODES.map((theme) => theme.id))
const VALID_CHAT_LAYOUTS = new Set<ChatLayoutPreset>(CHAT_LAYOUT_PRESETS.map((layout) => layout.id))

interface SettingsData {
  theme: ThemeMode
  chatLayout: ChatLayoutPreset
  compactChatMode: boolean
  locale: Locale
  reduceMotion: boolean
  highContrast: boolean
  fontSize: FontSize
  developerMode: boolean
  spatialAudioDistance: number
  spatialAudioDirectionMode: 'alternating' | 'left' | 'right' | 'center'
  spatialAudioSpreadAngle: number
  noiseSuppression: boolean
  messageNotifications: boolean
}

const DEFAULT_SETTINGS: SettingsData = {
  theme: 'midnight-lavender',
  chatLayout: 'modern',
  compactChatMode: false,
  locale: 'en',
  reduceMotion: false,
  highContrast: false,
  fontSize: 'medium',
  developerMode: false,
  spatialAudioDistance: 5,
  spatialAudioDirectionMode: 'alternating',
  spatialAudioSpreadAngle: 45,
  noiseSuppression: true,
  messageNotifications: true,
}

function migrateLegacySettings(): SettingsData {
  const data = { ...DEFAULT_SETTINGS }

  const theme = localStorage.getItem('theme') as ThemeMode | null
  if (theme && VALID_THEMES.has(theme)) data.theme = theme

  const chatLayout = localStorage.getItem('chatLayout') as ChatLayoutPreset | null
  if (chatLayout && VALID_CHAT_LAYOUTS.has(chatLayout)) data.chatLayout = chatLayout

  if (localStorage.getItem('compactChatMode') === 'true') data.compactChatMode = true
  const locale = localStorage.getItem('locale') as Locale | null
  if (locale) data.locale = locale
  if (localStorage.getItem('reduceMotion') === 'true') data.reduceMotion = true
  if (localStorage.getItem('highContrast') === 'true') data.highContrast = true
  const fontSize = localStorage.getItem('fontSize') as FontSize | null
  if (fontSize) data.fontSize = fontSize
  if (localStorage.getItem('developerMode') === 'true') data.developerMode = true

  const spatialDistance = localStorage.getItem('spatialAudioDistance')
  if (spatialDistance) data.spatialAudioDistance = Number(spatialDistance)

  const spatialDir = localStorage.getItem('spatialAudioDirectionMode') as SettingsData['spatialAudioDirectionMode'] | null
  if (spatialDir) data.spatialAudioDirectionMode = spatialDir

  const spatialSpread = localStorage.getItem('spatialAudioSpreadAngle')
  if (spatialSpread) data.spatialAudioSpreadAngle = Number(spatialSpread)

  if (localStorage.getItem('noiseSuppression') === 'false') data.noiseSuppression = false
  if (localStorage.getItem('messageNotifications') === 'false') data.messageNotifications = false

  // Remove legacy individual keys
  const legacyKeys = [
    'theme', 'chatLayout', 'compactChatMode', 'locale', 'reduceMotion',
    'highContrast', 'fontSize', 'developerMode', 'spatialAudioDistance',
    'spatialAudioDirectionMode', 'spatialAudioSpreadAngle', 'noiseSuppression',
    'messageNotifications',
  ]
  legacyKeys.forEach((k) => localStorage.removeItem(k))

  return data
}

function loadSettings(): SettingsData {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<SettingsData>
      return { ...DEFAULT_SETTINGS, ...parsed }
    }
  } catch {
    // corrupted data, fall through
  }
  return migrateLegacySettings()
}

let persistTimer: ReturnType<typeof setTimeout> | null = null

function schedulePersist(data: SettingsData) {
  if (persistTimer) clearTimeout(persistTimer)
  persistTimer = setTimeout(() => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(data))
    } catch {
      // storage full or unavailable
    }
    persistTimer = null
  }, 300)
}

export const useSettingsStore = defineStore('settings', () => {
  const stored = loadSettings()

  const theme = ref<ThemeMode>(stored.theme)
  const { systemTheme } = useSystemTheme()
  const resolvedTheme = computed<ResolvedThemeMode>(() =>
    theme.value === 'system' ? systemTheme.value : theme.value
  )
  const mobileSidebarOpen = ref(false)
  const chatLayout = ref<ChatLayoutPreset>(stored.chatLayout)
  const compactChatMode = ref(stored.compactChatMode)
  const locale = ref<Locale>(stored.locale)
  const reduceMotion = ref(stored.reduceMotion)
  const highContrast = ref(stored.highContrast)
  const fontSize = ref<FontSize>(stored.fontSize)
  const developerMode = ref(stored.developerMode)
  const spatialAudioEnabled = ref(false)
  const spatialAudioDistance = ref<number>(stored.spatialAudioDistance)
  const spatialAudioDirectionMode = ref<'alternating' | 'left' | 'right' | 'center'>(stored.spatialAudioDirectionMode)
  const spatialAudioSpreadAngle = ref<number>(stored.spatialAudioSpreadAngle)
  const inputVolume = ref(100)
  const outputVolume = ref(100)
  const noiseSuppressionEnabled = ref(stored.noiseSuppression)
  const messageNotifications = ref(stored.messageNotifications)

  function gatherSettings(): SettingsData {
    return {
      theme: theme.value,
      chatLayout: chatLayout.value,
      compactChatMode: compactChatMode.value,
      locale: locale.value,
      reduceMotion: reduceMotion.value,
      highContrast: highContrast.value,
      fontSize: fontSize.value,
      developerMode: developerMode.value,
      spatialAudioDistance: spatialAudioDistance.value,
      spatialAudioDirectionMode: spatialAudioDirectionMode.value,
      spatialAudioSpreadAngle: spatialAudioSpreadAngle.value,
      noiseSuppression: noiseSuppressionEnabled.value,
      messageNotifications: messageNotifications.value,
    }
  }

  function persist() {
    schedulePersist(gatherSettings())
  }

  function applyTheme() {
    document.documentElement.dataset.theme = resolvedTheme.value
    document.documentElement.style.colorScheme = resolvedTheme.value
  }

  function setTheme(next: ThemeMode) {
    if (VALID_THEMES.has(next)) {
      theme.value = next
      persist()
      try {
        const auth = useAuthStore()
        if (auth.user && auth.user.customTheme !== next) {
          auth.updateProfile({ customTheme: next })
        }
      } catch {
        // Safe fallback if authStore is not ready
      }
    }
  }

  function setChatLayout(next: ChatLayoutPreset) {
    if (!VALID_CHAT_LAYOUTS.has(next)) return
    chatLayout.value = next
    persist()
  }

  function applyUserTheme(preferredTheme: string | null | undefined) {
    if (preferredTheme && VALID_THEMES.has(preferredTheme as ThemeMode)) {
      theme.value = preferredTheme as ThemeMode
      persist()
    }
  }

  // DOM side-effect watchers (no localStorage writes)
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
      document.documentElement.dataset.chatLayout = v
    },
    { immediate: true }
  )

  watch(
    compactChatMode,
    (v) => {
      document.documentElement.dataset.chatDensity = v ? 'compact' : 'comfortable'
    },
    { immediate: true }
  )

  watch(
    reduceMotion,
    (v) => {
      document.documentElement.dataset.reduceMotion = v ? 'true' : 'false'
    },
    { immediate: true }
  )

  watch(
    highContrast,
    (v) => {
      document.documentElement.dataset.highContrast = v ? 'true' : 'false'
    },
    { immediate: true }
  )

  watch(
    fontSize,
    (v) => {
      document.documentElement.dataset.fontSize = v
    },
    { immediate: true }
  )

  watch(
    developerMode,
    (v) => {
      document.documentElement.dataset.developerMode = v ? 'true' : 'false'
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

  // Persist watchers (batched debounced save)
  watch([theme, chatLayout, compactChatMode, locale, reduceMotion, highContrast, fontSize, developerMode, spatialAudioDistance, spatialAudioDirectionMode, spatialAudioSpreadAngle, noiseSuppressionEnabled, messageNotifications], persist)

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
