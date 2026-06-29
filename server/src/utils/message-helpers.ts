import type { Server as SocketIOServer } from 'socket.io'

import { MessageRepository, type LeanMessage, type ReactionSummary } from '../repositories/message.repository'
import { UserRepository, type LeanUser } from '../repositories/user.repository'
import { serializeUser } from './serialize-user'

export async function getReactionsForMessages(
  messageIds: string[]
): Promise<Map<string, ReactionSummary[]>> {
  return MessageRepository.getReactions(messageIds)
}

export function serializeMessageRow(
  message: LeanMessage,
  user: LeanUser | null,
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
  const message = await MessageRepository.findById(messageId)
  if (!message) return null

  const user = await UserRepository.findById(message.userId.toString())

  const reactionsMap = await getReactionsForMessages([messageId])
  let replyTo = null
  if (message.replyToId) {
    const parent = await MessageRepository.findById(message.replyToId.toString())
    if (parent) {
      replyTo = {
        id: parent._id.toString(),
        content: parent.isDeleted ? 'Message deleted' : parent.content,
        userId: parent.userId.toString(),
        isDeleted: parent.isDeleted,
      }
    }
  }

  return serializeMessageRow(message, user, reactionsMap.get(messageId) ?? [], replyTo)
}

export function broadcastMessage(
  io: SocketIOServer,
  roomId: string,
  event: string,
  payload: unknown
) {
  io.to(roomId).emit(event, payload)
}
