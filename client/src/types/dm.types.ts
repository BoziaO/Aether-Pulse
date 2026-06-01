import type { User } from './user.types'

export interface DmLastMessage {
  content: string
  type: 'text' | 'file'
  attachmentName?: string | null
  createdAt: string
  userId: number
}

export interface DmConversation {
  id: string
  otherUser: User | null
  lastMessage: DmLastMessage | null
  updatedAt: string
}

export interface DmMessageUser {
  id: number
  displayName: string
  avatarUrl: string | null
  accentColor: string | null
  profileGradient: string | null
  status?: string
}

export interface DmMessage {
  id: number
  conversationId: string
  userId: number
  content: string
  type: 'text' | 'file'
  attachmentUrl?: string | null
  attachmentName?: string | null
  attachmentMime?: string | null
  replyToId?: number | null
  editedAt?: string | null
  isDeleted?: boolean
  createdAt: string
  user?: DmMessageUser | null
  replyTo?: { id: number; content: string; userId: number; isDeleted: boolean } | null
}
