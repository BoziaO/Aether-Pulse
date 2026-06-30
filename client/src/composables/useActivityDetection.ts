import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRoomStore } from '@/stores/room.store'
import { useWebActivityDetection } from '@/services/privacy/web-activity'

export interface PresenceActivity {
  id: string
  name: string
  icon: string
  category: string
}

export interface PresenceLine {
  text: string
  icon: string
  animated: boolean
}

export interface PresenceState {
  theme: string
  sessionId: number
  sessionDuration: number
  sessionFormatted: string
  room: {
    id: string
    name: string
    memberCount: number
    maxMembers: number
    isActive: boolean
  } | null
  activities: PresenceActivity[]
  games: PresenceActivity[]
  lines: PresenceLine[]
  rawActivities: PresenceActivity[]
  timestamp: number
}

export interface PresenceTheme {
  id: string
  name: string
}

export interface UnifiedActivity {
  source: 'electron' | 'web'
  name: string
  icon: string
  category: string
  timestamp: number
}

const CATEGORY_LABELS: Record<string, string> = {
  music: 'Slucha muzyki',
  coding: 'Koduje',
  design: 'Projektuje',
  media: 'Edytuje media',
  productivity: 'Pracuje',
  gaming: 'Gra',
}

const CATEGORY_ICONS: Record<string, string> = {
  music: 'music',
  coding: 'code',
  design: 'palette',
  media: 'video',
  productivity: 'briefcase',
  gaming: 'gamepad-2',
}

const WEB_CATEGORY_MAP: Record<string, string> = {
  'media-playing': 'media',
  'tab-focus': 'productivity',
  typing: 'coding',
  idle: 'productivity',
  'screen-share': 'media',
}

export function useActivityDetection() {
  const presenceState = ref<PresenceState | null>(null)
  const isElectron = ref(false)
  const themes = ref<PresenceTheme[]>([])
  const currentTheme = ref('default')

  let removePresenceChanged: (() => void) | null = null
  let removePresenceTick: (() => void) | null = null

  // Web activity detection (only works in browser)
  const { webActivities, isIdle, isMediaPlaying } = useWebActivityDetection()

  const activities = computed(() => presenceState.value?.rawActivities || [])
  const games = computed(() => presenceState.value?.games || [])
  const sessionFormatted = computed(() => presenceState.value?.sessionFormatted || '0s')
  const roomInfo = computed(() => presenceState.value?.room || null)
  const presenceLines = computed(() => presenceState.value?.lines || [])

  // Merge Electron + Web activities into unified list
  const unifiedActivities = computed<UnifiedActivity[]>(() => {
    const result: UnifiedActivity[] = []

    // Electron activities (process detection)
    for (const act of activities.value) {
      result.push({
        source: 'electron',
        name: act.name,
        icon: act.icon,
        category: act.category,
        timestamp: Date.now(),
      })
    }

    // Web activities (browser tab/media detection)
    for (const act of webActivities.value) {
      const category = WEB_CATEGORY_MAP[act.type] || 'productivity'
      result.push({
        source: 'web',
        name: act.details,
        icon: act.icon,
        category,
        timestamp: act.timestamp,
      })
    }

    return result
  })

  const hasAnyActivity = computed(() => unifiedActivities.value.length > 0)
  const currentActivityText = computed(() => {
    if (!unifiedActivities.value.length) return ''
    return unifiedActivities.value.map((a) => a.name).join(', ')
  })

  function formatActivityText(activityList: PresenceActivity[]): string {
    if (!activityList.length) return ''

    const categories = [...new Set(activityList.map((a) => a.category))]
    if (categories.length === 1) {
      const cat = categories[0]
      const label = CATEGORY_LABELS[cat] || cat
      const names = activityList.map((a) => a.name).join(', ')
      return `${label}: ${names}`
    }

    return activityList.map((a) => a.name).join(', ')
  }

  function getCategoryInfo(category: string) {
    return {
      label: CATEGORY_LABELS[category] || category,
      icon: CATEGORY_ICONS[category] || 'activity',
    }
  }

  function setRoomInfo(room: { id: string; name: string; memberCount: number; maxMembers: number; isActive: boolean } | null) {
    if (!isElectron.value) return
    ;(window as any).electronAPI.setRoomInfo(room)
  }

  function setTheme(themeId: string) {
    if (!isElectron.value) return
    currentTheme.value = themeId
    ;(window as any).electronAPI.setPresenceTheme(themeId)
  }

  async function fetchThemes(): Promise<PresenceTheme[]> {
    if (!isElectron.value) return []
    const result = await (window as any).electronAPI.getPresenceThemes()
    themes.value = result
    return result
  }

  // Sync room state with main process
  const roomStore = useRoomStore()

  watch(
    () => roomStore.currentRoom,
    (room) => {
      if (!isElectron.value) return
      if (room) {
        setRoomInfo({
          id: room.id,
          name: room.name,
          memberCount: room.memberCount || room.members?.length || 0,
          maxMembers: 10,
          isActive: room.isActive,
        })
      } else {
        setRoomInfo(null)
      }
    },
    { immediate: true }
  )

  watch(
    () => roomStore.rooms,
    () => {
      if (!isElectron.value || !roomStore.currentRoom) return
      const r = roomStore.currentRoom
      setRoomInfo({
        id: r.id,
        name: r.name,
        memberCount: r.memberCount || r.members?.length || 0,
        maxMembers: 10,
        isActive: r.isActive,
      })
    },
    { deep: true }
  )

  onMounted(async () => {
    isElectron.value = !!(window as any).electronAPI
    if (!isElectron.value) return

    try {
      const state = await (window as any).electronAPI.getPresenceState()
      presenceState.value = state
      if (state?.theme) currentTheme.value = state.theme
    } catch {
      presenceState.value = null
    }

    await fetchThemes()

    removePresenceChanged = (window as any).electronAPI.onPresenceChanged(
      (state: PresenceState) => {
        presenceState.value = state
        if (state?.theme) currentTheme.value = state.theme
      }
    )

    removePresenceTick = (window as any).electronAPI.onPresenceTick(
      (state: PresenceState) => {
        presenceState.value = state
      }
    )
  })

  onUnmounted(() => {
    if (removePresenceChanged) {
      removePresenceChanged()
      removePresenceChanged = null
    }
    if (removePresenceTick) {
      removePresenceTick()
      removePresenceTick = null
    }
  })

  return {
    // Electron presence
    presenceState,
    activities,
    games,
    sessionFormatted,
    roomInfo,
    presenceLines,
    isElectron,
    themes,
    currentTheme,
    formatActivityText,
    getCategoryInfo,
    setRoomInfo,
    setTheme,
    fetchThemes,
    // Web activity
    webActivities,
    isIdle,
    isMediaPlaying,
    // Unified
    unifiedActivities,
    hasAnyActivity,
    currentActivityText,
  }
}
