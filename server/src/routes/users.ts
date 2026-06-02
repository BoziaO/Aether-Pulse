import { Router, type IRouter } from "express";
import { eq, or, and } from "drizzle-orm";
import { db, usersTable, friendshipsTable } from "@workspace/db";
import { UpdateUserBody } from "@workspace/api-zod";
import { serializeUser } from "../utils/serialize-user";
import path from "node:path";
import fs from "node:fs";

const router: IRouter = Router();

const uploadsDir = path.resolve(process.cwd(), "uploads");
fs.mkdirSync(uploadsDir, { recursive: true });

function parseImageDataUrl(dataUrl: string): { buffer: Buffer; ext: string } | null {
  const match = /^data:(image\/(?:png|jpeg|jpg|webp|gif));base64,(.+)$/i.exec(dataUrl);
  if (!match) return null;
  const mime = match[1].toLowerCase();
  const base64 = match[2];
  const buffer = Buffer.from(base64, "base64");
  const ext = mime === "image/jpeg" ? "jpg" : mime === "image/jpg" ? "jpg" : mime.split("/")[1];
  return { buffer, ext };
}

async function areFriends(userA: number, userB: number): Promise<boolean> {
  try {
    const rows = await db
      .select({ id: friendshipsTable.id })
      .from(friendshipsTable)
      .where(
        and(
          eq(friendshipsTable.status, "accepted"),
          or(
            and(eq(friendshipsTable.requesterId, userA), eq(friendshipsTable.addresseeId, userB)),
            and(eq(friendshipsTable.requesterId, userB), eq(friendshipsTable.addresseeId, userA)),
          ),
        ),
      )
      .limit(1);
    return rows.length > 0;
  } catch {
    return false;
  }
}

router.get("/users/:userId", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
  const userId = parseInt(rawId, 10);
  if (isNaN(userId)) {
    res.status(400).json({ error: "Invalid user ID" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const viewerId = req.session?.userId ?? null;
  const privacy = user.profilePrivacy ?? "public";
  const isOwn = viewerId === userId;

  if (privacy === "private" && !isOwn) {
    res.status(403).json({ error: "This profile is private." });
    return;
  }

  const isFriend = viewerId != null && !isOwn ? await areFriends(viewerId, userId) : false;

  res.json(serializeUser(user, { viewerId, isFriend }));
});

router.post("/users/:userId/avatar", async (req, res): Promise<void> => {
  const sessionUserId = req.session?.userId;
  if (!sessionUserId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const rawId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
  const userId = parseInt(rawId, 10);
  if (isNaN(userId)) {
    res.status(400).json({ error: "Invalid user ID" });
    return;
  }
  if (sessionUserId !== userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const dataUrl = (req.body as { dataUrl?: string })?.dataUrl;
  if (!dataUrl) {
    res.status(400).json({ error: "Missing dataUrl" });
    return;
  }

  const parsedImage = parseImageDataUrl(dataUrl);
  if (!parsedImage) {
    res.status(400).json({ error: "Invalid image data" });
    return;
  }
  if (parsedImage.buffer.length > 6 * 1024 * 1024) {
    res.status(413).json({ error: "File too large (max 6MB)" });
    return;
  }

  const fileName = `user-${userId}-avatar-${Date.now()}.${parsedImage.ext}`;
  fs.writeFileSync(path.join(uploadsDir, fileName), parsedImage.buffer);
  const avatarUrl = `/api/uploads/${fileName}`;
  const [updated] = await db
    .update(usersTable)
    .set({ avatarUrl })
    .where(eq(usersTable.id, userId))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({ avatarUrl, user: serializeUser(updated, { viewerId: userId }) });
});

router.post("/users/:userId/banner", async (req, res): Promise<void> => {
  const sessionUserId = req.session?.userId;
  if (!sessionUserId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const rawId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
  const userId = parseInt(rawId, 10);
  if (isNaN(userId)) {
    res.status(400).json({ error: "Invalid user ID" });
    return;
  }
  if (sessionUserId !== userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const dataUrl = (req.body as { dataUrl?: string })?.dataUrl;
  if (!dataUrl) {
    res.status(400).json({ error: "Missing dataUrl" });
    return;
  }

  const parsedImage = parseImageDataUrl(dataUrl);
  if (!parsedImage) {
    res.status(400).json({ error: "Invalid image data" });
    return;
  }
  if (parsedImage.buffer.length > 6 * 1024 * 1024) {
    res.status(413).json({ error: "File too large (max 6MB)" });
    return;
  }

  const fileName = `user-${userId}-banner-${Date.now()}.${parsedImage.ext}`;
  fs.writeFileSync(path.join(uploadsDir, fileName), parsedImage.buffer);
  const bannerUrl = `/api/uploads/${fileName}`;
  const [updated] = await db
    .update(usersTable)
    .set({ bannerUrl })
    .where(eq(usersTable.id, userId))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({ bannerUrl, user: serializeUser(updated, { viewerId: userId }) });
});

router.patch("/users/:userId", async (req, res): Promise<void> => {
  const sessionUserId = req.session?.userId;
  if (!sessionUserId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const rawId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
  const userId = parseInt(rawId, 10);
  if (isNaN(userId)) {
    res.status(400).json({ error: "Invalid user ID" });
    return;
  }

  if (sessionUserId !== userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const parsed = UpdateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [updated] = await db
    .update(usersTable)
    .set(parsed.data as any)
    .where(eq(usersTable.id, userId))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(serializeUser(updated, { viewerId: userId }));
});

export default router;
