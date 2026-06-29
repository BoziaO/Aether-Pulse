export type ThemeMode = 'midnight-lavender' | 'candlelight' | 'aurora' | 'sakura-night' | 'system'

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
    id: 'midnight-lavender',
    name: 'Midnight Lavender',
    description: 'Calm night, pastel cyber. The default theme.',
    colors: ['#0F1018', '#B7A7FF', '#F5F4FF'],
  },
  {
    id: 'candlelight',
    name: 'Candlelight',
    description: 'Warm candlelight glow for a cozy atmosphere.',
    colors: ['#1A1513', '#FFC78E', '#FFF4E7'],
  },
  {
    id: 'aurora',
    name: 'Aurora',
    description: 'Northern lights and neon minimalism.',
    colors: ['#09111D', '#79F2FF', '#F2FBFF'],
  },
  {
    id: 'sakura-night',
    name: 'Sakura Night',
    description: 'Delicate, pastel evening vibes.',
    colors: ['#14121C', '#FFB7D5', '#FFF8FC'],
  },
  {
    id: 'system',
    name: 'System',
    description: 'Follows your operating system preference.',
    colors: ['#0F1018', '#B7A7FF', '#F5F4FF'],
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
