# AetherPulse

AetherPulse is a modern, real-time communication platform built with Vue, Node.js, and WebRTC. It provides a seamless experience for spatial audio, video calls, and instant messaging.

## Features

- **Real-time Communication:** Powered by WebRTC and Socket.io.
- **Spatial Audio:** Immersive audio experience based on user positioning.
- **Instant Messaging:** Fast and reliable chat system.
- **Monorepo Architecture:** Managed with pnpm and Turborepo for efficient development.
- **Full-stack Type Safety:** End-to-end type safety using TypeScript and Zod.

## Project Structure

This project is a monorepo managed with `pnpm` and `turbo`.

- `client/`: Frontend (Vue 3, Pinia, Vite)
- `server/`: Backend (Node.js, Express, Socket.io)
- `shared/`: Shared logic, types, and database schema
  - `shared/db`: Drizzle ORM schema and migrations
  - `shared/api-zod`: Zod schemas for API validation
  - `shared/api-client-react`: Generated API client (for future use or integration)
- `docs/`: Documentation
- `scripts/`: Build and deploy scripts

## Prerequisites

- [pnpm](https://pnpm.io/) (v10+)
- [Node.js](https://nodejs.org/) (v20+)

## Development

### Installation

```bash
pnpm install
```

### Running the Project

Run both client and server in development mode (this will also automatically synchronize the local SQLite database schema):

```bash
pnpm dev
```

Or run them individually:

```bash
pnpm start:client
pnpm start:server
```

### Database Setup

1. Copy `.env.example` to `.env` in the `shared/db` or root (depending on your setup).
2. Run migrations:

```bash
pnpm --filter @workspace/db migrate
```

## Building for Production

```bash
pnpm build
```

## Contributing

Please see [CONTRIBUTING.md](./CONTRIBUTING.md) (coming soon) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
