# 🏋️ GymFuel — Fitness & Nutrition Web Application

[![CI Pipeline](https://github.com/sibiraj-104/gym_project/actions/workflows/ci.yml/badge.svg)](https://github.com/sibiraj-104/gym_project/actions/workflows/ci.yml)

GymFuel is a full-stack fitness and nutrition monorepo utilizing **pnpm workspaces**, **TypeScript 6.0**, and the **MERN stack**.

## Project Workspaces

- [User App (PWA)](./apps/user) — React 19 / Vite 8 / Vitest
- [Admin Panel](./apps/admin) — React 19 / Vite 8 / Vitest
- [Landing Page](./apps/landing) — React 19 / Vite 8 / Vitest
- [Backend Server](./server) — Express 5 / Jest / Supertest
- [Shared Modules](./shared) — Zod Schemas & Shared Types

## Getting Started

### Prerequisites

- Node.js `24.x` (Active LTS)
- pnpm `11.x`

### Installation

```bash
pnpm install
```

### Scripts

- `pnpm run dev:all` — Run all workspaces in development mode simultaneously.
- `pnpm run build:all` — Build all workspaces for production.
- `pnpm run test:all` — Run test suites (Jest/Vitest) in all workspaces.
- `pnpm run lint:all` — Run ESLint 9 checks.
- `pnpm run typecheck:all` — Verify TypeScript types.

## Rollback (Staging)

If a bad deploy breaks staging, SSH into the VPS and run:

```bash
# 1. List available images and find the previous tag/SHA
docker images ghcr.io/sibiraj-104/gymfuel-api

# 2. Re-tag the last known-good image as latest
docker tag ghcr.io/sibiraj-104/gymfuel-api:<PREV_SHA> ghcr.io/sibiraj-104/gymfuel-api:latest
docker tag ghcr.io/sibiraj-104/gymfuel-user:<PREV_SHA> ghcr.io/sibiraj-104/gymfuel-user:latest
docker tag ghcr.io/sibiraj-104/gymfuel-admin:<PREV_SHA> ghcr.io/sibiraj-104/gymfuel-admin:latest
docker tag ghcr.io/sibiraj-104/gymfuel-landing:<PREV_SHA> ghcr.io/sibiraj-104/gymfuel-landing:latest

# 3. Restart containers using the reverted images
cd /app/gymfuel
docker compose -f docker-compose.staging.yml up -d --remove-orphans

# 4. Verify recovery
curl https://staging-api.gymfuel.com/api/system/health
```

Alternatively, re-run the CD pipeline from a previous passing commit via **GitHub Actions → CD Deploy Staging → Re-run jobs**.
