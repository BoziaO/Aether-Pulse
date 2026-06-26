export type UserStatus = 'online' | 'away' | 'busy' | 'offline'

export interface PresenceState {
  onlineUsers: Set<string>
  typingUsers: Map<string, Set<string>>
  readTimestamps: Map<string, Map<string, string>>
}

export interface TypingUser {
  userId: string
  roomId: string
  isTyping: boolean
}

export interface ReadReceipt {
  userId: string
  roomId: string
  lastReadAt: string
}
