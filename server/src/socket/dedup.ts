const DEDUP_WINDOW_MS = 5000
const userMessageHashes = new Map<string, Map<string, number>>()

function makeMessageHash(roomOrConv: string, userId: string, content: string): string {
  return `${roomOrConv}:${userId}:${content}`
}

export function isDuplicateMessage(roomOrConv: string, userId: string, content: string): boolean {
  const hash = makeMessageHash(roomOrConv, userId, content.trim())
  const now = Date.now()

  let userHashes = userMessageHashes.get(userId)
  if (!userHashes) {
    userHashes = new Map()
    userMessageHashes.set(userId, userHashes)
  }

  const lastSeen = userHashes.get(hash)
  if (lastSeen && now - lastSeen < DEDUP_WINDOW_MS) {
    return true
  }

  userHashes.set(hash, now)
  return false
}

export function cleanupUserDedup(userId: string) {
  userMessageHashes.delete(userId)
}
