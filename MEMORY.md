# 🧠 GymFuel — Project Memory & State

This file preserves the project context, architectural specifications, completed milestones, and custom rules for any future pairing or agentic session.

---

## 🏗️ Project Architecture & Tech Stack

GymFuel is a fitness and macro-nutrition tracker structured as a **pnpm monorepo** with the following workspaces:

- `server/` — Express 5.x REST API backend (MongoDB + Mongoose, Redis, Jest, Winston + Morgan).
- `apps/user/` — React PWA frontend client for regular gym users (Vite, TypeScript, Zustand, Tailwind/Vanilla CSS, framer-motion, Vitest).
- `apps/admin/` — React client for gym admins.
- `apps/landing/` — Marketing landing page.
- `shared/` — Common Typescript types, Zod validation schemas, and calculation utilities.

---

## 🔑 Authentication System Mechanics

- **Session Management**: App issues a custom signed JWT token stored in a secure, `httpOnly`, `sameSite: 'strict'` cookie named `token`. No localStorage token storage is used.
- **Google One-Tap Auth**: Client triggers Firebase OAuth Google authentication, retrieves the ID token, and sends it to the backend `POST /api/auth/google`. The backend validates the token signature against `FIREBASE_PROJECT_ID` and returns the session cookie.
- **Email & Password Auth**:
  - `POST /api/auth/register`: Zod validated. Passwords encrypted using `bcryptjs` (salt: 10). Emails are checked for uniqueness (`409 Conflict`).
  - `POST /api/auth/login`: Validates password hashes and issues the session cookie.
- **Routing Protection**: The `ProtectedRoute` component intercepts navigation on `/onboarding` and `/dashboard` depending on `isAuthenticated` and `user.isOnboarded` states.

---

## 🥗 Target & Calorie Calculations

All nutrition calculations live in `shared/src/utils/calculators.ts` to keep the logic unified:

1.  **BMR**: Calculated using the Mifflin-St Jeor equation.
2.  **TDEE**: BMR multiplied by activity multiplier (`sedentary`: 1.2, `light`: 1.375, `moderate`: 1.55, `active`: 1.725, `very_active`: 1.9).
3.  **Surplus/Deficit**: Lose Weight (`TDEE - 500` kcal), Build Muscle (`TDEE + 300` kcal), Maintain Weight (`TDEE` kcal).
4.  **Macros Split**:
    - _Protein_: 2.0g per kg of body weight (for muscle building/weight loss) or 1.6g per kg otherwise.
    - _Fat_: 25% of total calorie target (9 kcal/g).
    - _Carbs_: Remainder of calorie target (4 kcal/g).
    - _Water_: 8 glasses baseline + 1 glass per 10kg above 60kg (capped at 16 glasses).

---

## 🚀 Milestone Progress Status

### Milestone 1 — Infrastructure (100% Completed)

- Monorepo workspace, package manager, and shared TypeScript configurations.
- Docker compose setup for local services (MongoDB 7.0, Redis 7-alpine).
- CI Pipeline (.github/workflows/ci.yml) with database services.

### Milestone 2 — Auth & Dashboard (100% Completed)

- **Issue #12 (Done)**: Google/Firebase backend token verification and user auto-creation.
- **Issue #13 (Done)**: Backend email/password registration (`/register`) and login (`/login`) endpoints.
- **Issue #14 (Done)**: Backend profile fetch (`GET /api/user/profile`) and onboarding submission (`PUT /api/user/onboarding`) endpoints.
- **Issue #15 (Done)**: Frontend auth store (Zustand), Firebase client configs, ProtectedRoute component, and responsive Login UI page.
- **Issue #16 (Done)**: Frontend 3-step onboarding wizard flow (`/onboarding`).
- **Issue #17 (Done)**: User Dashboard UI redesign (Bento grid, calorie ring, macros, hydration).
- **Issue #18 (Done)**: Playwright E2E tests for authentication, onboarding, and dashboard routing flows.

### Milestone 3 — Food Tracking & Calculator (In Progress)

- **Issue #19 (Current)**: FoodItem + MealLog Mongoose models.

---

## 📜 Custom Agent Workspace Rules

1.  **Frontend Pre-PR Screenshot Rule**: Whenever you modify or create frontend pages, you **MUST** run the development server, launch a browser session, capture a visual screenshot of the interface, and display it to the user for review **BEFORE** creating a Pull Request on GitHub.
2.  **Serial Testing constraint**: Always run tests using `--runInBand` (e.g. `jest --runInBand`) to avoid database state race conditions on Mongoose.

---

## 🛠️ Local Development Commands

- **Install workspace packages**: `pnpm install`
- **Start development compose containers**: `docker compose up -d gymfuel-mongo gymfuel-redis`
- **Start user frontend**: `pnpm.cmd --filter gymfuel-user run dev` (Runs on `http://localhost:5173/`)
- **Start Express server**: `pnpm.cmd --filter gymfuel-server run dev` (Runs on `http://localhost:5000/`)
- **Run server test suites**: `pnpm.cmd --filter gymfuel-server run test`
