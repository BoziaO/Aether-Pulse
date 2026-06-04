import { createRequire } from 'module'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const require = createRequire(path.join(root, 'server/package.json'))
const { createClient } = require('@libsql/client')

const dbUrl = `file:${path.join(root, 'sqlite.db')}`
const client = createClient({ url: dbUrl })

const stmts = [
  `ALTER TABLE users ADD COLUMN profile_views INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE users ADD COLUMN show_profile_views INTEGER NOT NULL DEFAULT 1`,
]

for (const stmt of stmts) {
  try {
    await client.execute(stmt)
    console.log(`  ✓ OK: ${stmt.slice(0, 60)}`)
  } catch (e) {
    if (e.message?.includes('duplicate column name') || e.message?.includes('already exists')) {
      console.log(`  Column already exists (skip): ${stmt.match(/ADD COLUMN (\w+)/)?.[1]}`)
    } else {
      console.log(`  ✗ Failed: ${stmt}\n  ${e.message}`)
    }
  }
}

console.log('\nMigration complete.')
client.close()
