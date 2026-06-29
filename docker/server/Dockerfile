# ============================================================================
# Server Dockerfile for Nicori
# Multi-stage build for production
# ============================================================================

# Stage 1: Base with pnpm
FROM node:22-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Stage 2: Build stage
FROM base AS build
WORKDIR /usr/src/app

# Copy workspace files
COPY package.json pnpm-workspace.yaml ./
COPY server/package.json ./server/
COPY shared/db/package.json ./shared/db/
COPY shared/api-zod/package.json ./shared/api-zod/
COPY shared/api-client-react/package.json ./shared/api-client-react/
COPY shared/api-spec/package.json ./shared/api-spec/

# Install dependencies
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

# Copy source files
COPY . .

# Build server
RUN pnpm run build --filter nicori-server

# Stage 3: Production dependencies
FROM base AS prod-deps
WORKDIR /usr/src/app

# Copy package files
COPY package.json pnpm-workspace.yaml ./
COPY server/package.json ./server/
COPY shared/db/package.json ./shared/db/
COPY shared/api-zod/package.json ./shared/api-zod/
COPY shared/api-client-react/package.json ./shared/api-client-react/
COPY shared/api-spec/package.json ./shared/api-spec/

# Install only production dependencies
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --prod --frozen-lockfile

# Stage 4: Runner stage (minimal)
FROM node:22-alpine AS runner
WORKDIR /app

# Create non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Environment
ENV NODE_ENV=production
ENV PORT=3000

# Copy compiled server bundle
COPY --from=build --chown=appuser:appgroup /usr/src/app/server/dist ./server/dist

# Copy production node_modules
COPY --from=prod-deps --chown=appuser:appgroup /usr/src/app/node_modules ./node_modules
COPY --from=prod-deps --chown=appuser:appgroup /usr/src/app/server/node_modules ./server/node_modules
COPY --from=prod-deps --chown=appuser:appgroup /usr/src/app/package.json ./package.json
COPY --from=prod-deps --chown=appuser:appgroup /usr/src/app/server/package.json ./server/package.json

# Create folders for data
RUN mkdir -p /app/data /app/uploads /app/logs && \
    chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/api/health').then(r => r.status === 200 ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# Run server
CMD ["node", "--enable-source-maps", "./server/dist/server.mjs"]
