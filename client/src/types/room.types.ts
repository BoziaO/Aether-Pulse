import type { User } from './user.types'

export interface Room {
  id: string
  name: string
  inviteCode: string
  ownerId: string
  quality: string
  isActive: boolean
  createdAt: string
  memberCount?: number
  members?: User[]
}
