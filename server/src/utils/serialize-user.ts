import type { usersTable } from '@workspace/db'

export function parseBadges(value: string | string[] | null | undefined): string[] {
  if (Array.isArray(value)) return value
  if (!value) return []

  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed)
      ? parsed.filter((badge): badge is string => typeof badge === 'string')
      : []
  } catch {
    return []
  }
}

export function serializeUser(user: typeof usersTable.$inferSelect) {
  const { passwordHash: _, ...safe } = user

  return {
    ...safe,
    badges: parseBadges(safe.badges),
    avatarUrl: safe.avatarUrl ?? null,
    bannerUrl: safe.bannerUrl ?? null,
    bio: safe.bio ?? null,
    pronouns: safe.pronouns ?? null,
    website: safe.website ?? null,
    location: safe.location ?? null,
    customStatus: safe.customStatus ?? null,
    accentColor: safe.accentColor ?? null,
    profileGradient: safe.profileGradient ?? null,
    avatarFrame: safe.avatarFrame ?? null,
    profileTheme: safe.profileTheme ?? null,
    customTheme: safe.customTheme ?? null,
    createdAt: safe.createdAt.toISOString(),
  }
}
