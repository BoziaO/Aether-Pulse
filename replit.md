# AetherPulse

A premium dark-mode real-time communication app for private one-on-one conversations, screen sharing, co-watching, and chat between two people. Built with a glassmorphism aesthetic — deep navy/black backgrounds, neon violet and electric blue accents.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/aetherpulse run dev` — run the frontend (port 26020)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET` — session secret

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS + shadcn/ui + Framer Motion
- API: Express 5 + Socket.IO
- DB: PostgreSQL + Drizzle ORM
- Real-time: Socket.IO (signaling) + WebRTC via simple-peer
- Auth: express-session + bcryptjs (cookie-based sessions)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — API contract (source of truth)
- `lib/db/src/schema/` — Drizzle schema (users, rooms, room_members, messages)
- `artifacts/api-server/src/routes/` — Express route handlers (auth, users, rooms, messages)
- `artifacts/api-server/src/index.ts` — HTTP server + Socket.IO setup
- `artifacts/aetherpulse/src/` — React frontend
  - `src/hooks/use-webrtc.ts` — WebRTC hook (simple-peer + socket.io)
  - `src/lib/socket.ts` — Socket.IO client singleton
  - `src/context/auth-context.tsx` — Auth state context

## Architecture decisions

- Sessions use httpOnly cookies (no JWT/localStorage tokens) for security
- WebRTC streams go directly peer-to-peer; server only handles signaling via Socket.IO
- Socket.IO path is `/api/socket.io` (mounted under the `/api` route prefix)
- `simple-peer` requires `define: { global: "globalThis" }` in vite.config.ts to work in browser
- Rooms use nanoid for IDs and random 8-char hex invite codes
- All CSS custom properties start as `red` in scaffold — the design subagent rewrites them completely

## Product

- Register / Login with username + password
- Create rooms and invite people via a shareable invite code
- Real-time video/audio calls via WebRTC (peer-to-peer)
- Screen sharing with quality presets (360p to 1440p)
- Live text chat in the room sidebar
- User profiles with avatar, banner, bio, badges, custom status
- Settings page to update profile

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Socket.IO WebSocket path `/socket.io` must be listed in the api-server artifact.toml `paths` array or WebSocket connections are silently dropped
- `simple-peer` uses Node.js globals — must add `define: { global: "globalThis" }` to vite.config.ts
- Body schemas in OpenAPI must use entity-shaped names (NoteInput, not CreateNoteBody) to avoid TS2308 collision
- Run `pnpm run typecheck:libs` after changing DB schema before typechecking the API server

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
