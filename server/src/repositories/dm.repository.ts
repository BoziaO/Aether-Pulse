import { DmConversation, DmParticipant, DmMessage } from '@workspace/db'

export const DmRepository = {
  async findConversationBetween(userA: string, userB: string): Promise<string | null> {
    const participationsA = (await DmParticipant.find({ userId: userA }).lean()) as any[]
    const convIdsA = participationsA.map((p) => p.conversationId.toString())
    if (convIdsA.length === 0) return null
    const participationsB = (await DmParticipant.find({
      conversationId: { $in: convIdsA },
      userId: userB,
    }).lean()) as any[]
    for (const p of participationsB) {
      const convId = p.conversationId.toString()
      const allParticipants = (await DmParticipant.find({ conversationId: convId }).lean()) as any[]
      if (allParticipants.length === 2) return convId
    }
    return null
  },

  async createConversation(): Promise<string> {
    const conv = await DmConversation.create({})
    return conv._id.toString()
  },

  async addParticipants(conversationId: string, userIds: string[]) {
    await DmParticipant.create(userIds.map((userId) => ({ conversationId, userId })))
  },

  async isParticipant(conversationId: string, userId: string): Promise<boolean> {
    const row = await DmParticipant.findOne({ conversationId, userId }).lean()
    return Boolean(row)
  },

  async getParticipants(conversationId: string) {
    return DmParticipant.find({ conversationId }).lean() as any
  },

  async getOtherParticipant(conversationId: string, userId: string) {
    const participants = (await DmParticipant.find({ conversationId }).lean()) as any[]
    const other = participants.find((p) => p.userId.toString() !== userId)
    if (!other) return null
    return (await import('../repositories/user.repository')).UserRepository.findById(
      other.userId.toString()
    )
  },

  async findMessagesBefore(conversationId: string, before: string | null, limit: number) {
    const query: any = { conversationId }
    if (before) query._id = { $lt: before }
    return DmMessage.find(query).sort({ createdAt: -1 }).limit(limit).lean() as any
  },

  async createMessage(data: Record<string, any>) {
    return DmMessage.create(data) as any
  },

  async updateMessage(id: string, data: Record<string, any>) {
    await DmMessage.findByIdAndUpdate(id, data)
  },

  async findMessageById(id: string) {
    return DmMessage.findById(id).lean() as any
  },

  async getLastMessage(conversationId: string) {
    return DmMessage.findOne({ conversationId }).sort({ createdAt: -1 }).lean() as any
  },

  async updateConversationTimestamp(conversationId: string) {
    await DmConversation.findByIdAndUpdate(conversationId, { updatedAt: new Date() })
  },

  async getConversationById(id: string) {
    return DmConversation.findById(id).lean() as any
  },

  async getUserParticipations(userId: string) {
    return DmParticipant.find({ userId }).lean() as any
  },
}
