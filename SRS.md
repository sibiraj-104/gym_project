# 📄 Software Requirements Specification (SRS)
## GymFuel — Fitness & Nutrition Web Application
**Version:** 1.0 | **Date:** June 2026 | **Stack:** MERN + TypeScript + Docker + CI/CD

---

## 1. System Overview

GymFuel is a full-stack web application built on the **MERN stack** with a **single unified backend API** serving **three separate frontend applications** — User App, Admin Panel, and a Public Landing Page.

```
┌─────────────────────────────────────────────────────────────────┐
│                        GYMFUEL SYSTEM                           │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  USER APP    │  │  ADMIN PANEL │  │   LANDING PAGE       │  │
│  │  (React PWA) │  │  (React)     │  │   (React Static)     │  │
│  │  Port: 5173  │  │  Port: 5174  │  │   Port: 5175         │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘  │
│         │                 │                      │              │
│         └─────────────────┼──────────────────────┘              │
│                           │                                     │
│                    ┌──────▼───────┐                             │
│                    │   BACKEND    │                             │
│                    │  (Express 5) │                             │
│                    │  Port: 5000  │                             │
│                    └──────┬───────┘                             │
│                           │                                     │
│              ┌────────────┼─────────────┐                       │
│              │            │             │                       │
│       ┌──────▼──────┐ ┌───▼──────┐ ┌───▼──────────┐            │
│       │  MongoDB    │ │  Redis   │ │  Cloudinary  │            │
│       │  Atlas 8.3  │ │  Cache   │ │  (Images)    │            │
│       └─────────────┘ └──────────┘ └──────────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Frontend Applications (3 Apps)

### 2.1 — App 1: User App (PWA)
> The main app used by gym members

- **Type:** React PWA (Progressive Web App)
- **Users:** Registered gym members / fitness users
- **Install:** Installable from browser (no App Store needed)
- **Access:** `app.gymfuel.com`

| Page | Route | Description |
|------|-------|-------------|
| Landing | `/` | Hero, features, download CTA |
| Login | `/login` | Google One-Tap + Email |
| Onboarding | `/onboarding` | Age, weight, height, goal setup |
| Dashboard | `/dashboard` | Calorie ring, macros, water tracker |
| Food Scanner | `/scanner` | Barcode + AI photo scan |
| Meal Logger | `/meals` | Log breakfast/lunch/dinner/snacks |
| Diet Plan | `/diet-plan` | AI-generated personalized diet plans |
| Calculator | `/calculator` | TDEE, Protein, BMI, 1RM calculators |
| Workout | `/workout` | Log exercises, sets, reps |
| Workout Plan | `/workout-plan` | AI-generated workout programs |
| AI Coach | `/coach` | AI chatbot for fitness coaching |
| Reports | `/reports` | Weekly charts & summaries |
| Progress | `/progress` | Body measurements, before/after photos |
| Achievements | `/achievements` | Badges, streaks, milestones |
| Profile | `/profile` | Edit goals, weight history, settings |

---

### 2.2 — App 2: Admin Panel
> Internal tool for developers and content managers

- **Type:** React SPA (Single Page Application)
- **Users:** Super Admin, Content Manager, Support Agent, Developer
- **Access:** `admin.gymfuel.com` (IP-restricted in production)

| Page | Route | Description |
|------|-------|-------------|
| Login | `/login` | Email + 2FA only (no Google) |
| Dashboard | `/` | Users, scans, API quota, errors |
| User Management | `/users` | View, ban, delete, export users |
| Food Database | `/foods` | Add, edit, approve food items |
| Workout Templates | `/workouts` | Create & publish workout plans |
| Nutrition Alerts | `/alerts` | Configure smart alert rules |
| API Monitor | `/api-monitor` | Quota, response time, error logs |
| Analytics | `/analytics` | Growth, retention, feature usage |
| Notifications | `/notifications` | Send broadcast push messages |
| System Settings | `/settings` | Feature toggles, maintenance mode |
| Reports & Abuse | `/reports` | Handle flagged content |

---

### 2.3 — App 3: Landing Page
> Public marketing page (static, SEO optimized)

- **Type:** React Static Site
- **Users:** Public visitors (not logged in)
- **Access:** `gymfuel.com`

| Section | Description |
|---------|-------------|
| Hero | App tagline, CTA, animated mockup |
| Features | 6 key features highlighted |
| How It Works | 3-step onboarding guide |
| Testimonials | User reviews |
| Pricing | Free plan details |
| Footer | Links, social, legal |

---

## 3. Backend (Single API Server)

> One Express server handles ALL three frontend apps via route prefixes

- **Framework:** Express `5.2.x` (TypeScript)
- **Runtime:** Node.js `24.x LTS`
- **Language:** TypeScript 6.0 (strict mode)
- **Access:** `api.gymfuel.com`

### API Route Structure

```
/api/auth/*         → Login, register, Google OAuth, JWT
/api/user/*         → Profile, goals, settings
/api/meals/*        → Log meals, get history
/api/food/*         → Search food, barcode lookup, AI scan
/api/workout/*      → Log workouts, templates, exercise library
/api/calculator/*   → TDEE, protein, BMI, 1RM calc endpoints
/api/reports/*      → Weekly summaries, charts data, PDF export
/api/nutrition/*    → Micronutrient data, alerts
/api/ai/*           → AI chatbot coach, diet plan gen, workout plan gen
/api/admin/*        → Admin-only routes (role-protected)
/api/notifications/*→ Push notification management
/api/system/*       → Health check, feature flags
```

### Backend Middleware Stack
```
Request
  → helmet()          (Security headers)
  → compression()     (Gzip response compression)
  → cors()            (Allow frontend origins)
  → express-rate-limit (Rate limiting per IP + Redis store)
  → morgan()          (HTTP request logging)
  → express.json()    (Parse JSON body)
  → zodValidation()   (Zod schema validation)
  → authMiddleware()  (Verify JWT token)
  → rbacMiddleware()  (Check user role)
  → Controller Logic
  → Response
```

---

## 4. Database (MongoDB Atlas)

> Single MongoDB Atlas cluster shared by all apps

- **Provider:** MongoDB Atlas Cloud
- **Version:** `8.3.x`
- **ODM:** Mongoose `9.7.x`
- **Region:** Asia (ap-south-1) — for India users

### Collections (Tables)

| Collection | Description |
|------------|-------------|
| `users` | User profile, goals, preferences, streak data |
| `meal_logs` | Daily meal entries per user |
| `food_items` | Custom & approved food database |
| `workout_logs` | Exercise sessions per user |
| `workout_templates` | Admin-created workout plans |
| `exercises` | Exercise library (500+ exercises with muscle groups, equipment) |
| `diet_plans` | AI-generated personalized diet plans |
| `ai_chat_history` | AI coach conversation history per user |
| `achievements` | User badges & milestones |
| `body_measurements` | Body measurement tracking (chest, waist, arms, etc.) |
| `progress_photos` | Before/after photo references (Cloudinary URLs) |
| `notifications` | Push notification records |
| `api_logs` | External API call tracking |
| `admin_audit_logs` | Who did what in admin panel |
| `reports` | Generated weekly reports |
| `feature_flags` | System feature toggles |

### Key Schemas

```
users {
  _id, name, email, googleId,
  role: [user | admin | support | developer],
  profile: { age, weight, height, gender, activityLevel },
  goals: { type, targetCalories, targetProtein, targetCarbs, targetFat },
  createdAt, lastActiveAt
}

meal_logs {
  _id, userId, date,
  meals: [{
    type: [breakfast|lunch|dinner|snack],
    foodId, name, portion,
    calories, protein, carbs, fat, fiber
  }],
  totalCalories, totalProtein, waterGlasses
}

food_items {
  _id, name, brand, barcode,
  calories, protein, carbs, fat, fiber, sugar, sodium,
  vitamins: {}, minerals: {},
  source: [openFoodFacts | usda | userAdded | adminAdded],
  isApproved, reportCount
}
```

---

## 5. Stable Versions — Full Stack (2026)

### Frontend (All 3 Apps — TypeScript)

| Package | Stable Version | Purpose |
|---------|---------------|---------|
| **React** | `19.2.7` | Core UI framework |
| **React DOM** | `19.2.7` | React DOM renderer |
| **TypeScript** | 6.0 | Type-safe development |
| **Vite** | `8.0.x` | Build tool (Rolldown-powered) |
| **React Router** | `8.0.x` | Client-side routing |
| **Zustand** | `5.x` | Global state management |
| **TanStack Query** | `5.x` | Server state, caching, sync |
| **React Hook Form** | `7.x` | Form handling |
| **Zod** | `3.x` | Schema validation (shared with backend) |
| **Axios** | `1.8.x` | HTTP API calls |
| **Recharts** | `2.x` | Charts & data visualization |
| **Framer Motion** | `12.x` | Animations & transitions |
| **Firebase** | `11.x` | Google One-Tap Auth |
| **Vite PWA Plugin** | `0.21.x` | PWA + offline support |
| **@yudiel/react-qr-scanner** | `2.x` | Barcode scanner |
| **html5-qrcode** | `2.x` | Fallback barcode scanner |
| **TanStack Table** | `v8` | Admin data tables |
| **Socket.io-client** | `4.8.x` | Real-time admin updates |
| **react-hot-toast** | `2.x` | Toast notifications |
| **dayjs** | `1.x` | Lightweight date manipulation |

### Backend (Single Server — TypeScript)

| Package | Stable Version | Purpose |
|---------|---------------|---------|
| **Node.js** | `24.x LTS` | Runtime environment |
| **TypeScript** | 6.0 | Type-safe backend |
| **tsx** | `4.x` | TypeScript execution (dev) |
| **Express** | `5.2.x` | Web framework |
| **Mongoose** | `9.7.x` | MongoDB ODM |
| **Zod** | `3.x` | Request/response validation |
| **jsonwebtoken** | `9.x` | JWT token handling |
| **bcryptjs** | `2.x` | Password hashing |
| **google-auth-library** | `9.x` | Verify Google tokens |
| **@google/generative-ai** | `0.x` | Gemini AI SDK (food scan, coach, plans) |
| **cors** | `2.x` | Cross-origin requests |
| **helmet** | `8.x` | HTTP security headers |
| **compression** | `1.x` | Gzip response compression |
| **express-rate-limit** | `7.x` | API rate limiting |
| **multer** | `2.x` | File/image uploads |
| **cloudinary** | `2.x` | Image upload/storage SDK |
| **dotenv** | `16.x` | Environment variables |
| **winston** | `3.x` | Server logging |
| **morgan** | `1.x` | HTTP request logging |
| **node-cron** | `3.x` | Scheduled tasks |
| **nodemailer** | `6.x` | Email sending |
| **web-push** | `3.x` | PWA push notifications |
| **socket.io** | `4.8.x` | Real-time events |
| **ioredis** | `5.x` | Redis client (caching) |
| **bullmq** | `5.x` | Background job queue |
| **speakeasy** | `2.x` | TOTP 2FA for admin |

### Database & Services

| Service | Version / Plan | Purpose |
|---------|---------------|---------|
| **MongoDB Atlas** | `8.3.x` Free/M10 | Primary database |
| **Redis** (Upstash) | `7.x` | API caching, rate-limit store |
| **Cloudinary** | Free tier | Food images, progress photos |
| **Firebase Auth** | `11.x` | Google login service |

---

## 6. External APIs

| API | Version / Plan | Free Limit | Use |
|-----|---------------|------------|-----|
| **Open Food Facts** | REST v2 | ✅ Unlimited Free | Food search, barcode |
| **USDA FoodData Central** | v1 | ✅ Free (1000/hr) | Micronutrient data |
| **Nutritionix** | v2 | 500 req/day free | Branded & restaurant food |
| **Google Gemini API** | gemini-2.0-flash | Free quota | AI food scan, chatbot coach, plan generation |
| **Firebase Auth** | v11 | ✅ Free (10K/month) | Google One-Tap login |
| **Cloudinary** | v1 | 25GB free | Store food scan images, progress photos |

---

## 7. Authentication Flow

```
USER APP LOGIN
──────────────
User clicks "Continue with Google"
  → Firebase One-Tap popup
  → Google returns ID Token (JWT)
  → Frontend sends token to /api/auth/google
  → Backend verifies token via google-auth-library
  → If new user → create MongoDB record
  → Backend returns App JWT (expires 7 days)
  → Frontend stores JWT in httpOnly cookie
  → All future requests use this App JWT

ADMIN PANEL LOGIN
─────────────────
Admin enters Email + Password
  → POST /api/auth/admin/login
  → Backend checks bcrypt hash in MongoDB
  → If 2FA enabled → verify TOTP code
  → Backend returns Admin JWT (expires 8 hours)
  → RBAC middleware checks role on every admin route
```

---

## 8. Project Folder Structure

```
gymfuel/
│
├── apps/
│   ├── user/                   ← App 1: User PWA (React + Vite 8 + TypeScript)
│   │   ├── public/
│   │   ├── src/
│   │   │   ├── components/     ← Scanner, Dashboard, MealLog, Charts, AICoach
│   │   │   ├── pages/          ← All 15 user pages
│   │   │   ├── store/          ← Zustand state stores
│   │   │   ├── hooks/          ← Custom React hooks
│   │   │   ├── api/            ← TanStack Query + Axios API calls
│   │   │   ├── types/          ← TypeScript interfaces
│   │   │   └── utils/          ← TDEE calc, helpers
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── vite.config.ts
│   │
│   ├── admin/                  ← App 2: Admin Panel (React + Vite 8 + TypeScript)
│   │   ├── src/
│   │   │   ├── components/     ← Tables, Charts, Forms, Moderation
│   │   │   ├── pages/          ← All 10 admin pages
│   │   │   ├── store/          ← Zustand (admin state)
│   │   │   └── api/            ← Admin API calls
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── vite.config.ts
│   │
│   └── landing/                ← App 3: Landing Page (React + Vite 8 + TypeScript)
│       ├── src/
│       │   └── sections/       ← Hero, Features, Pricing, Footer
│       ├── package.json
│       ├── tsconfig.json
│       └── vite.config.ts
│
├── server/                     ← Single Express API Server (TypeScript)
│   ├── src/
│   │   ├── routes/             ← auth, user, food, meals, workout, ai, admin
│   │   ├── controllers/        ← Request handling per route
│   │   ├── services/           ← Business logic, OpenFoodFacts, USDA, Gemini
│   │   ├── models/             ← Mongoose schemas (TypeScript)
│   │   ├── middleware/         ← auth, rbac, validation, rateLimit, logger
│   │   ├── jobs/              ← BullMQ workers + node-cron tasks
│   │   ├── utils/             ← nutritionCalc, tokenHelper
│   │   └── config/            ← DB connection, Redis, env
│   ├── package.json
│   ├── tsconfig.json
│   └── server.ts
│
├── shared/                     ← Shared TypeScript types & validators
│   ├── types/                 ← Shared interfaces (User, Food, Workout, etc.)
│   ├── validators/            ← Zod schemas (used by frontend + backend)
│   └── constants/             ← Enums, config values
│
├── docker/                      ← Docker configs per service
│   ├── backend.Dockerfile
│   ├── user.Dockerfile
│   ├── admin.Dockerfile
│   └── landing.Dockerfile
├── nginx/                       ← Nginx reverse proxy config
│   ├── nginx.conf
│   └── staging.conf
├── .github/
│   └── workflows/
│       ├── ci.yml               ← Run tests on every PR/push
│       └── deploy-staging.yml   ← Auto-deploy to VPS on merge
├── docker-compose.yml           ← Run all services locally
├── docker-compose.staging.yml   ← Staging VPS deployment
├── docs/
│   ├── Issues.md                ← GitHub Issues tracker (features + infra)
│   └── ADR/                     ← Architecture Decision Records
├── .env.example                 ← Environment variable template
└── README.md
```

---

## 9. Deployment Architecture

### 9.1 — Staging Environment (CloudClusters VPS + Docker)

```
                        Internet
                           │
                 [Cloudflare DNS / Proxy]
                           │
              staging.gymfuel.com (VPS IP)
                           │
              ┌────────────▼────────────┐
              │   CloudClusters VPS     │
              │   Ubuntu 22.04 LTS      │
              │                         │
              │  ┌─────────────────┐    │
              │  │   Nginx Proxy   │    │  ← SSL termination (Let's Encrypt)
              │  │   (Port 80/443) │    │    Certbot auto-renewal
              │  └────────┬────────┘    │
              │           │             │
              │  ┌────────▼──────────────────────────────┐  │
              │  │         Docker Network                 │  │
              │  │                                        │  │
              │  │  [user:5173] [admin:5174] [land:5175]  │  │
              │  │              [api:5000]                │  │
              │  │         [mongo:27017] [redis:6379]     │  │
              │  └────────────────────────────────────────┘  │
              └─────────────────────────────────────────────┘
```

**Staging Subdomains:**
| Subdomain | Service | Docker Container |
|-----------|---------|------------------|
| `staging.gymfuel.com` | Landing Page | `gymfuel-landing` |
| `staging-app.gymfuel.com` | User PWA | `gymfuel-user` |
| `staging-admin.gymfuel.com` | Admin Panel | `gymfuel-admin` |
| `staging-api.gymfuel.com` | Backend API | `gymfuel-api` |

### 9.2 — Production Environment (Future)

```
                        Internet
                           │
                     [Cloudflare CDN]
                           │
          ┌────────────────┼────────────────┐
          │                │                │
   gymfuel.com      app.gymfuel.com   admin.gymfuel.com
          │                │                │
          └────────────────┼────────────────┘
                           │
                  api.gymfuel.com
               [CloudClusters VPS — Production]
                     Docker + Nginx
                           │
                ┌──────────┼──────────┐
                │          │          │
          [MongoDB     [Redis      [Cloudinary
           Atlas]       Upstash]    Images]
```

### 9.3 — CI/CD Pipeline

```
  Developer pushes code
         │
   [GitHub PR opened]
         │
   [GitHub Actions: CI]
    ├── Lint (ESLint)
    ├── Type-check (tsc --noEmit)
    ├── Unit Tests (Vitest / Jest)
    └── Integration Tests
         │
   [PR merged to main]
         │
   [GitHub Actions: CD]
    ├── Build Docker images
    ├── Push to GitHub Container Registry (GHCR)
    └── SSH into VPS → docker compose pull → up -d
         │
   [Staging auto-updated ✅]
```

---

## 10. Development Execution Plan

> All features are tracked as GitHub Issues in [`docs/Issues.md`](./docs/Issues.md). Each issue includes context, acceptance criteria, test cases, and definition of done.

### Infrastructure Phases (Before Feature Work)

| Issue | Phase | Task | Duration |
|-------|-------|------|----------|
| `#I-01` | **Infra 1** | Monorepo setup (pnpm workspaces) + Vitest/Jest test suites for all apps | Day 1–2 |
| `#I-02` | **Infra 2** | GitHub Actions CI pipeline (lint, type-check, test) | Day 2–3 |
| `#I-03` | **Infra 3** | Docker setup — Dockerfiles + docker-compose (local + staging) | Day 3–4 |
| `#I-04` | **Infra 4** | CloudClusters VPS configuration + Docker deployment | Day 4–5 |
| `#I-05` | **Infra 5** | Domain mapping + Nginx reverse proxy + SSL (Let's Encrypt) | Day 5–6 |

### Feature Phases (After Infra is Ready)

| Issue | Phase | Frontend | Backend | Duration |
|-------|-------|----------|---------|----------|
| `#F-01` | **Phase 1** | Landing + Login + Onboarding + Dashboard UI | Auth routes, User model, JWT | Week 2 |
| `#F-02` | **Phase 2** | Food Scanner + Meal Logger UI | Food API, Barcode, Meal log routes | Week 3–4 |
| `#F-03` | **Phase 3** | Calculator + Charts + Nutrient Alerts | TDEE logic, Nutrition routes, Alert engine | Week 5 |
| `#F-04` | **Phase 4** | Workout Tracker + Exercise Library + PWA | Workout routes, Exercise DB, PWA setup | Week 6 |
| `#F-05` | **Phase 5** | AI Coach Chat + Diet Plan + Workout Plan UI | Gemini integration, AI routes, plan gen | Week 7–8 |
| `#F-06` | **Phase 6** | Admin Panel (all pages) | Admin routes, RBAC, Analytics, 2FA | Week 9 |
| `#F-07` | **Phase 7** | Progress Photos + Achievements + Push Notifications | Cron jobs, BullMQ workers, Web Push | Week 10 |
| `#F-08` | **Phase 8** | Full regression testing + polish + production deploy | Load testing, security audit | Week 11 |

---

## 11. DevOps & Tooling Stack

| Tool | Purpose |
|------|---------|
| **pnpm workspaces** | Monorepo package manager |
| **Vitest** | Frontend unit testing (all 3 React apps) |
| **Jest + Supertest** | Backend unit + integration testing |
| **GitHub Actions** | CI pipeline (lint, type-check, test) |
| **Docker** | Containerize all services |
| **Docker Compose** | Orchestrate multi-service local + staging environments |
| **GHCR** | GitHub Container Registry (store Docker images) |
| **Nginx** | Reverse proxy + SSL termination on VPS |
| **Certbot** | Let's Encrypt SSL certificates (auto-renewal) |
| **CloudClusters VPS** | Staging + Production server hosting |
| **ESLint + Prettier** | Code quality and formatting |

---

## 12. Summary Table

| Item | Detail |
|------|--------|
| **Total Frontend Apps** | 3 (User PWA, Admin Panel, Landing Page) |
| **Total User Pages** | 15 (including AI Coach, Diet Plan, Workout Plan) |
| **Total Backend Servers** | 1 (Single Express API) |
| **Database** | 1 (MongoDB Atlas — single cluster, 16 collections) |
| **Cache Layer** | Redis (Upstash — free tier) |
| **Auth Provider** | Firebase (Google) + Custom JWT |
| **Primary Language** | TypeScript (strict mode, frontend + backend) |
| **Build Tool** | Vite 8.0.x (Rolldown-powered, all 3 frontends) |
| **Node Version** | 24.x LTS (stable, Active LTS 2026) |
| **React Version** | 19.2.7 (latest stable) |
| **Express Version** | 5.2.x (production recommended) |
| **MongoDB Version** | 8.3.x (latest stable) |
| **AI Engine** | Google Gemini 2.0 Flash (food scan, coach, plan gen) |
| **Package Manager** | pnpm workspaces (monorepo) |
| **Testing** | Vitest (frontend) + Jest/Supertest (backend) |
| **Containerization** | Docker + Docker Compose |
| **CI/CD** | GitHub Actions → GHCR → CloudClusters VPS |
| **Hosting** | CloudClusters VPS (staging + production) |
| **Reverse Proxy** | Nginx + Certbot (Let's Encrypt SSL) |
| **Estimated Build Time** | 11 weeks (infra first, then feature-by-feature) |
