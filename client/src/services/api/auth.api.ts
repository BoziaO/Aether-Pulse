import { apiFetch } from './client'
import type { User } from '@/types/user.types'

export const authApi = {
  login: (username: string, password: string) =>
    apiFetch<{ user: User }>('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),

  register: (username: string, password: string, displayName: string) =>
    apiFetch<{ user: User }>('/auth/register', { method: 'POST', body: JSON.stringify({ username, password, displayName }) }),

  logout: () => apiFetch<{ ok: boolean }>('/auth/logout', { method: 'POST' }),

  me: () => apiFetch<{ user: User | null }>('/auth/me'),
}
