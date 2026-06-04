import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'
import { createInsertSchema } from 'drizzle-zod'
import { z } from 'zod/v4'
import { usersTable } from './users'

export const roomsTable = sqliteTable(
  'rooms',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    inviteCode: text('invite_code').notNull().unique(),
    ownerId: integer('owner_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    quality: text('quality', { enum: ['360p', '480p', '720p', '1080p', '1440p'] })
      .notNull()
      .default('1080p'),
    isActive: integer('is_active', { mode: 'boolean' }).notNull().default(false),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().defaultNow(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    // Index for invite code lookups (join by code)
    inviteCodeIdx: index('rooms_invite_code_idx').on(table.inviteCode),
    // Index for owner lookups
    ownerIdIdx: index('rooms_owner_idx').on(table.ownerId),
    // Index for active rooms
    isActiveIdx: index('rooms_active_idx').on(table.isActive),
    // Index for createdAt (time-based queries)
    createdAtIdx: index('rooms_created_at_idx').on(table.createdAt),
  })
)

export const roomMembersTable = sqliteTable(
  'room_members',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    roomId: text('room_id')
      .notNull()
      .references(() => roomsTable.id, { onDelete: 'cascade' }),
    userId: integer('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    joinedAt: integer('joined_at', { mode: 'timestamp_ms' }).notNull().defaultNow(),
  },
  (table) => ({
    // Index for room-based member queries
    roomIdIdx: index('room_members_room_idx').on(table.roomId),
    // Index for user-based member queries
    userIdIdx: index('room_members_user_idx').on(table.userId),
    // Composite index for room + user (check membership)
    roomUserIdx: index('room_members_room_user_idx').on(table.roomId, table.userId),
    // Index for joinedAt (time-based queries)
    joinedAtIdx: index('room_members_joined_idx').on(table.joinedAt),
  })
)

export const insertRoomSchema = createInsertSchema(roomsTable).omit({
  createdAt: true,
  updatedAt: true,
})
export type InsertRoom = z.infer<typeof insertRoomSchema>
export type Room = typeof roomsTable.$inferSelect

export const insertRoomMemberSchema = createInsertSchema(roomMembersTable).omit({
  id: true,
  joinedAt: true,
})
export type InsertRoomMember = z.infer<typeof insertRoomMemberSchema>
export type RoomMember = typeof roomMembersTable.$inferSelect
