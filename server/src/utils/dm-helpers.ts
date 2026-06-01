import { and, eq, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db, dmConversationsTable, dmParticipantsTable, dmMessagesTable, usersTable } from "@workspace/db";
import { serializeUser } from "./serialize-user";

export async function findConversationBetween(userA: number, userB: number): Promise<string | null> {
  const participants = await db
    .select()
    .from(dmParticipantsTable)
    .where(inArray(dmParticipantsTable.userId, [userA, userB]));

  const byConversation = new Map<string, Set<number>>();
  for (const p of participants) {
    const set = byConversation.get(p.conversationId) ?? new Set();
    set.add(p.userId);
    byConversation.set(p.conversationId, set);
  }

  for (const [convId, users] of byConversation) {
    if (users.has(userA) && users.has(userB) && users.size === 2) return convId;
  }
  return null;
}

export async function getOrCreateConversation(userA: number, userB: number): Promise<string> {
  const existing = await findConversationBetween(userA, userB);
  if (existing) return existing;

  const id = nanoid(12);
  await db.insert(dmConversationsTable).values({ id });
  await db.insert(dmParticipantsTable).values([
    { conversationId: id, userId: userA },
    { conversationId: id, userId: userB },
  ]);
  return id;
}

export async function isDmParticipant(conversationId: string, userId: number): Promise<boolean> {
  const [row] = await db
    .select()
    .from(dmParticipantsTable)
    .where(
      and(
        eq(dmParticipantsTable.conversationId, conversationId),
        eq(dmParticipantsTable.userId, userId),
      ),
    )
    .limit(1);
  return Boolean(row);
}

export async function buildDmMessagePayload(messageId: number) {
  const [row] = await db
    .select({ message: dmMessagesTable, user: usersTable })
    .from(dmMessagesTable)
    .innerJoin(usersTable, eq(dmMessagesTable.userId, usersTable.id))
    .where(eq(dmMessagesTable.id, messageId))
    .limit(1);

  if (!row) return null;

  let replyTo = null;
  if (row.message.replyToId) {
    const [parent] = await db
      .select()
      .from(dmMessagesTable)
      .where(eq(dmMessagesTable.id, row.message.replyToId))
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

  return {
    id: row.message.id,
    conversationId: row.message.conversationId,
    userId: row.message.userId,
    content: row.message.isDeleted ? "" : row.message.content,
    type: row.message.type,
    attachmentUrl: row.message.attachmentUrl,
    attachmentName: row.message.attachmentName,
    attachmentMime: row.message.attachmentMime,
    replyToId: row.message.replyToId ?? null,
    editedAt: row.message.editedAt?.toISOString() ?? null,
    isDeleted: row.message.isDeleted,
    createdAt: row.message.createdAt.toISOString(),
    user: serializeUser(row.user),
    replyTo,
  };
}

export async function getOtherParticipant(conversationId: string, userId: number) {
  const rows = await db
    .select({ user: usersTable })
    .from(dmParticipantsTable)
    .innerJoin(usersTable, eq(dmParticipantsTable.userId, usersTable.id))
    .where(eq(dmParticipantsTable.conversationId, conversationId));

  const other = rows.find(r => r.user.id !== userId);
  return other?.user ?? null;
}
