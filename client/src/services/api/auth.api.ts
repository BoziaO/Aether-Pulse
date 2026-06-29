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

  forgotPassword: (email: string) =>
    apiFetch<{ ok: boolean }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token: string, newPassword: string) =>
    apiFetch<{ ok: boolean }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    }),

  getOAuthUrl: (provider: 'google' | 'github') =>
    apiFetch<{ url: string }>(`/auth/oauth/${provider}/url`),

  oauthCallback: (provider: string, code: string) =>
    apiFetch<AuthResponse>(`/auth/oauth/${provider}/callback`, {
      method: 'POST',
      body: JSON.stringify({ code }),
    }),
}
