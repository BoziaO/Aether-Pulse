import { Router, type IRouter } from "express";
import { and, eq, or, ne, like, inArray } from "drizzle-orm";
import { db, friendshipsTable, usersTable } from "@workspace/db";
import { serializeUser } from "../utils/serialize-user";
import { getFriendship, friendshipStatusFor } from "../utils/friend-helpers";

const router: IRouter = Router();

function requireAuth(req: any, res: any): number | null {
  const userId = req.session?.userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return null;
  }
  return userId;
}

router.get("/friends", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const rows = await db
    .select()
    .from(friendshipsTable)
    .where(
      or(
        eq(friendshipsTable.requesterId, userId),
        eq(friendshipsTable.addresseeId, userId),
      ),
    );

  const otherIds = rows.map(r => (r.requesterId === userId ? r.addresseeId : r.requesterId));
  const users = otherIds.length
    ? await db.select().from(usersTable).where(inArray(usersTable.id, otherIds))
    : [];
  const userMap = new Map(users.map(u => [u.id, serializeUser(u)]));

  const friends = rows
    .filter(r => r.status === "accepted")
    .map(r => {
      const oid = r.requesterId === userId ? r.addresseeId : r.requesterId;
      return { user: userMap.get(oid), since: r.createdAt.toISOString() };
    })
    .filter(f => f.user);

  const incoming = rows
    .filter(r => r.status === "pending" && r.addresseeId === userId)
    .map(r => ({ user: userMap.get(r.requesterId), requestId: r.id, createdAt: r.createdAt.toISOString() }))
    .filter(r => r.user);

  const outgoing = rows
    .filter(r => r.status === "pending" && r.requesterId === userId)
    .map(r => ({ user: userMap.get(r.addresseeId), requestId: r.id, createdAt: r.createdAt.toISOString() }))
    .filter(r => r.user);

  res.json({ friends, incoming, outgoing });
});

router.get("/friends/search", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const q = String(req.query.q ?? "").trim();
  if (q.length < 2) {
    res.status(400).json({ error: "Query must be at least 2 characters" });
    return;
  }

  const users = await db
    .select()
    .from(usersTable)
    .where(
      and(
        ne(usersTable.id, userId),
        or(
          like(usersTable.username, `%${q}%`),
          like(usersTable.displayName, `%${q}%`),
        ),
      ),
    )
    .limit(20);

  const results = await Promise.all(
    users.map(async (u) => {
      const friendship = await getFriendship(userId, u.id);
      return {
        user: serializeUser(u),
        status: friendshipStatusFor(friendship, userId),
      };
    }),
  );

  res.json(results.filter(r => r.status !== "blocked"));
});

router.post("/friends/request", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const targetId = Number(req.body.userId);
  if (!targetId || targetId === userId) {
    res.status(400).json({ error: "Invalid user" });
    return;
  }

  const [target] = await db.select().from(usersTable).where(eq(usersTable.id, targetId));
  if (!target) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const existing = await getFriendship(userId, targetId);
  if (existing) {
    if (existing.status === "accepted") {
      res.status(409).json({ error: "Already friends" });
      return;
    }
    if (existing.status === "pending") {
      // If they sent us a request, auto-accept
      if (existing.addresseeId === userId) {
        await db
          .update(friendshipsTable)
          .set({ status: "accepted" })
          .where(eq(friendshipsTable.id, existing.id));
        req.app.get("io")?.to(`user:${targetId}`).emit("friend-accepted", { userId });
        res.json({ status: "accepted", user: serializeUser(target) });
        return;
      }
      res.status(409).json({ error: "Request already sent" });
      return;
    }
    if (existing.status === "blocked") {
      res.status(403).json({ error: "Cannot send request" });
      return;
    }
  }

  await db.insert(friendshipsTable).values({
    requesterId: userId,
    addresseeId: targetId,
    status: "pending",
  });

  const [requester] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (requester) {
    req.app.get("io")?.to(`user:${targetId}`).emit("friend-request", {
      user: serializeUser(requester),
    });
  }

  res.status(201).json({ status: "pending", user: serializeUser(target) });
});

router.post("/friends/accept", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const targetId = Number(req.body.userId);
  const existing = await getFriendship(userId, targetId);
  if (!existing || existing.status !== "pending" || existing.addresseeId !== userId) {
    res.status(404).json({ error: "No pending request" });
    return;
  }

  await db.update(friendshipsTable).set({ status: "accepted" }).where(eq(friendshipsTable.id, existing.id));

  const [friend] = await db.select().from(usersTable).where(eq(usersTable.id, targetId));
  req.app.get("io")?.to(`user:${targetId}`).emit("friend-accepted", { userId });

  res.json({ status: "accepted", user: friend ? serializeUser(friend) : null });
});

router.post("/friends/reject", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const targetId = Number(req.body.userId);
  const existing = await getFriendship(userId, targetId);
  if (!existing || existing.status !== "pending" || existing.addresseeId !== userId) {
    res.status(404).json({ error: "No pending request" });
    return;
  }

  await db.delete(friendshipsTable).where(eq(friendshipsTable.id, existing.id));
  res.json({ ok: true });
});

router.delete("/friends/:otherUserId", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const otherId = Number(Array.isArray(req.params.otherUserId) ? req.params.otherUserId[0] : req.params.otherUserId);
  const existing = await getFriendship(userId, otherId);
  if (!existing) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  await db.delete(friendshipsTable).where(eq(friendshipsTable.id, existing.id));
  res.json({ ok: true });
});

router.post("/friends/block", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const targetId = Number(req.body.userId);
  if (!targetId || targetId === userId) {
    res.status(400).json({ error: "Invalid user" });
    return;
  }

  const existing = await getFriendship(userId, targetId);
  if (existing) {
    await db.delete(friendshipsTable).where(eq(friendshipsTable.id, existing.id));
  }

  await db.insert(friendshipsTable).values({
    requesterId: userId,
    addresseeId: targetId,
    status: "blocked",
  });

  res.json({ ok: true });
});

router.get("/friends/status/:otherUserId", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const otherId = Number(Array.isArray(req.params.otherUserId) ? req.params.otherUserId[0] : req.params.otherUserId);
  const existing = await getFriendship(userId, otherId);
  res.json({ status: friendshipStatusFor(existing, userId) });
});

export default router;
