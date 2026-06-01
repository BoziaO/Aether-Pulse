import { and, eq } from "drizzle-orm";
import { db, roomMembersTable } from "@workspace/db";

export async function isRoomMember(roomId: string, userId: number): Promise<boolean> {
  const [row] = await db
    .select({ id: roomMembersTable.id })
    .from(roomMembersTable)
    .where(and(eq(roomMembersTable.roomId, roomId), eq(roomMembersTable.userId, userId)))
    .limit(1);
  return Boolean(row);
}
