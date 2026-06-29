import mongoose from 'mongoose'
import { User } from '@workspace/db'

export type LeanUser = {
  _id: mongoose.Types.ObjectId
  username: string
  email?: string | null
  passwordHash: string
  displayName: string
  avatarUrl?: string | null
  bannerUrl?: string | null
  bio?: string | null
  pronouns?: string | null
  website?: string | null
  location?: string | null
  status: 'online' | 'away' | 'busy' | 'offline'
  customStatus?: string | null
  accentColor?: string | null
  primaryColor?: string | null
  displayNameStyle?: string | null
  profileGradient?: string | null
  avatarFrame?: string | null
  profileTheme?: string | null
  customTheme?: string | null
  badges: string[]
  socialLinks: Array<{ platform: string; url: string; label?: string }>
  timezone?: string | null
  profilePrivacy: 'public' | 'friends' | 'private'
  showTimezone: boolean
  showLastSeen: boolean
  preferredTheme?: string | null
  lastSeenAt?: Date | null
  profileViews: number
  showProfileViews: boolean
  richPresence: {
    label: string
    details?: string | null
    icon?: string | null
    startedAt?: number | null
  } | null
  googleId?: string | null
  githubId?: string | null
  resetPasswordToken?: string | null
  resetPasswordExpires?: Date | null
  createdAt: Date
  updatedAt: Date
}

type UserCreateData = {
  username: string
  email?: string | null
  passwordHash: string
  displayName: string
  avatarUrl?: string | null
  bannerUrl?: string | null
  bio?: string | null
  pronouns?: string | null
  website?: string | null
  location?: string | null
  status?: 'online' | 'away' | 'busy' | 'offline'
  customStatus?: string | null
  accentColor?: string | null
  primaryColor?: string | null
  displayNameStyle?: string | null
  profileGradient?: string | null
  avatarFrame?: string | null
  profileTheme?: string | null
  customTheme?: string | null
  badges?: string[]
  socialLinks?: Array<{ platform: string; url: string; label?: string }>
  timezone?: string | null
  profilePrivacy?: 'public' | 'friends' | 'private'
  showTimezone?: boolean
  showLastSeen?: boolean
  showProfileViews?: boolean
  googleId?: string | null
  githubId?: string | null
  resetPasswordToken?: string | null
  resetPasswordExpires?: Date | null
}

type UserUpdateData = Partial<Omit<UserCreateData, 'username' | 'passwordHash'>> & {
  richPresence?: {
    label: string
    details?: string | null
    icon?: string | null
    startedAt?: number | null
  } | null
}

export const UserRepository = {
  async findById(id: string): Promise<LeanUser | null> {
    return User.findById(id).lean() as Promise<LeanUser | null>
  },

  async findByIdAndUpdate(
    id: string,
    data: UserUpdateData,
    options?: { new?: boolean }
  ): Promise<LeanUser | null> {
    return User.findByIdAndUpdate(id, data, { new: true, ...options }).lean() as Promise<LeanUser | null>
  },

  async findOne(filter: Record<string, unknown>): Promise<LeanUser | null> {
    return User.findOne(filter).lean() as Promise<LeanUser | null>
  },

  async updateStatus(id: string, status: string): Promise<void> {
    await User.findByIdAndUpdate(id, { status })
  },

  async create(data: UserCreateData): Promise<LeanUser> {
    const doc = await User.create(data)
    return doc.toObject() as LeanUser
  },

  async search(query: string, excludeId: string, limit = 20): Promise<LeanUser[]> {
    return User.find({
      _id: { $ne: excludeId },
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { displayName: { $regex: query, $options: 'i' } },
      ],
    })
      .limit(limit)
      .lean() as Promise<LeanUser[]>
  },

  async findByIds(ids: string[]): Promise<LeanUser[]> {
    return User.find({ _id: { $in: ids } }).lean() as Promise<LeanUser[]>
  },
}
