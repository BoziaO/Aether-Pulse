import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId
  username: string
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
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    displayName: { type: String, required: true, index: true },
    avatarUrl: { type: String, default: null },
    bannerUrl: { type: String, default: null },
    bio: { type: String, default: null },
    pronouns: { type: String, default: null },
    website: { type: String, default: null },
    location: { type: String, default: null },
    status: {
      type: String,
      enum: ['online', 'away', 'busy', 'offline'],
      default: 'offline',
      index: true,
    },
    customStatus: { type: String, default: null },
    accentColor: { type: String, default: null },
    primaryColor: { type: String, default: null },
    displayNameStyle: { type: String, default: null },
    profileGradient: { type: String, default: null },
    avatarFrame: { type: String, default: null },
    profileTheme: { type: String, default: null },
    customTheme: { type: String, default: null },
    badges: { type: [String], default: [] },
    socialLinks: {
      type: [{ platform: String, url: String, label: String }],
      default: [],
    },
    timezone: { type: String, default: null },
    profilePrivacy: {
      type: String,
      enum: ['public', 'friends', 'private'],
      default: 'public',
    },
    showTimezone: { type: Boolean, default: true },
    showLastSeen: { type: Boolean, default: true },
    preferredTheme: { type: String, default: null },
    lastSeenAt: { type: Date, default: null },
    profileViews: { type: Number, default: 0 },
    showProfileViews: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
)

export const User: Model<IUser> = mongoose.models.User ?? mongoose.model<IUser>('User', UserSchema)
