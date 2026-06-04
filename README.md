# 🌌 AetherPulse

AetherPulse is a state-of-the-art, real-time communication and collaboration platform designed for seamless instant messaging, high-fidelity video calling, and immersive spatial audio. 

Built as a high-performance TypeScript monorepo, the platform combines a premium, highly responsive user interface with a robust, secure, and production-ready backend architecture.

### ✨ Highlighted Features

- **🎙️ Immersive Spatial Audio & Video:** Next-gen WebRTC voice and video calls featuring localized spatial audio positioning for organic team interactions.
- **💬 Real-Time Messaging & DMs:** Fully-featured group rooms and direct messages with instantaneous sync, message editing, soft-deletion, and dynamic typing indicators.
- **🎨 Visual Customization:** Beautiful design system with fluid glassmorphism animations, supporting highly customizable user profiles and dual UI/UX paradigms (Maximalist Aesthetic and Minimalist Pixel art).
- **🛡️ Enterprise-Grade Security:** Hardened Express backend with JWT session auth, strict CORS configurations, atomic database transactions, upload mime-type verification, and built-in rate-limiting guards.
- **⚡ Built to Scale:** Powered by Turborepo and pnpm workspace. Automatically scales in production using a clustered Socket.io Redis Adapter while maintaining a zero-dependency in-memory configuration for lightweight local development.

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
