import type { Message, ServerMessagePayload } from '../types/message.types'
import { serverPayloadToMessage } from '../utils/message.utils'

const API_BASE = '/api'

async function apiFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const token = localStorage.getItem('aetherpulse_access_token')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: { ...headers, ...(opts?.headers as Record<string, string>) },
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: { message: res.statusText } }))
    throw new Error(body.error?.message || `Request failed: ${res.status}`)
  }

  return res.json()
}

function parseMessage(payload: ServerMessagePayload): Message {
  return serverPayloadToMessage(payload)
}

export const chatApi = {
  messages: (roomId: string, opts?: { before?: string; limit?: number }) => {
    const params = new URLSearchParams()
    if (opts?.before) params.set('before', opts.before)
    if (opts?.limit) params.set('limit', String(opts.limit))
    const qs = params.toString()
    return apiFetch<ServerMessagePayload[]>(`/rooms/${roomId}/messages${qs ? `?${qs}` : ''}`)
  },

  searchMessages: (roomId: string, q: string) => {
    return apiFetch<ServerMessagePayload[]>(
      `/rooms/${roomId}/messages/search?q=${encodeURIComponent(q)}`
    )
  },

  editMessage: (roomId: string, messageId: string, content: string) => {
    return apiFetch<ServerMessagePayload>(`/rooms/${roomId}/messages/${messageId}`, {
      method: 'PATCH',
      body: JSON.stringify({ content }),
    }).then(parseMessage)
  },

  deleteMessage: (roomId: string, messageId: string) => {
    return apiFetch<ServerMessagePayload>(`/rooms/${roomId}/messages/${messageId}`, {
      method: 'DELETE',
    }).then(parseMessage)
  },

  toggleReaction: (roomId: string, messageId: string, emoji: string) => {
    return apiFetch<ServerMessagePayload>(`/rooms/${roomId}/messages/${messageId}/reactions`, {
      method: 'POST',
      body: JSON.stringify({ emoji }),
    }).then(parseMessage)
  },

  uploadFile: (roomId: string, dataUrl: string, fileName: string, caption?: string) => {
    return apiFetch<ServerMessagePayload>(`/rooms/${roomId}/upload`, {
      method: 'POST',
      body: JSON.stringify({ dataUrl, fileName, caption }),
    }).then(parseMessage)
  },
}
