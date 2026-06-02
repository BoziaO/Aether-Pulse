import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name").notNull(),
  avatarUrl: text("avatar_url"),
  bannerUrl: text("banner_url"),
  bio: text("bio"),
  pronouns: text("pronouns"),
  website: text("website"),
  location: text("location"),
  status: text("status", { enum: ["online", "away", "busy", "offline"] }).notNull().default("offline"),
  customStatus: text("custom_status"),
  accentColor: text("accent_color"),
  profileGradient: text("profile_gradient"),
  badges: text("badges").notNull().default("[]"),
  // New fields
  socialLinks: text("social_links").notNull().default("[]"),
  timezone: text("timezone"),
  profilePrivacy: text("profile_privacy", { enum: ["public", "friends", "private"] }).notNull().default("public"),
  showTimezone: integer("show_timezone", { mode: "boolean" }).notNull().default(true),
  showLastSeen: integer("show_last_seen", { mode: "boolean" }).notNull().default(true),
  preferredTheme: text("preferred_theme"),
  lastSeenAt: integer("last_seen_at", { mode: "timestamp_ms" }),
  profileViews: integer("profile_views").notNull().default(0),
  showProfileViews: integer("show_profile_views", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().defaultNow(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
