import { randomBytes } from 'crypto'

import { RoomRepository } from '../repositories/room.repository'
import { UserRepository } from '../repositories/user.repository'
import { MessageRepository } from '../repositories/message.repository'
import { serializeUser } from '../utils/serialize-user'
import { NotFoundError, ForbiddenError } from '../errors/AppError'

function serializeRoom(room: any, members: any[]) {
  return {
    id: room._id.toString(),
    name: room.name,
    inviteCode: room.inviteCode,
    ownerId: room.ownerId.toString(),
    quality: room.quality,
    isActive: room.isActive,
    memberCount: members.length,
    members,
    createdAt: room.createdAt.toISOString(),
    updatedAt: room.updatedAt.toISOString(),
  }
}

export const RoomService = {
  async getRoomWithMembers(roomId: string) {
    const room = await RoomRepository.findById(roomId)
    if (!room) return null
    const memberRows = await RoomRepository.getMembers(roomId)
    const members = memberRows
      .map((r: any) => (r.userId ? serializeUser(r.userId) : null))
      .filter(Boolean)
    return serializeRoom(room, members)
  },

  async listUserRooms(userId: string) {
    const roomIds = await RoomRepository.getMemberRooms(userId)
    if (roomIds.length === 0) return []
    const rooms = await Promise.all(roomIds.map((id) => this.getRoomWithMembers(id)))
    return rooms.filter(Boolean)
  },

  async createRoom(userId: string, data: { name: string; quality?: string }) {
    const inviteCode = randomBytes(4).toString('hex').toUpperCase()
    const room = await RoomRepository.create({
      name: data.name,
      inviteCode,
      ownerId: userId,
      quality: data.quality ?? '1080p',
    })
    await RoomRepository.addMember(room._id.toString(), userId)
    const result = await this.getRoomWithMembers(room._id.toString())
    if (!result) throw new Error('Failed to load newly created room')
    return result
  },

  async getRoom(roomId: string, userId: string) {
    if (!(await RoomRepository.isMember(roomId, userId))) {
      throw new ForbiddenError('Not a room member')
    }
    const room = await this.getRoomWithMembers(roomId)
    if (!room) throw new NotFoundError('Room not found')
    return room
  },

  async updateRoom(roomId: string, userId: string, body: Record<string, any>) {
    const room = await RoomRepository.findById(roomId)
    if (!room) throw new NotFoundError('Room not found')
    if (room.ownerId.toString() !== userId)
      throw new ForbiddenError('Only the room owner can update settings')

    const updates: Partial<{ name: string; quality: string }> = {}
    if (typeof body.name === 'string' && body.name.trim()) {
      updates.name = body.name.trim().slice(0, 64)
    }
    const qualities = ['360p', '480p', '720p', '1080p', '1440p']
    if (typeof body.quality === 'string' && qualities.includes(body.quality)) {
      updates.quality = body.quality
    }
    if (Object.keys(updates).length === 0) throw new Error('No valid fields to update')

    await RoomRepository.findByIdAndUpdate(roomId, updates)
    const result = await this.getRoomWithMembers(roomId)
    if (!result) throw new NotFoundError('Room not found')
    return result
  },

  async deleteRoom(roomId: string, userId: string, io: any) {
    const room = await RoomRepository.findById(roomId)
    if (!room) throw new NotFoundError('Room not found')
    if (room.ownerId.toString() !== userId) throw new ForbiddenError('Forbidden')

    io?.to(roomId).emit('room-deleted', { roomId })
    await RoomRepository.findByIdAndDelete(roomId)
    await RoomRepository.deleteMembers(roomId)
    await RoomRepository.deleteMessages(roomId)
  },

  async joinByCode(userId: string, inviteCode: string, io: any) {
    const room = await RoomRepository.findOne({ inviteCode })
    if (!room) throw new NotFoundError('Invalid invite code — room not found')
    await this.logRoomEntry(room._id.toString(), userId, io)
    const result = await this.getRoomWithMembers(room._id.toString())
    if (!result) throw new NotFoundError('Room not found')
    return result
  },

  async joinRoom(userId: string, roomId: string, inviteCode: string, io: any) {
    const room = await RoomRepository.findById(roomId)
    if (!room) throw new NotFoundError('Room not found')
    if (room.inviteCode !== inviteCode) throw new ForbiddenError('Invalid invite code')
    await this.logRoomEntry(roomId, userId, io)
    const result = await this.getRoomWithMembers(roomId)
    if (!result) throw new NotFoundError('Room not found')
    return result
  },

  async leaveRoom(roomId: string, userId: string, io: any) {
    await RoomRepository.removeMember(roomId, userId)
    io?.to(roomId).emit('room-member-left', { roomId, userId })
  },

  async getActivity(roomId: string, userId: string) {
    if (!(await RoomRepository.isMember(roomId, userId))) {
      throw new ForbiddenError('Not a room member')
    }
    const memberCount = await RoomRepository.countMembers(roomId)
    const messageCount = await RoomRepository.countMessages(roomId)
    const recentMessages = await RoomRepository.findRecentSystemMessages(roomId, 10)
    return {
      roomId,
      memberCount,
      messageCount,
      events: (recentMessages as any[]).map((m) => ({
        type: m.type,
        description: m.content,
        userId: m.userId.toString(),
        createdAt: m.createdAt.toISOString(),
      })),
    }
  },

  async logRoomEntry(roomId: string, userId: string, io: any) {
    const existing = await RoomRepository.isMember(roomId, userId)
    if (!existing) {
      await RoomRepository.addMember(roomId, userId)
      const user = await UserRepository.findById(userId)
      if (user) {
        const sysMsg = await MessageRepository.create({
          roomId,
          userId,
          content: `${user.displayName} joined the room`,
          type: 'system',
        })
        if (io) {
          const payload = {
            id: sysMsg._id.toString(),
            roomId: sysMsg.roomId.toString(),
            userId: sysMsg.userId.toString(),
            content: sysMsg.content,
            type: sysMsg.type,
            replyToId: null,
            editedAt: null,
            isDeleted: false,
            createdAt: sysMsg.createdAt.toISOString(),
            user: serializeUser(user as any),
            reactions: [],
            replyTo: null,
          }
          io.to(roomId).emit('new-message', payload)
          io.to(roomId).emit('room-member-joined', { roomId, user: serializeUser(user as any) })
        }
      }
    }
  },
}
