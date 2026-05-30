export interface Room {
  id: string
  name: string
  inviteCode: string
  ownerId: number
  quality: string
  isActive: boolean
  createdAt: string
  memberCount?: number
}
