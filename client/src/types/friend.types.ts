import type { User } from './user.types'

export type FriendshipStatus =
  | 'none'
  | 'friends'
  | 'pending_outgoing'
  | 'pending_incoming'
  | 'blocked'

export interface FriendEntry {
  user: User
  since: string
}

export interface FriendRequest {
  user: User
  requestId: string
  createdAt: string
}

export interface UserSearchResult {
  user: User
  status: FriendshipStatus
}

export interface FriendsData {
  friends: FriendEntry[]
  incoming: FriendRequest[]
  outgoing: FriendRequest[]
}
