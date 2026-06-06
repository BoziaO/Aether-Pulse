import { RoomMember } from '@workspace/db'

export async function isRoomMember(roomId: string, userId: string): Promise<boolean> {
  const row = await RoomMember.findOne({ roomId, userId }).lean()
  return Boolean(row)
}
