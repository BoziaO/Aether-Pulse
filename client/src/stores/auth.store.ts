import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/services/api/auth.api'
import { userApi } from '@/services/api/user.api'
import type { User } from '@/types/user.types'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isLoggedIn = computed(() => user.value !== null)

  async function login(username: string, password: string) {
    loading.value = true
    error.value = null
    try {
      const res = await authApi.login(username, password)
      user.value = res.user
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
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Registration failed'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    try { await authApi.logout() } catch {}
    user.value = null
  }

  async function fetchMe() {
    try {
      const u = await authApi.me()
      user.value = u
    } catch {
      user.value = null
    }
  }

  async function updateProfile(data: Partial<Pick<User, 'displayName' | 'bio' | 'pronouns' | 'website' | 'location' | 'avatarUrl' | 'bannerUrl' | 'customStatus' | 'accentColor' | 'profileGradient' | 'status'>>) {
    if (!user.value) return
    const updated = await userApi.update(user.value.id, data)
    user.value = { ...user.value, ...updated }
    return updated
  }

  return { user, loading, error, isLoggedIn, login, register, logout, fetchMe, updateProfile }
})
