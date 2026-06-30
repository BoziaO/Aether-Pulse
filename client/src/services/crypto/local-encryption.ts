import { e2e, type EncryptedData } from './e2e'

const STORAGE_KEY = 'nicori_local_key'
const SETTINGS_KEY = 'nicori_encrypted_settings'

let masterKey: string | null = null

function getMasterKey(): string {
  if (masterKey) return masterKey

  const stored = sessionStorage.getItem(STORAGE_KEY)
  if (stored) {
    masterKey = stored
    return masterKey
  }

  const newKey = e2e.generatePassphrase()
  sessionStorage.setItem(STORAGE_KEY, newKey)
  masterKey = newKey
  return masterKey
}

export const localEncryption = {
  async encrypt(data: string): Promise<EncryptedData> {
    const key = getMasterKey()
    return e2e.encryptLocal(data, key)
  },

  async decrypt(encrypted: EncryptedData): Promise<string> {
    const key = getMasterKey()
    return e2e.decryptLocal(encrypted, key)
  },

  async encryptObject(obj: Record<string, unknown>): Promise<EncryptedData> {
    return localEncryption.encrypt(JSON.stringify(obj))
  },

  async decryptObject<T = Record<string, unknown>>(encrypted: EncryptedData): Promise<T> {
    const json = await localEncryption.decrypt(encrypted)
    return JSON.parse(json) as T
  },

  async saveEncrypted(key: string, data: unknown): Promise<void> {
    const existing = localStorage.getItem(SETTINGS_KEY)
    let store: Record<string, EncryptedData> = {}

    if (existing) {
      try {
        store = JSON.parse(existing)
      } catch {
        store = {}
      }
    }

    store[key] = await localEncryption.encryptObject(data as Record<string, unknown>)
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(store))
  },

  async loadEncrypted<T = unknown>(key: string): Promise<T | null> {
    const existing = localStorage.getItem(SETTINGS_KEY)
    if (!existing) return null

    try {
      const store: Record<string, EncryptedData> = JSON.parse(existing)
      const encrypted = store[key]
      if (!encrypted) return null
      return localEncryption.decryptObject<T>(encrypted)
    } catch {
      return null
    }
  },

  async removeEncrypted(key: string): Promise<void> {
    const existing = localStorage.getItem(SETTINGS_KEY)
    if (!existing) return

    try {
      const store: Record<string, EncryptedData> = JSON.parse(existing)
      delete store[key]
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(store))
    } catch {
      // ignore
    }
  },

  clearKey(): void {
    masterKey = null
    sessionStorage.removeItem(STORAGE_KEY)
  },

  hasKey(): boolean {
    return sessionStorage.getItem(STORAGE_KEY) !== null
  },
}
