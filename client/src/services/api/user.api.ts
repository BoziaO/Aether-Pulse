import { apiFetch } from './client'
import type { User } from '@/types/user.types'

export interface UserStats {
  messageCount: number
  friendCount: number
  topReactions: { emoji: string; count: number }[]
  activityByDay: { date: string; count: number }[]
}

export const userApi = {
  getStats: (userId: string) => apiFetch<UserStats>(`/users/${userId}/stats`),
  update: (
    userId: string,
    data: Partial<
      Pick<
        User,
        | 'displayName'
        | 'bio'
        | 'pronouns'
        | 'website'
        | 'location'
        | 'avatarUrl'
        | 'bannerUrl'
        | 'customStatus'
        | 'accentColor'
        | 'profileGradient'
        | 'status'
        | 'avatarFrame'
        | 'profileTheme'
        | 'customTheme'
      >
    >
  ) => apiFetch<User>(`/users/${userId}`, { method: 'PATCH', body: JSON.stringify(data) }),

  get: (userId: string) => apiFetch<User>(`/users/${userId}`),

  uploadAvatar: (userId: string, dataUrl: string) =>
    apiFetch<{ avatarUrl: string; user: User }>(`/users/${userId}/avatar`, {
      method: 'POST',
      body: JSON.stringify({ dataUrl }),
    }),

  uploadBanner: (userId: string, dataUrl: string) =>
    apiFetch<{ bannerUrl: string; user: User }>(`/users/${userId}/banner`, {
      method: 'POST',
      body: JSON.stringify({ dataUrl }),
    }),
}
