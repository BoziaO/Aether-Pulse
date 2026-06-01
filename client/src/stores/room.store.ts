import { defineStore } from 'pinia'
import { ref } from 'vue'
import { roomApi } from '@/services/api/room.api'
import type { Room } from '@/types/room.types'

export const useRoomStore = defineStore('room', () => {
  const rooms = ref<Room[]>([])
  const currentRoom = ref<Room | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchRooms() {
    loading.value = true
    try {
      rooms.value = await roomApi.list()
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch rooms'
    } finally {
      loading.value = false
    }
  }

  async function createRoom(name: string, quality?: string): Promise<Room> {
    const room = await roomApi.create(name, quality)
    rooms.value.unshift(room)
    return room
  }

  async function joinByCode(inviteCode: string): Promise<Room> {
    const room = await roomApi.joinByCode(inviteCode)
    if (!rooms.value.find(r => r.id === room.id)) {
      rooms.value.unshift(room)
    }
    return room
  }

  async function loadRoom(roomId: string): Promise<Room> {
    const room = await roomApi.get(roomId)
    currentRoom.value = room
    return room
  }

  async function updateRoom(roomId: string, data: { name?: string; quality?: string }) {
    const room = await roomApi.update(roomId, data)
    if (currentRoom.value?.id === roomId) currentRoom.value = room
    const idx = rooms.value.findIndex(r => r.id === roomId)
    if (idx >= 0) rooms.value[idx] = room
    return room
  }

  async function deleteRoom(roomId: string) {
    await roomApi.delete(roomId)
    rooms.value = rooms.value.filter(r => r.id !== roomId)
    if (currentRoom.value?.id === roomId) currentRoom.value = null
  }

  async function leaveRoom(roomId: string) {
    await roomApi.leave(roomId)
    rooms.value = rooms.value.filter(r => r.id !== roomId)
    if (currentRoom.value?.id === roomId) currentRoom.value = null
  }

  function setCurrentRoom(room: Room | null) {
    currentRoom.value = room
  }

  function getInviteLink(room: Room): string {
    return `${window.location.origin}/join/${room.inviteCode}`
  }

  return { rooms, currentRoom, loading, error, fetchRooms, createRoom, joinByCode, loadRoom, updateRoom, deleteRoom, leaveRoom, setCurrentRoom, getInviteLink }
})
