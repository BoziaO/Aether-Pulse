import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

import { authApi } from '@/services/api/auth.api'
import { userApi } from '@/services/api/user.api'
import type { User } from '@/types/user.types'
import { useSettingsStore, type ThemeMode } from './settings.store'
import { getSocket } from '@/services/socket/socket'

// Storage keys for JWT tokens
const ACCESS_TOKEN_KEY = 'aetherpulse_access_token'
const REFRESH_TOKEN_KEY = 'aetherpulse_refresh_token'

/**
 * Get access token from localStorage
 */
function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

/**
 * Get refresh token from localStorage
 */
function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

/**
 * Set tokens in localStorage
 */
function setTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
}

/**
 * Clear tokens from localStorage
 */
function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const accessToken = ref<string | null>(getAccessToken())
  const refreshToken = ref<string | null>(getRefreshToken())
  const isFetchingMe = ref(false)

  const isLoggedIn = computed(() => {
    // Check if we have a valid access token and user
    return !!(accessToken.value && user.value)
  })

  /**
   * Refresh access token using refresh token
   */
  async function refreshAccessToken(): Promise<boolean> {
    const currentRefreshToken = refreshToken.value
    if (!currentRefreshToken) return false

    try {
      const res = await authApi.refresh(currentRefreshToken)
      accessToken.value = res.accessToken
      refreshToken.value = res.refreshToken
      setTokens(res.accessToken, res.refreshToken)
      return true
    } catch {
      // Refresh failed, clear tokens
      clearTokens()
      accessToken.value = null
      refreshToken.value = null
      user.value = null
      return false
    }
  }

  /**
   * Make authenticated API request with token refresh on 401
   */
  async function authRequest<T>(request: () => Promise<T>): Promise<T> {
    try {
      return await request()
    } catch (e: unknown) {
      const error = e as Error & { status?: number }
      // If unauthorized and we have a refresh token, try to refresh
      if (error.status === 401 && refreshToken.value) {
        const refreshed = await refreshAccessToken()
        if (refreshed) {
          return await request()
        }
      }
      throw e
    }
  }

  async function login(username: string, password: string) {
    loading.value = true
    error.value = null
    try {
      const res = await authApi.login(username, password)
      user.value = res.user
      accessToken.value = res.accessToken
      refreshToken.value = res.refreshToken
      setTokens(res.accessToken, res.refreshToken)
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Login failed'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function register(username: string, password: string, displayName: string) {
    loading.value = true
    error.value = null
    try {
      const res = await authApi.register(username, password, displayName)
      user.value = res.user
      accessToken.value = res.accessToken
      refreshToken.value = res.refreshToken
      setTokens(res.accessToken, res.refreshToken)
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Registration failed'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    try {
      await authApi.logout()
    } catch {}
    clearTokens()
    accessToken.value = null
    refreshToken.value = null
    user.value = null
    // Reset socket connection on logout to prevent stale connections
    import('@/services/socket/socket').then(({ resetSocket }) => resetSocket())
  }

  async function fetchMe() {
    // Prevent concurrent fetchMe calls
    if (isFetchingMe.value) {
      return
    }
    
    isFetchingMe.value = true
    try {
      const res = await authApi.me()
      user.value = res.user
    } catch {
      // If fetchMe fails, don't clear tokens - they might still be valid
      // The user will just remain as null until next successful fetch
      // This prevents being logged out due to temporary network issues
      user.value = null
    } finally {
      isFetchingMe.value = false
    }
  }

  async function updateProfile(
    data: Partial<
      Pick<
        User,
        | 'displayName'
        | 'bio'
        | 'pronouns'
        | 'website'
        | 'location'
        | 'avatarUrl'
        | 'bannerUrl'
        | 'customStatus'
        | 'accentColor'
        | 'primaryColor'
        | 'displayNameStyle'
        | 'badges'
        | 'profileGradient'
        | 'status'
        | 'avatarFrame'
        | 'profileTheme'
        | 'customTheme'
      >
    >
  ) {
    if (!user.value) return
    const updated = await userApi.update(user.value.id, data)
    user.value = { ...user.value, ...updated }
    try {
      getSocket().emit('user-status', {
        userId: user.value.id,
        status: updated.status ?? user.value.status,
      })
    } catch {}
    return updated
  }

  watch(
    user,
    (v) => {
      if (v && v.customTheme) {
        const settings = useSettingsStore()
        if (settings.theme !== v.customTheme) {
          settings.setTheme(v.customTheme as ThemeMode)
        }
      }
    },
    { immediate: true }
  )

  return {
    user,
    loading,
    error,
    isLoggedIn,
    accessToken,
    refreshToken,
    login,
    register,
    logout,
    fetchMe,
    updateProfile,
    refreshAccessToken,
    authRequest,
  }
})
