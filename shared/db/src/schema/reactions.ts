import { sqliteTable, text, integer, uniqueIndex, index } from 'drizzle-orm/sqlite-core'
import { messagesTable } from './messages'
import { usersTable } from './users'

export const messageReactionsTable = sqliteTable(
  'message_reactions',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    messageId: integer('message_id')
      .notNull()
      .references(() => messagesTable.id, { onDelete: 'cascade' }),
    userId: integer('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    emoji: text('emoji').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().defaultNow(),
  },
  (table) => ({
    uniqueReaction: uniqueIndex('message_reactions_unique').on(
      table.messageId,
      table.userId,
      table.emoji
    ),
    // Index for message-based reaction queries
    messageIdIdx: index('reactions_message_idx').on(table.messageId),
    // Index for user-based reaction queries
    userIdIdx: index('reactions_user_idx').on(table.userId),
    // Index for emoji-based queries
    emojiIdx: index('reactions_emoji_idx').on(table.emoji),
  })
)

export type MessageReaction = typeof messageReactionsTable.$inferSelect
