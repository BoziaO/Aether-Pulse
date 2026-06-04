import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'
import { usersTable } from './users'

export const dmConversationsTable = sqliteTable(
  'dm_conversations',
  {
    id: text('id').primaryKey(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().defaultNow(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    // Index for createdAt (time-based queries)
    createdAtIdx: index('dm_conversations_created_idx').on(table.createdAt),
    // Index for updatedAt (recent conversations)
    updatedAtIdx: index('dm_conversations_updated_idx').on(table.updatedAt),
  })
)

export const dmParticipantsTable = sqliteTable(
  'dm_participants',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    conversationId: text('conversation_id')
      .notNull()
      .references(() => dmConversationsTable.id, { onDelete: 'cascade' }),
    userId: integer('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    joinedAt: integer('joined_at', { mode: 'timestamp_ms' }).notNull().defaultNow(),
  },
  (table) => ({
    // Index for conversation-based participant queries
    conversationIdIdx: index('dm_participants_conversation_idx').on(table.conversationId),
    // Index for user-based participant queries
    userIdIdx: index('dm_participants_user_idx').on(table.userId),
    // Composite index for conversation + user
    conversationUserIdx: index('dm_participants_conv_user_idx').on(
      table.conversationId,
      table.userId
    ),
  })
)

export const dmMessagesTable = sqliteTable(
  'dm_messages',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    conversationId: text('conversation_id')
      .notNull()
      .references(() => dmConversationsTable.id, { onDelete: 'cascade' }),
    userId: integer('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    type: text('type', { enum: ['text', 'file'] })
      .notNull()
      .default('text'),
    attachmentUrl: text('attachment_url'),
    attachmentName: text('attachment_name'),
    attachmentMime: text('attachment_mime'),
    replyToId: integer('reply_to_id'),
    editedAt: integer('edited_at', { mode: 'timestamp_ms' }),
    isDeleted: integer('is_deleted', { mode: 'boolean' }).notNull().default(false),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().defaultNow(),
  },
  (table) => ({
    // Index for conversation-based message queries
    conversationIdIdx: index('dm_messages_conversation_idx').on(table.conversationId),
    // Index for user-based message queries
    userIdIdx: index('dm_messages_user_idx').on(table.userId),
    // Index for reply chain lookups
    replyToIdIdx: index('dm_messages_reply_idx').on(table.replyToId),
    // Index for createdAt (time-based queries, pagination)
    createdAtIdx: index('dm_messages_created_idx').on(table.createdAt),
    // Composite index for conversation + createdAt (most common query pattern)
    conversationCreatedAtIdx: index('dm_messages_conv_created_idx').on(
      table.conversationId,
      table.createdAt
    ),
  })
)

export type DmConversation = typeof dmConversationsTable.$inferSelect
export type DmMessage = typeof dmMessagesTable.$inferSelect
