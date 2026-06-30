const DB_NAME = 'nicori-offline'
const DB_VERSION = 1

const STORES = {
  MESSAGES: 'pending-messages',
  DM_MESSAGES: 'pending-dm-messages',
  PROFILE_UPDATES: 'pending-profile-updates',
  REACTIONS: 'pending-reactions',
  CACHE: 'response-cache',
} as const

let dbInstance: IDBDatabase | null = null

function openDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance)

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result

      if (!db.objectStoreNames.contains(STORES.MESSAGES)) {
        const msgStore = db.createObjectStore(STORES.MESSAGES, { keyPath: 'id', autoIncrement: true })
        msgStore.createIndex('roomId', 'roomId', { unique: false })
        msgStore.createIndex('timestamp', 'timestamp', { unique: false })
      }

      if (!db.objectStoreNames.contains(STORES.DM_MESSAGES)) {
        const dmStore = db.createObjectStore(STORES.DM_MESSAGES, { keyPath: 'id', autoIncrement: true })
        dmStore.createIndex('conversationId', 'conversationId', { unique: false })
        dmStore.createIndex('timestamp', 'timestamp', { unique: false })
      }

      if (!db.objectStoreNames.contains(STORES.PROFILE_UPDATES)) {
        db.createObjectStore(STORES.PROFILE_UPDATES, { keyPath: 'id', autoIncrement: true })
      }

      if (!db.objectStoreNames.contains(STORES.REACTIONS)) {
        db.createObjectStore(STORES.REACTIONS, { keyPath: 'id', autoIncrement: true })
      }

      if (!db.objectStoreNames.contains(STORES.CACHE)) {
        const cacheStore = db.createObjectStore(STORES.CACHE, { keyPath: 'url' })
        cacheStore.createIndex('timestamp', 'timestamp', { unique: false })
      }
    }

    request.onsuccess = () => {
      dbInstance = request.result
      resolve(dbInstance)
    }

    request.onerror = () => reject(request.error)
  })
}

async function addPending(storeName: string, data: Record<string, unknown>): Promise<number> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite')
    const store = tx.objectStore(storeName)
    const entry = { ...data, timestamp: Date.now(), synced: false }
    const req = store.add(entry)
    req.onsuccess = () => resolve(req.result as number)
    req.onerror = () => reject(req.error)
  })
}

async function getPending(storeName: string): Promise<Record<string, unknown>[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly')
    const store = tx.objectStore(storeName)
    const req = store.getAll()
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function removePending(storeName: string, id: number): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite')
    const store = tx.objectStore(storeName)
    const req = store.delete(id)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

async function clearStore(storeName: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite')
    const store = tx.objectStore(storeName)
    const req = store.clear()
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

async function cacheResponse(url: string, data: unknown, ttlMs = 300000): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.CACHE, 'readwrite')
    const store = tx.objectStore(STORES.CACHE)
    store.put({ url, data, timestamp: Date.now(), ttl: ttlMs })
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

async function getCachedResponse(url: string): Promise<unknown | null> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.CACHE, 'readonly')
    const store = tx.objectStore(STORES.CACHE)
    const req = store.get(url)
    req.onsuccess = () => {
      const result = req.result
      if (!result) return resolve(null)
      if (Date.now() - result.timestamp > result.ttl) {
        resolve(null)
      } else {
        resolve(result.data)
      }
    }
    req.onerror = () => reject(req.error)
  })
}

export const offlineDB = {
  openDB,
  addPendingMessage: (data: Record<string, unknown>) => addPending(STORES.MESSAGES, data),
  getPendingMessages: () => getPending(STORES.MESSAGES),
  removePendingMessage: (id: number) => removePending(STORES.MESSAGES, id),
  clearPendingMessages: () => clearStore(STORES.MESSAGES),

  addPendingDm: (data: Record<string, unknown>) => addPending(STORES.DM_MESSAGES, data),
  getPendingDms: () => getPending(STORES.DM_MESSAGES),
  removePendingDm: (id: number) => removePending(STORES.DM_MESSAGES, id),
  clearPendingDms: () => clearStore(STORES.DM_MESSAGES),

  addPendingProfile: (data: Record<string, unknown>) => addPending(STORES.PROFILE_UPDATES, data),
  getPendingProfiles: () => getPending(STORES.PROFILE_UPDATES),
  removePendingProfile: (id: number) => removePending(STORES.PROFILE_UPDATES, id),

  addPendingReaction: (data: Record<string, unknown>) => addPending(STORES.REACTIONS, data),
  getPendingReactions: () => getPending(STORES.REACTIONS),
  removePendingReaction: (id: number) => removePending(STORES.REACTIONS, id),

  cacheResponse,
  getCachedResponse,
  clearCache: () => clearStore(STORES.CACHE),
}
