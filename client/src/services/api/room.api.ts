import { apiFetch } from './client'
import type { Room } from '@/types/room.types'
import type { Message } from '@/types/message.types'

export const roomApi = {
  list: () => apiFetch<Room[]>('/rooms'),

  get: (roomId: string) => apiFetch<Room>(`/rooms/${roomId}`),

  create: (name: string, quality?: string) =>
    apiFetch<Room>('/rooms', { method: 'POST', body: JSON.stringify({ name, quality }) }),

  update: (roomId: string, data: { name?: string; quality?: string }) =>
    apiFetch<Room>(`/rooms/${roomId}`, { method: 'PATCH', body: JSON.stringify(data) }),

  delete: (roomId: string) => apiFetch<void>(`/rooms/${roomId}`, { method: 'DELETE' }),

  leave: (roomId: string) =>
    apiFetch<{ ok: boolean }>(`/rooms/${roomId}/leave`, { method: 'POST' }),

  joinByCode: (inviteCode: string) =>
    apiFetch<Room>('/rooms/join-by-code', { method: 'POST', body: JSON.stringify({ inviteCode }) }),

  messages: (roomId: string, opts?: { before?: string; limit?: number }) => {
    const params = new URLSearchParams()
    if (opts?.before) params.set('before', opts.before)
    if (opts?.limit) params.set('limit', String(opts.limit))
    const qs = params.toString()
    return apiFetch<Message[]>(`/rooms/${roomId}/messages${qs ? `?${qs}` : ''}`)
  },

  searchMessages: (roomId: string, q: string) =>
    apiFetch<Message[]>(`/rooms/${roomId}/messages/search?q=${encodeURIComponent(q)}`),

  sendMessage: (roomId: string, content: string, replyToId?: string) =>
    apiFetch<Message>(`/rooms/${roomId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content, replyToId }),
    }),

  editMessage: (roomId: string, messageId: string, content: string) =>
    apiFetch<Message>(`/rooms/${roomId}/messages/${messageId}`, {
      method: 'PATCH',
      body: JSON.stringify({ content }),
    }),

  deleteMessage: (roomId: string, messageId: string) =>
    apiFetch<Message>(`/rooms/${roomId}/messages/${messageId}`, { method: 'DELETE' }),

  toggleReaction: (roomId: string, messageId: string, emoji: string) =>
    apiFetch<Message>(`/rooms/${roomId}/messages/${messageId}/reactions`, {
      method: 'POST',
      body: JSON.stringify({ emoji }),
    }),

  uploadFile: (
    roomId: string,
    dataUrl: string,
    fileName: string,
    caption?: string,
    replyToId?: string
  ) =>
    apiFetch<Message>(`/rooms/${roomId}/upload`, {
      method: 'POST',
      body: JSON.stringify({ dataUrl, fileName, caption, replyToId }),
    }),
}
