# Nicori Documentation

Welcome to the Nicori documentation. This project is a modern, real-time communication platform built with Vue,
Node.js, and WebRTC.

## Documentation Structure

- **[Architecture](./architecture/)** - System architecture, components, and data flow
- **[API Reference](./api/)** - REST API and Socket.IO events documentation
- **[Deployment](./deployment/)** - Deployment guides for different environments
- **[Development](./development/)** - Development setup, guidelines, and best practices

## Quick Links

- [Getting Started](../README.md) - Project setup and running locally
- [Contributing](../CONTRIBUTING.md) - Contribution guidelines
- [API Specification](../shared/api-spec/) - OpenAPI specification

## Project Overview

Nicori provides:

- Real-time text chat with rooms and direct messages
- Voice and video calls with spatial audio
- Screen sharing capabilities
- User authentication and profile management
- Friend system with requests

## Technology Stack

| Layer          | Technology                                   |
| -------------- | -------------------------------------------- |
| Frontend       | Vue 3, Pinia, Vite, TypeScript, Tailwind CSS |
| Backend        | Node.js, Express, Socket.IO, TypeScript      |
| Database       | MongoDB (Mongoose)                           |
| Real-time      | WebRTC, Socket.IO                            |
| Infrastructure | Docker, Docker Compose, Nginx                |
| DevOps         | GitHub Actions, pnpm, Turbo                  |

## Architecture Highlights

- **Monorepo structure** managed with pnpm and Turborepo
- **Full-stack TypeScript** for type safety
- **Real-time communication** via Socket.IO and WebRTC
- **Modular design** with Pinia stores for state management
- **Scalable architecture** with support for MongoDB and Redis

---

For detailed documentation, please refer to the specific sections above.
