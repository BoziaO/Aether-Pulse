import { Room, RoomMember, Message } from '@workspace/db'

export const RoomRepository = {
  async findById(id: string) {
    return Room.findById(id).lean() as any
  },

  async findOne(filter: Record<string, any>) {
    return Room.findOne(filter).lean() as any
  },

  async create(data: Record<string, any>) {
    return Room.create(data) as any
  },

  async findByIdAndUpdate(id: string, data: Record<string, any>) {
    await Room.findByIdAndUpdate(id, data)
  },

  async findByIdAndDelete(id: string) {
    await Room.findByIdAndDelete(id)
  },

  async getMemberRooms(userId: string): Promise<string[]> {
    const memberRows = (await RoomMember.find({ userId }).lean()) as any[]
    return memberRows.map((r) => r.roomId.toString())
  },

  async isMember(roomId: string, userId: string): Promise<boolean> {
    const row = await RoomMember.findOne({ roomId, userId }).lean()
    return Boolean(row)
  },

  async addMember(roomId: string, userId: string) {
    await RoomMember.create({ roomId, userId })
  },

  async removeMember(roomId: string, userId: string) {
    await RoomMember.deleteOne({ roomId, userId })
  },

  async deleteMembers(roomId: string) {
    await RoomMember.deleteMany({ roomId })
  },

  async getMembers(roomId: string) {
    return RoomMember.find({ roomId }).populate('userId').lean() as any
  },

  async countMembers(roomId: string): Promise<number> {
    return RoomMember.countDocuments({ roomId })
  },

  async countMessages(roomId: string): Promise<number> {
    return Message.countDocuments({ roomId })
  },

  async deleteMessages(roomId: string) {
    await Message.deleteMany({ roomId })
  },

  async findRecentSystemMessages(roomId: string, limit = 10) {
    return Message.find({ roomId, type: 'system' })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean() as any
  },
}
