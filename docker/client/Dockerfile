# ============================================================================
# Client Dockerfile for AetherPulse
# Multi-stage build with nginx
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
COPY client/package.json ./client/
COPY shared/db/package.json ./shared/db/
COPY shared/api-zod/package.json ./shared/api-zod/
COPY shared/api-client-react/package.json ./shared/api-client-react/
COPY shared/api-spec/package.json ./shared/api-spec/

# Install dependencies
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

# Copy source files
COPY . .

# Build client
RUN pnpm run build --filter aetherpulse-client

# Stage 3: Production stage with nginx
FROM nginx:stable-alpine

# Remove default nginx config
RUN rm -rf /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built client files
COPY --from=build /usr/src/app/client/dist /usr/share/nginx/html

# Create non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup && \
    chown -R appuser:appgroup /usr/share/nginx/html

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Run nginx
CMD ["nginx", "-g", "daemon off;"]
