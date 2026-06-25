# 🏋️ GymFuel — Fitness & Nutrition Web Application

[![CI Pipeline](https://github.com/sibiraj-104/gym_project/actions/workflows/ci.yml/badge.svg)](https://github.com/sibiraj-104/gym_project/actions/workflows/ci.yml)

GymFuel is a full-stack fitness and nutrition monorepo utilizing **pnpm workspaces**, **TypeScript 6.0**, and the **MERN stack**.

## Project Workspaces

* [User App (PWA)](./apps/user) — React 19 / Vite 8 / Vitest
* [Admin Panel](./apps/admin) — React 19 / Vite 8 / Vitest
* [Landing Page](./apps/landing) — React 19 / Vite 8 / Vitest
* [Backend Server](./server) — Express 5 / Jest / Supertest
* [Shared Modules](./shared) — Zod Schemas & Shared Types

## Getting Started

### Prerequisites

* Node.js `24.x` (Active LTS)
* pnpm `11.x`

### Installation

```bash
pnpm install
```

### Scripts

* `pnpm run dev:all` — Run all workspaces in development mode simultaneously.
* `pnpm run build:all` — Build all workspaces for production.
* `pnpm run test:all` — Run test suites (Jest/Vitest) in all workspaces.
* `pnpm run lint:all` — Run ESLint 9 checks.
* `pnpm run typecheck:all` — Verify TypeScript types.
