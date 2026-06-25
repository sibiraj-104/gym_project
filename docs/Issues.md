# 📋 GymFuel — GitHub Issues Tracker

> All issues follow the GitHub Issue format with detailed context, acceptance criteria, and test criteria.
> **Labels:** `infra` `backend` `frontend` `testing` `devops` `feature`
> **Milestones:** `Milestone 1: Infra` → `Milestone 2–8: Features`

---

## 🏗️ MILESTONE 1 — Infrastructure Setup

---

### `#I-01` — Monorepo Setup with pnpm Workspaces + Test Suites

**Labels:** `infra` `testing` `devops`
**Milestone:** Milestone 1 — Infra
**Priority:** 🔴 Critical (blocks everything else)
**Estimated Time:** 2 days

#### Context

The GymFuel project is a monorepo containing 4 workspaces: `apps/user`, `apps/admin`, `apps/landing`, and `server`. Currently there is no unified package manager config, no shared TypeScript base config, and no test runners configured. This issue sets up the entire foundation so all future development has consistent tooling, linting, and testing from Day 1.

#### Scope of Work

- Initialize `pnpm-workspace.yaml` at root
- Create root `package.json` with workspace scripts (`test:all`, `lint:all`, `typecheck:all`, `dev:all`)
- Create `tsconfig.base.json` at root (extended by each app)
- Configure **ESLint** (with TypeScript + React rules) shared config
- Configure **Prettier** at root
- Set up **Vitest** in each of the 3 React apps (`apps/user`, `apps/admin`, `apps/landing`)
- Set up **Jest + Supertest** in `server/`
- Write 3 sample tests per workspace (to validate setup)
- Add test scripts to each `package.json`

#### Acceptance Criteria

- [ ] `pnpm install` from root installs all workspace dependencies
- [ ] `pnpm run test:all` runs all tests across all 4 workspaces
- [ ] `pnpm run lint:all` lints all workspaces with zero errors on fresh setup
- [ ] `pnpm run typecheck:all` runs `tsc --noEmit` across all workspaces with no errors
- [ ] Each workspace has at least 3 passing sample tests
- [ ] `tsconfig.base.json` is extended by all workspace `tsconfig.json` files

#### Test Criteria

| Type        | Test                                                        | Expected |
| ----------- | ----------------------------------------------------------- | -------- |
| Unit        | `apps/user` — renders `<App />` without crashing            | ✅ Pass  |
| Unit        | `apps/admin` — renders `<App />` without crashing           | ✅ Pass  |
| Unit        | `apps/landing` — renders `<App />` without crashing         | ✅ Pass  |
| Unit        | `server/` — health check handler returns `{ status: 'ok' }` | ✅ Pass  |
| Integration | `server/` — `GET /api/system/health` returns `200 OK`       | ✅ Pass  |

#### Definition of Done

- [ ] All tests pass: `pnpm run test:all`
- [ ] No TypeScript errors: `pnpm run typecheck:all`
- [ ] No lint errors: `pnpm run lint:all`
- [ ] PR reviewed and merged to `main`

---

### `#I-02` — GitHub Actions CI Pipeline

**Labels:** `infra` `devops` `testing`
**Milestone:** Milestone 1 — Infra
**Priority:** 🔴 Critical
**Estimated Time:** 1–2 days
**Depends on:** `#I-01`

#### Context

Every pull request to `main` must automatically run lint, type-check, and tests to prevent broken code from being merged. This issue sets up the GitHub Actions CI workflow that runs on every `push` and `pull_request` targeting `main`. It also sets up job separation per workspace so failures are traceable.

#### Scope of Work

- Create `.github/workflows/ci.yml`
- Jobs (run in parallel where possible):
  - `lint` — runs ESLint across all workspaces
  - `typecheck` — runs `tsc --noEmit` across all workspaces
  - `test-user` — Vitest for `apps/user`
  - `test-admin` — Vitest for `apps/admin`
  - `test-landing` — Vitest for `apps/landing`
  - `test-server` — Jest for `server/`
- Add Node.js 24 + pnpm caching to speed up runs
- Add status badge to `README.md`

#### Acceptance Criteria

- [ ] CI runs automatically on every `push` and `pull_request` to `main`
- [ ] All 6 jobs appear separately in GitHub Actions UI
- [ ] A failing test causes the CI check to fail (blocks merge)
- [ ] A passing run shows all green checks
- [ ] pnpm cache reduces subsequent run times by >50%
- [ ] README has a CI status badge

#### Test Criteria

| Scenario                           | Expected Result                 |
| ---------------------------------- | ------------------------------- |
| Push with all tests passing        | ✅ All CI jobs green            |
| Push with a broken TypeScript type | ❌ `typecheck` job fails        |
| Push with a failing unit test      | ❌ Corresponding test job fails |
| PR opened with lint error          | ❌ `lint` job fails, PR blocked |

#### Definition of Done

- [ ] `.github/workflows/ci.yml` committed and working
- [ ] All jobs verified green on a clean push
- [ ] Deliberately broken test confirmed to fail CI
- [ ] README badge updated

---

### `#I-03` — Docker Setup (Local Dev + Staging)

**Labels:** `infra` `devops`
**Milestone:** Milestone 1 — Infra
**Priority:** 🔴 Critical
**Estimated Time:** 2 days
**Depends on:** `#I-01`

#### Context

Docker ensures every developer runs the same environment and the staging server runs identical containers. This issue creates multi-stage Dockerfiles for each service and a `docker-compose.yml` for local development, plus a `docker-compose.staging.yml` for the VPS.

#### Scope of Work

- `docker/backend.Dockerfile` — multi-stage (build → production), Node 24 Alpine
- `docker/user.Dockerfile` — Vite build → Nginx serve static
- `docker/admin.Dockerfile` — Vite build → Nginx serve static
- `docker/landing.Dockerfile` — Vite build → Nginx serve static
- `docker-compose.yml` (local dev):
  - `gymfuel-api` — backend with hot reload (tsx watch)
  - `gymfuel-mongo` — MongoDB 8.3 (local)
  - `gymfuel-redis` — Redis 7
  - `gymfuel-user`, `gymfuel-admin`, `gymfuel-landing` — frontend dev servers
- `docker-compose.staging.yml` (VPS):
  - Same services but built from production images
  - Uses GHCR image tags
  - Includes Nginx container for routing
- `.env.example` updated with all required variables
- `.dockerignore` files for each service

#### Acceptance Criteria

- [ ] `docker compose up` starts all 6 services locally
- [ ] Backend API accessible at `http://localhost:5000/api/system/health`
- [ ] User app accessible at `http://localhost:5173`
- [ ] Admin app accessible at `http://localhost:5174`
- [ ] Landing page accessible at `http://localhost:5175`
- [ ] MongoDB and Redis accessible within Docker network
- [ ] Production Docker images build without error
- [ ] Images are under 500MB each (multi-stage build efficiency)

#### Test Criteria

| Check                                                                | Expected                  |
| -------------------------------------------------------------------- | ------------------------- |
| `docker compose up` — no errors                                      | ✅ All containers healthy |
| `curl http://localhost:5000/api/system/health`                       | `{ "status": "ok" }`      |
| `docker images` — check image sizes                                  | All < 500MB               |
| Stop and restart containers — data persists (MongoDB volume)         | ✅ Data retained          |
| `docker compose -f docker-compose.staging.yml config` — valid config | ✅ No errors              |

#### Definition of Done

- [ ] All Dockerfiles committed
- [ ] `docker compose up` works end-to-end locally
- [ ] Both compose files committed
- [ ] `.env.example` updated
- [ ] PR reviewed and merged

---

### `#I-04` — CloudClusters VPS Configuration + Docker Deployment

**Labels:** `infra` `devops`
**Milestone:** Milestone 1 — Infra
**Priority:** 🔴 Critical
**Estimated Time:** 1–2 days
**Depends on:** `#I-02` `#I-03`

#### Context

The staging server runs on a CloudClusters VPS. This issue configures the VPS with Docker + Docker Compose, sets up the GitHub Actions CD pipeline to auto-deploy on merge to `main`, and verifies the full deployment end-to-end.

#### Scope of Work

- Install Docker + Docker Compose on VPS (Ubuntu 22.04)
- Create a deploy user with SSH key (stored in GitHub Secrets)
- Create `.github/workflows/deploy-staging.yml`:
  - Trigger: push to `main` (after CI passes)
  - Steps: Build images → Push to GHCR → SSH into VPS → `docker compose pull && docker compose up -d`
- Configure GitHub Secrets: `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`, `GHCR_TOKEN`
- Add health check URL verification step in CD workflow
- Set up Docker log rotation on VPS

#### Acceptance Criteria

- [ ] Merging to `main` triggers the CD workflow automatically
- [ ] CD workflow builds and pushes images to GHCR
- [ ] VPS automatically pulls new images and restarts containers
- [ ] `GET staging-api.gymfuel.com/api/system/health` returns `200 OK` after deploy
- [ ] Zero-downtime deployment (rolling restart)
- [ ] GitHub Secrets are set and not exposed in logs

#### Test Criteria

| Scenario                                        | Expected                                |
| ----------------------------------------------- | --------------------------------------- |
| Merge a trivial change to `main`                | CD pipeline triggers automatically      |
| CD pipeline completes                           | VPS containers updated within 3 minutes |
| Hit `staging-api.gymfuel.com/api/system/health` | `200 OK`                                |
| Check `docker ps` on VPS                        | All containers running                  |
| Introduce a broken build                        | CD fails, old containers stay running   |

#### Definition of Done

- [ ] CD workflow committed and tested
- [ ] VPS running all containers successfully
- [ ] Auto-deploy confirmed end-to-end
- [ ] Rollback procedure documented in README

---

### `#I-05` — Domain Mapping + Nginx Reverse Proxy + SSL (Let's Encrypt)

**Labels:** `infra` `devops`
**Milestone:** Milestone 1 — Infra
**Priority:** 🔴 Critical
**Estimated Time:** 1 day
**Depends on:** `#I-04`

#### Context

The staging server needs proper domain names, Nginx to route traffic to the correct containers, and free SSL certificates via Certbot (Let's Encrypt) for HTTPS. This makes the staging environment accessible to the team over secure URLs.

#### Scope of Work

- Configure DNS A records in Cloudflare:
  - `staging.gymfuel.com` → VPS IP
  - `staging-app.gymfuel.com` → VPS IP
  - `staging-admin.gymfuel.com` → VPS IP
  - `staging-api.gymfuel.com` → VPS IP
- Create `nginx/staging.conf` with upstream proxy rules:
  - Port 80 → redirect to HTTPS
  - Port 443 → proxy to correct Docker container
- Install Certbot on VPS and issue SSL certs for all 4 subdomains
- Configure auto-renewal (`certbot renew` cron job)
- Add Nginx container to `docker-compose.staging.yml`

#### Acceptance Criteria

- [ ] All 4 subdomains resolve to the VPS IP
- [ ] HTTPS works on all 4 subdomains (no certificate warning)
- [ ] HTTP redirects to HTTPS (301)
- [ ] SSL certificates are valid and show correct domain names
- [ ] Certbot auto-renewal configured (`certbot renew --dry-run` passes)
- [ ] Nginx correctly routes to each container

#### Test Criteria

| Check                                               | Expected             |
| --------------------------------------------------- | -------------------- |
| `https://staging-api.gymfuel.com/api/system/health` | `200 OK` + valid SSL |
| `https://staging-app.gymfuel.com`                   | User app loads       |
| `https://staging-admin.gymfuel.com`                 | Admin app loads      |
| `https://staging.gymfuel.com`                       | Landing page loads   |
| `http://staging-api.gymfuel.com`                    | Redirects to HTTPS   |
| `certbot renew --dry-run`                           | ✅ Successful        |
| SSL Labs test on any subdomain                      | Grade A or A+        |

#### Definition of Done

- [ ] All 4 HTTPS subdomains working
- [ ] HTTP → HTTPS redirect working
- [ ] Auto-renewal verified
- [ ] Team confirmed access from their machines
- [ ] Config committed to `nginx/staging.conf`

---

### `#I-06` — Shared Typings & Schema Setup

**Labels:** `infra` `backend` `frontend`
**Milestone:** Milestone 1 — Infra
**Priority:** 🔴 Critical
**Estimated Time:** 1 day
**Depends on:** `#I-01`

#### Context

A monorepo setup benefits significantly from a shared library. This issue covers creating standard TypeScript interfaces and Zod validation schemas for Core Entities (User, Food, Meal, Workout, Auth) to be used across all workspaces.

#### Acceptance Criteria

- [ ] Shared `gymfuel-shared` package configured properly.
- [ ] Types defined for all core entities.
- [ ] Zod validators created for request payloads.
- [ ] Shared constants exported.

---

### `#I-07` — Environment Variable Validation

**Labels:** `infra` `backend`
**Milestone:** Milestone 1 — Infra
**Priority:** 🔴 Critical
**Estimated Time:** 1 day
**Depends on:** `#I-01`

#### Context

Failing fast on missing environment variables is key to robust server infrastructure. We need to implement Zod-based environment variable validation during backend startup.

#### Acceptance Criteria

- [ ] `env.ts` configuration file that strictly parses `process.env`.
- [ ] Server refuses to start without critical environment variables.
- [ ] `.env.example` is fully updated.

---

### `#I-08` — MongoDB Init & Seeds

**Labels:** `infra` `backend`
**Milestone:** Milestone 1 — Infra
**Priority:** 🔴 High
**Estimated Time:** 1 day
**Depends on:** `#I-03`

#### Context

The database requires predefined indexes for optimal queries and seed data for local development.

#### Acceptance Criteria

- [ ] Exponential backoff retry logic implemented for DB connection.
- [ ] Idempotent MongoDB index initialization script created.
- [ ] Development seed script (Users, Exercises, Foods) implemented.

---

### `#I-09` — Logging & Error Monitoring Base

**Labels:** `infra` `backend`
**Milestone:** Milestone 1 — Infra
**Priority:** 🔴 High
**Estimated Time:** 1 day
**Depends on:** `#I-01`

#### Context

Setting up logging and global error handling ensures any issues in development and staging are easily tracked.

#### Acceptance Criteria

- [ ] Winston logger configured with environment-specific formats.
- [ ] Global Express error handler implemented.
- [ ] Morgan request logging integrated with Winston.

---

### `#I-10` — Developer Experience Tooling

**Labels:** `infra` `devops`
**Milestone:** Milestone 1 — Infra
**Priority:** 🟡 Medium
**Estimated Time:** 1 day
**Depends on:** `#I-01`

#### Context

Developer experience is crucial. Pre-commit hooks via Husky and lint-staged ensure no unlinted or unformatted code gets committed. Commitlint enforces standard commit messages.

#### Acceptance Criteria

- [ ] Husky installed and configured.
- [ ] lint-staged configured to format and lint on commit.
- [ ] commitlint enforces Conventional Commits.

---

## 🚀 MILESTONE 2 — Phase 1: Auth + Dashboard

---

### `#F-01` — Auth System + User Onboarding + Dashboard (Phase 1)

**Labels:** `backend` `frontend` `feature`
**Milestone:** Milestone 2 — Phase 1
**Priority:** 🔴 Critical
**Estimated Time:** 1 week
**Depends on:** `#I-05` (infra complete)

#### Context

This is the first feature phase. Users need to log in with Google (Firebase One-Tap) or email, complete an onboarding flow, and land on the dashboard. The backend must handle token verification, user creation, and JWT issuance. The frontend must handle the auth flow and display the dashboard UI.

#### Backend Scope

- `POST /api/auth/google` — verify Firebase token, create/get user, return App JWT
- `POST /api/auth/register` — email/password registration
- `POST /api/auth/login` — email/password login
- `GET /api/user/profile` — return user profile (auth required)
- `PUT /api/user/onboarding` — save age, weight, height, goal
- `GET /api/system/health` — health check
- `users` MongoDB model + Mongoose schema
- Auth middleware (JWT verification)
- RBAC middleware skeleton

#### Frontend Scope (`apps/user`)

- `/` — Landing page redirect to login if not authed
- `/login` — Google One-Tap + email/password form
- `/onboarding` — 3-step form: body stats → goal selection → calorie targets
- `/dashboard` — calorie ring (Recharts), macro bars, water tracker

#### Acceptance Criteria

- [ ] Google One-Tap login works end-to-end
- [ ] New user auto-created in MongoDB on first login
- [ ] Onboarding data saved and reflected on dashboard
- [ ] Dashboard shows correct TDEE-based calorie goal
- [ ] JWT stored in httpOnly cookie
- [ ] Protected routes redirect unauthenticated users to `/login`
- [ ] All API routes return correct HTTP status codes

#### Test Criteria

| Type        | Test                                              | Expected               |
| ----------- | ------------------------------------------------- | ---------------------- |
| Unit        | `verifyGoogleToken()` with valid token            | Returns user payload   |
| Unit        | `generateJWT()` returns signed token              | Valid JWT string       |
| Unit        | `calculateTDEE()` for known inputs                | Correct calorie value  |
| Integration | `POST /api/auth/google` with valid Firebase token | `200` + JWT cookie set |
| Integration | `POST /api/auth/google` with invalid token        | `401 Unauthorized`     |
| Integration | `GET /api/user/profile` without JWT               | `401 Unauthorized`     |
| Integration | `PUT /api/user/onboarding` with valid data        | `200` + user updated   |
| E2E         | Full login → onboarding → dashboard flow          | ✅ All steps complete  |

#### Definition of Done

- [ ] All unit + integration tests pass in CI
- [ ] Feature deployed to staging
- [ ] Google login verified on staging
- [ ] Dashboard renders with real data
- [ ] PR reviewed and merged

---

## 🍎 MILESTONE 3 — Phase 2: Food Scanner + Meal Logger

---

### `#F-02` — Food Scanner + Barcode Lookup + Meal Logger (Phase 2)

**Labels:** `backend` `frontend` `feature`
**Milestone:** Milestone 3 — Phase 2
**Priority:** 🔴 High
**Estimated Time:** 2 weeks
**Depends on:** `#F-01`

#### Context

The core value of GymFuel is tracking food intake. Users need to scan barcodes or search food names, and log meals (breakfast/lunch/dinner/snack). The backend integrates Open Food Facts and USDA APIs. An AI photo scan via Gemini is included.

#### Backend Scope

- `GET /api/food/search?q=` — search Open Food Facts + USDA
- `GET /api/food/barcode/:code` — barcode lookup via Open Food Facts
- `POST /api/food/scan` — Gemini AI photo food scan (multipart image)
- `POST /api/meals/log` — log a meal entry
- `GET /api/meals/today` — get today's meal logs for user
- `GET /api/meals/history` — paginated meal history
- `food_items` + `meal_logs` MongoDB models

#### Frontend Scope

- `/scanner` — barcode scanner (react-qr-scanner) + AI photo scan
- `/meals` — meal logger: search food, select meal type, log portion
- Dashboard updates: live calorie/macro totals from today's logs

#### Acceptance Criteria

- [ ] Barcode scan returns correct food data from Open Food Facts
- [ ] Food name search returns results within 1 second
- [ ] AI photo scan returns estimated nutrition data
- [ ] Meal logged successfully and visible in today's log
- [ ] Dashboard calorie ring updates after meal log
- [ ] Calorie + macro totals calculated correctly

#### Test Criteria

| Type        | Test                                                 | Expected                    |
| ----------- | ---------------------------------------------------- | --------------------------- |
| Unit        | `parseFoodFacts(apiResponse)` — nutrition extraction | Correct macros extracted    |
| Unit        | `calculateMealTotals(meals[])`                       | Correct sum of macros       |
| Integration | `GET /api/food/search?q=banana`                      | Returns ≥1 food item        |
| Integration | `GET /api/food/barcode/8901030865038`                | Returns food item or 404    |
| Integration | `POST /api/meals/log` with valid meal data           | `201` + meal saved          |
| Integration | `GET /api/meals/today`                               | Returns today's meals array |
| Integration | `POST /api/food/scan` with test image                | Returns nutrition estimate  |

#### Definition of Done

- [ ] All tests pass in CI
- [ ] Barcode scan works on staging (mobile browser test)
- [ ] Meal logger end-to-end tested on staging
- [ ] PR reviewed and merged

---

## 🧮 MILESTONE 4 — Phase 3: Calculators + Alerts

---

### `#F-03` — Fitness Calculators + Nutrient Alerts (Phase 3)

**Labels:** `backend` `frontend` `feature`
**Milestone:** Milestone 4 — Phase 3
**Priority:** 🟡 Medium
**Estimated Time:** 1 week
**Depends on:** `#F-02`

#### Context

Users need calculators (TDEE, BMI, Protein, 1RM) and smart alerts when nutritional goals are off-track. All calculator logic lives in the `shared/` package (reused by frontend and backend).

#### Backend Scope

- `GET /api/calculator/tdee` — TDEE calculation
- `GET /api/calculator/bmi` — BMI calculation
- `GET /api/calculator/protein` — Protein target
- `GET /api/calculator/1rm` — One Rep Max (Epley formula)
- `POST /api/nutrition/alerts` — configure alert rules
- `GET /api/nutrition/alerts` — list user alerts
- Alert engine: cron job checks daily nutrition and sends push/email if threshold breached

#### Frontend Scope

- `/calculator` — tabbed calculator UI (TDEE, BMI, Protein, 1RM)
- Alert configuration UI in profile settings

#### Acceptance Criteria

- [ ] TDEE calculator returns correct value for known inputs
- [ ] BMI classification correct (Underweight / Normal / Overweight / Obese)
- [ ] 1RM Epley formula: `weight × (1 + reps/30)` correct
- [ ] Alerts fire when user's calorie intake is <50% of goal
- [ ] Calculator results match industry-standard values (verified manually)

#### Test Criteria

| Type        | Test                                                                                 | Expected         |
| ----------- | ------------------------------------------------------------------------------------ | ---------------- |
| Unit        | `calculateTDEE(70kg, 175cm, 25yr, male, moderate)`                                   | ~2,800 kcal      |
| Unit        | `calculateBMI(70kg, 175cm)`                                                          | 22.9 — Normal    |
| Unit        | `calculateEpley(100kg, 5reps)`                                                       | ~117 kg          |
| Unit        | `calculateProteinTarget(70kg, 'muscle_gain')`                                        | 140–168g         |
| Integration | `GET /api/calculator/tdee?weight=70&height=175&age=25&gender=male&activity=moderate` | `{ tdee: 2800 }` |

#### Definition of Done

- [ ] All unit tests pass (calculator logic 100% tested)
- [ ] Calculator UI works on staging
- [ ] Alert fires in test environment
- [ ] PR reviewed and merged

---

## 🏋️ MILESTONE 5 — Phase 4: Workout Tracker + PWA

---

### `#F-04` — Workout Tracker + Exercise Library + PWA Setup (Phase 4)

**Labels:** `backend` `frontend` `feature`
**Milestone:** Milestone 5 — Phase 4
**Priority:** 🟡 High
**Estimated Time:** 1 week
**Depends on:** `#F-03`

#### Context

Users log workout sessions (sets, reps, weight) and follow workout templates. The exercise library contains 500+ exercises. PWA setup makes the user app installable on mobile devices.

#### Backend Scope

- `GET /api/workout/exercises` — paginated exercise library with filters
- `POST /api/workout/log` — log a workout session
- `GET /api/workout/history` — user workout history
- `GET /api/workout/templates` — list workout templates
- `exercises` + `workout_logs` + `workout_templates` models
- PWA manifest + service worker (via Vite PWA plugin)

#### Acceptance Criteria

- [ ] Exercise library returns correct results with muscle group filter
- [ ] Workout session logged with sets/reps/weight
- [ ] PWA installable on Chrome Android and iOS Safari
- [ ] App works offline (cached shell + last session data)
- [ ] Push notification permission requested on install

#### Test Criteria

| Type        | Test                                      | Expected                        |
| ----------- | ----------------------------------------- | ------------------------------- |
| Unit        | Exercise filter by muscle group           | Returns only matching exercises |
| Integration | `POST /api/workout/log` with 3 exercises  | `201` + log saved               |
| Integration | `GET /api/workout/exercises?muscle=chest` | Returns chest exercises         |
| E2E         | Install PWA → open offline                | App shell loads                 |

#### Definition of Done

- [ ] Workout log end-to-end working on staging
- [ ] PWA installable on staging URL
- [ ] All tests pass in CI
- [ ] PR reviewed and merged

---

## 🤖 MILESTONE 6 — Phase 5: AI Features

---

### `#F-05` — AI Coach + AI Diet Plan + AI Workout Plan (Phase 5)

**Labels:** `backend` `frontend` `feature` `ai`
**Milestone:** Milestone 6 — Phase 5
**Priority:** 🟡 High
**Estimated Time:** 2 weeks
**Depends on:** `#F-04`

#### Context

GymFuel's AI features use Google Gemini 2.0 Flash. The AI Coach is a chat interface. The Diet Plan generator creates a personalized weekly plan. The Workout Plan generator creates a progressive training program. All AI calls are rate-limited and cached in Redis.

#### Backend Scope

- `POST /api/ai/chat` — AI coach chat (Gemini, context-aware)
- `POST /api/ai/diet-plan` — generate personalized diet plan
- `POST /api/ai/workout-plan` — generate personalized workout program
- `GET /api/ai/diet-plan/current` — return saved diet plan
- `GET /api/ai/workout-plan/current` — return saved workout plan
- Redis caching for generated plans (24h TTL)
- Rate limiting: 10 AI chat requests/hour per user

#### Frontend Scope

- `/coach` — AI chat UI (streaming responses, Framer Motion animations)
- `/diet-plan` — display generated diet plan with edit capability
- `/workout-plan` — display generated workout plan week-by-week

#### Acceptance Criteria

- [ ] AI coach responds in <5 seconds for typical queries
- [ ] Diet plan generated with correct calorie targets matching user's goals
- [ ] Workout plan appropriate for user's stated fitness level
- [ ] Chat history persists across sessions
- [ ] Rate limiting prevents >10 requests/hour per user
- [ ] Cached plans served from Redis (not re-generated on refresh)

#### Test Criteria

| Type        | Test                                       | Expected                  |
| ----------- | ------------------------------------------ | ------------------------- |
| Unit        | `buildAICoachPrompt(userProfile, message)` | Correct prompt structure  |
| Unit        | `parseDietPlanResponse(geminiOutput)`      | Structured plan object    |
| Integration | `POST /api/ai/chat` — 11th request in 1hr  | `429 Too Many Requests`   |
| Integration | `POST /api/ai/diet-plan` — cached response | Redis hit, no Gemini call |
| Integration | `POST /api/ai/workout-plan`                | Returns structured plan   |

#### Definition of Done

- [ ] All AI routes working on staging
- [ ] Chat UI smooth and responsive
- [ ] Rate limiting confirmed
- [ ] Redis caching verified
- [ ] PR reviewed and merged

---

## 🛡️ MILESTONE 7 — Phase 6: Admin Panel

---

### `#F-06` — Admin Panel + RBAC + Analytics (Phase 6)

**Labels:** `backend` `frontend` `feature`
**Milestone:** Milestone 7 — Phase 6
**Priority:** 🟡 High
**Estimated Time:** 1 week
**Depends on:** `#F-05`

#### Context

The admin panel is used by internal team members to manage users, food database, workout templates, and view analytics. It uses Email + TOTP 2FA login (no Google). All admin routes are RBAC-protected.

#### Backend Scope

- `POST /api/auth/admin/login` — email + bcrypt + TOTP 2FA
- `GET /api/admin/users` — paginated user list
- `PATCH /api/admin/users/:id/ban` — ban a user
- `GET /api/admin/analytics` — growth, retention, feature usage
- `GET /api/admin/api-monitor` — API quota + error logs
- RBAC: `super_admin`, `content_manager`, `support_agent`, `developer` roles
- `admin_audit_logs` model — track all admin actions

#### Frontend Scope (`apps/admin`)

- `/login` — email + password + TOTP code form
- `/` — dashboard (user count, scans, API quota, errors)
- `/users` — data table with search, ban, export
- `/analytics` — charts (user growth, feature usage)

#### Acceptance Criteria

- [ ] Admin login requires correct TOTP code (2FA)
- [ ] Support agent cannot access user ban feature (RBAC enforced)
- [ ] All admin actions logged to `admin_audit_logs`
- [ ] User table supports search + pagination
- [ ] Analytics shows real data from DB

#### Test Criteria

| Type        | Test                                              | Expected          |
| ----------- | ------------------------------------------------- | ----------------- |
| Unit        | `verifyTOTP(secret, token)` — valid token         | `true`            |
| Unit        | `verifyTOTP(secret, expiredToken)`                | `false`           |
| Integration | `POST /api/auth/admin/login` — wrong TOTP         | `401`             |
| Integration | `PATCH /api/admin/users/:id/ban` as support agent | `403 Forbidden`   |
| Integration | `GET /api/admin/users` as super_admin             | `200` + user list |

#### Definition of Done

- [ ] 2FA login working on staging
- [ ] RBAC tested for all roles
- [ ] Audit logs written for all admin actions
- [ ] PR reviewed and merged

---

## 📸 MILESTONE 8 — Phase 7: Progress, Achievements & Push

---

### `#F-07` — Progress Photos + Achievements + Push Notifications (Phase 7)

**Labels:** `backend` `frontend` `feature`
**Milestone:** Milestone 8 — Phase 7
**Priority:** 🟢 Medium
**Estimated Time:** 1 week
**Depends on:** `#F-06`

#### Context

Users can upload before/after progress photos (stored on Cloudinary), earn achievement badges for milestones (7-day streak, 10 workouts, etc.), and receive push notifications for reminders and alerts. Background jobs run via BullMQ + node-cron.

#### Backend Scope

- `POST /api/user/progress/photo` — upload photo to Cloudinary
- `GET /api/user/progress/photos` — list progress photos
- `GET /api/achievements` — list user achievements
- `POST /api/notifications/subscribe` — save push subscription
- BullMQ worker: award achievements based on activity
- node-cron: daily meal reminder push at 8am, 12pm, 6pm

#### Acceptance Criteria

- [ ] Photo upload works and Cloudinary URL saved to DB
- [ ] Achievement badge awarded within 1 minute of qualifying action
- [ ] Push notification received on subscribed device
- [ ] Streak counter correctly increments/resets

#### Test Criteria

| Type        | Test                                                   | Expected                           |
| ----------- | ------------------------------------------------------ | ---------------------------------- |
| Unit        | `checkStreakAchievement(logs, 7)` — 7 consecutive days | Returns `seven_day_streak` badge   |
| Unit        | `checkStreakAchievement(logs, 6)` — only 6 days        | Returns `null`                     |
| Integration | `POST /api/user/progress/photo` with image             | `201` + Cloudinary URL in response |
| Integration | BullMQ worker triggers after 7 meal logs               | Achievement created in DB          |

#### Definition of Done

- [ ] Photo upload end-to-end on staging
- [ ] Achievement awarded in test scenario
- [ ] Push notification received on staging
- [ ] PR reviewed and merged

---

## ✅ MILESTONE 9 — Phase 8: Testing, Polish & Production Deploy

---

### `#F-08` — Full Regression Testing + Security Audit + Production Deploy (Phase 8)

**Labels:** `testing` `devops` `infra`
**Milestone:** Milestone 9 — Phase 8
**Priority:** 🔴 Critical
**Estimated Time:** 1 week
**Depends on:** All previous issues complete

#### Context

Before production launch, run full regression testing, security audit, performance testing, and deploy to production. This is the final gate before GymFuel goes live.

#### Scope of Work

- Full regression test run across all features
- Load testing: `k6` — simulate 500 concurrent users
- Security audit: check for common vulnerabilities (rate limiting, SQL injection N/A, NoSQL injection, CORS misconfiguration, JWT vulnerabilities)
- Update DNS to production domains (`gymfuel.com`, `app.gymfuel.com`, `admin.gymfuel.com`, `api.gymfuel.com`)
- SSL for production domains
- Set up MongoDB Atlas backups
- Performance: Lighthouse score >90 on user app and landing page

#### Acceptance Criteria

- [ ] All 50+ automated tests pass
- [ ] Load test: API handles 500 concurrent users with <500ms p95 response time
- [ ] Lighthouse score ≥90 (Performance, Accessibility, SEO)
- [ ] No critical security vulnerabilities
- [ ] Production domains live with SSL
- [ ] MongoDB Atlas automated backups configured
- [ ] Monitoring alerts set up (uptime + error rate)

#### Test Criteria

| Check                                            | Expected                           |
| ------------------------------------------------ | ---------------------------------- |
| k6 load test — 500 VUs for 60s                   | p95 < 500ms, error rate < 1%       |
| Lighthouse — `app.gymfuel.com`                   | Performance ≥90, Accessibility ≥90 |
| `curl https://api.gymfuel.com/api/system/health` | `200 OK`                           |
| SSL Labs — production API domain                 | Grade A+                           |
| All CI tests                                     | ✅ 100% pass                       |

#### Definition of Done

- [ ] All tests passing
- [ ] Load test results documented
- [ ] Security audit report documented
- [ ] Production domains live
- [ ] Team sign-off
- [ ] 🎉 GymFuel is LIVE

---

## 📊 Issue Summary

| Issue   | Title                           | Labels                    | Priority    | Week     |
| ------- | ------------------------------- | ------------------------- | ----------- | -------- |
| `#I-01` | Monorepo + Test Suite Setup     | `infra` `testing`         | 🔴 Critical | Week 1   |
| `#I-02` | GitHub Actions CI Pipeline      | `infra` `devops`          | 🔴 Critical | Week 1   |
| `#I-03` | Docker Setup (Local + Staging)  | `infra` `devops`          | 🔴 Critical | Week 1   |
| `#I-04` | CloudClusters VPS + CD Pipeline | `infra` `devops`          | 🔴 Critical | Week 1   |
| `#I-05` | Domain + Nginx + SSL            | `infra` `devops`          | 🔴 Critical | Week 1   |
| `#I-06` | Shared Typings & Schema Setup   | `infra` `backend`         | 🔴 Critical | Week 1   |
| `#I-07` | Environment Variable Validation | `infra` `backend`         | 🔴 Critical | Week 1   |
| `#I-08` | MongoDB Init & Seeds            | `infra` `backend`         | 🔴 High     | Week 1   |
| `#I-09` | Logging & Error Monitoring Base | `infra` `backend`         | 🔴 High     | Week 1   |
| `#I-10` | Developer Experience Tooling    | `infra` `devops`          | 🟡 Medium   | Week 1   |
| `#F-01` | Auth + Onboarding + Dashboard   | `backend` `frontend`      | 🔴 Critical | Week 2   |
| `#F-02` | Food Scanner + Meal Logger      | `backend` `frontend`      | 🔴 High     | Week 3–4 |
| `#F-03` | Calculators + Alerts            | `backend` `frontend`      | 🟡 Medium   | Week 5   |
| `#F-04` | Workout Tracker + PWA           | `backend` `frontend`      | 🟡 High     | Week 6   |
| `#F-05` | AI Coach + Plans                | `backend` `frontend` `ai` | 🟡 High     | Week 7–8 |
| `#F-06` | Admin Panel + RBAC              | `backend` `frontend`      | 🟡 High     | Week 9   |
| `#F-07` | Progress + Achievements + Push  | `backend` `frontend`      | 🟢 Medium   | Week 10  |
| `#F-08` | Testing + Deploy to Production  | `testing` `devops`        | 🔴 Critical | Week 11  |
