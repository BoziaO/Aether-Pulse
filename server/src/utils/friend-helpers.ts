import { FriendRepository, type LeanFriendship } from '../repositories/friend.repository'

export async function getFriendship(userId: string, otherId: string): Promise<LeanFriendship | null> {
  return FriendRepository.findFriendship(userId, otherId)
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
  row: LeanFriendship | null,
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
