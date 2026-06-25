# ==============================================================================
# GymFuel Server — Multi-Stage Dockerfile
# Optimized for pnpm workspaces. Builds both shared and server packages.
# ==============================================================================

# ── Stage 1: Base & Dependencies ──────────────────────────────────────────────
FROM node:22-alpine AS base
# Enable corepack for pnpm
RUN corepack enable && corepack prepare pnpm@9.12.3 --activate
WORKDIR /app

# Copy workspace config and package.json files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY shared/package.json ./shared/
COPY server/package.json ./server/

# Install all dependencies (dev included, needed for build)
RUN pnpm install --frozen-lockfile

# ── Stage 2: Build ────────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app

# Copy source code
COPY shared/ ./shared/
COPY server/ ./server/
COPY tsconfig.json ./

# Build shared package first, then server
RUN pnpm --filter gymfuel-shared build
RUN pnpm --filter gymfuel-server build

# ── Stage 3: Production Runner ────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Re-enable pnpm in production stage
RUN corepack enable && corepack prepare pnpm@9.12.3 --activate

# Copy minimal files needed for production install
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY shared/package.json ./shared/
COPY server/package.json ./server/

# Install ONLY production dependencies
RUN pnpm install --prod --frozen-lockfile

# Copy built artifacts from builder stage
COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/server/dist ./server/dist

# Expose port and run the server
EXPOSE 5000
CMD ["node", "server/dist/server.js"]
