import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { RegisterBody, LoginBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { username, password, displayName } = parsed.data;

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.username, username));
  if (existing) {
    res.status(409).json({ error: "Username already taken" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db
    .insert(usersTable)
    .values({ username, passwordHash, displayName, status: "online" })
    .returning();

  req.session!.userId = user.id;

  const { passwordHash: _, ...safeUser } = user;
  res.status(201).json({
    user: {
      ...safeUser,
      badges: safeUser.badges ?? [],
      avatarUrl: safeUser.avatarUrl ?? null,
      bannerUrl: safeUser.bannerUrl ?? null,
      bio: safeUser.bio ?? null,
      customStatus: safeUser.customStatus ?? null,
      accentColor: safeUser.accentColor ?? null,
      createdAt: safeUser.createdAt.toISOString(),
    },
  });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { username, password } = parsed.data;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.username, username));
  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  await db.update(usersTable).set({ status: "online" }).where(eq(usersTable.id, user.id));

  req.session!.userId = user.id;

  const { passwordHash: _, ...safeUser } = user;
  res.json({
    user: {
      ...safeUser,
      status: "online",
      badges: safeUser.badges ?? [],
      avatarUrl: safeUser.avatarUrl ?? null,
      bannerUrl: safeUser.bannerUrl ?? null,
      bio: safeUser.bio ?? null,
      customStatus: safeUser.customStatus ?? null,
      accentColor: safeUser.accentColor ?? null,
      createdAt: safeUser.createdAt.toISOString(),
    },
  });
});

router.post("/auth/logout", async (req, res): Promise<void> => {
  const userId = req.session?.userId;
  if (userId) {
    await db.update(usersTable).set({ status: "offline" }).where(eq(usersTable.id, userId));
  }
  req.session?.destroy(() => {});
  res.json({ ok: true });
});

router.get("/auth/me", async (req, res): Promise<void> => {
  const userId = req.session?.userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const { passwordHash: _, ...safeUser } = user;
  res.json({
    ...safeUser,
    badges: safeUser.badges ?? [],
    avatarUrl: safeUser.avatarUrl ?? null,
    bannerUrl: safeUser.bannerUrl ?? null,
    bio: safeUser.bio ?? null,
    customStatus: safeUser.customStatus ?? null,
    accentColor: safeUser.accentColor ?? null,
    createdAt: safeUser.createdAt.toISOString(),
  });
});

export default router;
