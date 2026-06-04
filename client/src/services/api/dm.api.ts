import { apiFetch } from './client'
import type { DmConversation, DmMessage } from '@/types/dm.types'
import type { User } from '@/types/user.types'

export const dmApi = {
  list: () => apiFetch<DmConversation[]>('/dms'),

  openWith: (userId: number) =>
    apiFetch<{ id: string; otherUser: User | null }>(`/dms/with/${userId}`, { method: 'POST' }),

  messages: (conversationId: string, opts?: { before?: number; limit?: number }) => {
    const params = new URLSearchParams()
    if (opts?.before) params.set('before', String(opts.before))
    if (opts?.limit) params.set('limit', String(opts.limit))
    const qs = params.toString()
    return apiFetch<DmMessage[]>(`/dms/${conversationId}/messages${qs ? `?${qs}` : ''}`)
  },

  send: (conversationId: string, content: string, replyToId?: number) =>
    apiFetch<DmMessage>(`/dms/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content, replyToId }),
    }),

  upload: (conversationId: string, dataUrl: string, fileName: string, caption?: string) =>
    apiFetch<DmMessage>(`/dms/${conversationId}/upload`, {
      method: 'POST',
      body: JSON.stringify({ dataUrl, fileName, caption }),
    }),

  edit: (conversationId: string, messageId: number, content: string) =>
    apiFetch<DmMessage>(`/dms/${conversationId}/messages/${messageId}`, {
      method: 'PATCH',
      body: JSON.stringify({ content }),
    }),

  delete: (conversationId: string, messageId: number) =>
    apiFetch<DmMessage>(`/dms/${conversationId}/messages/${messageId}`, {
      method: 'DELETE',
    }),
}
