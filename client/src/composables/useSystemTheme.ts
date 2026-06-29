import { computed, onScopeDispose, ref } from 'vue'

import type { ThemeMode } from '@/types/settings.types'

function readMatchMedia(query: string) {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return null
  }
  return window.matchMedia(query)
}

export function useSystemTheme() {
  const mediaQuery = readMatchMedia('(prefers-color-scheme: dark)')
  const prefersDark = ref(mediaQuery?.matches ?? true)

  const updatePreference = (value: boolean) => {
    prefersDark.value = value
  }

  if (mediaQuery) {
    const listener = (event: MediaQueryListEvent) => updatePreference(event.matches)
    prefersDark.value = mediaQuery.matches

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', listener)
      onScopeDispose(() => mediaQuery.removeEventListener('change', listener))
    } else if (typeof mediaQuery.addListener === 'function') {
      mediaQuery.addListener(listener)
      onScopeDispose(() => mediaQuery.removeListener(listener))
    }
  }

  const systemTheme = computed((): ThemeMode => (prefersDark.value ? 'midnight-lavender' : 'midnight-lavender'))

  return {
    prefersDark,
    systemTheme,
  }
}
