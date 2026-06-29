import type { RoomUser } from './state'

// ─── Server → Client events ──────────────────────────────────────────────────

export interface ServerToClientEvents {
  'new-message': (payload: Record<string, unknown>) => void
  'message-updated': (payload: Record<string, unknown>) => void
  'user-typing': (data: { userId: string; roomId: string; isTyping: boolean }) => void
  'user-joined': (data: { userId: string; socketId: string }) => void
  'user-left': (data: { userId: string; socketId: string }) => void
  'room-users': (data: { userIds: string[] }) => void
  'call-users': (data: { users: RoomUser[] }) => void
  'call-user-joined': (data: { userId: string; socketId: string }) => void
  'call-user-left': (data: { userId: string; socketId: string }) => void
  'user-status-changed': (data: { userId: string; status: string }) => void
  'user-rich-presence-changed': (data: { userId: string; richPresence: Record<string, unknown> | null }) => void
  'user-profile-updated': (data: Record<string, unknown>) => void
  'room-activity-changed': (data: { roomId: string; isActive: boolean }) => void
  'room-updated': (data: Record<string, unknown>) => void
  'room-member-joined': (data: { roomId: string; user: Record<string, unknown> }) => void
  'room-member-left': (data: { roomId: string; userId: string }) => void
  'room-deleted': (data: { roomId: string }) => void
  offer: (data: { from: string; fromUserId: string; offer: unknown }) => void
  answer: (data: { from: string; fromUserId: string; answer: unknown }) => void
  'ice-candidate': (data: { from: string; fromUserId: string; candidate: unknown }) => void
  'new-dm-message': (payload: Record<string, unknown>) => void
  'dm-message-updated': (payload: Record<string, unknown>) => void
  'dm-typing': (data: { conversationId: string; userId: string; isTyping: boolean }) => void
  heartbeat: (data: { ts: number }) => void
  'friend-request': (data: Record<string, unknown>) => void
  'friend-accepted': (data: { userId: string }) => void
  'friendship-updated': () => void
  error: (data: { message: string }) => void
}

// ─── Client → Server events ──────────────────────────────────────────────────

export interface ClientToServerEvents {
  'join-room': (data: { roomId: string; userId: string }) => void
  'leave-room': (data: { roomId: string; userId: string }) => void
  'join-call': (data: { roomId: string; userId: string }) => void
  'leave-call': (data: { roomId: string; userId: string }) => void
  'join-call-no-audio': (data: { roomId: string; userId: string }) => void
  offer: (data: { to: string; offer: unknown; fromUserId: string }) => void
  answer: (data: { to: string; answer: unknown; fromUserId: string }) => void
  'ice-candidate': (data: { to: string; candidate: unknown; fromUserId: string }) => void
  'chat-message': (data: {
    roomId: string
    userId: string
    content: string
    replyToId?: string
  }) => void
  'user-typing': (data: { roomId: string; userId: string; isTyping: boolean }) => void
  'user-status': (data: { userId: string; status: string }) => void
  'set-rich-presence': (data: {
    userId: string
    richPresence: { label: string; details?: string | null; icon?: string | null; startedAt?: number | null } | null
  }) => void
  'join-dm': (data: { conversationId: string }) => void
  'leave-dm': (data: { conversationId: string }) => void
  'dm-message': (data: { conversationId: string; content: string; replyToId?: string }) => void
  'dm-typing': (data: { conversationId: string; isTyping: boolean }) => void
  authenticate: (data: { token: string }) => void
}

// ─── Socket Data ─────────────────────────────────────────────────────────────

export interface SocketData {
  userId: string
}
