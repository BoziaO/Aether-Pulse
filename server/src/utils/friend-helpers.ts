import { and, eq, or } from 'drizzle-orm'
import { db, friendshipsTable } from '@workspace/db'

export async function getFriendship(userId: number, otherId: number) {
  const [row] = await db
    .select()
    .from(friendshipsTable)
    .where(
      or(
        and(eq(friendshipsTable.requesterId, userId), eq(friendshipsTable.addresseeId, otherId)),
        and(eq(friendshipsTable.requesterId, otherId), eq(friendshipsTable.addresseeId, userId))
      )
    )
    .limit(1)
  return row ?? null
}

export async function areFriends(userId: number, otherId: number): Promise<boolean> {
  const row = await getFriendship(userId, otherId)
  return row?.status === 'accepted'
}

export async function isBlocked(userId: number, otherId: number): Promise<boolean> {
  const row = await getFriendship(userId, otherId)
  if (!row) return false
  if (row.status !== 'blocked') return false
  // blocked by either party blocks interaction
  return true
}

export function friendshipStatusFor(
  row: typeof friendshipsTable.$inferSelect | null,
  currentUserId: number
): 'none' | 'friends' | 'pending_outgoing' | 'pending_incoming' | 'blocked' {
  if (!row) return 'none'
  if (row.status === 'accepted') return 'friends'
  if (row.status === 'blocked') return 'blocked'
  if (row.status === 'pending') {
    return row.requesterId === currentUserId ? 'pending_outgoing' : 'pending_incoming'
  }
  return 'none'
}
