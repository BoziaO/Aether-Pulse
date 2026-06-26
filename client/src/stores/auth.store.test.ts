import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// Mock the authApi at the top level to avoid hoisting and context conflicts
vi.mock('@/services/api/auth.api', () => ({
  authApi: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    refresh: vi.fn(),
    me: vi.fn(),
  },
}))

import { authApi } from '@/services/api/auth.api'
import { useAuthStore } from './auth.store'

describe('Auth Store', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())

    // Clear localStorage before each test
    localStorage.clear()
  })

  it('initializes with null user and tokens', () => {
    const auth = useAuthStore()

    expect(auth.user).toBeNull()
    expect(auth.accessToken).toBeNull()
    expect(auth.refreshToken).toBeNull()
    expect(auth.loading).toBe(false)
    expect(auth.error).toBeNull()
    expect(auth.isLoggedIn).toBe(false)
  })

  it('updates user on login', async () => {
    vi.mocked(authApi.login).mockResolvedValue({
      user: {
        id: 1,
        username: 'testuser',
        displayName: 'Test User',
        avatarUrl: null,
        bannerUrl: null,
        bio: null,
        pronouns: null,
        website: null,
        location: null,
        status: 'online',
        customStatus: null,
        accentColor: null,
        profileGradient: null,
        avatarFrame: null,
        profileTheme: null,
        customTheme: null,
        badges: [],
        createdAt: new Date().toISOString(),
      },
      accessToken: 'test-access-token',
      refreshToken: 'test-refresh-token',
    })

    const auth = useAuthStore()
    await auth.login('testuser', 'password123')

    expect(auth.user).toEqual({
      id: 1,
      username: 'testuser',
      displayName: 'Test User',
      avatarUrl: null,
      bannerUrl: null,
      bio: null,
      pronouns: null,
      website: null,
      location: null,
      status: 'online',
      customStatus: null,
      accentColor: null,
      profileGradient: null,
      avatarFrame: null,
      profileTheme: null,
      customTheme: null,
      badges: [],
      createdAt: expect.any(String),
    })
    expect(auth.accessToken).toBe('test-access-token')
    expect(auth.refreshToken).toBe('test-refresh-token')
    expect(auth.isLoggedIn).toBe(true)
    expect(auth.loading).toBe(false)
  })

  it('sets loading state during login', async () => {
    vi.mocked(authApi.login).mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              user: {
                id: 1,
                username: 'testuser',
                displayName: 'Test User',
                avatarUrl: null,
                bannerUrl: null,
                bio: null,
                pronouns: null,
                website: null,
                location: null,
                status: 'online',
                customStatus: null,
                accentColor: null,
                profileGradient: null,
                avatarFrame: null,
                profileTheme: null,
                customTheme: null,
                badges: [],
                createdAt: new Date().toISOString(),
              },
              accessToken: 'test-access-token',
              refreshToken: 'test-refresh-token',
            })
          }, 100)
        })
    )

    const auth = useAuthStore()
    const loginPromise = auth.login('testuser', 'password123')

    expect(auth.loading).toBe(true)

    await loginPromise

    expect(auth.loading).toBe(false)
  })

  it('sets error on login failure', async () => {
    vi.mocked(authApi.login).mockRejectedValue(new Error('Invalid credentials'))

    const auth = useAuthStore()

    try {
      await auth.login('testuser', 'wrongpassword')
    } catch {
      // Expected
    }

    expect(auth.error).toBe('Invalid credentials')
    expect(auth.user).toBeNull()
    expect(auth.isLoggedIn).toBe(false)
  })

  it('clears user and tokens on logout', async () => {
    vi.mocked(authApi.logout).mockResolvedValue({ ok: true } as any)

    const auth = useAuthStore()

    // Set initial state
    auth.user = {
      id: 1,
      username: 'testuser',
      displayName: 'Test User',
      avatarUrl: null,
      bannerUrl: null,
      bio: null,
      pronouns: null,
      website: null,
      location: null,
      status: 'online',
      customStatus: null,
      accentColor: null,
      profileGradient: null,
      avatarFrame: null,
      profileTheme: null,
      customTheme: null,
      badges: [],
      createdAt: new Date().toISOString(),
    }
    auth.accessToken = 'test-access-token'
    auth.refreshToken = 'test-refresh-token'
    localStorage.setItem('aetherpulse_access_token', 'test-access-token')
    localStorage.setItem('aetherpulse_refresh_token', 'test-refresh-token')

    expect(auth.isLoggedIn).toBe(true)

    await auth.logout()

    expect(auth.user).toBeNull()
    expect(auth.accessToken).toBeNull()
    expect(auth.refreshToken).toBeNull()
    expect(auth.isLoggedIn).toBe(false)
    expect(localStorage.getItem('aetherpulse_access_token')).toBeNull()
    expect(localStorage.getItem('aetherpulse_refresh_token')).toBeNull()
  })

  it('persists tokens to localStorage on login', async () => {
    vi.mocked(authApi.login).mockResolvedValue({
      user: {
        id: 1,
        username: 'testuser',
        displayName: 'Test User',
        avatarUrl: null,
        bannerUrl: null,
        bio: null,
        pronouns: null,
        website: null,
        location: null,
        status: 'online',
        customStatus: null,
        accentColor: null,
        profileGradient: null,
        avatarFrame: null,
        profileTheme: null,
        customTheme: null,
        badges: [],
        createdAt: new Date().toISOString(),
      },
      accessToken: 'test-access-token',
      refreshToken: 'test-refresh-token',
    })

    const auth = useAuthStore()
    await auth.login('testuser', 'password123')

    expect(localStorage.getItem('aetherpulse_access_token')).toBe('test-access-token')
    expect(localStorage.getItem('aetherpulse_refresh_token')).toBe('test-refresh-token')
  })

  it('loads tokens from localStorage on initialization', () => {
    // Set tokens in localStorage
    localStorage.setItem('aetherpulse_access_token', 'stored-access-token')
    localStorage.setItem('aetherpulse_refresh_token', 'stored-refresh-token')

    const auth = useAuthStore()

    expect(auth.accessToken).toBe('stored-access-token')
    expect(auth.refreshToken).toBe('stored-refresh-token')
  })

  it('refreshes access token successfully', async () => {
    vi.mocked(authApi.refresh).mockResolvedValue({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    })

    const auth = useAuthStore()

    // Set initial refresh token
    auth.refreshToken = 'valid-refresh-token'
    localStorage.setItem('aetherpulse_refresh_token', 'valid-refresh-token')

    const result = await auth.refreshAccessToken()

    expect(result).toBe(true)
    expect(auth.accessToken).toBe('new-access-token')
    expect(auth.refreshToken).toBe('new-refresh-token')
    expect(localStorage.getItem('aetherpulse_access_token')).toBe('new-access-token')
    expect(localStorage.getItem('aetherpulse_refresh_token')).toBe('new-refresh-token')
  })

  it('clears tokens on refresh failure', async () => {
    vi.mocked(authApi.refresh).mockRejectedValue(new Error('Invalid refresh token'))

    const auth = useAuthStore()

    // Set initial tokens
    auth.accessToken = 'old-access-token'
    auth.refreshToken = 'invalid-refresh-token'
    auth.user = {
      id: 1,
      username: 'testuser',
      displayName: 'Test User',
      avatarUrl: null,
      bannerUrl: null,
      bio: null,
      pronouns: null,
      website: null,
      location: null,
      status: 'offline',
      customStatus: null,
      accentColor: null,
      profileGradient: null,
      avatarFrame: null,
      profileTheme: null,
      customTheme: null,
      badges: [],
      createdAt: new Date().toISOString(),
    }
    localStorage.setItem('aetherpulse_access_token', 'old-access-token')
    localStorage.setItem('aetherpulse_refresh_token', 'invalid-refresh-token')

    const result = await auth.refreshAccessToken()

    expect(result).toBe(false)
    expect(auth.accessToken).toBeNull()
    expect(auth.refreshToken).toBeNull()
    expect(auth.user).toBeNull()
    expect(localStorage.getItem('aetherpulse_access_token')).toBeNull()
    expect(localStorage.getItem('aetherpulse_refresh_token')).toBeNull()
  })
})
