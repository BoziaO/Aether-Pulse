import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const require = createRequire(path.join(root, "server/package.json"));
const { createClient } = require("@libsql/client");

const dbUrl = `file:${path.join(root, "sqlite.db")}`;
const client = createClient({ url: dbUrl });

const stmts = [
  `ALTER TABLE users ADD COLUMN social_links TEXT NOT NULL DEFAULT '[]'`,
  `ALTER TABLE users ADD COLUMN timezone TEXT`,
  `ALTER TABLE users ADD COLUMN profile_privacy TEXT NOT NULL DEFAULT 'public'`,
  `ALTER TABLE users ADD COLUMN show_timezone INTEGER NOT NULL DEFAULT 1`,
  `ALTER TABLE users ADD COLUMN show_last_seen INTEGER NOT NULL DEFAULT 1`,
  `ALTER TABLE users ADD COLUMN preferred_theme TEXT`,
  `ALTER TABLE users ADD COLUMN last_seen_at INTEGER`,
];

for (const stmt of stmts) {
  try {
    await client.execute(stmt);
    const col = stmt.match(/ADD COLUMN (\w+)/)?.[1];
    console.log(`✓ Added column: ${col}`);
  } catch (e) {
    if (e.message?.includes("duplicate column name") || e.message?.includes("already exists")) {
      const col = stmt.match(/ADD COLUMN (\w+)/)?.[1];
      console.log(`  Column already exists (skip): ${col}`);
    } else {
      console.error(`✗ Failed: ${stmt}`);
      console.error(`  ${e.message}`);
    }
  }
}

console.log("\nMigration complete.");
