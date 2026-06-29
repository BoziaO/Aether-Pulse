import { RoomRepository } from '../repositories/room.repository'

export async function isRoomMember(roomId: string, userId: string): Promise<boolean> {
  return RoomRepository.isMember(roomId, userId)
}
