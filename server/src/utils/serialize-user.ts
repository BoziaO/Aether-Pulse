import type { usersTable } from "@workspace/db";

export function parseBadges(value: string | string[] | null | undefined): string[] {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((badge): badge is string => typeof badge === "string") : [];
  } catch {
    return [];
  }
}

export interface SocialLink {
  platform: string;
  url: string;
  label?: string;
}

export function parseSocialLinks(value: string | null | undefined): SocialLink[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is SocialLink =>
        typeof item === "object" &&
        item !== null &&
        typeof item.platform === "string" &&
        typeof item.url === "string",
    );
  } catch {
    return [];
  }
}

export function serializeUser(
  user: typeof usersTable.$inferSelect,
  options: { viewerId?: number | null; isFriend?: boolean } = {},
) {
  const { passwordHash: _, ...safe } = user;
  const privacy = safe.profilePrivacy ?? "public";
  const isOwn = options.viewerId != null && options.viewerId === safe.id;
  const isFriend = options.isFriend ?? false;

  const canViewFull = isOwn || privacy === "public" || (privacy === "friends" && isFriend);

  const socialLinks = parseSocialLinks(safe.socialLinks);
  const lastSeenAt = safe.lastSeenAt ? safe.lastSeenAt.toISOString() : null;

  return {
    id: safe.id,
    username: safe.username,
    displayName: safe.displayName,
    avatarUrl: safe.avatarUrl ?? null,
    bannerUrl: canViewFull ? (safe.bannerUrl ?? null) : null,
    bio: canViewFull ? (safe.bio ?? null) : null,
    pronouns: canViewFull ? (safe.pronouns ?? null) : null,
    website: canViewFull ? (safe.website ?? null) : null,
    location: canViewFull ? (safe.location ?? null) : null,
    status: canViewFull ? safe.status : ("offline" as const),
    customStatus: canViewFull ? (safe.customStatus ?? null) : null,
    accentColor: safe.accentColor ?? null,
    profileGradient: safe.profileGradient ?? null,
    badges: parseBadges(safe.badges),
    socialLinks: canViewFull ? socialLinks : [],
    timezone: canViewFull && safe.showTimezone ? (safe.timezone ?? null) : null,
    profilePrivacy: safe.profilePrivacy ?? "public",
    showTimezone: safe.showTimezone ?? true,
    showLastSeen: safe.showLastSeen ?? true,
    preferredTheme: isOwn ? (safe.preferredTheme ?? null) : null,
    lastSeenAt: canViewFull && safe.showLastSeen ? lastSeenAt : null,
    createdAt: safe.createdAt.toISOString(),
  };
}
