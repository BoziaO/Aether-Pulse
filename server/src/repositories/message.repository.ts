import { Message, MessageReaction, mongoose } from '@workspace/db'

export type ReactionSummary = {
  emoji: string
  count: number
  userIds: string[]
}

export const MessageRepository = {
  async findById(id: string) {
    return Message.findById(id).lean() as any
  },

  async findOne(filter: Record<string, any>) {
    return Message.findOne(filter).lean() as any
  },

  async create(data: Record<string, any>) {
    return Message.create(data) as any
  },

  async findByIdAndUpdate(id: string, data: Record<string, any>) {
    await Message.findByIdAndUpdate(id, data)
  },

  async findMessagesBefore(roomId: string, before: string | null, limit: number) {
    const query: any = { roomId }
    if (before) query._id = { $lt: before }
    return Message.find(query).sort({ createdAt: -1 }).limit(limit).lean() as any
  },

  async searchMessages(roomId: string, query: string, limit = 25) {
    return Message.find({
      roomId,
      isDeleted: false,
      type: 'text',
      content: { $regex: query, $options: 'i' },
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean() as any
  },

  async softDelete(id: string) {
    await Message.findByIdAndUpdate(id, { isDeleted: true, content: '' })
  },

  async getReactions(messageIds: string[]): Promise<Map<string, ReactionSummary[]>> {
    const map = new Map<string, ReactionSummary[]>()
    if (messageIds.length === 0) return map
    const rows = (await MessageReaction.find({ messageId: { $in: messageIds } }).lean()) as any[]
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

  async addReaction(messageId: string, userId: string, emoji: string) {
    await MessageReaction.create({ messageId, userId, emoji })
  },

  async removeReaction(reactionId: string) {
    await MessageReaction.findByIdAndDelete(reactionId)
  },

  async findReaction(messageId: string, userId: string, emoji: string) {
    return MessageReaction.findOne({ messageId, userId, emoji }).lean() as any
  },

  async findByIds(ids: string[]) {
    return Message.find({ _id: { $in: ids } }).lean() as any
  },

  async countByUser(userId: string): Promise<number> {
    return Message.countDocuments({ userId, isDeleted: false })
  },

  async getTopReactions(userId: string, limit = 5) {
    const userObjectId = new mongoose.Types.ObjectId(userId)
    return MessageReaction.aggregate([
      { $match: { userId: userObjectId } },
      { $group: { _id: '$emoji', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: limit },
    ])
  },

  async getActivityByDay(userId: string, days = 7) {
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
