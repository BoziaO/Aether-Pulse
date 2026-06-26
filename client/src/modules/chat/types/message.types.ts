export enum MessageStatus {
  Sending = 'sending',
  Sent = 'sent',
  Delivered = 'delivered',
  Read = 'read',
  Failed = 'failed',
}

export type MessageType = 'text' | 'system' | 'file' | 'image'

export interface Attachment {
  url: string
  name: string
  mime: string
  size?: number
  width?: number
  height?: number
  thumbnailUrl?: string
}

export interface Reaction {
  emoji: string
  count: number
  userIds: string[]
}

export interface ReplyPreview {
  id: string
  content: string
  userId: string
  isDeleted: boolean
  user?: { displayName?: string } | null
}

export interface MessageUser {
  id: string
  displayName: string
  avatarUrl: string | null
  accentColor: string | null
  profileGradient: string | null
  primaryColor?: string | null
  displayNameStyle?: string | null
  status?: string
}

export interface Message {
  clientId: string
  serverId?: string
  roomId: string
  userId: string
  content: string
  type: MessageType
  status: MessageStatus
  replyToId?: string | null
  replyTo?: ReplyPreview | null
  attachments: Attachment[]
  reactions: Reaction[]
  createdAt: string
  editedAt?: string | null
  isDeleted: boolean
  user?: MessageUser | null
}

export interface ServerMessagePayload {
  id: string
  roomId: string
  userId: string
  content: string
  type: string
  replyToId?: string | null
  editedAt?: string | null
  isDeleted?: boolean
  createdAt: string
  user?: MessageUser | null
  reactions?: Array<{ emoji: string; count: number; userIds: string[] }> | null
  replyTo?: ReplyPreview | null
  attachmentUrl?: string | null
  attachmentName?: string | null
  attachmentMime?: string | null
  clientId?: string | null
}

export function isServerPayload(msg: Message | ServerMessagePayload): msg is ServerMessagePayload {
  return 'id' in msg
}
