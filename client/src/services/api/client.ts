import { TokenManager } from '@/services/auth.token-manager'

export class ApiError extends Error {
  status: number
  code: string | undefined

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

let onUnauthorized: (() => Promise<boolean>) | null = null

export function setOnUnauthorized(handler: () => Promise<boolean>): void {
  onUnauthorized = handler
}

const isElectronProd =
  typeof window !== 'undefined' && (window as any).electronAPI && location.protocol === 'file:'
const apiUrl =
  import.meta.env.VITE_API_URL || (isElectronProd ? 'https://nicori-server.onrender.com' : '')
const API_BASE = apiUrl + '/api'

function buildHeaders(additional?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...additional,
  }
  const token = TokenManager.getAccessToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as T

  const body = await res.json().catch(() => null)

  if (!res.ok) {
    const message = (body as any)?.error || (body as any)?.message || res.statusText
    const code = (body as any)?.code
    throw new ApiError(message, res.status, code)
  }

  return body as T
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: buildHeaders(options.headers as Record<string, string>),
    ...options,
  })

  if (res.status === 401 && onUnauthorized && !path.startsWith('/auth/refresh')) {
    const refreshed = await onUnauthorized()
    if (refreshed) {
      const retryRes = await fetch(`${API_BASE}${path}`, {
        credentials: 'include',
        headers: buildHeaders(options.headers as Record<string, string>),
        ...options,
      })
      return handleResponse<T>(retryRes)
    }
  }

  return handleResponse<T>(res)
}

export async function apiUpload<T>(
  path: string,
  formData: FormData,
  options: { method?: string } = {}
): Promise<T> {
  const headers: Record<string, string> = {}
  const token = TokenManager.getAccessToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method: options.method ?? 'POST',
    credentials: 'include',
    body: formData,
    headers,
  })

  if (res.status === 401 && onUnauthorized) {
    const refreshed = await onUnauthorized()
    if (refreshed) {
      const retryHeaders: Record<string, string> = {}
      const retryToken = TokenManager.getAccessToken()
      if (retryToken) retryHeaders['Authorization'] = `Bearer ${retryToken}`

      const retryRes = await fetch(`${API_BASE}${path}`, {
        method: options.method ?? 'POST',
        credentials: 'include',
        body: formData,
        headers: retryHeaders,
      })
      return handleResponse<T>(retryRes)
    }
  }

  return handleResponse<T>(res)
}
