export type ThemeMode = 'dark' | 'light' | 'system'

export type ResolvedThemeMode = 'dark' | 'light'

export type ChatLayoutPreset = 'compact' | 'bubble' | 'modern'

export type Locale = 'pl' | 'en' | 'de' | 'es' | 'fr' | 'ja'

export type FontSize = 'small' | 'medium' | 'large'

export const THEME_MODES: Array<{
  id: ThemeMode
  name: string
  description: string
  colors: string[]
}> = [
  {
    id: 'dark',
    name: 'Dark',
    description: 'Uses the app\u2019s default dark palette.',
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

export const LOCALES: Array<{
  id: Locale
  name: string
  nativeName: string
}> = [
  { id: 'en', name: 'English', nativeName: 'English' },
  { id: 'pl', name: 'Polish', nativeName: 'Polski' },
  { id: 'de', name: 'German', nativeName: 'Deutsch' },
  { id: 'es', name: 'Spanish', nativeName: 'Espa\u00f1ol' },
  { id: 'fr', name: 'French', nativeName: 'Fran\u00e7ais' },
  { id: 'ja', name: 'Japanese', nativeName: '\u65e5\u672c\u8a9e' },
]

export const FONT_SIZES: Array<{
  id: FontSize
  name: string
  description: string
}> = [
  { id: 'small', name: 'Small', description: 'Smaller text for denser content' },
  { id: 'medium', name: 'Medium', description: 'Default text size' },
  { id: 'large', name: 'Large', description: 'Larger text for better readability' },
]
