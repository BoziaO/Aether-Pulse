import sharp from 'sharp'

import { UserRepository } from '../repositories/user.repository'
import { FriendRepository } from '../repositories/friend.repository'
import { MessageRepository } from '../repositories/message.repository'
import { serializeUser } from '../utils/serialize-user'
import { parseFileDataUrl } from '../utils/upload'
import { NotFoundError, ForbiddenError } from '../errors/AppError'

export const UserService = {
  async getProfile(userId: string, viewerId: string | null) {
    const user = await UserRepository.findById(userId)
    if (!user) throw new NotFoundError('User not found')

    const privacy = user.profilePrivacy ?? 'public'
    const isOwn = viewerId === user._id.toString()

    if (privacy === 'private' && !isOwn) {
      throw new ForbiddenError('This profile is private.')
    }

    const isFriend =
      viewerId != null && !isOwn
        ? await FriendRepository.areFriends(viewerId, user._id.toString())
        : false

    if (!isOwn && viewerId != null) {
      UserRepository.findByIdAndUpdate(user._id.toString(), { $inc: { profileViews: 1 } } as any)
        .then(() => {})
        .catch(() => {})
    }

    return serializeUser(user as any, { viewerId, isFriend })
  },

  async getStats(userId: string) {
    const msgCount = await MessageRepository.countByUser(userId)
    const friendCount = await FriendRepository.countAccepted(userId)

    const topReactions = await MessageRepository.getTopReactions(userId, 5)

    const activityAgg = await MessageRepository.getActivityByDay(userId, 7)

    const activityMap = new Map(activityAgg.map((a: any) => [a._id, a.cnt]))
    const activityByDay = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      const key = d.toISOString().slice(0, 10)
      activityByDay.push({ date: key, count: activityMap.get(key) ?? 0 })
    }

    return {
      messageCount: msgCount,
      friendCount,
      topReactions: topReactions.map((r: any) => ({ emoji: r._id, count: r.count })),
      activityByDay,
    }
  },

  async updateProfile(userId: string, data: Record<string, any>) {
    const updated = await UserRepository.findByIdAndUpdate(userId, data as any, { new: true })
    if (!updated) throw new NotFoundError('User not found')
    return serializeUser(updated as any, { viewerId: userId })
  },

  async uploadAvatar(_userId: string, dataUrl: string) {
    const parsed = parseFileDataUrl(dataUrl)
    if (!parsed) throw new Error('Invalid image data')

    let buffer = parsed.buffer
    const isGif = parsed.ext === 'gif'
    if (!isGif) {
      try {
        buffer = await sharp(buffer)
          .resize(512, 512, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 80, mozjpeg: true })
          .toBuffer()
      } catch {
        /* fallback */
      }
    }

    const mime = isGif ? 'image/gif' : 'image/jpeg'
    const storedDataUrl = `data:${mime};base64,${buffer.toString('base64')}`
    return storedDataUrl
  },

  async uploadBanner(_userId: string, dataUrl: string) {
    const parsed = parseFileDataUrl(dataUrl)
    if (!parsed) throw new Error('Invalid image data')

    let buffer = parsed.buffer
    const isGif = parsed.ext === 'gif'
    if (!isGif) {
      try {
        buffer = await sharp(buffer)
          .resize(1920, 480, { fit: 'cover', position: 'centre' })
          .jpeg({ quality: 80, mozjpeg: true })
          .toBuffer()
      } catch {
        /* fallback */
      }
    }

    const mime = isGif ? 'image/gif' : 'image/jpeg'
    const storedDataUrl = `data:${mime};base64,${buffer.toString('base64')}`
    return storedDataUrl
  },
}
