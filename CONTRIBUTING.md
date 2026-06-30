# Contributing to Nicori

Thanks for your interest in contributing to Nicori! Every contribution helps make this project better.

## How to Contribute

### Reporting Bugs

Before creating a bug report, please check [existing issues](https://github.com/BoziaO/Nicori/issues) to avoid duplicates.

When creating a bug report, include:

- A clear and descriptive title
- Steps to reproduce the issue
- Expected behavior vs actual behavior
- Your environment (OS, browser, Node.js version)
- Screenshots or logs if applicable

Use the [bug report template](.github/ISSUE_TEMPLATE/bug_report.yml).

### Suggesting Features

Feature suggestions are welcome! Please use the [feature request template](.github/ISSUE_TEMPLATE/feature_request.yml) and describe:

- The problem you're trying to solve
- Your proposed solution
- Alternatives you've considered

### Pull Requests

1. Fork the repository
2. Create a branch from `main` (`git checkout -b feature/my-feature`)
3. Make your changes
4. Run tests and linting (`pnpm typecheck && pnpm lint`)
5. Commit with a [conventional commit](#commit-messages) message
6. Push to your fork and open a Pull Request

## Development Setup

### Prerequisites

- Node.js >= 22
- pnpm >= 11
- MongoDB (local or Atlas)

### Getting Started

```bash
# Clone the repository
git clone https://github.com/BoziaO/Nicori.git
cd Nicori

# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env

# Start development servers
pnpm dev
```

The client runs at `http://localhost:5174` and the server at `http://localhost:3000`.

### Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all services (Turborepo) |
| `pnpm build` | Build all packages |
| `pnpm typecheck` | Type-check TypeScript |
| `pnpm lint` | Run ESLint |
| `pnpm test` | Run tests (Vitest) |
| `pnpm format` | Format code with Prettier |

## Code Style

- **TypeScript** for all new code
- **Vue 3 Composition API** with `<script setup>` for components
- **Functional components** and hooks
- Follow existing patterns in the codebase
- Use Prettier for formatting (configured in `.prettierrc.cjs`)

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat: add new feature`
- `fix: resolve bug`
- `docs: update documentation`
- `refactor: improve code structure`
- `test: add or update tests`
- `chore: maintenance tasks`

### Project Structure

```
Nicori/
├── client/          # Vue 3 frontend
├── server/          # Express backend
├── shared/          # Shared packages
├── docker/          # Docker configuration
└── docs/            # Documentation
```

## Testing

```bash
# Run all tests
pnpm test

# Run specific package tests
pnpm --filter nicori-client test
pnpm --filter nicori-server test
```

## Questions?

If you have questions, feel free to open an issue or reach out to the maintainers.

Thank you for contributing to Nicori!
