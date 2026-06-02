import { apiFetch } from './client'
import type { User, SocialLink } from '@/types/user.types'

export interface UpdateUserData {
  displayName?: string
  bio?: string | null
  pronouns?: string | null
  website?: string | null
  location?: string | null
  avatarUrl?: string | null
  bannerUrl?: string | null
  customStatus?: string | null
  accentColor?: string
  profileGradient?: string | null
  status?: User['status']
  socialLinks?: string | null
  timezone?: string | null
  profilePrivacy?: 'public' | 'friends' | 'private'
  showTimezone?: boolean
  showLastSeen?: boolean
  showProfileViews?: boolean
  preferredTheme?: string | null
}

export interface UserStats {
  messageCount: number
  friendCount: number
  topReactions: { emoji: string; count: number }[]
  activityByDay: { date: string; count: number }[]
}

export const userApi = {
  update: (userId: number, data: UpdateUserData) =>
    apiFetch<User>(`/users/${userId}`, { method: 'PATCH', body: JSON.stringify(data) }),

  get: (userId: number) => apiFetch<User>(`/users/${userId}`),

  getStats: (userId: number) => apiFetch<UserStats>(`/users/${userId}/stats`),

  uploadAvatar: (userId: number, dataUrl: string) =>
    apiFetch<{ avatarUrl: string; user: User }>(`/users/${userId}/avatar`, { method: 'POST', body: JSON.stringify({ dataUrl }) }),

  uploadBanner: (userId: number, dataUrl: string) =>
    apiFetch<{ bannerUrl: string; user: User }>(`/users/${userId}/banner`, { method: 'POST', body: JSON.stringify({ dataUrl }) }),

  serializeSocialLinks: (links: SocialLink[]): string => JSON.stringify(links),

  parseSocialLinks: (raw: string | null | undefined): SocialLink[] => {
    if (!raw) return []
    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  },
}
