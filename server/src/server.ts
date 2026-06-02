import { createServer } from "http";
import { Server as SocketIOServer, type Socket } from "socket.io";
import { eq } from "drizzle-orm";
import app from "./app";
import { logger } from "./utils/logger";
import { sessionMiddleware } from "./middleware/session";
import { db, messagesTable, roomsTable, usersTable, dmMessagesTable, dmConversationsTable } from "@workspace/db";
import { isRoomMember } from "./utils/room-auth";
import { buildMessagePayload, broadcastMessage } from "./utils/message-helpers";
import { buildDmMessagePayload, isDmParticipant } from "./utils/dm-helpers";
import { serializeUser } from "./utils/serialize-user";

const rawPort = process.env["PORT"];
if (!rawPort) throw new Error("PORT environment variable is required but was not provided.");
const port = Number(rawPort);
if (Number.isNaN(port) || port <= 0) throw new Error(`Invalid PORT value: "${rawPort}"`);

const httpServer = createServer(app);

const io = new SocketIOServer(httpServer, {
  cors: { origin: true, credentials: true },
  path: "/api/socket.io",
});

app.set("io", io);

interface RoomUser {
  userId: number;
  socketId: string;
}

const roomUsers = new Map<string, RoomUser[]>();
const callUsers = new Map<string, RoomUser[]>();

function upsertUser(list: RoomUser[], userId: number, socketId: string) {
  const existing = list.find(u => u.userId === userId);
  if (existing) existing.socketId = socketId;
  else list.push({ userId, socketId });
}

function removeUserBySocketId(list: RoomUser[], socketId: string) {
  return list.filter(u => u.socketId !== socketId);
}

async function setRoomActive(roomId: string, active: boolean) {
  await db.update(roomsTable).set({ isActive: active }).where(eq(roomsTable.id, roomId));
  io.emit("room-activity-changed", { roomId, isActive: active });
}

async function updateRoomActiveState(roomId: string) {
  const callers = callUsers.get(roomId) ?? [];
  await setRoomActive(roomId, callers.length > 0);
}

async function insertSystemMessage(roomId: string, userId: number, content: string) {
  const [msg] = await db
    .insert(messagesTable)
    .values({ roomId, userId, content, type: "system" })
    .returning();
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  const payload = {
    id: msg.id,
    roomId: msg.roomId,
    userId: msg.userId,
    content: msg.content,
    type: msg.type,
    replyToId: null,
    editedAt: null,
    isDeleted: false,
    createdAt: msg.createdAt.toISOString(),
    user: user ? serializeUser(user) : null,
    reactions: [],
    replyTo: null,
  };
  broadcastMessage(io, roomId, "new-message", payload);
}

function getAuthedUserId(socket: Socket): number | null {
  const id = socket.data.userId;
  return typeof id === "number" ? id : null;
}

io.engine.use((req: any, res: any, next: any) => {
  sessionMiddleware(req, res, next);
});

io.use((socket, next) => {
  const session = (socket.request as any).session;
  if (!session?.userId) {
    next(new Error("Unauthorized"));
    return;
  }
  socket.data.userId = session.userId;
  next();
});

io.on("connection", (socket) => {
  const authedUserId = getAuthedUserId(socket)!;
  socket.join(`user:${authedUserId}`);
  logger.info({ socketId: socket.id, userId: authedUserId }, "Socket connected");

  socket.on("join-room", async ({ roomId, userId }: { roomId: string; userId: number }) => {
    try {
      if (userId !== authedUserId) return;
      if (!(await isRoomMember(roomId, userId))) return;

      socket.join(roomId);
      if (!roomUsers.has(roomId)) roomUsers.set(roomId, []);
      const users = roomUsers.get(roomId)!;
      const wasOnline = users.some(u => u.userId === userId);
      upsertUser(users, userId, socket.id);

      const roomUserIds = roomUsers.get(roomId)!.map(u => u.userId);
      socket.emit("room-users", { userIds: roomUserIds });
      if (!wasOnline) {
        socket.to(roomId).emit("user-joined", { userId, socketId: socket.id });
      }
      logger.info({ socketId: socket.id, roomId, userId }, "User joined room");
    } catch (e) {
      logger.error({ err: e, roomId, userId }, "Error in join-room");
    }
  });

  socket.on("leave-room", async ({ roomId, userId }: { roomId: string; userId: number }) => {
    try {
      if (userId !== authedUserId) return;
      socket.leave(roomId);
      const users = roomUsers.get(roomId) ?? [];
      roomUsers.set(roomId, users.filter(u => u.userId !== userId));
      socket.to(roomId).emit("user-left", { userId, socketId: socket.id });

      const callers = callUsers.get(roomId) ?? [];
      callUsers.set(roomId, callers.filter(u => u.userId !== userId));
      socket.to(roomId).emit("call-user-left", { userId, socketId: socket.id });
      await updateRoomActiveState(roomId);
    } catch (e) {
      logger.error({ err: e, roomId, userId }, "Error in leave-room");
    }
  });

  socket.on("join-call", async ({ roomId, userId }: { roomId: string; userId: number }) => {
    try {
      if (userId !== authedUserId || !roomId) return;
      if (!(await isRoomMember(roomId, userId))) return;

      if (!callUsers.has(roomId)) callUsers.set(roomId, []);
      const callers = callUsers.get(roomId)!;
      const wasInCall = callers.some(u => u.userId === userId);
      upsertUser(callers, userId, socket.id);

      socket.emit("call-users", { users: callers.filter(u => u.userId !== userId) });
      if (!wasInCall) {
        socket.to(roomId).emit("call-user-joined", { userId, socketId: socket.id });
        const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
        if (user) {
          await insertSystemMessage(roomId, userId, `${user.displayName} joined the voice channel`);
        }
      }
      await updateRoomActiveState(roomId);
    } catch (e) {
      logger.error({ err: e, roomId, userId }, "Error in join-call");
    }
  });

  socket.on("leave-call", async ({ roomId, userId }: { roomId: string; userId: number }) => {
    if (userId !== authedUserId || !roomId) return;
    const callers = callUsers.get(roomId) ?? [];
    callUsers.set(roomId, callers.filter(u => u.userId !== userId));
    socket.to(roomId).emit("call-user-left", { userId, socketId: socket.id });
    await updateRoomActiveState(roomId);
  });

  socket.on("offer", ({ to, offer, fromUserId }: { to: string; offer: unknown; fromUserId?: number }) => {
    if (fromUserId && fromUserId !== authedUserId) return;
    io.to(to).emit("offer", { from: socket.id, fromUserId: authedUserId, offer });
  });

  socket.on("answer", ({ to, answer, fromUserId }: { to: string; answer: unknown; fromUserId?: number }) => {
    if (fromUserId && fromUserId !== authedUserId) return;
    io.to(to).emit("answer", { from: socket.id, fromUserId: authedUserId, answer });
  });

  socket.on("ice-candidate", ({ to, candidate, fromUserId }: { to: string; candidate: unknown; fromUserId?: number }) => {
    if (fromUserId && fromUserId !== authedUserId) return;
    io.to(to).emit("ice-candidate", { from: socket.id, fromUserId: authedUserId, candidate });
  });

  socket.on("chat-message", async ({ roomId, userId, content, replyToId }: { roomId: string; userId: number; content: string; replyToId?: number }) => {
    if (userId !== authedUserId || !content?.trim() || !roomId) return;
    if (!(await isRoomMember(roomId, userId))) return;

    try {
      const [msg] = await db.insert(messagesTable).values({
        roomId,
        userId,
        content: content.trim(),
        type: "text",
        replyToId: replyToId ?? undefined,
      }).returning();

      const payload = await buildMessagePayload(msg.id);
      if (payload) broadcastMessage(io, roomId, "new-message", payload);
    } catch (e) {
      logger.error({ err: e }, "Failed to save chat message");
    }
  });

  socket.on("user-typing", async ({ roomId, userId, isTyping }: { roomId: string; userId: number; isTyping: boolean }) => {
    if (userId !== authedUserId) return;
    if (!(await isRoomMember(roomId, userId))) return;
    socket.to(roomId).emit("user-typing", { userId, isTyping });
  });

  socket.on("user-status", async ({ userId, status }: { userId: number; status: string }) => {
    if (userId !== authedUserId) return;
    const now = new Date();
    await db.update(usersTable).set({ status: status as any, lastSeenAt: now }).where(eq(usersTable.id, userId));
    socket.broadcast.emit("user-status-changed", { userId, status });
  });

  socket.on("ping-activity", async ({ userId }: { userId: number }) => {
    if (userId !== authedUserId) return;
    await db.update(usersTable).set({ lastSeenAt: new Date() }).where(eq(usersTable.id, userId));
  });

  socket.on("join-dm", async ({ conversationId }: { conversationId: string }) => {
    if (!conversationId) return;
    if (!(await isDmParticipant(conversationId, authedUserId))) return;
    socket.join(`dm:${conversationId}`);
  });

  socket.on("leave-dm", ({ conversationId }: { conversationId: string }) => {
    if (conversationId) socket.leave(`dm:${conversationId}`);
  });

  socket.on("dm-message", async ({ conversationId, content, replyToId }: { conversationId: string; content: string; replyToId?: number }) => {
    if (!conversationId || !content?.trim()) return;
    if (!(await isDmParticipant(conversationId, authedUserId))) return;

    try {
      const [msg] = await db.insert(dmMessagesTable).values({
        conversationId,
        userId: authedUserId,
        content: content.trim(),
        type: "text",
        replyToId: replyToId ?? undefined,
      }).returning();

      await db.update(dmConversationsTable).set({ updatedAt: new Date() }).where(eq(dmConversationsTable.id, conversationId));

      const payload = await buildDmMessagePayload(msg.id);
      if (payload) io.to(`dm:${conversationId}`).emit("new-dm-message", payload);
    } catch (e) {
      logger.error({ err: e }, "Failed to save DM");
    }
  });

  socket.on("disconnect", async () => {
    for (const [roomId, users] of roomUsers.entries()) {
      const user = users.find(u => u.socketId === socket.id);
      if (user) {
        roomUsers.set(roomId, users.filter(u => u.socketId !== socket.id));
        socket.to(roomId).emit("user-left", { userId: user.userId, socketId: socket.id });
      }
    }

    for (const [roomId, users] of callUsers.entries()) {
      const user = users.find(u => u.socketId === socket.id);
      if (user) {
        callUsers.set(roomId, removeUserBySocketId(users, socket.id));
        socket.to(roomId).emit("call-user-left", { userId: user.userId, socketId: socket.id });
        await updateRoomActiveState(roomId);
      }
    }

    try {
      const now = new Date();
      await db.update(usersTable).set({ status: "offline", lastSeenAt: now }).where(eq(usersTable.id, authedUserId));
      socket.broadcast.emit("user-status-changed", { userId: authedUserId, status: "offline" });
    } catch {}

    logger.info({ socketId: socket.id }, "Socket disconnected");
  });
});

httpServer.listen(port, () => {
  logger.info({ port }, "Server listening");
});
