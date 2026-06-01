export interface MessageUser {
  id: number
  displayName: string
  avatarUrl: string | null
  accentColor: string | null
  profileGradient: string | null
  status?: string
}

export interface MessageReaction {
  emoji: string
  count: number
  userIds: number[]
}

export interface MessageReplyPreview {
  id: number
  content: string
  userId: number
  isDeleted: boolean
}

/** Minimal shape for reply bar in ChatInput */
export interface ReplyTarget {
  id: number
  user?: { displayName?: string } | null
}

export interface Message {
  id: number
  roomId: string
  userId: number
  content: string
  type: 'text' | 'system' | 'file'
  replyToId?: number | null
  editedAt?: string | null
  isDeleted?: boolean
  createdAt: string
  user?: MessageUser | null
  reactions?: MessageReaction[]
  replyTo?: MessageReplyPreview | null
  attachmentUrl?: string | null
  attachmentName?: string | null
  attachmentMime?: string | null
}
