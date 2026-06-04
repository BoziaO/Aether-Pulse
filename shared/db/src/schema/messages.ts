import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'
import { createInsertSchema } from 'drizzle-zod'
import { z } from 'zod/v4'
import { usersTable } from './users'
import { roomsTable } from './rooms'

export const messagesTable = sqliteTable(
  'messages',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    roomId: text('room_id')
      .notNull()
      .references(() => roomsTable.id, { onDelete: 'cascade' }),
    userId: integer('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    type: text('type', { enum: ['text', 'system', 'file'] })
      .notNull()
      .default('text'),
    replyToId: integer('reply_to_id'),
    editedAt: integer('edited_at', { mode: 'timestamp_ms' }),
    isDeleted: integer('is_deleted', { mode: 'boolean' }).notNull().default(false),
    attachmentUrl: text('attachment_url'),
    attachmentName: text('attachment_name'),
    attachmentMime: text('attachment_mime'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().defaultNow(),
  },
  (table) => ({
    // Index for room-based message queries
    roomIdIdx: index('messages_room_id_idx').on(table.roomId),
    // Index for user-based message queries
    userIdIdx: index('messages_user_id_idx').on(table.userId),
    // Index for reply chain lookups
    replyToIdIdx: index('messages_reply_to_idx').on(table.replyToId),
    // Index for createdAt (time-based queries, pagination)
    createdAtIdx: index('messages_created_at_idx').on(table.createdAt),
    // Composite index for room + createdAt (most common query pattern)
    roomIdCreatedAtIdx: index('messages_room_created_idx').on(table.roomId, table.createdAt),
  })
)

export const insertMessageSchema = createInsertSchema(messagesTable).omit({
  id: true,
  createdAt: true,
})
export type InsertMessage = z.infer<typeof insertMessageSchema>
export type Message = typeof messagesTable.$inferSelect
