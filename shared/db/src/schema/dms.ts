import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { usersTable } from "./users";

export const dmConversationsTable = sqliteTable("dm_conversations", {
  id: text("id").primaryKey(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().defaultNow(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const dmParticipantsTable = sqliteTable("dm_participants", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  conversationId: text("conversation_id")
    .notNull()
    .references(() => dmConversationsTable.id, { onDelete: "cascade" }),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  joinedAt: integer("joined_at", { mode: "timestamp_ms" }).notNull().defaultNow(),
});

export const dmMessagesTable = sqliteTable("dm_messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  conversationId: text("conversation_id")
    .notNull()
    .references(() => dmConversationsTable.id, { onDelete: "cascade" }),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  type: text("type", { enum: ["text", "file"] }).notNull().default("text"),
  attachmentUrl: text("attachment_url"),
  attachmentName: text("attachment_name"),
  attachmentMime: text("attachment_mime"),
  replyToId: integer("reply_to_id"),
  editedAt: integer("edited_at", { mode: "timestamp_ms" }),
  isDeleted: integer("is_deleted", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().defaultNow(),
});

export type DmConversation = typeof dmConversationsTable.$inferSelect;
export type DmMessage = typeof dmMessagesTable.$inferSelect;
