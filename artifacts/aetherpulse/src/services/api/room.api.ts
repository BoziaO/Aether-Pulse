import { apiFetch } from './client'
import type { Room } from '@/types/room.types'
import type { Message } from '@/types/message.types'

export const roomApi = {
  list: () => apiFetch<Room[]>('/rooms'),

  get: (roomId: string) => apiFetch<Room>(`/rooms/${roomId}`),

  create: (name: string) =>
    apiFetch<Room>('/rooms', { method: 'POST', body: JSON.stringify({ name }) }),

  joinByCode: (inviteCode: string) =>
    apiFetch<Room>('/rooms/join-by-code', { method: 'POST', body: JSON.stringify({ inviteCode }) }),

  messages: (roomId: string) => apiFetch<Message[]>(`/rooms/${roomId}/messages`),

  sendMessage: (roomId: string, content: string) =>
    apiFetch<Message>(`/rooms/${roomId}/messages`, { method: 'POST', body: JSON.stringify({ content }) }),
}
