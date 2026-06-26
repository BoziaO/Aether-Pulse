import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const usePresenceStore = defineStore('chatPresenceModule', () => {
  const onlineUsers = ref<Set<string>>(new Set())
  const typingUsers = ref<Map<string, Set<string>>>(new Map())
  const readTimestamps = ref<Map<string, Map<string, string>>>(new Map())

  const connectedUserCount = computed(() => onlineUsers.value.size)

  function setOnlineUsers(userIds: string[]): void {
    onlineUsers.value = new Set(userIds)
  }

  function userJoined(userId: string): void {
    const next = new Set(onlineUsers.value)
    next.add(userId)
    onlineUsers.value = next
  }

  function userLeft(userId: string): void {
    const next = new Set(onlineUsers.value)
    next.delete(userId)
    onlineUsers.value = next

    const typingCopy = new Map(typingUsers.value)
    for (const [roomId, userIds] of typingCopy) {
      if (userIds.has(userId)) {
        const nextTyping = new Set(userIds)
        nextTyping.delete(userId)
        if (nextTyping.size > 0) {
          typingCopy.set(roomId, nextTyping)
        } else {
          typingCopy.delete(roomId)
        }
      }
    }
    typingUsers.value = typingCopy
  }

  function setTyping(roomId: string, userId: string, isTyping: boolean): void {
    const next = new Map(typingUsers.value)
    const roomTyping = new Set(next.get(roomId) || [])

    if (isTyping) {
      roomTyping.add(userId)
    } else {
      roomTyping.delete(userId)
    }

    if (roomTyping.size > 0) {
      next.set(roomId, roomTyping)
    } else {
      next.delete(roomId)
    }

    typingUsers.value = next
  }

  function clearTyping(roomId: string): void {
    const next = new Map(typingUsers.value)
    next.delete(roomId)
    typingUsers.value = next
  }

  function isUserTyping(roomId: string, userId: string): boolean {
    return typingUsers.value.get(roomId)?.has(userId) ?? false
  }

  function getTypingUsers(roomId: string): string[] {
    return Array.from(typingUsers.value.get(roomId) || [])
  }

  function markRead(roomId: string, userId: string, timestamp: string): void {
    const next = new Map(readTimestamps.value)
    const roomReads = new Map(next.get(roomId) || [])
    roomReads.set(userId, timestamp)
    next.set(roomId, roomReads)
    readTimestamps.value = next
  }

  function getLastRead(roomId: string, userId: string): string | null {
    return readTimestamps.value.get(roomId)?.get(userId) || null
  }

  function isUserOnline(userId: string): boolean {
    return onlineUsers.value.has(userId)
  }

  function clear(): void {
    onlineUsers.value = new Set()
    typingUsers.value = new Map()
  }

  function clearAll(): void {
    onlineUsers.value = new Set()
    typingUsers.value = new Map()
    readTimestamps.value = new Map()
  }

  return {
    onlineUsers,
    typingUsers,
    readTimestamps,
    connectedUserCount,
    setOnlineUsers,
    userJoined,
    userLeft,
    setTyping,
    clearTyping,
    isUserTyping,
    getTypingUsers,
    markRead,
    getLastRead,
    isUserOnline,
    clear,
    clearAll,
  }
})
