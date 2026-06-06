import { Friendship } from '@workspace/db'
import type { IFriendship } from '@workspace/db'
import mongoose from 'mongoose'

export async function getFriendship(userId: string, otherId: string): Promise<IFriendship | null> {
  const row = await Friendship.findOne({
    $or: [
      { requesterId: userId, addresseeId: otherId },
      { requesterId: otherId, addresseeId: userId },
    ],
  })
  return row ?? null
}

export async function areFriends(userId: string, otherId: string): Promise<boolean> {
  const row = await getFriendship(userId, otherId)
  return row?.status === 'accepted'
}

export async function isBlocked(userId: string, otherId: string): Promise<boolean> {
  const row = await getFriendship(userId, otherId)
  if (!row) return false
  return row.status === 'blocked'
}

export function friendshipStatusFor(
  row: IFriendship | null,
  currentUserId: string
): 'none' | 'friends' | 'pending_outgoing' | 'pending_incoming' | 'blocked' {
  if (!row) return 'none'
  if (row.status === 'accepted') return 'friends'
  if (row.status === 'blocked') return 'blocked'
  if (row.status === 'pending') {
    return row.requesterId.toString() === currentUserId ? 'pending_outgoing' : 'pending_incoming'
  }
  return 'none'
}
