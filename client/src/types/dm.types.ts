import type { User } from './user.types'

export interface DmLastMessage {
  content: string
  type: 'text' | 'file'
  attachmentName?: string | null | undefined
  createdAt: string
  userId: string
}

export interface DmConversation {
  id: string
  otherUser: User | null
  lastMessage: DmLastMessage | null
  updatedAt: string
}

export interface DmMessageUser {
  id: string
  displayName: string
  avatarUrl: string | null
  accentColor: string | null
  profileGradient: string | null
  status?: string
}

export interface DmMessage {
  id: string
  conversationId: string
  userId: string
  content: string
  type: 'text' | 'file'
  attachmentUrl?: string | null
  attachmentName?: string | null
  attachmentMime?: string | null
  replyToId?: string | null
  editedAt?: string | null
  isDeleted?: boolean
  createdAt: string
  user?: DmMessageUser | null
  replyTo?: { id: string; content: string; userId: string; isDeleted: boolean; user?: { displayName?: string } | null } | null
}
