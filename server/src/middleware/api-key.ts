import type { Request, Response, NextFunction } from 'express'

const API_KEY_HEADER = 'X-API-Key'
const API_KEY_STORE = new Map<string, { userId: string; createdAt: number; name: string }>()

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

  ;(req as any).userId = entry.userId
  ;(req as any).authMethod = 'api-key'
  next()
}
