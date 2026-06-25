# Stage 1: Build
FROM node:24-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm@11
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY shared/package.json ./shared/
COPY apps/admin/package.json ./apps/admin/
RUN pnpm install --frozen-lockfile
COPY shared/ ./shared/
COPY apps/admin/ ./apps/admin/
RUN pnpm --filter gymfuel-shared run build
RUN pnpm --filter gymfuel-admin run build

# Stage 2: Serve
FROM nginx:alpine
COPY --from=builder /app/apps/admin/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
