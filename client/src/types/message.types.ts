export interface MessageUser {
  id: string
  displayName: string
  avatarUrl: string | null
  accentColor: string | null
  primaryColor?: string | null
  displayNameStyle?: string | null
  profileGradient: string | null
  status?: string
}

export interface MessageReaction {
  emoji: string
  count: number
  userIds: string[]
}

export interface MessageReplyPreview {
  id: string
  content: string
  userId: string
  isDeleted: boolean
  user?: { displayName?: string } | null
}

/** Minimal shape for reply bar in ChatInput */
export interface ReplyTarget {
  id: string
  user?: { displayName?: string } | null
}

export interface Message {
  id: string
  roomId: string
  userId: string
  content: string
  type: 'text' | 'system' | 'file'
  replyToId?: string | null
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
