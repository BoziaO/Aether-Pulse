import { offlineDB } from './offline-db'
import { roomApi } from '@/services/api/room.api'
import { dmApi } from '@/services/api/dm.api'
import { userApi } from '@/services/api/user.api'

let isOnline = navigator.onLine
let syncInterval: ReturnType<typeof setInterval> | null = null
let onSyncComplete: (() => void) | null = null

function setOnlineStatus(online: boolean) {
  isOnline = online
  if (online) {
    syncPending()
  }
}

async function syncPending() {
  if (!isOnline) return

  await syncMessages()
  await syncDms()
  await syncProfiles()
  await syncReactions()

  if (onSyncComplete) {
    onSyncComplete()
  }
}

async function syncMessages() {
  const pending = await offlineDB.getPendingMessages()
  for (const item of pending) {
    try {
      await roomApi.sendMessage(item.roomId as string, item.content as string, item.replyToId as string | undefined)
      await offlineDB.removePendingMessage(item.id as number)
    } catch {
      // Will retry on next sync
    }
  }
}

async function syncDms() {
  const pending = await offlineDB.getPendingDms()
  for (const item of pending) {
    try {
      await dmApi.send(item.conversationId as string, item.content as string, item.replyToId as string | undefined)
      await offlineDB.removePendingDm(item.id as number)
    } catch {
      // Will retry on next sync
    }
  }
}

async function syncProfiles() {
  const pending = await offlineDB.getPendingProfiles()
  for (const item of pending) {
    try {
      await userApi.update(item.userId as string, item.data as Record<string, unknown>)
      await offlineDB.removePendingProfile(item.id as number)
    } catch {
      // Will retry on next sync
    }
  }
}

async function syncReactions() {
  const pending = await offlineDB.getPendingReactions()
  for (const item of pending) {
    try {
      await roomApi.toggleReaction(item.roomId as string, item.messageId as string, item.emoji as string)
      await offlineDB.removePendingReaction(item.id as number)
    } catch {
      // Will retry on next sync
    }
  }
}

export function initSync() {
  window.addEventListener('online', () => setOnlineStatus(true))
  window.addEventListener('offline', () => setOnlineStatus(false))

  isOnline = navigator.onLine

  if (isOnline) {
    syncPending()
  }

  syncInterval = setInterval(() => {
    if (isOnline) syncPending()
  }, 30000)
}

function setOnSyncComplete(handler: () => void) {
  onSyncComplete = handler
}

function getPendingCount(): Promise<number> {
  return Promise.all([
    offlineDB.getPendingMessages(),
    offlineDB.getPendingDms(),
    offlineDB.getPendingProfiles(),
    offlineDB.getPendingReactions(),
  ]).then(([msgs, dms, profiles, reactions]) => msgs.length + dms.length + profiles.length + reactions.length)
}

export function isOffline(): boolean {
  return !isOnline
}

export const syncEngine = {
  init: initSync,
  syncPending,
  getPendingCount,
  isOffline,
  setOnSyncComplete,
  stop: () => {
    if (syncInterval) {
      clearInterval(syncInterval)
      syncInterval = null
    }
  },
}
