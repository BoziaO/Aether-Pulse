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

  register: (username: string, password: string, displayName: string) =>
    apiFetch<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, displayName }),
    }),

  logout: () => apiFetch<{ ok: boolean }>('/auth/logout', { method: 'POST' }),

  me: () => apiFetch<{ user: User | null }>('/auth/me'),

  refresh: (refreshToken: string) =>
    apiFetch<TokensResponse>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }),
}
