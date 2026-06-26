import { MessageRepository } from '../repositories/message.repository'
import { RoomRepository } from '../repositories/room.repository'
import { UserRepository } from '../repositories/user.repository'
import { serializeMessageRow, buildMessagePayload } from '../utils/message-helpers'
import { saveUploadedFile } from '../utils/upload'
import { NotFoundError, ForbiddenError } from '../errors/AppError'

export const MessageService = {
  async listMessages(roomId: string, userId: string, before: string | null, limit = 50) {
    if (!(await RoomRepository.isMember(roomId, userId))) {
      throw new ForbiddenError('Not a room member')
    }
    limit = Math.min(limit, 100)

    const rows = await MessageRepository.findMessagesBefore(roomId, before, limit)
    const ordered = rows.reverse()
    const messageIds = (ordered as any[]).map((r: any) => r._id.toString())
    const reactionsMap = await MessageRepository.getReactions(messageIds)

    const replyIds = (ordered as any[])
      .map((r: any) => r.replyToId?.toString())
      .filter((id: any): id is string => id != null)
    const replyDocs = replyIds.length ? await MessageRepository.findByIds(replyIds) : []
    const replyMap = new Map((replyDocs as any[]).map((r: any) => [r._id.toString(), r]))

    const userIds = [...new Set((ordered as any[]).map((r: any) => r.userId.toString()))]
    const users = await UserRepository.findByIds(userIds as string[])
    const userMap = new Map(users.filter(Boolean).map((u: any) => [u._id.toString(), u]))

    return ordered.map((r: any) => {
      const msgId = r._id.toString()
      const user = userMap.get(r.userId.toString())
      const parent = r.replyToId ? replyMap.get(r.replyToId.toString()) : null
      return serializeMessageRow(
        r,
        user,
        reactionsMap.get(msgId) ?? [],
        parent
          ? {
              id: parent._id.toString(),
              content: parent.isDeleted ? 'Message deleted' : parent.content,
              userId: parent.userId.toString(),
              isDeleted: parent.isDeleted,
            }
          : null
      )
    })
  },

  async searchMessages(roomId: string, userId: string, query: string) {
    if (query.length < 2) throw new Error('Query must be at least 2 characters')
    if (!(await RoomRepository.isMember(roomId, userId))) {
      throw new ForbiddenError('Not a room member')
    }

    const rows = await MessageRepository.searchMessages(roomId, query, 25)
    const ordered = (rows as any[]).reverse()
    const messageIds = ordered.map((r: any) => r._id.toString())
    const reactionsMap = await MessageRepository.getReactions(messageIds)
    const userIds = [...new Set(ordered.map((r: any) => r.userId.toString()))]
    const users = await UserRepository.findByIds(userIds as string[])
    const userMap = new Map(users.filter(Boolean).map((u: any) => [u._id.toString(), u]))

    return ordered.map((r: any) =>
      serializeMessageRow(
        r,
        userMap.get(r.userId.toString()),
        reactionsMap.get(r._id.toString()) ?? []
      )
    )
  },

  async createMessage(
    roomId: string,
    userId: string,
    content: string,
    type = 'text',
    replyToId?: string | null
  ) {
    if (!(await RoomRepository.isMember(roomId, userId))) {
      throw new ForbiddenError('Not a room member')
    }

    const msg = await MessageRepository.create({
      roomId,
      userId,
      content: content.trim(),
      type,
      replyToId: replyToId || undefined,
    })

    return buildMessagePayload(msg._id.toString())
  },

  async updateMessage(roomId: string, messageId: string, userId: string, content: string) {
    if (!content) throw new Error('Content is required')

    const existing = await MessageRepository.findOne({ _id: messageId, roomId })
    if (!existing) throw new NotFoundError('Message not found')
    if (existing.userId.toString() !== userId) throw new ForbiddenError('Forbidden')
    if (existing.type !== 'text') throw new Error('Cannot edit this message type')

    await MessageRepository.findByIdAndUpdate(messageId, { content, editedAt: new Date() })
    return buildMessagePayload(messageId)
  },

  async deleteMessage(roomId: string, messageId: string, userId: string) {
    const existing = await MessageRepository.findOne({ _id: messageId, roomId })
    if (!existing) throw new NotFoundError('Message not found')
    if (existing.userId.toString() !== userId) throw new ForbiddenError('Forbidden')

    await MessageRepository.softDelete(messageId)
    return buildMessagePayload(messageId)
  },

  async toggleReaction(roomId: string, messageId: string, userId: string, emoji: string) {
    if (!(await RoomRepository.isMember(roomId, userId))) {
      throw new ForbiddenError('Not a room member')
    }

    const existing = await MessageRepository.findOne({ _id: messageId, roomId })
    if (!existing) throw new NotFoundError('Message not found')

    const reaction = await MessageRepository.findReaction(messageId, userId, emoji)
    if (reaction) {
      await MessageRepository.removeReaction(reaction._id)
    } else {
      await MessageRepository.addReaction(messageId, userId, emoji)
    }

    return buildMessagePayload(messageId)
  },

  async uploadFile(
    roomId: string,
    userId: string,
    dataUrl: string,
    fileName: string,
    caption: string,
    replyToId: string | null
  ) {
    if (!(await RoomRepository.isMember(roomId, userId))) {
      throw new ForbiddenError('Not a room member')
    }

    const saved = saveUploadedFile(`room-${roomId}`, dataUrl, fileName)
    if (!saved) throw new Error('Invalid or too large file (max 10MB)')

    const msg = await MessageRepository.create({
      roomId,
      userId,
      content: caption || saved.name,
      type: 'file',
      attachmentUrl: saved.url,
      attachmentName: saved.name,
      attachmentMime: saved.mime,
      replyToId: replyToId || undefined,
    })

    return buildMessagePayload(msg._id.toString())
  },
}
