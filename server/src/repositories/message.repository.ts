import mongoose from 'mongoose'
import { Message, MessageReaction } from '@workspace/db'

function validateObjectId(id: string): void {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error('Invalid ID format')
  }
}

export type LeanMessage = {
  _id: mongoose.Types.ObjectId
  roomId: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  content: string
  type: 'text' | 'system' | 'file'
  replyToId?: mongoose.Types.ObjectId | null
  editedAt?: Date | null
  isDeleted: boolean
  attachmentUrl?: string | null
  attachmentName?: string | null
  attachmentMime?: string | null
  createdAt: Date
  updatedAt: Date
}

export type LeanReaction = {
  _id: mongoose.Types.ObjectId
  messageId: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  emoji: string
  createdAt: Date
}

export type ReactionSummary = {
  emoji: string
  count: number
  userIds: string[]
}

type MessageCreateData = {
  roomId: string | mongoose.Types.ObjectId
  userId: string | mongoose.Types.ObjectId
  content: string
  type?: string
  replyToId?: string | mongoose.Types.ObjectId | null | undefined
  attachmentUrl?: string | null
  attachmentName?: string | null
  attachmentMime?: string | null
}

type MessageUpdateData = {
  content?: string
  editedAt?: Date
  isDeleted?: boolean
  attachmentUrl?: string | null
  attachmentName?: string | null
  attachmentMime?: string | null
}

export const MessageRepository = {
  async findById(id: string): Promise<LeanMessage | null> {
    validateObjectId(id)
    return Message.findById(id).lean() as Promise<LeanMessage | null>
  },

  async findOne(filter: Record<string, unknown>): Promise<LeanMessage | null> {
    return Message.findOne(filter).lean() as Promise<LeanMessage | null>
  },

  async create(data: MessageCreateData): Promise<LeanMessage> {
    const doc = await Message.create(data)
    return doc.toObject() as LeanMessage
  },

  async findByIdAndUpdate(id: string, data: MessageUpdateData): Promise<void> {
    validateObjectId(id)
    await Message.findByIdAndUpdate(id, data)
  },

  async findMessagesBefore(
    roomId: string,
    before: string | null,
    limit: number
  ): Promise<LeanMessage[]> {
    validateObjectId(roomId)
    const query: Record<string, unknown> = { roomId }
    if (before) query._id = { $lt: before }
    return Message.find(query).sort({ createdAt: -1 }).limit(limit).lean() as Promise<LeanMessage[]>
  },

  async searchMessages(roomId: string, query: string, limit = 25): Promise<LeanMessage[]> {
    validateObjectId(roomId)
    return Message.find({
      roomId,
      isDeleted: false,
      type: 'text',
      content: { $regex: query, $options: 'i' },
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean() as Promise<LeanMessage[]>
  },

  async softDelete(id: string): Promise<void> {
    validateObjectId(id)
    await Message.findByIdAndUpdate(id, { isDeleted: true, content: '' })
  },

  async getReactions(messageIds: string[]): Promise<Map<string, ReactionSummary[]>> {
    const map = new Map<string, ReactionSummary[]>()
    if (messageIds.length === 0) return map

    messageIds.forEach(validateObjectId)
    const rows = await MessageReaction.find({ messageId: { $in: messageIds } }).lean() as LeanReaction[]

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
  },

  async addReaction(messageId: string, userId: string, emoji: string): Promise<void> {
    validateObjectId(messageId)
    validateObjectId(userId)
    await MessageReaction.create({ messageId, userId, emoji })
  },

  async removeReaction(reactionId: string | mongoose.Types.ObjectId): Promise<void> {
    await MessageReaction.findByIdAndDelete(reactionId)
  },

  async findReaction(
    messageId: string,
    userId: string,
    emoji: string
  ): Promise<LeanReaction | null> {
    validateObjectId(messageId)
    validateObjectId(userId)
    return MessageReaction.findOne({ messageId, userId, emoji }).lean() as Promise<LeanReaction | null>
  },

  async findByIds(ids: string[]): Promise<LeanMessage[]> {
    ids.forEach(validateObjectId)
    return Message.find({ _id: { $in: ids } }).lean() as Promise<LeanMessage[]>
  },

  async countByUser(userId: string): Promise<number> {
    validateObjectId(userId)
    return Message.countDocuments({ userId, isDeleted: false })
  },

  async getTopReactions(userId: string, limit = 5) {
    validateObjectId(userId)
    const userObjectId = new mongoose.Types.ObjectId(userId)
    return MessageReaction.aggregate([
      { $match: { userId: userObjectId } },
      { $group: { _id: '$emoji', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: limit },
    ])
  },

  async getActivityByDay(userId: string, days = 7) {
    validateObjectId(userId)
    const userObjectId = new mongoose.Types.ObjectId(userId)
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    return Message.aggregate([
      {
        $match: {
          userId: userObjectId,
          isDeleted: false,
          createdAt: { $gte: since },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          cnt: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ])
  },
}
