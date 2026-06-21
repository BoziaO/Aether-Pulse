# AetherPulse

AetherPulse is a finished real-time communication app for private rooms, voice calls, chat, video, screen sharing and lightweight streaming. The project is built as a TypeScript monorepo with a Vue client, Express API, Socket.io realtime layer, MongoDB database, Electron desktop wrapper and Capacitor Android app.

Repository: <https://github.com/BoziaO/Aether-Pulse>

## Features

- Private rooms with invite codes, members and live activity status.
- Real-time room chat and direct messages.
- WebRTC voice calls with mute, camera and spatial audio.
- Screen sharing on browser/Electron desktop.
- Android camera streaming fallback, Picture-in-Picture support and mobile-focused call controls.
- User profiles, statuses, friends, profile badges and visual customization.
- JWT authentication with refresh flow.
- API validation with generated Zod schemas.
- MongoDB persistence through Mongoose.
- Optional Redis adapter for Socket.io scaling.
- Builds for web, Windows Electron, Linux Electron and Android.

## Tech Stack

| Area            | Technology                                                    |
| --------------- | ------------------------------------------------------------- |
| Client          | Vue 3, Vite, Pinia, Vue Router, Tailwind CSS, lucide-vue-next |
| Realtime        | Socket.io, WebRTC, simple-peer                                |
| Server          | Node.js, Express 5, Socket.io, Helmet, rate limiting, Pino    |
| Database        | MongoDB, Mongoose                                             |
| Shared packages | pnpm workspace packages, generated Zod API schemas            |
| Desktop         | Electron, electron-builder                                    |
| Mobile          | Capacitor Android                                             |
| Tooling         | TypeScript, Vitest, Turborepo, pnpm                           |
| Deployment      | Vercel client, Render server, Docker Compose                  |

## Project Structure

```text
Aether-Pulse/
├─ client/                 Vue app, Electron wrapper and Android project
│  ├─ src/
│  │  ├─ app/              Router and app layout
│  │  ├─ components/       UI, chat, room, profile and call components
│  │  ├─ services/         API, Socket.io and WebRTC helpers
│  │  ├─ stores/           Pinia stores
│  │  ├─ styles/           Global theme and layout styles
│  │  └─ views/            App pages
│  ├─ electron/            Electron main and preload scripts
│  └─ android/             Capacitor Android app
├─ server/                 Express API and Socket.io server
│  └─ src/
│     ├─ routes/           REST routes
│     ├─ middleware/       Auth middleware
│     ├─ utils/            Shared server helpers
│     ├─ app.ts            Express setup
│     └─ server.ts         HTTP and Socket.io bootstrap
├─ shared/
│  ├─ db/                  Mongoose connection and schemas
│  ├─ api-spec/            OpenAPI source and Orval config
│  ├─ api-zod/             Generated Zod validation package
│  └─ api-client-react/    Generated API client package
├─ scripts/                Build, deploy and migration scripts
├─ docker/                 Docker Compose, Dockerfiles and nginx config
├─ docs/                   Extra architecture, API and deployment docs
├─ package.json            Root scripts and workspace metadata
├─ pnpm-workspace.yaml     Workspace and dependency catalog
└─ turbo.json              Turborepo pipeline
```

## Requirements

- Node.js 22 or newer
- pnpm 11 or newer
- MongoDB, local or Atlas
- Redis, optional but recommended for multi-instance realtime deployment
- Java and Android Studio, only for Android builds
- Docker, optional

## Environment

Copy the root example file for local development:

```bash
cp .env.example .env
```

Required local values:

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=mongodb://localhost:27017/aetherpulse
REDIS_URL=
JWT_SECRET=your_jwt_secret_at_least_32_chars_long
SESSION_SECRET=your_session_secret_at_least_32_chars_long
CLIENT_URL=http://localhost:5174
```

For a deployed frontend, set `VITE_API_URL` in `client/.env.local` or in the Vercel dashboard:

```env
VITE_API_URL=https://your-render-server.onrender.com
```

Do not put secrets in `VITE_*` variables. They are bundled into client-side code.

## Installation

```bash
pnpm install
```

## Development

Run the whole monorepo:

```bash
pnpm dev
```

Run only one side:

```bash
pnpm start:server
pnpm start:client
```

Default local URLs:

- Client: `http://localhost:5174`
- Server API: `http://localhost:3000/api`
- Socket.io path: `http://localhost:3000/api/socket.io`

## Quality Checks

```bash
pnpm typecheck
pnpm lint
pnpm --filter aetherpulse-client test
pnpm --filter aetherpulse-server test
```

Build everything:

```bash
pnpm build
```

## Desktop Builds

Windows installer:

```bash
pnpm electron:build
```

Linux build:

```bash
pnpm --filter aetherpulse-client electron:build:linux
```

Output is written to `client/dist-electron/`.

## Android

Sync the web build into Capacitor:

```bash
pnpm android:sync
```

Open the native project:

```bash
pnpm android:open
```

The Android app supports camera and microphone permissions, WebRTC calls, Android Picture-in-Picture in active rooms and camera-based streaming. Full Android screen capture requires a native MediaProjection implementation.

## Docker

Run the production-style stack locally:

```bash
pnpm docker:build
pnpm docker:up
```

Stop it:

```bash
pnpm docker:down
```

Docker Compose starts:

- client on port `80`
- server on port `3000`
- MongoDB on port `27017`
- Redis on port `6379`

## Deployment

The repository includes deployment config for:

- Vercel frontend: `vercel.json` and `client/vercel.json`
- Render backend: `render.yaml`
- Docker: `docker/docker-compose.yml`

Typical hosted setup:

1. Deploy the server to Render.
2. Set `DATABASE_URL`, `JWT_SECRET`, `SESSION_SECRET`, `CLIENT_URL` and optionally `REDIS_URL`.
3. Deploy the client to Vercel.
4. Set `VITE_API_URL` to the Render server URL.
5. Update `CLIENT_URL` on Render to the Vercel URL.

## Useful Scripts

| Command               | Description                                   |
| --------------------- | --------------------------------------------- |
| `pnpm dev`            | Start all development tasks through Turborepo |
| `pnpm build`          | Build all packages                            |
| `pnpm typecheck`      | Run TypeScript checks                         |
| `pnpm lint`           | Run lint tasks                                |
| `pnpm start:client`   | Start Vite client                             |
| `pnpm start:server`   | Start Express and Socket.io server            |
| `pnpm electron:dev`   | Start desktop app in development              |
| `pnpm electron:build` | Build Windows Electron app                    |
| `pnpm android:sync`   | Build and sync Capacitor Android              |
| `pnpm docker:up`      | Start Docker stack                            |

## Notes

- The server requires `DATABASE_URL` on startup.
- Redis is optional. Without `REDIS_URL`, Socket.io uses the default in-memory adapter.
- Release download buttons on the landing page expect GitHub release assets for Windows, Android APK and Linux ZIP.
- Generated API/Zod files live under `shared/api-zod`. The old duplicate `lib/api-zod` directory is no longer used.

## License

MIT. See [LICENSE](LICENSE).
