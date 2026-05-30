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
  createdAt: string
}
