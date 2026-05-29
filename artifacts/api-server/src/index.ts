import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import app from "./app";
import { logger } from "./lib/logger";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const httpServer = createServer(app);

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: true,
    credentials: true,
  },
  path: "/api/socket.io",
});

app.set("io", io);

interface RoomUser {
  userId: number;
  socketId: string;
}

const roomUsers = new Map<string, RoomUser[]>();

io.on("connection", (socket) => {
  logger.info({ socketId: socket.id }, "Socket connected");

  socket.on("join-room", ({ roomId, userId }: { roomId: string; userId: number }) => {
    socket.join(roomId);

    if (!roomUsers.has(roomId)) {
      roomUsers.set(roomId, []);
    }
    const users = roomUsers.get(roomId)!;
    const existing = users.find(u => u.userId === userId);
    if (!existing) {
      users.push({ userId, socketId: socket.id });
    }

    socket.to(roomId).emit("user-joined", { userId, socketId: socket.id });
    logger.info({ socketId: socket.id, roomId, userId }, "User joined room");
  });

  socket.on("leave-room", ({ roomId, userId }: { roomId: string; userId: number }) => {
    socket.leave(roomId);
    const users = roomUsers.get(roomId) ?? [];
    const filtered = users.filter(u => u.userId !== userId);
    roomUsers.set(roomId, filtered);

    socket.to(roomId).emit("user-left", { userId, socketId: socket.id });
    logger.info({ socketId: socket.id, roomId, userId }, "User left room");
  });

  socket.on("offer", ({ to, offer }: { to: string; offer: unknown }) => {
    io.to(to).emit("offer", { from: socket.id, offer });
  });

  socket.on("answer", ({ to, answer }: { to: string; answer: unknown }) => {
    io.to(to).emit("answer", { from: socket.id, answer });
  });

  socket.on("ice-candidate", ({ to, candidate }: { to: string; candidate: unknown }) => {
    io.to(to).emit("ice-candidate", { from: socket.id, candidate });
  });

  socket.on("disconnect", () => {
    roomUsers.forEach((users, roomId) => {
      const user = users.find(u => u.socketId === socket.id);
      if (user) {
        const filtered = users.filter(u => u.socketId !== socket.id);
        roomUsers.set(roomId, filtered);
        socket.to(roomId).emit("user-left", { userId: user.userId, socketId: socket.id });
      }
    });
    logger.info({ socketId: socket.id }, "Socket disconnected");
  });
});

httpServer.listen(port, () => {
  logger.info({ port }, "Server listening");
});
