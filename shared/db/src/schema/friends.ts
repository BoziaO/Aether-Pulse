import { sqliteTable, text, integer, uniqueIndex } from "drizzle-orm/sqlite-core";
import { usersTable } from "./users";

export const friendshipsTable = sqliteTable(
  "friendships",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    requesterId: integer("requester_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    addresseeId: integer("addressee_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    status: text("status", { enum: ["pending", "accepted", "blocked"] }).notNull().default("pending"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().defaultNow(),
  },
  (table) => ({
    uniquePair: uniqueIndex("friendships_pair_unique").on(table.requesterId, table.addresseeId),
  }),
);

export type Friendship = typeof friendshipsTable.$inferSelect;
