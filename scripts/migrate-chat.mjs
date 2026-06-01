import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const require = createRequire(path.join(root, "server/package.json"));
const { createClient } = require("@libsql/client");

const client = createClient({ url: `file:${path.join(root, "sqlite.db")}` });

const stmts = [
  "ALTER TABLE messages ADD COLUMN reply_to_id INTEGER",
  "ALTER TABLE messages ADD COLUMN edited_at INTEGER",
  "ALTER TABLE messages ADD COLUMN is_deleted INTEGER NOT NULL DEFAULT 0",
  `CREATE TABLE IF NOT EXISTS message_reactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    message_id INTEGER NOT NULL REFERENCES messages(id) ON DELETE cascade,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE cascade,
    emoji TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer))
  )`,
  "CREATE UNIQUE INDEX IF NOT EXISTS message_reactions_unique ON message_reactions (message_id, user_id, emoji)",
];

for (const sql of stmts) {
  try {
    await client.execute(sql);
    console.log("OK:", sql.split("\n")[0].slice(0, 70));
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.log("SKIP:", msg.slice(0, 100));
  }
}

console.log("Migration complete.");
