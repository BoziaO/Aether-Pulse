import { DmParticipant, DmMessage, DmConversation, mongoose } from '@workspace/db'

import { DmRepository } from '../repositories/dm.repository'
import { FriendRepository } from '../repositories/friend.repository'
import { UserRepository } from '../repositories/user.repository'
import { buildDmMessagePayload } from '../utils/dm-helpers'
import { saveUploadedFile } from '../utils/upload'
import { serializeUser } from '../utils/serialize-user'
import { NotFoundError, ForbiddenError } from '../errors/AppError'

export const DmService = {
  async listConversations(userId: string) {
    const myParticipations = await DmRepository.getUserParticipations(userId)
    if (myParticipations.length === 0) return []

    const convIds = myParticipations.map((p: any) => p.conversationId.toString())

    // Batch-load all participants for these conversations
    const allParticipants = (await DmParticipant.find({
      conversationId: { $in: convIds },
    }).lean()) as any[]
    const participantsByConv = new Map<string, any[]>()
    for (const p of allParticipants) {
      const cid = p.conversationId.toString()
      if (!participantsByConv.has(cid)) participantsByConv.set(cid, [])
      participantsByConv.get(cid)!.push(p)
    }

    // Batch-load last message per conversation
    const convObjectIds = convIds.map((id: string) => new mongoose.Types.ObjectId(id))
    const lastMessages = await DmMessage.aggregate([
      { $match: { conversationId: { $in: convObjectIds } } },
      { $sort: { createdAt: -1 } },
      { $group: { _id: '$conversationId', doc: { $first: '$$ROOT' } } },
    ])
    const lastMsgByConv = new Map<string, any>()
    for (const m of lastMessages) {
      lastMsgByConv.set(m._id.toString(), m.doc)
    }

    // Batch-load conversations
    const convs = convIds.length
      ? ((await DmConversation.find({ _id: { $in: convIds } }).lean()) as any[])
      : []
    const convMap = new Map(convs.map((c: any) => [c._id.toString(), c]))

    // Collect unique other user IDs
    const otherUserIds = [
      ...new Set(
        myParticipations
          .map((p: any) => {
            const cid = p.conversationId.toString()
            const parts = participantsByConv.get(cid) ?? []
            const other = parts.find((x: any) => x.userId.toString() !== userId)
            return other ? other.userId.toString() : null
          })
          .filter(Boolean)
      ),
    ] as string[]
    const otherUsers = otherUserIds.length ? await UserRepository.findByIds(otherUserIds) : []
    const userMap = new Map(
      otherUsers.filter(Boolean).map((u: any) => [u._id.toString(), serializeUser(u)])
    )

    const conversations = myParticipations.map((p: any) => {
      const convId = p.conversationId.toString()
      const parts = participantsByConv.get(convId) ?? []
      const other = parts.find((x: any) => x.userId.toString() !== userId)
      const otherUser = other ? userMap.get(other.userId.toString()) : null
      const lastMsg = lastMsgByConv.get(convId)
      const conv = convMap.get(convId)

      return {
        id: convId,
        otherUser: otherUser ?? null,
        lastMessage: lastMsg
          ? {
              content: lastMsg.isDeleted ? 'Message deleted' : lastMsg.content,
              type: lastMsg.type,
              attachmentName: lastMsg.attachmentName,
              createdAt: lastMsg.createdAt.toISOString(),
              userId: lastMsg.userId.toString(),
            }
          : null,
        updatedAt: conv?.updatedAt?.toISOString() ?? p.joinedAt.toISOString(),
      }
    })

    conversations.sort(
      (a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
    return conversations
  },

  async getOrCreateConversation(userId: string, otherUserId: string) {
    if (!otherUserId || otherUserId === userId) {
      throw new Error('Invalid user')
    }

    if (!(await FriendRepository.areFriends(userId, otherUserId))) {
      throw new ForbiddenError('You must be friends to send direct messages')
    }

    let conversationId = await DmRepository.findConversationBetween(userId, otherUserId)
    if (!conversationId) {
      conversationId = await DmRepository.createConversation()
      await DmRepository.addParticipants(conversationId, [userId, otherUserId])
    }

    const other = await UserRepository.findById(otherUserId)
    return {
      id: conversationId,
      otherUser: other ? serializeUser(other as any) : null,
    }
  },

  async getMessages(conversationId: string, userId: string, before: string | null, limit = 50) {
    if (!(await DmRepository.isParticipant(conversationId, userId))) {
      throw new ForbiddenError('Not a participant')
    }
    limit = Math.min(limit, 100)

    const rows = await DmRepository.findMessagesBefore(conversationId, before, limit)
    const ordered = rows.reverse()

    // Batch-load users for all messages
    const userIds = [...new Set((ordered as any[]).map((r: any) => r.userId.toString()))]
    const users = await UserRepository.findByIds(userIds)
    const userMap = new Map(
      users.filter(Boolean).map((u: any) => [u._id.toString(), serializeUser(u)])
    )

    // Batch-load reply parents
    const replyIds = (ordered as any[])
      .map((r: any) => r.replyToId?.toString())
      .filter((id: any): id is string => id != null)
    const replyDocs = replyIds.length
      ? ((await DmMessage.find({ _id: { $in: replyIds } }).lean()) as any[])
      : []
    const replyMap = new Map(replyDocs.map((r: any) => [r._id.toString(), r]))

    const messages = (ordered as any[]).map((r: any) => {
      const user = userMap.get(r.userId.toString())
      const parent = r.replyToId ? replyMap.get(r.replyToId.toString()) : null
      return {
        id: r._id.toString(),
        conversationId: r.conversationId.toString(),
        userId: r.userId.toString(),
        content: r.isDeleted ? '' : r.content,
        type: r.type,
        attachmentUrl: r.attachmentUrl ?? null,
        attachmentName: r.attachmentName ?? null,
        attachmentMime: r.attachmentMime ?? null,
        replyToId: r.replyToId ? r.replyToId.toString() : null,
        editedAt: r.editedAt ? r.editedAt.toISOString() : null,
        isDeleted: r.isDeleted,
        createdAt: r.createdAt.toISOString(),
        user: user ?? null,
        replyTo: parent
          ? {
              id: parent._id.toString(),
              content: parent.isDeleted ? 'Message deleted' : parent.content,
              userId: parent.userId.toString(),
              isDeleted: parent.isDeleted,
            }
          : null,
      }
    })
    return messages
  },

  async createMessage(
    conversationId: string,
    userId: string,
    content: string,
    replyToId?: string | null
  ) {
    if (!(await DmRepository.isParticipant(conversationId, userId))) {
      throw new ForbiddenError('Not a participant')
    }
    if (!content) throw new Error('Content is required')

    const msg = await DmRepository.createMessage({
      conversationId,
      userId,
      content,
      type: 'text',
      replyToId: replyToId || undefined,
    })

    await DmRepository.updateConversationTimestamp(conversationId)
    return buildDmMessagePayload(msg._id.toString())
  },

  async uploadFile(
    conversationId: string,
    userId: string,
    dataUrl: string,
    fileName: string,
    caption: string
  ) {
    if (!(await DmRepository.isParticipant(conversationId, userId))) {
      throw new ForbiddenError('Not a participant')
    }

    const saved = saveUploadedFile(`dm-${conversationId}`, dataUrl, fileName)
    if (!saved) throw new Error('Invalid or too large file (max 10MB)')

    const msg = await DmRepository.createMessage({
      conversationId,
      userId,
      content: caption || saved.name,
      type: 'file',
      attachmentUrl: saved.url,
      attachmentName: saved.name,
      attachmentMime: saved.mime,
    })

    await DmRepository.updateConversationTimestamp(conversationId)
    return buildDmMessagePayload(msg._id.toString())
  },

  async updateMessage(conversationId: string, messageId: string, userId: string, content: string) {
    if (!content) throw new Error('Content is required')

    const existing = await DmRepository.findMessageById(messageId)
    if (!existing || existing.conversationId.toString() !== conversationId) {
      throw new NotFoundError('Message not found')
    }
    if (existing.userId.toString() !== userId) throw new ForbiddenError('Forbidden')
    if (existing.type !== 'text') throw new Error('Cannot edit this message type')

    await DmRepository.updateMessage(messageId, { content, editedAt: new Date() })
    return buildDmMessagePayload(messageId)
  },

  async deleteMessage(conversationId: string, messageId: string, userId: string) {
    const existing = await DmRepository.findMessageById(messageId)
    if (!existing || existing.conversationId.toString() !== conversationId) {
      throw new NotFoundError('Message not found')
    }
    if (existing.userId.toString() !== userId) throw new ForbiddenError('Forbidden')

    await DmRepository.updateMessage(messageId, { isDeleted: true, content: '' })
    return buildDmMessagePayload(messageId)
  },
}
