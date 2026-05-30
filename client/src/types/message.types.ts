export interface MessageUser {
  id: number
  displayName: string
  avatarUrl: string | null
  accentColor: string | null
  profileGradient: string | null
}

export interface Message {
  id: number
  roomId: string
  userId: number
  content: string
  type: 'text' | 'system' | 'file'
  createdAt: string
  user?: MessageUser | null
}
