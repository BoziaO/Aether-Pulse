import { defineStore } from 'pinia'
import { ref } from 'vue'

import { roomApi } from '@/services/api/room.api'
import { useAuthStore } from './auth.store'
import type { Room } from '@/types/room.types'

export const useRoomStore = defineStore('room', () => {
  const auth = useAuthStore()
  const rooms = ref<Room[]>([])
  const currentRoom = ref<Room | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchRooms() {
    loading.value = true
    try {
      rooms.value = await auth.authRequest(() => roomApi.list())
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch rooms'
    } finally {
      loading.value = false
    }
  }

  async function createRoom(name: string, quality?: string): Promise<Room> {
    loading.value = true
    error.value = null
    try {
      const room = await auth.authRequest(() => roomApi.create(name, quality))
      rooms.value.unshift(room)
      return room
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Failed to create room'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function joinByCode(inviteCode: string): Promise<Room> {
    loading.value = true
    error.value = null
    try {
      const room = await auth.authRequest(() => roomApi.joinByCode(inviteCode))
      if (!rooms.value.find((r) => r.id === room.id)) {
        rooms.value.unshift(room)
      }
      return room
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Failed to join room'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function loadRoom(roomId: string): Promise<Room> {
    loading.value = true
    error.value = null
    try {
      const room = await auth.authRequest(() => roomApi.get(roomId))
      currentRoom.value = room
      return room
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Failed to load room'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateRoom(roomId: string, data: { name?: string; quality?: string }) {
    loading.value = true
    error.value = null
    try {
      const room = await auth.authRequest(() => roomApi.update(roomId, data))
      if (currentRoom.value?.id === roomId) currentRoom.value = room
      const idx = rooms.value.findIndex((r) => r.id === roomId)
      if (idx >= 0) rooms.value[idx] = room
      return room
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Failed to update room'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function deleteRoom(roomId: string) {
    loading.value = true
    error.value = null
    try {
      await auth.authRequest(() => roomApi.delete(roomId))
      rooms.value = rooms.value.filter((r) => r.id !== roomId)
      if (currentRoom.value?.id === roomId) currentRoom.value = null
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Failed to delete room'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function leaveRoom(roomId: string) {
    loading.value = true
    error.value = null
    try {
      await auth.authRequest(() => roomApi.leave(roomId))
      rooms.value = rooms.value.filter((r) => r.id !== roomId)
      if (currentRoom.value?.id === roomId) currentRoom.value = null
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Failed to leave room'
      throw e
    } finally {
      loading.value = false
    }
  }

  function setCurrentRoom(room: Room | null) {
    currentRoom.value = room
  }

  function getInviteLink(room: Room): string {
    return `${window.location.origin}/join/${room.inviteCode}`
  }

  return {
    rooms,
    currentRoom,
    loading,
    error,
    fetchRooms,
    createRoom,
    joinByCode,
    loadRoom,
    updateRoom,
    deleteRoom,
    leaveRoom,
    setCurrentRoom,
    getInviteLink,
  }
})
