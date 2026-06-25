import { apiFetch } from './client'
import type { User } from '@/types/user.types'

export interface AuthResponse {
  user: User
  accessToken: string
  refreshToken: string
}

export interface TokensResponse {
  accessToken: string
  refreshToken: string
}

export const authApi = {
  login: (username: string, password: string) =>
    apiFetch<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  register: (username: string, email: string, password: string, displayName: string) =>
    apiFetch<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password, displayName }),
    }),

  changePassword: (currentPassword: string, newPassword: string) =>
    apiFetch<{ ok: boolean }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  logout: () => apiFetch<{ ok: boolean }>('/auth/logout', { method: 'POST' }),

  me: () => apiFetch<{ user: User | null }>('/auth/me'),

  refresh: (refreshToken: string) =>
    apiFetch<TokensResponse>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }),
}
