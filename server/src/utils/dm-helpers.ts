import { DmConversation, DmParticipant, DmMessage, User } from '@workspace/db'

import { serializeUser } from './serialize-user'

export async function findConversationBetween(
  userA: string,
  userB: string
): Promise<string | null> {
  // Find conversations where both users are participants
  const participationsA = await DmParticipant.find({ userId: userA }).lean()
  const convIdsA = participationsA.map((p) => p.conversationId.toString())

  if (convIdsA.length === 0) return null

  const participationsB = await DmParticipant.find({
    conversationId: { $in: convIdsA },
    userId: userB,
  }).lean()

  if (participationsB.length === 0) return null

  // Find the conversation that has exactly both of them
  for (const p of participationsB) {
    const convId = p.conversationId.toString()
    const allParticipants = await DmParticipant.find({ conversationId: convId }).lean()
    if (allParticipants.length === 2) return convId
  }
  return null
}

export async function getOrCreateConversation(userA: string, userB: string): Promise<string> {
  const existing = await findConversationBetween(userA, userB)
  if (existing) return existing

  const conv = await DmConversation.create({})
  const id = conv._id.toString()
  await DmParticipant.create([
    { conversationId: id, userId: userA },
    { conversationId: id, userId: userB },
  ])
  return id
}

export async function isDmParticipant(conversationId: string, userId: string): Promise<boolean> {
  const row = await DmParticipant.findOne({ conversationId, userId }).lean()
  return Boolean(row)
}

export async function buildDmMessagePayload(messageId: string) {
  const message = await DmMessage.findById(messageId).lean()
  if (!message) return null

  const user = await User.findById(message.userId).lean()

  let replyTo = null
  if (message.replyToId) {
    const parent = await DmMessage.findById(message.replyToId).lean()
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
    user: user ? serializeUser(user as any) : null,
    replyTo,
  }
}

export async function getOtherParticipant(conversationId: string, userId: string) {
  const participants = await DmParticipant.find({ conversationId }).lean()
  const other = participants.find((p) => p.userId.toString() !== userId)
  if (!other) return null
  return User.findById(other.userId).lean()
}
