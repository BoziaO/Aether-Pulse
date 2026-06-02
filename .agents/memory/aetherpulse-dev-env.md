---
name: AetherPulse dev environment
description: Startup quirks for the AetherPulse monorepo — pnpm version, port config, DATABASE_URL, turbo env passthrough, lucide alias
---

# AetherPulse dev environment quirks

## pnpm version
Replit installs pnpm@10.26.1 via nix. The `packageManager` field in root `package.json` must match (`"pnpm@10.26.1"`), otherwise corepack intercepts and tries to download the specified version, which fails with EAGAIN. If install hangs/fails, prefix with `COREPACK_ENABLE_STRICT=0`.

**Why:** corepack uses `packageManager` to enforce a specific pnpm binary; the version in nix is 10.26.1 not 11.x.

## Port config
- Vite client: port 8080 (the port Replit's external proxy maps to port 80 — this is the main entry point users see)
- Express server: port 3000 (proxied by Vite `/api` → `:3000`)
- Set via workflow command: `DATABASE_URL=file:sqlite.db CLIENT_PORT=8080 turbo dev`

**Why:** .replit `waitForPort = 8080`, so the workflow health check requires something on 8080; Vite reads `CLIENT_PORT` env var.

## Turbo env passthrough
`turbo.json` must list env vars in the `dev` task's `"env"` array for them to propagate to child processes:
```json
"env": ["DATABASE_URL", "CLIENT_PORT", "PORT", "NODE_ENV", "SESSION_SECRET", "BASE_PATH"]
```
**Why:** Turbo sandboxes env vars by default; vars set in the workflow command won't reach Vite or the server unless listed here.

## DATABASE_URL
The Replit-provisioned DATABASE_URL secret is a PostgreSQL URL (contains `?sslmode=...`) which breaks `@libsql/client`. Always override with `DATABASE_URL=file:sqlite.db` (or `DATABASE_URL=sqlite.db`) in the workflow command and `.env` file. The `normalizeDatabaseUrl` helper in the codebase converts a bare `sqlite.db` to an absolute `file://` URL.

**Why:** Replit auto-provisions a Postgres DB and sets DATABASE_URL, but the codebase uses drizzle/libsql (SQLite dialect).

## .env file requirement
The server dev command uses `node --env-file=../.env`. A `.env` must exist at workspace root. It is NOT committed (gitignored). Contents:
```
DATABASE_URL=sqlite.db
PORT=3000
NODE_ENV=development
SESSION_SECRET=aetherpulse_dev_session_secret_key_2024
CLIENT_PORT=8080
BASE_PATH=/
```

## lucide-vue-next alias
The client imports from `lucide-vue-next` (old package name) but only `@lucide/vue` (new name) is installed. Fix: add alias in `client/vite.config.ts`:
```ts
"lucide-vue-next": "@lucide/vue"
```

## DB initialization
On a fresh environment: run `DATABASE_URL=sqlite.db pnpm --filter @workspace/db push-force` to create all tables. Migration scripts (`scripts/migrate-*.mjs`) use hardcoded `file:${root}/sqlite.db` — they must run AFTER tables are created.
