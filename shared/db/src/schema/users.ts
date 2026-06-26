import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IUser extends Document {
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
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      maxlength: 32,
    },
    email: {
      type: String,
      default: null,
      sparse: true,
      unique: true,
      maxlength: 255,
    },
    passwordHash: { type: String, required: true, maxlength: 255 },
    displayName: {
      type: String,
      required: true,
      index: true,
      maxlength: 64,
    },
    avatarUrl: { type: String, default: null, maxlength: 2048 },
    bannerUrl: { type: String, default: null, maxlength: 2048 },
    bio: { type: String, default: null, maxlength: 512 },
    pronouns: { type: String, default: null, maxlength: 32 },
    website: { type: String, default: null, maxlength: 2048 },
    location: { type: String, default: null, maxlength: 128 },
    status: {
      type: String,
      enum: ['online', 'away', 'busy', 'offline'],
      default: 'offline',
      index: true,
    },
    customStatus: { type: String, default: null, maxlength: 128 },
    accentColor: { type: String, default: null, maxlength: 7 },
    primaryColor: { type: String, default: null, maxlength: 7 },
    displayNameStyle: { type: String, default: null, maxlength: 64 },
    profileGradient: { type: String, default: null, maxlength: 255 },
    avatarFrame: { type: String, default: null, maxlength: 255 },
    profileTheme: { type: String, default: null, maxlength: 64 },
    customTheme: { type: String, default: null, maxlength: 64 },
    badges: { type: [String], default: [] },
    socialLinks: {
      type: [
        {
          platform: {
            type: String,
            required: true,
            maxlength: 32,
          },
          url: {
            type: String,
            required: true,
            maxlength: 2048,
          },
          label: { type: String, maxlength: 64 },
        },
      ],
      default: [],
    },
    timezone: { type: String, default: null, maxlength: 64 },
    profilePrivacy: {
      type: String,
      enum: ['public', 'friends', 'private'],
      default: 'public',
    },
    showTimezone: { type: Boolean, default: true },
    showLastSeen: { type: Boolean, default: true },
    preferredTheme: { type: String, default: null, maxlength: 64 },
    lastSeenAt: { type: Date, default: null },
    profileViews: { type: Number, default: 0, min: 0 },
    showProfileViews: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
)

UserSchema.index({ username: 'text', displayName: 'text' }, { name: 'user_search_text' })

export const User: Model<IUser> = mongoose.models.User ?? mongoose.model<IUser>('User', UserSchema)
