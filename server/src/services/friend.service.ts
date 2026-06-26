import { Friendship } from '@workspace/db'

import { FriendRepository } from '../repositories/friend.repository'
import { UserRepository } from '../repositories/user.repository'
import { serializeUser } from '../utils/serialize-user'
import { NotFoundError, ForbiddenError, ConflictError } from '../errors/AppError'

export const FriendService = {
  async listFriends(userId: string) {
    const rows = await FriendRepository.findAllForUser(userId)
    const otherIds = (rows as any[]).map((r: any) =>
      r.requesterId.toString() === userId ? r.addresseeId.toString() : r.requesterId.toString()
    )
    const users = otherIds.length ? await UserRepository.findByIds(otherIds) : []
    const userMap = new Map(
      users.filter(Boolean).map((u: any) => [u._id.toString(), serializeUser(u)])
    )

    const friends = (rows as any[])
      .filter((r: any) => r.status === 'accepted')
      .map((r: any) => {
        const oid =
          r.requesterId.toString() === userId ? r.addresseeId.toString() : r.requesterId.toString()
        return { user: userMap.get(oid), since: r.createdAt.toISOString() }
      })
      .filter((f: any) => f.user)

    const incoming = (rows as any[])
      .filter((r: any) => r.status === 'pending' && r.addresseeId.toString() === userId)
      .map((r: any) => ({
        user: userMap.get(r.requesterId.toString()),
        requestId: r._id.toString(),
        createdAt: r.createdAt.toISOString(),
      }))
      .filter((r: any) => r.user)

    const outgoing = (rows as any[])
      .filter((r: any) => r.status === 'pending' && r.requesterId.toString() === userId)
      .map((r: any) => ({
        user: userMap.get(r.addresseeId.toString()),
        requestId: r._id.toString(),
        createdAt: r.createdAt.toISOString(),
      }))
      .filter((r: any) => r.user)

    return { friends, incoming, outgoing }
  },

  async searchUsers(userId: string, query: string) {
    if (query.length < 2) throw new Error('Query must be at least 2 characters')

    const users = await UserRepository.search(query, userId, 20)
    const otherIds = (users as any[]).map((u: any) => u._id.toString())
    const friendshipRows = otherIds.length
      ? await Friendship.find({
          $or: [
            { requesterId: userId, addresseeId: { $in: otherIds } },
            { requesterId: { $in: otherIds }, addresseeId: userId },
          ],
        }).lean()
      : []
    const friendshipMap = new Map<string, any>()
    for (const f of friendshipRows as any[]) {
      const otherId =
        f.requesterId.toString() === userId ? f.addresseeId.toString() : f.requesterId.toString()
      friendshipMap.set(otherId, f)
    }

    return (users as any[]).map((u: any) => ({
      user: serializeUser(u as any),
      status: this.friendshipStatusFor(friendshipMap.get(u._id.toString()), userId),
    }))
  },

  async sendRequest(userId: string, targetId: string) {
    if (!targetId || targetId === userId) throw new Error('Invalid user')

    const target = await UserRepository.findById(targetId)
    if (!target) throw new NotFoundError('User not found')

    const existing = await FriendRepository.findFriendship(userId, targetId)

    if (existing) {
      if (existing.status === 'accepted') throw new ConflictError('Already friends')
      if (existing.status === 'pending') {
        if (existing.addresseeId.toString() === userId) {
          await FriendRepository.updateStatus(existing._id, 'accepted')
          return { status: 'accepted' as const, user: serializeUser(target as any) }
        }
        throw new ConflictError('Request already sent')
      }
      if (existing.status === 'blocked') throw new ForbiddenError('Cannot send request')
    }

    await FriendRepository.create({ requesterId: userId, addresseeId: targetId, status: 'pending' })
    return { status: 'pending' as const, user: serializeUser(target as any) }
  },

  async acceptRequest(userId: string, targetId: string) {
    const existing = await FriendRepository.findFriendship(userId, targetId)
    if (!existing || existing.status !== 'pending' || existing.addresseeId.toString() !== userId) {
      throw new NotFoundError('No pending request')
    }

    await FriendRepository.updateStatus(existing._id, 'accepted')
    const friend = await UserRepository.findById(targetId)
    return { status: 'accepted' as const, user: friend ? serializeUser(friend as any) : null }
  },

  async rejectRequest(userId: string, targetId: string) {
    const existing = await FriendRepository.findFriendship(userId, targetId)
    if (!existing || existing.status !== 'pending' || existing.addresseeId.toString() !== userId) {
      throw new NotFoundError('No pending request')
    }
    await FriendRepository.delete(existing._id)
  },

  async removeFriend(userId: string, otherId: string) {
    const existing = await FriendRepository.findFriendship(userId, otherId)
    if (!existing) throw new NotFoundError('Not found')
    await FriendRepository.delete(existing._id)
  },

  async blockUser(userId: string, targetId: string) {
    if (!targetId || targetId === userId) throw new Error('Invalid user')

    const existing = await FriendRepository.findFriendship(userId, targetId)
    if (existing) {
      await FriendRepository.delete(existing._id)
    }
    await FriendRepository.create({ requesterId: userId, addresseeId: targetId, status: 'blocked' })
  },

  async getSuggestions(userId: string) {
    const rows = await FriendRepository.findAllForUser(userId)
    const friendIds = (rows as any[]).map((r) =>
      r.requesterId.toString() === userId ? r.addresseeId.toString() : r.requesterId.toString()
    )
    friendIds.push(userId)

    const suggestions = await FriendRepository.getSuggestions(friendIds, 6)
    return suggestions.map((u) => ({
      user: serializeUser(u as any),
      status: 'none' as const,
    }))
  },

  async getStatus(userId: string, otherId: string) {
    const existing = await FriendRepository.findFriendship(userId, otherId)
    return { status: this.friendshipStatusFor(existing, userId) }
  },

  friendshipStatusFor(
    row: any,
    currentUserId: string
  ): 'none' | 'friends' | 'pending_outgoing' | 'pending_incoming' | 'blocked' {
    if (!row) return 'none'
    if (row.status === 'accepted') return 'friends'
    if (row.status === 'blocked') return 'blocked'
    if (row.status === 'pending') {
      return row.requesterId.toString() === currentUserId ? 'pending_outgoing' : 'pending_incoming'
    }
    return 'none'
  },
}
