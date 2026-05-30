import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, messagesTable, usersTable } from "@workspace/db";
import { SendMessageBody } from "@workspace/api-zod";
import { serializeUser } from "../utils/serialize-user";

const router: IRouter = Router();

router.get("/rooms/:roomId/messages", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.roomId) ? req.params.roomId[0] : req.params.roomId;

  const rows = await db
    .select({ message: messagesTable, user: usersTable })
    .from(messagesTable)
    .innerJoin(usersTable, eq(messagesTable.userId, usersTable.id))
    .where(eq(messagesTable.roomId, rawId))
    .orderBy(desc(messagesTable.createdAt))
    .limit(50);

  const messages = rows.reverse().map(r => ({
    ...r.message,
    user: serializeUser(r.user),
    createdAt: r.message.createdAt.toISOString(),
  }));

  res.json(messages);
});

router.post("/rooms/:roomId/messages", async (req, res): Promise<void> => {
  const userId = req.session?.userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const rawId = Array.isArray(req.params.roomId) ? req.params.roomId[0] : req.params.roomId;

  const parsed = SendMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [msg] = await db
    .insert(messagesTable)
    .values({
      roomId: rawId,
      userId,
      content: parsed.data.content,
      type: (parsed.data.type as any) ?? "text",
    })
    .returning();

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));

  const result = {
    ...msg,
    user: user ? serializeUser(user) : null,
    createdAt: msg.createdAt.toISOString(),
  };

  req.app.get("io")?.to(rawId).emit("message", result);

  res.status(201).json(result);
});

export default router;
