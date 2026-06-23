import type { ThemeMode } from './settings.types'

export interface SocialLink {
  platform: string
  url: string
  label?: string
}

export interface User {
  id: string
  username: string
  displayName: string
  avatarUrl: string | null
  bannerUrl: string | null
  bio: string | null
  pronouns: string | null
  website: string | null
  location: string | null
  status: 'online' | 'away' | 'busy' | 'offline'
  customStatus: string | null
  accentColor: string | null
  primaryColor: string | null
  displayNameStyle: string | null
  profileGradient: string | null
  avatarFrame: string | null
  profileTheme: string | null
  customTheme: ThemeMode | null
  badges: string[]
  socialLinks: SocialLink[]
  timezone: string | null
  profilePrivacy: 'public' | 'friends' | 'private'
  showTimezone: boolean
  showLastSeen: boolean
  showProfileViews: boolean
  preferredTheme: ThemeMode | null
  lastSeenAt: string | null
  profileViews: number | null
  createdAt: string
}
