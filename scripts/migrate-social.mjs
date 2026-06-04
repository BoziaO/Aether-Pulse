import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const require = createRequire(path.join(root, 'server/package.json'))
const { createClient } = require('@libsql/client')

const client = createClient({ url: `file:${path.join(root, 'sqlite.db')}` })

const stmts = [
  `CREATE TABLE IF NOT EXISTS friendships (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    requester_id INTEGER NOT NULL REFERENCES users(id) ON DELETE cascade,
    addressee_id INTEGER NOT NULL REFERENCES users(id) ON DELETE cascade,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at INTEGER NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer))
  )`,
  'CREATE UNIQUE INDEX IF NOT EXISTS friendships_pair_unique ON friendships (requester_id, addressee_id)',
  `CREATE TABLE IF NOT EXISTS dm_conversations (
    id TEXT PRIMARY KEY NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)),
    updated_at INTEGER NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer))
  )`,
  `CREATE TABLE IF NOT EXISTS dm_participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    conversation_id TEXT NOT NULL REFERENCES dm_conversations(id) ON DELETE cascade,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE cascade,
    joined_at INTEGER NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer))
  )`,
  `CREATE TABLE IF NOT EXISTS dm_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    conversation_id TEXT NOT NULL REFERENCES dm_conversations(id) ON DELETE cascade,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE cascade,
    content TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'text',
    attachment_url TEXT,
    attachment_name TEXT,
    attachment_mime TEXT,
    reply_to_id INTEGER,
    edited_at INTEGER,
    is_deleted INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer))
  )`,
  'ALTER TABLE messages ADD COLUMN attachment_url TEXT',
  'ALTER TABLE messages ADD COLUMN attachment_name TEXT',
  'ALTER TABLE messages ADD COLUMN attachment_mime TEXT',
]

for (const sql of stmts) {
  try {
    await client.execute(sql)
    console.log('OK:', sql.split('\n')[0].slice(0, 70))
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.log('SKIP:', msg.slice(0, 100))
  }
}

console.log('Friends/DM migration complete.')
