# AetherPulse Monorepo

## Structure

- `client/`: Frontend Vue application (Tauri + Capacitor ready).
- `server/`: Backend Node.js Express application.
- `shared/`: Shared packages like database schema (`db`) and Zod schemas (`api-zod`).
- `docs/`: Project documentation.
- `docker/`: Docker configurations.
- `scripts/`: Utility scripts for building and deploying.

## Getting Started

### Prerequisites

- [pnpm](https://pnpm.io/) (v10+)
- [Node.js](https://nodejs.org/) (v20+)

### Installation

```bash
pnpm install
```

### Development

Run both client and server in development mode:

```bash
pnpm dev
```

Or run them individually:

```bash
pnpm start:client
pnpm start:server
```

### Building

```bash
pnpm build
```

## Internal Structure (Client)

- `src/app/`: Core app logic (router, layouts, providers).
- `src/components/`: UI components organized by feature.
- `src/services/`: API, Socket, and RTC services.
- `src/stores/`: Pinia stores.
- `src/views/`: Page components.

## Internal Structure (Server)

- `src/controllers/`: Route handlers.
- `src/routes/`: Express routes.
- `src/services/`: Business logic.
- `src/sockets/`: Socket.io events and handlers.
- `src/utils/`: Helper functions and utilities.
