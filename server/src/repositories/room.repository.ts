import mongoose from 'mongoose'
import { Room, RoomMember, Message } from '@workspace/db'

export type LeanRoom = {
  _id: mongoose.Types.ObjectId
  name: string
  inviteCode: string
  ownerId: mongoose.Types.ObjectId
  quality: '360p' | '480p' | '720p' | '1080p' | '1440p'
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export type LeanRoomMember = {
  _id: mongoose.Types.ObjectId
  roomId: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  joinedAt: Date
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

type RoomCreateData = {
  name: string
  inviteCode: string
  ownerId: string | mongoose.Types.ObjectId
  quality?: string
  isActive?: boolean
}

type RoomUpdateData = {
  name?: string
  quality?: string
  isActive?: boolean
}

export const RoomRepository = {
  async findById(id: string): Promise<LeanRoom | null> {
    return Room.findById(id).lean() as Promise<LeanRoom | null>
  },

  async findOne(filter: Record<string, unknown>): Promise<LeanRoom | null> {
    return Room.findOne(filter).lean() as Promise<LeanRoom | null>
  },

  async create(data: RoomCreateData): Promise<LeanRoom> {
    const doc = await Room.create(data)
    return doc.toObject() as LeanRoom
  },

  async findByIdAndUpdate(id: string, data: RoomUpdateData): Promise<void> {
    await Room.findByIdAndUpdate(id, data)
  },

  async findByIdAndDelete(id: string): Promise<void> {
    await Room.findByIdAndDelete(id)
  },

  async getMemberRooms(userId: string): Promise<string[]> {
    const memberRows = await RoomMember.find({ userId }).lean() as LeanRoomMember[]
    return memberRows.map((r) => r.roomId.toString())
  },

  async isMember(roomId: string, userId: string): Promise<boolean> {
    const row = await RoomMember.findOne({ roomId, userId }).lean()
    return Boolean(row)
  },

  async addMember(roomId: string, userId: string): Promise<void> {
    await RoomMember.create({ roomId, userId })
  },

  async removeMember(roomId: string, userId: string): Promise<void> {
    await RoomMember.deleteOne({ roomId, userId })
  },

  async deleteMembers(roomId: string): Promise<void> {
    await RoomMember.deleteMany({ roomId })
  },

  async getMembers(roomId: string) {
    return RoomMember.find({ roomId }).populate('userId').lean()
  },

  async countMembers(roomId: string): Promise<number> {
    return RoomMember.countDocuments({ roomId })
  },

  async countMessages(roomId: string): Promise<number> {
    return Message.countDocuments({ roomId })
  },

  async deleteMessages(roomId: string): Promise<void> {
    await Message.deleteMany({ roomId })
  },

  async findRecentSystemMessages(roomId: string, limit = 10): Promise<LeanMessage[]> {
    return Message.find({ roomId, type: 'system' })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean() as Promise<LeanMessage[]>
  },
}
