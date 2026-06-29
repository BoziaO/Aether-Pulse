import { DmRepository } from '../repositories/dm.repository'
import { UserRepository } from '../repositories/user.repository'
import { serializeUser } from './serialize-user'

export async function findConversationBetween(
  userA: string,
  userB: string
): Promise<string | null> {
  return DmRepository.findConversationBetween(userA, userB)
}

export async function getOrCreateConversation(userA: string, userB: string): Promise<string> {
  const existing = await DmRepository.findConversationBetween(userA, userB)
  if (existing) return existing

  const convId = await DmRepository.createConversation()
  await DmRepository.addParticipants(convId, [userA, userB])
  return convId
}

export async function isDmParticipant(conversationId: string, userId: string): Promise<boolean> {
  return DmRepository.isParticipant(conversationId, userId)
}

export async function buildDmMessagePayload(messageId: string) {
  const message = await DmRepository.findMessageById(messageId)
  if (!message) return null

  const user = await UserRepository.findById(message.userId.toString())

  let replyTo = null
  if (message.replyToId) {
    const parent = await DmRepository.findMessageById(message.replyToId.toString())
    if (parent) {
      replyTo = {
        id: parent._id.toString(),
        content: parent.isDeleted ? 'Message deleted' : parent.content,
        userId: parent.userId.toString(),
        isDeleted: parent.isDeleted,
      }
    }
  }

  return {
    id: message._id.toString(),
    conversationId: message.conversationId.toString(),
    userId: message.userId.toString(),
    content: message.isDeleted ? '' : message.content,
    type: message.type,
    attachmentUrl: message.attachmentUrl ?? null,
    attachmentName: message.attachmentName ?? null,
    attachmentMime: message.attachmentMime ?? null,
    replyToId: message.replyToId ? message.replyToId.toString() : null,
    editedAt: message.editedAt ? message.editedAt.toISOString() : null,
    isDeleted: message.isDeleted,
    createdAt: message.createdAt.toISOString(),
    user: user ? serializeUser(user) : null,
    replyTo,
  }
}

export async function getOtherParticipant(conversationId: string, userId: string) {
  return DmRepository.getOtherParticipant(conversationId, userId)
}
