import { sqliteTable, text, integer, uniqueIndex, index } from 'drizzle-orm/sqlite-core'
import { usersTable } from './users'

export const friendshipsTable = sqliteTable(
  'friendships',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    requesterId: integer('requester_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    addresseeId: integer('addressee_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    status: text('status', { enum: ['pending', 'accepted', 'blocked'] })
      .notNull()
      .default('pending'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().defaultNow(),
  },
  (table) => ({
    uniquePair: uniqueIndex('friendships_pair_unique').on(table.requesterId, table.addresseeId),
    // Index for requester-based queries
    requesterIdIdx: index('friendships_requester_idx').on(table.requesterId),
    // Index for addressee-based queries
    addresseeIdIdx: index('friendships_addressee_idx').on(table.addresseeId),
    // Index for status queries
    statusIdx: index('friendships_status_idx').on(table.status),
    // Index for createdAt (time-based queries)
    createdAtIdx: index('friendships_created_idx').on(table.createdAt),
  })
)

export type Friendship = typeof friendshipsTable.$inferSelect
