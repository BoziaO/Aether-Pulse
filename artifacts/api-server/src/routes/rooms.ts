import { Router, type IRouter } from "express";
import { eq, and, count, desc } from "drizzle-orm";
import { db, usersTable, roomsTable, roomMembersTable, messagesTable } from "@workspace/db";
import { CreateRoomBody, JoinRoomBody } from "@workspace/api-zod";
import { randomBytes } from "crypto";
import { nanoid } from "nanoid";

const router: IRouter = Router();

function requireAuth(req: any, res: any): number | null {
  const userId = req.session?.userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return null;
  }
  return userId;
}

function serializeUser(user: typeof usersTable.$inferSelect) {
  const { passwordHash: _, ...safe } = user;
  return {
    ...safe,
    badges: safe.badges ?? [],
    avatarUrl: safe.avatarUrl ?? null,
    bannerUrl: safe.bannerUrl ?? null,
    bio: safe.bio ?? null,
    customStatus: safe.customStatus ?? null,
    accentColor: safe.accentColor ?? null,
    createdAt: safe.createdAt.toISOString(),
  };
}

async function getRoomWithMembers(roomId: string) {
  const room = await db.select().from(roomsTable).where(eq(roomsTable.id, roomId)).then(r => r[0]);
  if (!room) return null;

  const memberRows = await db
    .select({ user: usersTable })
    .from(roomMembersTable)
    .innerJoin(usersTable, eq(roomMembersTable.userId, usersTable.id))
    .where(eq(roomMembersTable.roomId, roomId));

  const members = memberRows.map(r => serializeUser(r.user));

  return {
    ...room,
    memberCount: members.length,
    members,
    createdAt: room.createdAt.toISOString(),
  };
}

router.get("/rooms", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const memberRooms = await db
    .select({ roomId: roomMembersTable.roomId })
    .from(roomMembersTable)
    .where(eq(roomMembersTable.userId, userId));

  const roomIds = memberRooms.map(r => r.roomId);
  if (roomIds.length === 0) {
    res.json([]);
    return;
  }

  const rooms = await Promise.all(roomIds.map(getRoomWithMembers));
  res.json(rooms.filter(Boolean));
});

router.post("/rooms", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const parsed = CreateRoomBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const roomId = nanoid(8);
  const inviteCode = randomBytes(4).toString("hex").toUpperCase();

  const [room] = await db
    .insert(roomsTable)
    .values({
      id: roomId,
      name: parsed.data.name,
      inviteCode,
      ownerId: userId,
      quality: (parsed.data.quality as any) ?? "1080p",
    })
    .returning();

  await db.insert(roomMembersTable).values({ roomId: room.id, userId });

  const result = await getRoomWithMembers(room.id);
  res.status(201).json(result);
});

router.get("/rooms/:roomId", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.roomId) ? req.params.roomId[0] : req.params.roomId;

  const room = await getRoomWithMembers(rawId);
  if (!room) {
    res.status(404).json({ error: "Room not found" });
    return;
  }
  res.json(room);
});

router.delete("/rooms/:roomId", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const rawId = Array.isArray(req.params.roomId) ? req.params.roomId[0] : req.params.roomId;
  const [room] = await db.select().from(roomsTable).where(eq(roomsTable.id, rawId));
  if (!room) {
    res.status(404).json({ error: "Room not found" });
    return;
  }
  if (room.ownerId !== userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  await db.delete(roomsTable).where(eq(roomsTable.id, rawId));
  res.sendStatus(204);
});

router.post("/rooms/join-by-code", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const parsed = JoinRoomBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [room] = await db
    .select()
    .from(roomsTable)
    .where(eq(roomsTable.inviteCode, parsed.data.inviteCode));

  if (!room) {
    res.status(404).json({ error: "Invalid invite code — room not found" });
    return;
  }

  const [existing] = await db
    .select()
    .from(roomMembersTable)
    .where(and(eq(roomMembersTable.roomId, room.id), eq(roomMembersTable.userId, userId)));

  if (!existing) {
    await db.insert(roomMembersTable).values({ roomId: room.id, userId });
  }

  const result = await getRoomWithMembers(room.id);
  res.json(result);
});

router.post("/rooms/:roomId/join", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const rawId = Array.isArray(req.params.roomId) ? req.params.roomId[0] : req.params.roomId;

  const parsed = JoinRoomBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [room] = await db.select().from(roomsTable).where(eq(roomsTable.id, rawId));
  if (!room) {
    res.status(404).json({ error: "Room not found" });
    return;
  }
  if (room.inviteCode !== parsed.data.inviteCode) {
    res.status(403).json({ error: "Invalid invite code" });
    return;
  }

  const [existing] = await db
    .select()
    .from(roomMembersTable)
    .where(and(eq(roomMembersTable.roomId, rawId), eq(roomMembersTable.userId, userId)));

  if (!existing) {
    await db.insert(roomMembersTable).values({ roomId: rawId, userId });
  }

  const result = await getRoomWithMembers(rawId);
  res.json(result);
});

router.post("/rooms/:roomId/leave", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const rawId = Array.isArray(req.params.roomId) ? req.params.roomId[0] : req.params.roomId;
  await db
    .delete(roomMembersTable)
    .where(and(eq(roomMembersTable.roomId, rawId), eq(roomMembersTable.userId, userId)));

  res.json({ ok: true });
});

router.get("/rooms/:roomId/activity", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.roomId) ? req.params.roomId[0] : req.params.roomId;

  const [memberCount] = await db
    .select({ count: count() })
    .from(roomMembersTable)
    .where(eq(roomMembersTable.roomId, rawId));

  const [msgCount] = await db
    .select({ count: count() })
    .from(messagesTable)
    .where(eq(messagesTable.roomId, rawId));

  const recentMessages = await db
    .select({ content: messagesTable.content, type: messagesTable.type, userId: messagesTable.userId, createdAt: messagesTable.createdAt })
    .from(messagesTable)
    .where(and(eq(messagesTable.roomId, rawId), eq(messagesTable.type, "system")))
    .orderBy(desc(messagesTable.createdAt))
    .limit(10);

  res.json({
    roomId: rawId,
    memberCount: Number(memberCount?.count ?? 0),
    messageCount: Number(msgCount?.count ?? 0),
    events: recentMessages.map(m => ({
      type: m.type,
      description: m.content,
      userId: m.userId,
      createdAt: m.createdAt.toISOString(),
    })),
  });
});

export default router;
