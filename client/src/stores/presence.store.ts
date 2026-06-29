import { defineStore } from 'pinia'
import { ref } from 'vue'

import type { User } from '@/types/user.types'

export type RichPresence = NonNullable<User['richPresence']>

export const usePresenceStore = defineStore('presence', () => {
  const statuses = ref<Map<string, User['status']>>(new Map())
  const onlineInRoom = ref<Set<string>>(new Set())
  const richPresences = ref<Map<string, RichPresence | null>>(new Map())

  function setStatus(userId: string, status: User['status']) {
    statuses.value = new Map(statuses.value.set(userId, status))
  }

  function setRichPresence(userId: string, richPresence: RichPresence | null) {
    richPresences.value = new Map(richPresences.value.set(userId, richPresence))
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

  function getRichPresence(userId: string): RichPresence | null {
    return richPresences.value.get(userId) ?? null
  }

  function isOnlineInRoom(userId: string) {
    return onlineInRoom.value.has(userId)
  }

  return {
    statuses,
    onlineInRoom,
    richPresences,
    setStatus,
    setRichPresence,
    setRoomOnline,
    userJoined,
    userLeft,
    getStatus,
    getRichPresence,
    isOnlineInRoom,
  }
})
