import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { User } from '@/types/user.types'

export const usePresenceStore = defineStore('presence', () => {
  const statuses = ref<Map<number, User['status']>>(new Map())
  const onlineInRoom = ref<Set<number>>(new Set())

  function setStatus(userId: number, status: User['status']) {
    statuses.value = new Map(statuses.value.set(userId, status))
  }

  function setRoomOnline(userIds: number[]) {
    onlineInRoom.value = new Set(userIds)
  }

  function userJoined(userId: number) {
    onlineInRoom.value = new Set([...onlineInRoom.value, userId])
  }

  function userLeft(userId: number) {
    const next = new Set(onlineInRoom.value)
    next.delete(userId)
    onlineInRoom.value = next
  }

  function getStatus(userId: number, fallback: User['status'] = 'offline'): User['status'] {
    return statuses.value.get(userId) ?? fallback
  }

  function isOnlineInRoom(userId: number) {
    return onlineInRoom.value.has(userId)
  }

  return { statuses, onlineInRoom, setStatus, setRoomOnline, userJoined, userLeft, getStatus, isOnlineInRoom }
})
