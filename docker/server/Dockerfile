FROM node:22-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Stage 1: Build stage
FROM base AS build
COPY . /usr/src/app
WORKDIR /usr/src/app
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm run build --filter aetherpulse-server

# Stage 2: Production dependencies stage
FROM base AS prod-deps
WORKDIR /usr/src/app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY server/package.json ./server/
COPY shared/db/package.json ./shared/db/
COPY shared/api-zod/package.json ./shared/api-zod/
COPY shared/api-client-react/package.json ./shared/api-client-react/
COPY shared/api-spec/package.json ./shared/api-spec/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

# Stage 3: Runner stage
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Copy compiled server bundle
COPY --from=build /usr/src/app/server/dist ./server/dist

# Copy production node_modules and configurations
COPY --from=prod-deps /usr/src/app/node_modules ./node_modules
COPY --from=prod-deps /usr/src/app/server/node_modules ./server/node_modules
COPY --from=prod-deps /usr/src/app/package.json ./package.json
COPY --from=prod-deps /usr/src/app/server/package.json ./server/package.json

# Create folders for persistent SQLite DB and uploads
RUN mkdir -p /app/data /app/uploads

EXPOSE 3000

# Server health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/api/health').then(r => r.status === 200 ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

CMD ["node", "--enable-source-maps", "./server/dist/server.mjs"]
