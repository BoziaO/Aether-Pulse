import type mongoose from 'mongoose'

export interface SerializableUser {
  _id: mongoose.Types.ObjectId | string
  username: string
  email?: string | null
  displayName: string
  avatarUrl?: string | null
  bannerUrl?: string | null
  bio?: string | null
  pronouns?: string | null
  website?: string | null
  location?: string | null
  status: string
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
  profilePrivacy: string
  showTimezone: boolean
  showLastSeen: boolean
  showProfileViews: boolean
  richPresence: {
    label: string
    details?: string | null
    icon?: string | null
    startedAt?: number | null
  } | null
  preferredTheme?: string | null
  lastSeenAt?: Date | null
  profileViews?: number | null
  createdAt: Date
}

export interface SocialLink {
  platform: string
  url: string
  label?: string
}

export function serializeUser(
  user: SerializableUser,
  options: { viewerId?: string | null; isFriend?: boolean } = {}
) {
  const privacy = user.profilePrivacy ?? 'public'
  const isOwn = options.viewerId != null && options.viewerId === user._id.toString()
  const isFriend = options.isFriend ?? false

  const canViewFull = isOwn || privacy === 'public' || (privacy === 'friends' && isFriend)
  const canViewViews = user.showProfileViews ?? true

  const socialLinks: SocialLink[] = Array.isArray(user.socialLinks) ? user.socialLinks : []
  const lastSeenAt = user.lastSeenAt ? user.lastSeenAt.toISOString() : null

  return {
    id: user._id.toString(),
    username: user.username,
    email: isOwn ? (user.email ?? null) : null,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl ?? null,
    bannerUrl: canViewFull ? (user.bannerUrl ?? null) : null,
    bio: canViewFull ? (user.bio ?? null) : null,
    pronouns: canViewFull ? (user.pronouns ?? null) : null,
    website: canViewFull ? (user.website ?? null) : null,
    location: canViewFull ? (user.location ?? null) : null,
    status: canViewFull ? user.status : ('offline' as const),
    customStatus: canViewFull ? (user.customStatus ?? null) : null,
    accentColor: user.accentColor ?? null,
    primaryColor: user.primaryColor ?? null,
    displayNameStyle: user.displayNameStyle ?? null,
    profileGradient: user.profileGradient ?? null,
    avatarFrame: user.avatarFrame ?? null,
    profileTheme: user.profileTheme ?? null,
    customTheme: user.customTheme ?? null,
    badges: Array.isArray(user.badges) ? user.badges : [],
    socialLinks: canViewFull ? socialLinks : [],
    timezone: canViewFull && user.showTimezone ? (user.timezone ?? null) : null,
    profilePrivacy: user.profilePrivacy ?? 'public',
    showTimezone: user.showTimezone ?? true,
    showLastSeen: user.showLastSeen ?? true,
    showProfileViews: user.showProfileViews ?? true,
    richPresence: canViewFull ? (user.richPresence ?? null) : null,
    preferredTheme: isOwn ? (user.preferredTheme ?? null) : null,
    lastSeenAt: canViewFull && user.showLastSeen ? lastSeenAt : null,
    profileViews: isOwn || canViewViews ? (user.profileViews ?? 0) : null,
    createdAt: user.createdAt.toISOString(),
  }
}
