import type { Message } from '../types/message.types'
import { MessageStatus } from '../types/message.types'
import { createOptimisticMessage } from '../utils/message.utils'

export interface SendResult {
  success: boolean
  error?: string
}

export interface SendOptions {
  roomId: string
  userId: string
  content: string
  user?: Message['user']
  replyToId: string | undefined
  onEmit: (roomId: string, content: string, clientId: string, replyToId?: string) => void
  onOptimistic: (message: Message) => void
  onConfirm: (clientId: string) => void
  onFail: (clientId: string) => void
}

export function sendMessage(options: SendOptions): Message {
  const message = createOptimisticMessage(
    options.roomId,
    options.userId,
    options.content,
    options.user,
    options.replyToId
  )

  options.onOptimistic(message)

  try {
    options.onEmit(options.roomId, options.content, message.clientId, options.replyToId)
  } catch {
    options.onFail(message.clientId)
  }

  return message
}

export function confirmMessage(
  clientId: string,
  fields: Partial<Message>,
  updateFn: (msg: Message) => void
): void {
  const msg: Message = {
    clientId,
    serverId: fields.serverId,
    roomId: fields.roomId || '',
    userId: fields.userId || '',
    content: fields.content || '',
    type: fields.type || 'text',
    status: MessageStatus.Sent,
    replyToId: fields.replyToId || null,
    attachments: fields.attachments || [],
    reactions: fields.reactions || [],
    createdAt: fields.createdAt || new Date().toISOString(),
    editedAt: fields.editedAt || null,
    isDeleted: fields.isDeleted || false,
    user: fields.user || null,
  } as Message

  updateFn(msg)
}
