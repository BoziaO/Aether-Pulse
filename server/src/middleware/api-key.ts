import type { Request, Response, NextFunction } from 'express'
import type { AuthenticatedRequest } from './auth'

const API_KEY_HEADER = 'X-API-Key'
const API_KEY_STORE = new Map<string, { userId: string; createdAt: number; name: string }>()

const MAX_AGE = 30 * 24 * 60 * 60 * 1000 // 30 days

function cleanupApiKeys() {
  const now = Date.now()
  for (const [key, value] of API_KEY_STORE.entries()) {
    if (now - value.createdAt > MAX_AGE) {
      API_KEY_STORE.delete(key)
    }
  }
}

setInterval(cleanupApiKeys, 24 * 60 * 60 * 1000)

export function generateApiKey(userId: string, name: string): string {
  const key = `nicori_${Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')}`

  API_KEY_STORE.set(key, {
    userId,
    name,
    createdAt: Date.now(),
  })

  return key
}

export function revokeApiKey(key: string): boolean {
  return API_KEY_STORE.delete(key)
}

export function listApiKeys(userId: string): { name: string; createdAt: number }[] {
  const keys: { name: string; createdAt: number }[] = []
  API_KEY_STORE.forEach((value, _key) => {
    if (value.userId === userId) {
      keys.push({ name: value.name, createdAt: value.createdAt })
    }
  })
  return keys
}

export function apiKeyAuth(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers[API_KEY_HEADER.toLowerCase()] as string | undefined

  if (!apiKey) {
    return next()
  }

  const entry = API_KEY_STORE.get(apiKey)
  if (!entry) {
    res.status(401).json({ error: { message: 'Invalid API key', code: 'INVALID_API_KEY' } })
    return
  }

  ;(req as AuthenticatedRequest).user = { userId: entry.userId, username: entry.name }
  ;(req as any).authMethod = 'api-key'
  next()
}
