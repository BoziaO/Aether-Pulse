import { apiFetch } from './client'
import type { User } from '@/types/user.types'

export const userApi = {
  update: (
    userId: number,
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

  get: (userId: number) => apiFetch<User>(`/users/${userId}`),

  uploadAvatar: (userId: number, dataUrl: string) =>
    apiFetch<{ avatarUrl: string; user: User }>(`/users/${userId}/avatar`, {
      method: 'POST',
      body: JSON.stringify({ dataUrl }),
    }),

  uploadBanner: (userId: number, dataUrl: string) =>
    apiFetch<{ bannerUrl: string; user: User }>(`/users/${userId}/banner`, {
      method: 'POST',
      body: JSON.stringify({ dataUrl }),
    }),
}
