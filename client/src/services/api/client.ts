/**
 * Get JWT access token from localStorage
 */
function getAccessToken(): string | null {
  return localStorage.getItem('aetherpulse_access_token')
}

/**
 * Build headers with optional JWT Authorization
 */
function buildHeaders(additionalHeaders: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...additionalHeaders,
  }

  const token = getAccessToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  return headers
}

const isElectronProd = typeof window !== 'undefined' && (window as any).electronAPI && location.protocol === 'file:'
const apiUrl = import.meta.env.VITE_API_URL || (isElectronProd ? 'https://aether-pulse-server.onrender.com' : '')
const API_BASE = apiUrl + '/api'

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: buildHeaders(options.headers as Record<string, string>),
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    const message = (err as { error?: string }).error || `HTTP ${res.status}`
    const apiError = new Error(message)
    ;(apiError as any).status = res.status
    throw apiError
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export async function apiUpload<T>(
  path: string,
  formData: FormData,
  options: { method?: string } = {}
): Promise<T> {
  // For form data, we don't set Content-Type (browser will set it with boundary)
  const headers: Record<string, string> = {}
  const token = getAccessToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method: options.method ?? 'POST',
    credentials: 'include',
    body: formData,
    headers,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    const message = (err as { error?: string }).error || `HTTP ${res.status}`
    const apiError = new Error(message)
    ;(apiError as any).status = res.status
    throw apiError
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}
