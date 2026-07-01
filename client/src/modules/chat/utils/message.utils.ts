import type { Message, ServerMessagePayload, Reaction, Attachment } from '../types/message.types'
import { MessageStatus } from '../types/message.types'

const GROUP_WINDOW_MS = 5 * 60 * 1000

export function generateClientId(): string {
  return crypto.randomUUID()
}

export function createOptimisticMessage(
  roomId: string,
  userId: string,
  content: string,
  user?: Message['user'],
  replyToId?: string
): Message {
  const now = new Date().toISOString()
  return {
    clientId: generateClientId(),
    roomId,
    userId,
    content,
    type: 'text',
    status: MessageStatus.Sending,
    replyToId: replyToId || null,
    attachments: [],
    reactions: [],
    createdAt: now,
    isDeleted: false,
    user: user || null,
  }
}

export function serverPayloadToMessage(payload: ServerMessagePayload): Message {
  const attachments: Attachment[] = []
  if (payload.attachmentUrl && payload.attachmentName) {
    attachments.push({
      url: payload.attachmentUrl,
      name: payload.attachmentName,
      mime: payload.attachmentMime || 'application/octet-stream',
    })
  }

  return {
    clientId: payload.clientId || `server:${payload.id}`,
    serverId: payload.id,
    roomId: payload.roomId,
    userId: payload.userId,
    content: payload.content,
    type: (payload.type as Message['type']) || 'text',
    status: payload.isDeleted ? MessageStatus.Read : MessageStatus.Sent,
    replyToId: payload.replyToId || null,
    replyTo: payload.replyTo || null,
    attachments,
    reactions: (payload.reactions || []) as Reaction[],
    createdAt: payload.createdAt,
    editedAt: payload.editedAt || null,
    isDeleted: payload.isDeleted || false,
    isStarred: payload.isStarred || false,
    user: payload.user || null,
  }
}

export function matchOptimisticMessage(
  serverMsg: Message,
  pendingMessages: Map<string, Message>
): string | null {
  const candidates: Message[] = []
  for (const msg of pendingMessages.values()) {
    if (
      msg.status === MessageStatus.Sending &&
      msg.roomId === serverMsg.roomId &&
      msg.userId === serverMsg.userId
    ) {
      candidates.push(msg)
    }
  }

  const serverTime = new Date(serverMsg.createdAt).getTime()

  for (const candidate of candidates) {
    if (candidate.content !== serverMsg.content) continue
    const candidateTime = new Date(candidate.createdAt).getTime()
    if (Math.abs(candidateTime - serverTime) < 5000) {
      return candidate.clientId
    }
  }

  return null
}

export function upsertMessage(
  messages: Map<string, Message>,
  message: Message
): Map<string, Message> {
  const next = new Map(messages)
  const key = message.serverId || message.clientId

  const existing = next.get(key)
  if (!existing) {
    next.set(key, message)
    return next
  }

  const merged: Message = {
    ...existing,
    ...message,
    status: mergeStatus(existing.status, message.status, !!message.serverId),
    reactions: message.reactions.length > 0 ? message.reactions : existing.reactions,
  }

  next.set(key, merged)
  return next
}

function mergeStatus(
  existing: MessageStatus,
  incoming: MessageStatus,
  hasServerId: boolean
): MessageStatus {
  if (hasServerId && existing === MessageStatus.Sending) {
    return MessageStatus.Sent
  }
  const order = [
    MessageStatus.Sending,
    MessageStatus.Sent,
    MessageStatus.Delivered,
    MessageStatus.Read,
  ]
  const existingIdx = order.indexOf(existing)
  const incomingIdx = order.indexOf(incoming)
  return incomingIdx > existingIdx ? incoming : existing
}

export function messageGroupMeta(
  messages: Message[]
): Map<string, { showAvatar: boolean; showAuthor: boolean; isGrouped: boolean }> {
  const meta = new Map<string, { showAvatar: boolean; showAuthor: boolean; isGrouped: boolean }>()

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i]

    if (msg.type === 'system') {
      meta.set(msg.clientId, { showAvatar: false, showAuthor: false, isGrouped: false })
      continue
    }

    const prev = i > 0 ? messages[i - 1] : null
    const next = i < messages.length - 1 ? messages[i + 1] : null

    const sameAsPrev = prev != null && prev.userId === msg.userId && prev.type !== 'system'
    const sameAsNext = next != null && next.userId === msg.userId && next.type !== 'system'

    if (!sameAsPrev && !sameAsNext) {
      meta.set(msg.clientId, { showAvatar: true, showAuthor: true, isGrouped: false })
      continue
    }

    const currTime = new Date(msg.createdAt).getTime()
    let inGroup = false

    if (sameAsPrev) {
      inGroup = currTime - new Date(prev!.createdAt).getTime() < GROUP_WINDOW_MS
    }
    if (!inGroup && sameAsNext) {
      inGroup = new Date(next!.createdAt).getTime() - currTime < GROUP_WINDOW_MS
    }

    if (!inGroup) {
      meta.set(msg.clientId, { showAvatar: true, showAuthor: true, isGrouped: false })
    } else {
      meta.set(msg.clientId, {
        showAvatar: !sameAsPrev,
        showAuthor: !sameAsPrev,
        isGrouped: sameAsPrev,
      })
    }
  }

  return meta
}

export function getSortedMessages(messages: Map<string, Message>): Message[] {
  return Array.from(messages.values())
    .filter((m) => !m.isDeleted)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
}
