import { describe, it, expect } from 'vitest'

import { serializeUser, type SerializableUser } from './serialize-user'

function makeUser(overrides: Partial<SerializableUser> = {}): SerializableUser {
  return {
    _id: '507f1f77bcf86cd799439011',
    username: 'testuser',
    email: 'test@example.com',
    displayName: 'Test User',
    status: 'online',
    badges: [],
    socialLinks: [],
    profilePrivacy: 'public',
    showTimezone: true,
    showLastSeen: true,
    showProfileViews: true,
    createdAt: new Date('2024-01-01'),
    ...overrides,
  }
}

describe('serialize-user', () => {
  describe('serializeUser', () => {
    it('should return basic user fields', () => {
      const user = makeUser()
      const result = serializeUser(user)
      expect(result.id).toBe('507f1f77bcf86cd799439011')
      expect(result.username).toBe('testuser')
      expect(result.displayName).toBe('Test User')
    })

    it('should include email only for own profile', () => {
      const user = makeUser({ email: 'secret@example.com' })
      const ownResult = serializeUser(user, { viewerId: '507f1f77bcf86cd799439011' })
      expect(ownResult.email).toBe('secret@example.com')

      const otherResult = serializeUser(user, { viewerId: 'other-user-id' })
      expect(otherResult.email).toBeNull()
    })

    it('should hide sensitive fields for non-public profiles', () => {
      const user = makeUser({
        profilePrivacy: 'private',
        bannerUrl: 'https://example.com/banner.png',
        bio: 'My bio',
        pronouns: 'they/them',
      })

      const result = serializeUser(user, { viewerId: 'other-user-id' })
      expect(result.bannerUrl).toBeNull()
      expect(result.bio).toBeNull()
      expect(result.pronouns).toBeNull()
      expect(result.status).toBe('offline')
    })

    it('should show fields for friends when privacy is friends-only', () => {
      const user = makeUser({
        profilePrivacy: 'friends',
        bio: 'Friend only bio',
      })

      const friendResult = serializeUser(user, {
        viewerId: 'other-user-id',
        isFriend: true,
      })
      expect(friendResult.bio).toBe('Friend only bio')

      const nonFriendResult = serializeUser(user, {
        viewerId: 'other-user-id',
        isFriend: false,
      })
      expect(nonFriendResult.bio).toBeNull()
    })

    it('should show profile views only when allowed', () => {
      const user = makeUser({ profileViews: 42, showProfileViews: true })
      const result = serializeUser(user)
      expect(result.profileViews).toBe(42)

      const hiddenUser = makeUser({ profileViews: 42, showProfileViews: false })
      const hiddenResult = serializeUser(hiddenUser, { viewerId: 'other' })
      expect(hiddenResult.profileViews).toBeNull()
    })

    it('should always show profile views to own user', () => {
      const user = makeUser({
        profileViews: 100,
        showProfileViews: false,
      })
      const result = serializeUser(user, { viewerId: '507f1f77bcf86cd799439011' })
      expect(result.profileViews).toBe(100)
    })

    it('should handle null/undefined optional fields', () => {
      const user = makeUser({
        bannerUrl: null,
        bio: undefined,
        pronouns: null,
        website: null,
        location: null,
        customStatus: null,
      })

      const result = serializeUser(user)
      expect(result.bannerUrl).toBeNull()
      expect(result.bio).toBeNull()
      expect(result.pronouns).toBeNull()
      expect(result.website).toBeNull()
      expect(result.location).toBeNull()
      expect(result.customStatus).toBeNull()
    })

    it('should convert lastSeenAt to ISO string', () => {
      const date = new Date('2024-06-15T10:30:00Z')
      const user = makeUser({ lastSeenAt: date })
      const result = serializeUser(user)
      expect(result.lastSeenAt).toBe(date.toISOString())
    })

    it('should hide lastSeenAt when showLastSeen is false', () => {
      const user = makeUser({
        lastSeenAt: new Date(),
        showLastSeen: false,
      })
      const result = serializeUser(user, { viewerId: 'other' })
      expect(result.lastSeenAt).toBeNull()
    })

    it('should include preferredTheme only for own profile', () => {
      const user = makeUser({ preferredTheme: 'aurora' })
      const ownResult = serializeUser(user, { viewerId: '507f1f77bcf86cd799439011' })
      expect(ownResult.preferredTheme).toBe('aurora')

      const otherResult = serializeUser(user, { viewerId: 'other' })
      expect(otherResult.preferredTheme).toBeNull()
    })

    it('should default badges to empty array when not an array', () => {
      const user = makeUser({ badges: null as unknown as string[] })
      const result = serializeUser(user)
      expect(result.badges).toEqual([])
    })

    it('should default socialLinks to empty array when not an array', () => {
      const user = makeUser({ socialLinks: null as unknown as SerializableUser['socialLinks'] })
      const result = serializeUser(user)
      expect(result.socialLinks).toEqual([])
    })
  })
})
