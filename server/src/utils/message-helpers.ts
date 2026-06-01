import { eq, inArray } from "drizzle-orm";
import type { Server as SocketIOServer } from "socket.io";
import { db, messagesTable, messageReactionsTable, usersTable } from "@workspace/db";
import { serializeUser } from "./serialize-user";

export type ReactionSummary = {
  emoji: string;
  count: number;
  userIds: number[];
};

export async function getReactionsForMessages(messageIds: number[]): Promise<Map<number, ReactionSummary[]>> {
  const map = new Map<number, ReactionSummary[]>();
  if (messageIds.length === 0) return map;

  const rows = await db
    .select()
    .from(messageReactionsTable)
    .where(inArray(messageReactionsTable.messageId, messageIds));

  for (const row of rows) {
    const list = map.get(row.messageId) ?? [];
    const existing = list.find(r => r.emoji === row.emoji);
    if (existing) {
      existing.count += 1;
      existing.userIds.push(row.userId);
    } else {
      list.push({ emoji: row.emoji, count: 1, userIds: [row.userId] });
    }
    map.set(row.messageId, list);
  }
  return map;
}

export async function serializeMessageRow(
  message: typeof messagesTable.$inferSelect,
  user: typeof usersTable.$inferSelect | null,
  reactions?: ReactionSummary[],
  replyTo?: { id: number; content: string; userId: number; isDeleted: boolean } | null,
) {
  return {
    id: message.id,
    roomId: message.roomId,
    userId: message.userId,
    content: message.isDeleted ? "" : message.content,
    type: message.type,
    replyToId: message.replyToId ?? null,
    editedAt: message.editedAt?.toISOString() ?? null,
    isDeleted: message.isDeleted,
    attachmentUrl: message.attachmentUrl ?? null,
    attachmentName: message.attachmentName ?? null,
    attachmentMime: message.attachmentMime ?? null,
    createdAt: message.createdAt.toISOString(),
    user: user ? serializeUser(user) : null,
    reactions: reactions ?? [],
    replyTo: replyTo ?? null,
  };
}

export async function buildMessagePayload(messageId: number) {
  const [row] = await db
    .select({ message: messagesTable, user: usersTable })
    .from(messagesTable)
    .innerJoin(usersTable, eq(messagesTable.userId, usersTable.id))
    .where(eq(messagesTable.id, messageId))
    .limit(1);

  if (!row) return null;

  const reactionsMap = await getReactionsForMessages([messageId]);
  let replyTo = null;
  if (row.message.replyToId) {
    const [parent] = await db
      .select()
      .from(messagesTable)
      .where(eq(messagesTable.id, row.message.replyToId))
      .limit(1);
    if (parent) {
      replyTo = {
        id: parent.id,
        content: parent.isDeleted ? "Message deleted" : parent.content,
        userId: parent.userId,
        isDeleted: parent.isDeleted,
      };
    }
  }

  return serializeMessageRow(
    row.message,
    row.user,
    reactionsMap.get(messageId) ?? [],
    replyTo,
  );
}

export function broadcastMessage(io: SocketIOServer, roomId: string, event: string, payload: unknown) {
  io.to(roomId).emit(event, payload);
}
