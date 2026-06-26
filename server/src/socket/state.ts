export interface RoomUser {
  userId: string
  socketId: string
}

export const roomUsers = new Map<string, RoomUser[]>()
export const callUsers = new Map<string, RoomUser[]>()

/** Tracks which rooms each socket has joined, for O(1) disconnect cleanup */
export const socketRooms = new Map<string, Set<string>>()

export function addUserSocket(list: RoomUser[], userId: string, socketId: string) {
  if (!list.some((u) => u.socketId === socketId)) {
    list.push({ userId, socketId })
  }
}

export function removeSocketFromList(list: RoomUser[], socketId: string): RoomUser[] {
  return list.filter((u) => u.socketId !== socketId)
}

export function trackSocketRoom(socketId: string, roomId: string) {
  const rooms = socketRooms.get(socketId) ?? new Set()
  rooms.add(roomId)
  socketRooms.set(socketId, rooms)
}

export function untrackSocketRoom(socketId: string, roomId: string) {
  const rooms = socketRooms.get(socketId)
  if (rooms) {
    rooms.delete(roomId)
    if (rooms.size === 0) socketRooms.delete(socketId)
  }
}

export function removeAllSocketRooms(socketId: string) {
  const rooms = socketRooms.get(socketId)
  socketRooms.delete(socketId)
  return rooms ?? new Set<string>()
}

export function cleanupSocketFromState(socketId: string, store: Map<string, RoomUser[]>) {
  for (const [key, users] of store.entries()) {
    const remaining = users.filter((u) => u.socketId !== socketId)
    if (remaining.length === 0) store.delete(key)
    else store.set(key, remaining)
  }
}
