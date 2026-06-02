export interface SocialLink {
  platform: string
  url: string
  label?: string
}

export interface User {
  id: number
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
  profileGradient: string | null
  badges: string[]
  socialLinks: SocialLink[]
  timezone: string | null
  profilePrivacy: 'public' | 'friends' | 'private'
  showTimezone: boolean
  showLastSeen: boolean
  showProfileViews: boolean
  preferredTheme: string | null
  lastSeenAt: string | null
  profileViews: number | null
  createdAt: string
}
