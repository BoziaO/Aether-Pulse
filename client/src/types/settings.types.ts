export type ThemeMode = 'dark' | 'light' | 'system'

export type ResolvedThemeMode = 'dark' | 'light'

export type ChatLayoutPreset = 'compact' | 'bubble' | 'modern'

export const THEME_MODES: Array<{
  id: ThemeMode
  name: string
  description: string
  colors: string[]
}> = [
  {
    id: 'dark',
    name: 'Dark',
    description: 'Uses the app’s default dark palette.',
    colors: ['#070a13', '#8b5cf6', '#e2e8f0'],
  },
  {
    id: 'light',
    name: 'Light',
    description: 'A brighter interface for daylight use.',
    colors: ['#f6f7fb', '#6d28d9', '#0f172a'],
  },
  {
    id: 'system',
    name: 'System',
    description: 'Follows your operating system preference.',
    colors: ['#070a13', '#f6f7fb', '#3b82f6'],
  },
]

export const CHAT_LAYOUT_PRESETS: Array<{
  id: ChatLayoutPreset
  name: string
  description: string
}> = [
  {
    id: 'compact',
    name: 'Compact',
    description: 'Dense rows, tighter spacing, more messages in view.',
  },
  {
    id: 'bubble',
    name: 'Bubble',
    description: 'Rounded message bubbles with a softer conversation flow.',
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Balanced spacing with the cleanest default reading rhythm.',
  },
]
