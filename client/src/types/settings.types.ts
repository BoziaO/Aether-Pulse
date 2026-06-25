export type ThemeMode = 'dark' | 'light' | 'system' | 'amoled' | 'midnight' | 'sunset' | 'ocean' | 'forest' | 'nord'

export type ResolvedThemeMode = ThemeMode

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
  {
    id: 'amoled',
    name: 'AMOLED',
    description: 'Pure black backgrounds for true blacks on OLED screens.',
    colors: ['#000000', '#8b5cf6', '#a78bfa'],
  },
  {
    id: 'midnight',
    name: 'Midnight',
    description: 'Deep navy with cool blue accents for late night use.',
    colors: ['#0f1729', '#38bdf8', '#e2e8f0'],
  },
  {
    id: 'sunset',
    name: 'Sunset',
    description: 'Warm dusk tones with orange and rose accents.',
    colors: ['#1c1414', '#f97316', '#fda4af'],
  },
  {
    id: 'ocean',
    name: 'Ocean',
    description: 'Deep teal and aqua tones inspired by the sea.',
    colors: ['#0f1a1e', '#2dd4bf', '#67e8f9'],
  },
  {
    id: 'forest',
    name: 'Forest',
    description: 'Earthy greens with warm amber accents.',
    colors: ['#0f1a12', '#22c55e', '#fbbf24'],
  },
  {
    id: 'nord',
    name: 'Nord',
    description: 'Inspired by the popular Nord color palette.',
    colors: ['#1c2333', '#81a1c1', '#88c0d0'],
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
