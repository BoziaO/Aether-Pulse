import type { Server as SocketIOServer } from 'socket.io'
import { Message, MessageReaction, User } from '@workspace/db'
import type { IMessage } from '@workspace/db'

import { serializeUser } from './serialize-user'

export type ReactionSummary = {
  emoji: string
  count: number
  userIds: string[]
}

export async function getReactionsForMessages(
  messageIds: string[]
): Promise<Map<string, ReactionSummary[]>> {
  const map = new Map<string, ReactionSummary[]>()
  if (messageIds.length === 0) return map

  const rows = await MessageReaction.find({ messageId: { $in: messageIds } }).lean()

  for (const row of rows) {
    const key = row.messageId.toString()
    const list = map.get(key) ?? []
    const existing = list.find((r) => r.emoji === row.emoji)
    if (existing) {
      existing.count += 1
      existing.userIds.push(row.userId.toString())
    } else {
      list.push({ emoji: row.emoji, count: 1, userIds: [row.userId.toString()] })
    }
    map.set(key, list)
  }
  return map
}

export function serializeMessageRow(
  message: IMessage,
  user: any,
  reactions?: ReactionSummary[],
  replyTo?: { id: string; content: string; userId: string; isDeleted: boolean } | null
) {
  return {
    id: message._id.toString(),
    roomId: message.roomId.toString(),
    userId: message.userId.toString(),
    content: message.isDeleted ? '' : message.content,
    type: message.type,
    replyToId: message.replyToId ? message.replyToId.toString() : null,
    editedAt: message.editedAt ? message.editedAt.toISOString() : null,
    isDeleted: message.isDeleted,
    attachmentUrl: message.attachmentUrl ?? null,
    attachmentName: message.attachmentName ?? null,
    attachmentMime: message.attachmentMime ?? null,
    createdAt: message.createdAt.toISOString(),
    user: user ? serializeUser(user) : null,
    reactions: reactions ?? [],
    replyTo: replyTo ?? null,
  }
}

export async function buildMessagePayload(messageId: string) {
  const message = await Message.findById(messageId).lean()
  if (!message) return null

  const user = await User.findById(message.userId).lean()

  const reactionsMap = await getReactionsForMessages([messageId])
  let replyTo = null
  if (message.replyToId) {
    const parent = await Message.findById(message.replyToId).lean()
    if (parent) {
      replyTo = {
        id: parent._id.toString(),
        content: parent.isDeleted ? 'Message deleted' : parent.content,
        userId: parent.userId.toString(),
        isDeleted: parent.isDeleted,
      }
    }
  }

  return serializeMessageRow(message as any, user, reactionsMap.get(messageId) ?? [], replyTo)
}

export function broadcastMessage(
  io: SocketIOServer,
  roomId: string,
  event: string,
  payload: unknown
) {
  io.to(roomId).emit(event, payload)
}
