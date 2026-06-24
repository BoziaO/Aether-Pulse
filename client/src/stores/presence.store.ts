import { defineStore } from 'pinia'
import { ref } from 'vue'

import type { User } from '@/types/user.types'

export const usePresenceStore = defineStore('presence', () => {
  const statuses = ref<Map<string, User['status']>>(new Map())
  const onlineInRoom = ref<Set<string>>(new Set())

  function setStatus(userId: string, status: User['status']) {
    statuses.value = new Map(statuses.value.set(userId, status))
  }

  function setRoomOnline(userIds: string[]) {
    onlineInRoom.value = new Set(userIds)
  }

  function userJoined(userId: string) {
    onlineInRoom.value = new Set([...onlineInRoom.value, userId])
  }

  function userLeft(userId: string) {
    const next = new Set(onlineInRoom.value)
    next.delete(userId)
    onlineInRoom.value = next
  }

  function getStatus(userId: string, fallback: User['status'] = 'offline'): User['status'] {
    return statuses.value.get(userId) ?? fallback
  }

  function isOnlineInRoom(userId: string) {
    return onlineInRoom.value.has(userId)
  }

  return {
    statuses,
    onlineInRoom,
    setStatus,
    setRoomOnline,
    userJoined,
    userLeft,
    getStatus,
    isOnlineInRoom,
  }
})
