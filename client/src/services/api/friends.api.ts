import { apiFetch } from './client'
import type { FriendsData, FriendshipStatus, UserSearchResult } from '@/types/friend.types'
import type { User } from '@/types/user.types'

export const friendsApi = {
  list: () => apiFetch<FriendsData>('/friends'),

  search: (q: string) => apiFetch<UserSearchResult[]>(`/friends/search?q=${encodeURIComponent(q)}`),

  getStatus: (userId: number) =>
    apiFetch<{ status: FriendshipStatus }>(`/friends/status/${userId}`),

  sendRequest: (userId: number) =>
    apiFetch<{ status: string; user: User }>('/friends/request', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),

  accept: (userId: number) =>
    apiFetch<{ status: string; user: User | null }>('/friends/accept', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),

  reject: (userId: number) =>
    apiFetch<{ ok: boolean }>('/friends/reject', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),

  remove: (userId: number) =>
    apiFetch<{ ok: boolean }>(`/friends/${userId}`, { method: 'DELETE' }),

  block: (userId: number) =>
    apiFetch<{ ok: boolean }>('/friends/block', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),
}
