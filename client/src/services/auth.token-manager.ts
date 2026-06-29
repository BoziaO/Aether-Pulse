const ACCESS_TOKEN_KEY = 'nicori_access_token'
const REFRESH_TOKEN_KEY = 'nicori_refresh_token'
const REMEMBER_ME_KEY = 'nicori_remember_me'

let refreshTimer: ReturnType<typeof setTimeout> | null = null

function parseJwtExp(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return typeof payload.exp === 'number' ? payload.exp : null
  } catch {
    return null
  }
}

export const TokenManager = {
  getAccessToken(): string | null {
    return sessionStorage.getItem(ACCESS_TOKEN_KEY) ?? localStorage.getItem(ACCESS_TOKEN_KEY)
  },

  getRefreshToken(): string | null {
    return sessionStorage.getItem(REFRESH_TOKEN_KEY) ?? localStorage.getItem(REFRESH_TOKEN_KEY)
  },

  isRememberMe(): boolean {
    return localStorage.getItem(REMEMBER_ME_KEY) !== 'false'
  },

  setTokens(accessToken: string, refreshToken: string, remember: boolean): void {
    const storage = remember ? localStorage : sessionStorage
    const other = remember ? sessionStorage : localStorage

    storage.setItem(ACCESS_TOKEN_KEY, accessToken)
    storage.setItem(REFRESH_TOKEN_KEY, refreshToken)
    other.removeItem(ACCESS_TOKEN_KEY)
    other.removeItem(REFRESH_TOKEN_KEY)

    if (remember) {
      localStorage.setItem(REMEMBER_ME_KEY, 'true')
    } else {
      localStorage.removeItem(REMEMBER_ME_KEY)
    }
  },

  clearTokens(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    sessionStorage.removeItem(ACCESS_TOKEN_KEY)
    sessionStorage.removeItem(REFRESH_TOKEN_KEY)
    localStorage.removeItem(REMEMBER_ME_KEY)
    TokenManager.cancelAutoRefresh()
  },

  scheduleAutoRefresh(onRefresh: () => Promise<boolean>): void {
    TokenManager.cancelAutoRefresh()
    const token = TokenManager.getAccessToken()
    if (!token) return

    const exp = parseJwtExp(token)
    if (!exp) return

    const now = Math.floor(Date.now() / 1000)
    const refreshIn = (exp - now - 60) * 1000

    if (refreshIn <= 0) {
      onRefresh()
      return
    }

    refreshTimer = setTimeout(async () => {
      const success = await onRefresh()
      if (success) {
        TokenManager.scheduleAutoRefresh(onRefresh)
      }
    }, refreshIn)
  },

  cancelAutoRefresh(): void {
    if (refreshTimer) {
      clearTimeout(refreshTimer)
      refreshTimer = null
    }
  },
}
