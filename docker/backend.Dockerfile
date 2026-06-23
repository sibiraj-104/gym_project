# Stage 1: Build
FROM node:24-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm@11
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY shared/package.json ./shared/
COPY server/package.json ./server/
RUN pnpm install --frozen-lockfile
COPY shared/ ./shared/
COPY server/ ./server/
RUN pnpm --filter gymfuel-shared run build
RUN pnpm --filter gymfuel-server run build

# Stage 2: Run
FROM node:24-alpine
WORKDIR /app
RUN npm install -g pnpm@11
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY shared/package.json ./shared/
COPY server/package.json ./server/
RUN pnpm install --prod --frozen-lockfile
COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/server/dist ./server/dist
EXPOSE 5000
ENV NODE_ENV=production
CMD ["node", "server/dist/server.js"]
