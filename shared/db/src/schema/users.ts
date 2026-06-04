import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'
import { createInsertSchema } from 'drizzle-zod'
import { z } from 'zod/v4'

export const usersTable = sqliteTable(
  'users',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    username: text('username').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    displayName: text('display_name').notNull(),
    avatarUrl: text('avatar_url'),
    bannerUrl: text('banner_url'),
    bio: text('bio'),
    pronouns: text('pronouns'),
    website: text('website'),
    location: text('location'),
    status: text('status', { enum: ['online', 'away', 'busy', 'offline'] })
      .notNull()
      .default('offline'),
    customStatus: text('custom_status'),
    accentColor: text('accent_color'),
    profileGradient: text('profile_gradient'),
    avatarFrame: text('avatar_frame'),
    profileTheme: text('profile_theme'),
    customTheme: text('custom_theme'),
    badges: text('badges').notNull().default('[]'), // Store as JSON string
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().defaultNow(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    // Index for username lookups (login, search)
    usernameIdx: index('users_username_idx').on(table.username),
    // Index for display name searches
    displayNameIdx: index('users_display_name_idx').on(table.displayName),
    // Index for status queries (online users, etc.)
    statusIdx: index('users_status_idx').on(table.status),
    // Index for createdAt (time-based queries, sorting)
    createdAtIdx: index('users_created_at_idx').on(table.createdAt),
  })
)

export const insertUserSchema = createInsertSchema(usersTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})
export type InsertUser = z.infer<typeof insertUserSchema>
export type User = typeof usersTable.$inferSelect
