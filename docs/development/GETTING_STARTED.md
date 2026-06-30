# Development Guide

## Prerequisites

Before you begin, ensure you have the following installed:

| Tool    | Version | Installation                                                  |
| ------- | ------- | ------------------------------------------------------------- |
| Node.js | >= 22.x | [https://nodejs.org/](https://nodejs.org/)                    |
| pnpm    | >= 11.x | `npm install -g pnpm` or [https://pnpm.io/](https://pnpm.io/) |
| Git     | >= 2.x  | [https://git-scm.com/](https://git-scm.com/)                  |
| IDE     | Latest  | VS Code recommended                                           |

### Recommended VS Code Extensions

- [Vue Language Features (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.volar)
- [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin)
- [Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss)
- [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
- [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

## Project Setup

### 1. Clone the Repository

```bash
git clone https://github.com/BoziaO/Nicori.git
cd nicori
```

### 2. Install Dependencies

```bash
# Install all dependencies (uses pnpm workspaces)
pnpm install
```

This will install dependencies for all packages in the monorepo:

- `nicori-client` (frontend)
- `nicori-server` (backend)
- `@workspace/db` (database)
- `@workspace/api-zod` (API schemas)

### 3. Copy Environment File

```bash
cp .env.example .env
```

Edit `.env` with your local configuration:

```env
# Server
PORT=3000
NODE_ENV=development
SESSION_SECRET=your_dev_secret
DATABASE_URL=mongodb://localhost:27017/nicori

# Client
CLIENT_PORT=5174
```

### 4. Start MongoDB

Make sure MongoDB is running locally or use a cloud instance (MongoDB Atlas).

### 5. Run the Application

```bash
pnpm dev
```

## Running the Application

### Development Mode

```bash
# Start both server and client with hot reload
pnpm dev
```

This command starts both server and client with `turbo dev`.

### Individual Services

```bash
# Start only the server
pnpm start:server

# Start only the client
pnpm start:client

# Build both for production
pnpm build

# Type-check both packages
pnpm typecheck
```

### Using Turborepo

Turborepo is used for caching and optimized builds. Common commands:

```bash
# Run dev with caching
turbo dev

# Run dev without cache
turbo dev --no-cache

# Run specific package
turbo dev --filter nicori-client

# Clean cache
turbo daemon clean
```

## Project Structure

```
nicori/
├── client/                    # Vue 3 Frontend
│   ├── public/               # Static assets
│   │   └── icons/            # App icons
│   ├── src/
│   │   ├── app/              # App configuration
│   │   │   ├── layouts/      # Layout components
│   │   │   └── router/       # Vue Router config
│   │   ├── components/       # Vue components
│   │   │   ├── call/         # Call-related components
│   │   │   ├── chat/         # Chat-related components
│   │   │   ├── modals/       # Modal dialogs
│   │   │   ├── profile/      # User profile components
│   │   │   ├── rooms/        # Room-related components
│   │   │   ├── sidebar/      # Sidebar navigation
│   │   │   └── ui/           # UI utility components
│   │   ├── services/         # Service layers
│   │   │   ├── api/          # API service clients
│   │   │   ├── rtc/          # WebRTC services
│   │   │   └── socket/       # Socket.IO service
│   │   ├── stores/           # Pinia state stores
│   │   ├── styles/           # CSS styles
│   │   ├── types/            # TypeScript types
│   │   ├── utils/            # Utility functions
│   │   └── views/            # Page views
│   └── vite.config.ts        # Vite configuration
│
├── server/                    # Node.js Backend
│   ├── src/
│   │   ├── middleware/       # Express middleware
│   │   ├── routes/           # API route handlers
│   │   └── utils/            # Helper utilities
│   ├── build.mjs              # Build script
│   └── tsconfig.json
│
├── shared/                    # Shared Code
│   ├── api-client-react/     # Auto-generated API client
│   ├── api-spec/             # OpenAPI specification
│   ├── api-zod/              # Zod schemas for API
│   │   └── src/generated/    # Auto-generated from OpenAPI
│   └── db/                   # Database layer (Mongoose)
│       ├── src/
│       │   └── models/       # Mongoose models
│       └── tsconfig.json
│
├── docker/                    # Docker configuration
│   ├── client/
│   │   └── Dockerfile
│   ├── server/
│   │   └── Dockerfile
│   ├── docker-compose.yml
│   └── nginx.conf
│
├── docs/                     # Documentation
│   ├── architecture/
│   ├── api/
│   ├── deployment/
│   └── development/
│
├── scripts/                  # Utility scripts
│   ├── build-client.sh
│   ├── build-server.sh
│   └── post-merge.sh
│
├── .eslintrc.cjs             # ESLint configuration
├── .prettierrc.cjs           # Prettier configuration
├── .husky/                   # Git hooks
├── .lintstagedrc.cjs         # Lint-staged configuration
├── package.json              # Root package.json
├── pnpm-workspace.yaml       # Workspace configuration
├── tsconfig.base.json        # Base TypeScript config
└── turbo.json                # Turborepo configuration
```

## Development Workflow

### 1. Create a New Feature

```bash
# Create a feature branch
git checkout -b feature/your-feature-name

# Make your changes
# Commit with conventional commits
git commit -m "feat: add your feature description"

# Push to remote
git push origin feature/your-feature-name

# Create a PR
```

### 2. Code Quality

```bash
# Run linter
pnpm lint

# Run linter without fixing
pnpm lint:check

# Format code
pnpm format

# Check formatting
pnpm format:check

# Type-check all packages
pnpm typecheck
```

### 3. Testing

```bash
# Run all tests (if tests exist)
pnpm test

# Run tests for specific package
pnpm --filter nicori-client test
pnpm --filter nicori-server test
```

### 4. Cleanup

```bash
# Clean node_modules (if corrupted)
find . -name node_modules -type d -exec rm -rf {} + 2>/dev/null || true

# Clean build artifacts
rm -rf client/dist server/dist

# Clean pnpm store
pnpm store prune
```

## Common Tasks

### Adding a New API Endpoint

1. **Define the route schema** in `shared/api-zod/src/generated/api.ts` (auto-generated from OpenAPI)
2. **Add the route handler** in `server/src/routes/`
3. **Register the route** in `server/src/routes/index.ts`
4. **Create API client method** in `client/src/services/api/`
5. **Use in store/component**

### Adding a New Pinia Store

1. Create file in `client/src/stores/`:

```typescript
// stores/your.store.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useYourStore = defineStore('your', () => {
  const state = ref()
  const loading = ref(false)

  function fetchData() {
    loading.value = true
    // API call
    loading.value = false
  }

  return { state, loading, fetchData }
})
```

2. Use in components:

```typescript
import { useYourStore } from '@/stores/your.store'

const yourStore = useYourStore()
yourStore.fetchData()
```

### Adding a New Component

1. Create file in appropriate folder under `client/src/components/`
2. Use PascalCase naming: `YourComponent.vue`
3. Add `<script setup>` for Composition API
4. Use `lang="ts"` for TypeScript support

Example:

```vue
<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  title: string
}>()

const count = ref(0)
</script>

<template>
  <div>{{ title }}: {{ count }}</div>
</template>
```

### Adding a New Route

1. Add to `client/src/app/router/index.ts`:

```typescript
{
  path: '/your-path',
  name: 'your-route',
  component: () => import('@/views/YourView.vue'),
  meta: { requiresAuth: true }
}
```

2. Create the view file in `client/src/views/`

## Database Operations

### Using Mongoose

```typescript
import { User } from '@workspace/db'

// Find all users
const users = await User.find()

// Find specific user
const user = await User.findById(userId)

// Create
const newUser = await User.create({ ... })

// Update
const updated = await User.findByIdAndUpdate(userId, { ... }, { new: true })

// Delete
const deleted = await User.findByIdAndDelete(userId)
```

### MongoDB Connection

The server connects to MongoDB automatically on startup using the `DATABASE_URL` environment variable.

## Socket.IO Development

### Server-side

```typescript
// In server/src/server.ts
io.on('connection', (socket) => {
  socket.on('your-event', (data) => {
    // Handle event
    io.to(roomId).emit('broadcast-event', data)
  })
})
```

### Client-side

```typescript
// In client/src/services/socket/socket.ts
import { io } from 'socket.io-client'

const socket = io({
  path: '/api/socket.io',
  autoConnect: false,
  withCredentials: true,
})

// Emit event
socket.emit('your-event', data)

// Listen to event
socket.on('broadcast-event', (data) => {
  // Handle event
})
```

## WebRTC Development

### Using the PeerManager

```typescript
import { PeerManager } from '@/services/rtc/peer'

// Create peer manager
const peerManager = new PeerManager(socket, localUserId, onRemoteStream, onPeerClose)

// Set local stream
peerManager.setLocalStream(localStream)

// Initiate call
peerManager.initiateCall(userId, socketId)

// Handle incoming offer
// (Already handled in RTC store)
```

## Debugging

### Debugging the Server

```bash
# Run server with debug logging
NODE_ENV=development pnpm start:server

# Or with node inspector
node --inspect-brk ./server/dist/server.mjs
```

### Debugging the Client

```bash
# Run client with debug
pnpm start:client

# Use Vue DevTools browser extension
```

### Debugging WebRTC

```bash
# Chrome WebRTC internals
chrome://webrtc-internals/

# Chrome flags for WebRTC logging
chrome://flags/#enable-logging
```

### Debugging Socket.IO

```javascript
// Enable debug logging
import { io } from 'socket.io-client'
const socket = io({
  path: '/api/socket.io',
  autoConnect: false,
  withCredentials: true,
  transports: ['websocket'],
  // Enable debug
  // Note: For Socket.IO v4+, use the debug module separately
})

// Use debug package
import Debug from 'debug'
const debug = Debug('socket.io-client:socket')
debug.enabled = true
```

## Environment Variables

| Variable         | Description             | Default                            |
| ---------------- | ----------------------- | ---------------------------------- |
| `NODE_ENV`       | Environment mode        | `development`                      |
| `PORT`           | Server port             | `3000`                             |
| `DATABASE_URL`   | Database connection URL | `mongodb://localhost:27017/nicori` |
| `SESSION_SECRET` | Session secret key      | -                                  |
| `CLIENT_URL`     | Client URL for CORS     | `http://localhost:5173`            |
| `REDIS_URL`      | Redis connection URL    | -                                  |
| `JWT_SECRET`     | JWT secret (future)     | -                                  |

## Tips and Tricks

### Hot Reload Not Working?

```bash
# Clean and restart
rm -rf client/node_modules/.vite
rm -rf server/dist
pnpm dev
```

### TypeScript Issues?

```bash
# Reinstall types
pnpm install --force

# Clear TypeScript cache
rm -rf client/node_modules/.cache
rm -rf server/.tsbuildinfo
```

### Database Issues?

```bash
# Check MongoDB connection
mongosh --eval "db.adminCommand('ping')"

# Or check server logs for connection errors
pnpm start:server
```

### Port Conflicts?

```bash
# Find and kill processes on port 3000
lsof -i :3000
kill -9 <PID>
```

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for contribution guidelines.

## License

This project is licensed under the MIT License. See [LICENSE](../../LICENSE) for details.
