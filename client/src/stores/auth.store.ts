import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

import { authApi } from '@/services/api/auth.api'
import { setOnUnauthorized } from '@/services/api/client'
import { TokenManager } from '@/services/auth.token-manager'
import { userApi } from '@/services/api/user.api'
import type { User } from '@/types/user.types'
import { useSettingsStore, type ThemeMode } from './settings.store'
import { getSocket } from '@/services/socket/socket'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const isFetchingMe = ref(false)

  let refreshPromise: Promise<boolean> | null = null

  const isLoggedIn = computed(() => !!user.value)

  async function doRefresh(): Promise<boolean> {
    const rt = TokenManager.getRefreshToken()
    if (!rt) return false

    try {
      const res = await authApi.refresh(rt)
      TokenManager.setTokens(res.accessToken, res.refreshToken, TokenManager.isRememberMe())
      TokenManager.scheduleAutoRefresh(doRefresh)
      return true
    } catch {
      TokenManager.clearTokens()
      user.value = null
      return false
    }
  }

  async function refreshAccessToken(): Promise<boolean> {
    if (refreshPromise) return refreshPromise
    refreshPromise = doRefresh()
    try {
      return await refreshPromise
    } finally {
      refreshPromise = null
    }
  }

  setOnUnauthorized(async () => {
    return refreshAccessToken()
  })

  async function login(username: string, password: string, remember?: boolean) {
    loading.value = true
    error.value = null
    try {
      const res = await authApi.login(username, password)
      user.value = res.user
      TokenManager.setTokens(res.accessToken, res.refreshToken, remember ?? true)
      TokenManager.scheduleAutoRefresh(doRefresh)
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Login failed'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function register(
    username: string,
    email: string,
    password: string,
    displayName: string,
    remember?: boolean
  ) {
    loading.value = true
    error.value = null
    try {
      const res = await authApi.register(username, email, password, displayName)
      user.value = res.user
      TokenManager.setTokens(res.accessToken, res.refreshToken, remember ?? true)
      TokenManager.scheduleAutoRefresh(doRefresh)
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
    } catch {
      /* empty */
    }
    TokenManager.clearTokens()
    user.value = null
    import('@/services/socket/socket').then(({ resetSocket }) => resetSocket())
  }

  async function fetchMe() {
    if (isFetchingMe.value) return
    isFetchingMe.value = true

    try {
      const token = TokenManager.getAccessToken()
      if (!token) {
        user.value = null
        return
      }

      const res = await authApi.me()
      user.value = res.user
      TokenManager.scheduleAutoRefresh(doRefresh)
    } catch {
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
        | 'socialLinks'
        | 'profilePrivacy'
        | 'showTimezone'
        | 'showLastSeen'
        | 'showProfileViews'
        | 'timezone'
        | 'richPresence'
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
    } catch {
      /* empty */
    }
    return updated
  }

  async function forgotPassword(email: string) {
    return authApi.forgotPassword(email)
  }

  async function resetPassword(token: string, newPassword: string) {
    return authApi.resetPassword(token, newPassword)
  }

  async function getOAuthUrl(provider: 'google' | 'github') {
    return authApi.getOAuthUrl(provider)
  }

  async function handleOAuthCallback(provider: string, code: string) {
    const res = await authApi.oauthCallback(provider, code)
    user.value = res.user
    TokenManager.setTokens(res.accessToken, res.refreshToken, true)
    TokenManager.scheduleAutoRefresh(doRefresh)
    return res
  }

  async function authRequest<T>(fn: () => Promise<T>): Promise<T> {
    return fn()
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
    login,
    register,
    logout,
    fetchMe,
    updateProfile,
    refreshAccessToken,
    forgotPassword,
    resetPassword,
    getOAuthUrl,
    handleOAuthCallback,
    authRequest,
  }
})
