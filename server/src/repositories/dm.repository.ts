import mongoose from 'mongoose'
import { DmConversation, DmParticipant, DmMessage } from '@workspace/db'

import { UserRepository } from './user.repository'

export type LeanDmConversation = {
  _id: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

export type LeanDmParticipant = {
  _id: mongoose.Types.ObjectId
  conversationId: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  joinedAt: Date
}

export type LeanDmMessage = {
  _id: mongoose.Types.ObjectId
  conversationId: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  content: string
  type: 'text' | 'file'
  attachmentUrl?: string | null
  attachmentName?: string | null
  attachmentMime?: string | null
  replyToId?: mongoose.Types.ObjectId | null
  editedAt?: Date | null
  isDeleted: boolean
  createdAt: Date
  updatedAt: Date
}

type DmMessageCreateData = {
  conversationId: string | mongoose.Types.ObjectId
  userId: string | mongoose.Types.ObjectId
  content: string
  type?: string
  replyToId?: string | mongoose.Types.ObjectId | null | undefined
  attachmentUrl?: string | null
  attachmentName?: string | null
  attachmentMime?: string | null
}

type DmMessageUpdateData = {
  content?: string
  editedAt?: Date
  isDeleted?: boolean
}

export const DmRepository = {
  async findConversationBetween(userA: string, userB: string): Promise<string | null> {
    const participationsA = await DmParticipant.find({ userId: userA }).lean() as LeanDmParticipant[]
    const convIdsA = participationsA.map((p) => p.conversationId.toString())
    if (convIdsA.length === 0) return null

    const participationsB = await DmParticipant.find({
      conversationId: { $in: convIdsA },
      userId: userB,
    }).lean() as LeanDmParticipant[]

    for (const p of participationsB) {
      const convId = p.conversationId.toString()
      const allParticipants = await DmParticipant.find({ conversationId: convId }).lean() as LeanDmParticipant[]
      if (allParticipants.length === 2) return convId
    }
    return null
  },

  async createConversation(): Promise<string> {
    const conv = await DmConversation.create({})
    return conv._id.toString()
  },

  async addParticipants(conversationId: string, userIds: string[]): Promise<void> {
    await DmParticipant.create(userIds.map((userId) => ({ conversationId, userId })))
  },

  async isParticipant(conversationId: string, userId: string): Promise<boolean> {
    const row = await DmParticipant.findOne({ conversationId, userId }).lean()
    return Boolean(row)
  },

  async getParticipants(conversationId: string): Promise<LeanDmParticipant[]> {
    return DmParticipant.find({ conversationId }).lean() as Promise<LeanDmParticipant[]>
  },

  async getOtherParticipant(conversationId: string, userId: string) {
    const participants = await DmParticipant.find({ conversationId }).lean() as LeanDmParticipant[]
    const other = participants.find((p) => p.userId.toString() !== userId)
    if (!other) return null
    return UserRepository.findById(other.userId.toString())
  },

  async findMessagesBefore(
    conversationId: string,
    before: string | null,
    limit: number
  ): Promise<LeanDmMessage[]> {
    const query: Record<string, unknown> = { conversationId }
    if (before) query._id = { $lt: before }
    return DmMessage.find(query).sort({ createdAt: -1 }).limit(limit).lean() as Promise<LeanDmMessage[]>
  },

  async createMessage(data: DmMessageCreateData): Promise<LeanDmMessage> {
    const doc = await DmMessage.create(data)
    return doc.toObject() as LeanDmMessage
  },

  async updateMessage(id: string, data: DmMessageUpdateData): Promise<void> {
    await DmMessage.findByIdAndUpdate(id, data)
  },

  async findMessageById(id: string): Promise<LeanDmMessage | null> {
    return DmMessage.findById(id).lean() as Promise<LeanDmMessage | null>
  },

  async getLastMessage(conversationId: string): Promise<LeanDmMessage | null> {
    return DmMessage.findOne({ conversationId }).sort({ createdAt: -1 }).lean() as Promise<LeanDmMessage | null>
  },

  async updateConversationTimestamp(conversationId: string): Promise<void> {
    await DmConversation.findByIdAndUpdate(conversationId, { updatedAt: new Date() })
  },

  async getConversationById(id: string): Promise<LeanDmConversation | null> {
    return DmConversation.findById(id).lean() as Promise<LeanDmConversation | null>
  },

  async getUserParticipations(userId: string): Promise<LeanDmParticipant[]> {
    return DmParticipant.find({ userId }).lean() as Promise<LeanDmParticipant[]>
  },
}
