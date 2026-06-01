import { Router, type IRouter } from "express";
import { eq, desc, and, lt, like, inArray } from "drizzle-orm";
import { db, messagesTable, messageReactionsTable, usersTable } from "@workspace/db";
import { SendMessageBody } from "@workspace/api-zod";
import { isRoomMember } from "../utils/room-auth";
import {
  buildMessagePayload,
  broadcastMessage,
  getReactionsForMessages,
  serializeMessageRow,
} from "../utils/message-helpers";
import { saveUploadedFile } from "../utils/upload";

const router: IRouter = Router();

function requireAuth(req: any, res: any): number | null {
  const userId = req.session?.userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return null;
  }
  return userId;
}

router.get("/rooms/:roomId/messages", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const rawId = Array.isArray(req.params.roomId) ? req.params.roomId[0] : req.params.roomId;
  if (!(await isRoomMember(rawId, userId))) {
    res.status(403).json({ error: "Not a room member" });
    return;
  }

  const before = req.query.before ? Number(req.query.before) : null;
  const limit = Math.min(Number(req.query.limit) || 50, 100);

  const conditions = [eq(messagesTable.roomId, rawId)];
  if (before && !Number.isNaN(before)) {
    conditions.push(lt(messagesTable.id, before));
  }

  const rows = await db
    .select({ message: messagesTable, user: usersTable })
    .from(messagesTable)
    .innerJoin(usersTable, eq(messagesTable.userId, usersTable.id))
    .where(and(...conditions))
    .orderBy(desc(messagesTable.createdAt))
    .limit(limit);

  const ordered = rows.reverse();
  const messageIds = ordered.map(r => r.message.id);
  const reactionsMap = await getReactionsForMessages(messageIds);

  const replyIds = ordered.map(r => r.message.replyToId).filter((id): id is number => id != null);
  const replyRows = replyIds.length
    ? await db.select().from(messagesTable).where(inArray(messagesTable.id, replyIds))
    : [];
  const replyMap = new Map(replyRows.map(r => [r.id, r]));

  const messages = ordered.map(r => {
    const parent = r.message.replyToId ? replyMap.get(r.message.replyToId) : null;
    return serializeMessageRow(
      r.message,
      r.user,
      reactionsMap.get(r.message.id) ?? [],
      parent
        ? {
            id: parent.id,
            content: parent.isDeleted ? "Message deleted" : parent.content,
            userId: parent.userId,
            isDeleted: parent.isDeleted,
          }
        : null,
    );
  });

  res.json(messages);
});

router.get("/rooms/:roomId/messages/search", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const rawId = Array.isArray(req.params.roomId) ? req.params.roomId[0] : req.params.roomId;
  const q = String(req.query.q ?? "").trim();
  if (!q || q.length < 2) {
    res.status(400).json({ error: "Query must be at least 2 characters" });
    return;
  }
  if (!(await isRoomMember(rawId, userId))) {
    res.status(403).json({ error: "Not a room member" });
    return;
  }

  const rows = await db
    .select({ message: messagesTable, user: usersTable })
    .from(messagesTable)
    .innerJoin(usersTable, eq(messagesTable.userId, usersTable.id))
    .where(
      and(
        eq(messagesTable.roomId, rawId),
        eq(messagesTable.isDeleted, false),
        eq(messagesTable.type, "text"),
        like(messagesTable.content, `%${q}%`),
      ),
    )
    .orderBy(desc(messagesTable.createdAt))
    .limit(25);

  const messageIds = rows.map(r => r.message.id);
  const reactionsMap = await getReactionsForMessages(messageIds);

  res.json(
    rows.reverse().map(r =>
      serializeMessageRow(r.message, r.user, reactionsMap.get(r.message.id) ?? []),
    ),
  );
});

router.post("/rooms/:roomId/messages", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const rawId = Array.isArray(req.params.roomId) ? req.params.roomId[0] : req.params.roomId;
  if (!(await isRoomMember(rawId, userId))) {
    res.status(403).json({ error: "Not a room member" });
    return;
  }

  const parsed = SendMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const replyToId = typeof req.body.replyToId === "number" ? req.body.replyToId : null;

  const [msg] = await db
    .insert(messagesTable)
    .values({
      roomId: rawId,
      userId,
      content: parsed.data.content.trim(),
      type: (parsed.data.type as any) ?? "text",
      replyToId: replyToId ?? undefined,
    })
    .returning();

  const result = await buildMessagePayload(msg.id);
  if (result) {
    broadcastMessage(req.app.get("io"), rawId, "new-message", result);
  }

  res.status(201).json(result);
});

router.patch("/rooms/:roomId/messages/:messageId", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const rawId = Array.isArray(req.params.roomId) ? req.params.roomId[0] : req.params.roomId;
  const messageId = Number(Array.isArray(req.params.messageId) ? req.params.messageId[0] : req.params.messageId);
  const content = String(req.body.content ?? "").trim();

  if (!content) {
    res.status(400).json({ error: "Content is required" });
    return;
  }

  const [existing] = await db
    .select()
    .from(messagesTable)
    .where(and(eq(messagesTable.id, messageId), eq(messagesTable.roomId, rawId)));

  if (!existing) {
    res.status(404).json({ error: "Message not found" });
    return;
  }
  if (existing.userId !== userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  if (existing.type !== "text") {
    res.status(400).json({ error: "Cannot edit this message type" });
    return;
  }

  await db
    .update(messagesTable)
    .set({ content, editedAt: new Date() })
    .where(eq(messagesTable.id, messageId));

  const result = await buildMessagePayload(messageId);
  if (result) {
    broadcastMessage(req.app.get("io"), rawId, "message-updated", result);
  }
  res.json(result);
});

router.delete("/rooms/:roomId/messages/:messageId", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const rawId = Array.isArray(req.params.roomId) ? req.params.roomId[0] : req.params.roomId;
  const messageId = Number(Array.isArray(req.params.messageId) ? req.params.messageId[0] : req.params.messageId);

  const [existing] = await db
    .select()
    .from(messagesTable)
    .where(and(eq(messagesTable.id, messageId), eq(messagesTable.roomId, rawId)));

  if (!existing) {
    res.status(404).json({ error: "Message not found" });
    return;
  }
  if (existing.userId !== userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  await db
    .update(messagesTable)
    .set({ isDeleted: true, content: "" })
    .where(eq(messagesTable.id, messageId));

  const result = await buildMessagePayload(messageId);
  if (result) {
    broadcastMessage(req.app.get("io"), rawId, "message-updated", result);
  }
  res.json(result);
});

router.post("/rooms/:roomId/messages/:messageId/reactions", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const rawId = Array.isArray(req.params.roomId) ? req.params.roomId[0] : req.params.roomId;
  const messageId = Number(Array.isArray(req.params.messageId) ? req.params.messageId[0] : req.params.messageId);
  const emoji = String(req.body.emoji ?? "").trim();

  if (!emoji) {
    res.status(400).json({ error: "Emoji is required" });
    return;
  }

  const [existing] = await db
    .select()
    .from(messagesTable)
    .where(and(eq(messagesTable.id, messageId), eq(messagesTable.roomId, rawId)));

  if (!existing) {
    res.status(404).json({ error: "Message not found" });
    return;
  }

  const [reaction] = await db
    .select()
    .from(messageReactionsTable)
    .where(
      and(
        eq(messageReactionsTable.messageId, messageId),
        eq(messageReactionsTable.userId, userId),
        eq(messageReactionsTable.emoji, emoji),
      ),
    );

  if (reaction) {
    await db
      .delete(messageReactionsTable)
      .where(eq(messageReactionsTable.id, reaction.id));
  } else {
    await db.insert(messageReactionsTable).values({ messageId, userId, emoji });
  }

  const result = await buildMessagePayload(messageId);
  if (result) {
    broadcastMessage(req.app.get("io"), rawId, "message-updated", result);
  }
  res.json(result);
});

router.post("/rooms/:roomId/upload", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const rawId = Array.isArray(req.params.roomId) ? req.params.roomId[0] : req.params.roomId;
  if (!(await isRoomMember(rawId, userId))) {
    res.status(403).json({ error: "Not a room member" });
    return;
  }

  const dataUrl = String(req.body.dataUrl ?? "");
  const fileName = String(req.body.fileName ?? "file");
  const caption = String(req.body.caption ?? "").trim();
  const replyToId = typeof req.body.replyToId === "number" ? req.body.replyToId : null;

  const saved = saveUploadedFile(`room-${rawId}`, dataUrl, fileName);
  if (!saved) {
    res.status(400).json({ error: "Invalid or too large file (max 10MB)" });
    return;
  }

  const [msg] = await db
    .insert(messagesTable)
    .values({
      roomId: rawId,
      userId,
      content: caption || saved.name,
      type: "file",
      attachmentUrl: saved.url,
      attachmentName: saved.name,
      attachmentMime: saved.mime,
      replyToId: replyToId ?? undefined,
    })
    .returning();

  const result = await buildMessagePayload(msg.id);
  if (result) {
    broadcastMessage(req.app.get("io"), rawId, "new-message", result);
  }
  res.status(201).json(result);
});

export default router;
