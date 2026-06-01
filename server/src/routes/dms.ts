import { Router, type IRouter } from "express";
import { eq, desc, and, lt } from "drizzle-orm";
import {
  db,
  dmConversationsTable,
  dmParticipantsTable,
  dmMessagesTable,
  usersTable,
} from "@workspace/db";
import { areFriends } from "../utils/friend-helpers";
import {
  buildDmMessagePayload,
  getOrCreateConversation,
  getOtherParticipant,
  isDmParticipant,
} from "../utils/dm-helpers";
import { saveUploadedFile } from "../utils/upload";
import { serializeUser } from "../utils/serialize-user";

const router: IRouter = Router();

function requireAuth(req: any, res: any): number | null {
  const userId = req.session?.userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return null;
  }
  return userId;
}

function dmRoom(conversationId: string) {
  return `dm:${conversationId}`;
}

router.get("/dms", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const myParticipations = await db
    .select()
    .from(dmParticipantsTable)
    .where(eq(dmParticipantsTable.userId, userId));

  const conversations = await Promise.all(
    myParticipations.map(async (p) => {
      const other = await getOtherParticipant(p.conversationId, userId);
      const [lastMsg] = await db
        .select()
        .from(dmMessagesTable)
        .where(eq(dmMessagesTable.conversationId, p.conversationId))
        .orderBy(desc(dmMessagesTable.createdAt))
        .limit(1);

      const [conv] = await db
        .select()
        .from(dmConversationsTable)
        .where(eq(dmConversationsTable.id, p.conversationId));

      return {
        id: p.conversationId,
        otherUser: other ? serializeUser(other) : null,
        lastMessage: lastMsg
          ? {
              content: lastMsg.isDeleted ? "Message deleted" : lastMsg.content,
              type: lastMsg.type,
              attachmentName: lastMsg.attachmentName,
              createdAt: lastMsg.createdAt.toISOString(),
              userId: lastMsg.userId,
            }
          : null,
        updatedAt: conv?.updatedAt.toISOString() ?? p.joinedAt.toISOString(),
      };
    }),
  );

  conversations.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  res.json(conversations);
});

router.post("/dms/with/:otherUserId", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const otherId = Number(Array.isArray(req.params.otherUserId) ? req.params.otherUserId[0] : req.params.otherUserId);
  if (!otherId || otherId === userId) {
    res.status(400).json({ error: "Invalid user" });
    return;
  }

  if (!(await areFriends(userId, otherId))) {
    res.status(403).json({ error: "You must be friends to send direct messages" });
    return;
  }

  const conversationId = await getOrCreateConversation(userId, otherId);
  const [other] = await db.select().from(usersTable).where(eq(usersTable.id, otherId));

  res.json({
    id: conversationId,
    otherUser: other ? serializeUser(other) : null,
  });
});

router.get("/dms/:conversationId/messages", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const conversationId = Array.isArray(req.params.conversationId)
    ? req.params.conversationId[0]
    : req.params.conversationId;

  if (!(await isDmParticipant(conversationId, userId))) {
    res.status(403).json({ error: "Not a participant" });
    return;
  }

  const before = req.query.before ? Number(req.query.before) : null;
  const limit = Math.min(Number(req.query.limit) || 50, 100);
  const conditions = [eq(dmMessagesTable.conversationId, conversationId)];
  if (before && !Number.isNaN(before)) {
    conditions.push(lt(dmMessagesTable.id, before));
  }

  const rows = await db
    .select({ message: dmMessagesTable, user: usersTable })
    .from(dmMessagesTable)
    .innerJoin(usersTable, eq(dmMessagesTable.userId, usersTable.id))
    .where(and(...conditions))
    .orderBy(desc(dmMessagesTable.createdAt))
    .limit(limit);

  const messages = await Promise.all(rows.reverse().map(r => buildDmMessagePayload(r.message.id)));
  res.json(messages.filter(Boolean));
});

router.post("/dms/:conversationId/messages", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const conversationId = Array.isArray(req.params.conversationId)
    ? req.params.conversationId[0]
    : req.params.conversationId;

  if (!(await isDmParticipant(conversationId, userId))) {
    res.status(403).json({ error: "Not a participant" });
    return;
  }

  const content = String(req.body.content ?? "").trim();
  const replyToId = typeof req.body.replyToId === "number" ? req.body.replyToId : null;

  if (!content) {
    res.status(400).json({ error: "Content is required" });
    return;
  }

  const [msg] = await db
    .insert(dmMessagesTable)
    .values({
      conversationId,
      userId,
      content,
      type: "text",
      replyToId: replyToId ?? undefined,
    })
    .returning();

  await db
    .update(dmConversationsTable)
    .set({ updatedAt: new Date() })
    .where(eq(dmConversationsTable.id, conversationId));

  const payload = await buildDmMessagePayload(msg.id);
  if (payload) {
    req.app.get("io")?.to(dmRoom(conversationId)).emit("new-dm-message", payload);
  }
  res.status(201).json(payload);
});

router.post("/dms/:conversationId/upload", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const conversationId = Array.isArray(req.params.conversationId)
    ? req.params.conversationId[0]
    : req.params.conversationId;

  if (!(await isDmParticipant(conversationId, userId))) {
    res.status(403).json({ error: "Not a participant" });
    return;
  }

  const dataUrl = String(req.body.dataUrl ?? "");
  const fileName = String(req.body.fileName ?? "file");
  const caption = String(req.body.caption ?? "").trim();

  const saved = saveUploadedFile(`dm-${conversationId}`, dataUrl, fileName);
  if (!saved) {
    res.status(400).json({ error: "Invalid or too large file (max 10MB)" });
    return;
  }

  const [msg] = await db
    .insert(dmMessagesTable)
    .values({
      conversationId,
      userId,
      content: caption || saved.name,
      type: "file",
      attachmentUrl: saved.url,
      attachmentName: saved.name,
      attachmentMime: saved.mime,
    })
    .returning();

  await db
    .update(dmConversationsTable)
    .set({ updatedAt: new Date() })
    .where(eq(dmConversationsTable.id, conversationId));

  const payload = await buildDmMessagePayload(msg.id);
  if (payload) {
    req.app.get("io")?.to(dmRoom(conversationId)).emit("new-dm-message", payload);
  }
  res.status(201).json(payload);
});

export default router;
