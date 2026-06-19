# 📄 Software Requirements Specification (SRS)
## GymFuel — Fitness & Nutrition Web Application
**Version:** 1.0.0 | **Date:** May 2026 | **Stack:** MERN

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
| Calculator | `/calculator` | TDEE + Protein calculator |
| Workout | `/workout` | Log exercises, sets, reps |
| Reports | `/reports` | Weekly charts & summaries |
| Profile | `/profile` | Edit goals, weight history |

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

- **Framework:** Express `5.2.x`
- **Runtime:** Node.js `24.x LTS`
- **Access:** `api.gymfuel.com`

### API Route Structure

```
/api/auth/*         → Login, register, Google OAuth, JWT
/api/user/*         → Profile, goals, settings
/api/meals/*        → Log meals, get history
/api/food/*         → Search food, barcode lookup, AI scan
/api/workout/*      → Log workouts, templates
/api/calculator/*   → TDEE, protein calc endpoints
/api/reports/*      → Weekly summaries, charts data
/api/nutrition/*    → Micronutrient data, alerts
/api/admin/*        → Admin-only routes (role-protected)
/api/notifications/*→ Push notification management
/api/system/*       → Health check, feature flags
```

### Backend Middleware Stack
```
Request
  → helmet()          (Security headers)
  → cors()            (Allow frontend origins)
  → express-rate-limit (Rate limiting per IP)
  → morgan()          (HTTP request logging)
  → express.json()    (Parse JSON body)
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
- **ODM:** Mongoose `9.6.x`
- **Region:** Asia (ap-south-1) — for India users

### Collections (Tables)

| Collection | Description |
|------------|-------------|
| `users` | User profile, goals, preferences |
| `meal_logs` | Daily meal entries per user |
| `food_items` | Custom & approved food database |
| `workout_logs` | Exercise sessions per user |
| `workout_templates` | Admin-created workout plans |
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

### Frontend (All 3 Apps)

| Package | Stable Version | Purpose |
|---------|---------------|---------|
| **React** | `19.2.6` | Core UI framework |
| **Vite** | `6.x` | Build tool (fast HMR) |
| **React Router DOM** | `7.x` | Client-side routing |
| **Zustand** | `5.x` | Global state management |
| **React Hook Form** | `7.x` | Form handling |
| **Axios** | `1.8.x` | HTTP API calls |
| **Recharts** | `2.x` | Charts & data visualization |
| **Framer Motion** | `11.x` | Animations & transitions |
| **Firebase** | `11.x` | Google One-Tap Auth |
| **Vite PWA Plugin** | `0.20.x` | PWA + offline support |
| **@yudiel/react-qr-scanner** | `latest` | Barcode scanner |
| **TanStack Table** | `v8` | Admin data tables |
| **Socket.io-client** | `4.x` | Real-time admin updates |

### Backend (Single Server)

| Package | Stable Version | Purpose |
|---------|---------------|---------|
| **Node.js** | `24.x LTS` | Runtime environment |
| **Express** | `5.2.x` | Web framework |
| **Mongoose** | `9.6.x` | MongoDB ODM |
| **jsonwebtoken** | `9.x` | JWT token handling |
| **bcryptjs** | `2.x` | Password hashing |
| **google-auth-library** | `9.x` | Verify Google tokens |
| **cors** | `2.x` | Cross-origin requests |
| **helmet** | `8.x` | HTTP security headers |
| **express-rate-limit** | `7.x` | API rate limiting |
| **multer** | `1.x` | File/image uploads |
| **dotenv** | `16.x` | Environment variables |
| **winston** | `3.x` | Server logging |
| **morgan** | `1.x` | HTTP request logging |
| **node-cron** | `3.x` | Scheduled tasks |
| **nodemailer** | `6.x` | Email sending |
| **socket.io** | `4.x` | Real-time events |
| **ioredis** | `5.x` | Redis client (caching) |
| **bull** | `4.x` | Background job queue |

### Database & Services

| Service | Version / Plan | Purpose |
|---------|---------------|---------|
| **MongoDB Atlas** | `8.3.x` Free/M10 | Primary database |
| **Redis** (Upstash) | `7.x` | API response caching |
| **Cloudinary** | Free tier | Food image storage |
| **Firebase Auth** | `11.x` | Google login service |

---

## 6. External APIs

| API | Version / Plan | Free Limit | Use |
|-----|---------------|------------|-----|
| **Open Food Facts** | REST v2 | ✅ Unlimited Free | Food search, barcode |
| **USDA FoodData Central** | v1 | ✅ Free (1000/hr) | Micronutrient data |
| **Nutritionix** | v2 | 500 req/day free | Branded & restaurant food |
| **Google Gemini API** | gemini-1.5-flash | Free quota | AI food photo scan |
| **Firebase Auth** | v11 | ✅ Free (10K/month) | Google One-Tap login |
| **Cloudinary** | v1 | 25GB free | Store food scan images |

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
├── frontend-user/          ← App 1: User PWA (React + Vite)
│   ├── public/
│   ├── src/
│   │   ├── components/     ← Scanner, Dashboard, MealLog, Charts
│   │   ├── pages/          ← All 10 user pages
│   │   ├── store/          ← Zustand state
│   │   ├── hooks/          ← Custom React hooks
│   │   ├── api/            ← Axios API calls
│   │   └── utils/          ← TDEE calc, helpers
│   ├── package.json
│   └── vite.config.js
│
├── frontend-admin/         ← App 2: Admin Panel (React + Vite)
│   ├── src/
│   │   ├── components/     ← Tables, Charts, Forms
│   │   ├── pages/          ← All 10 admin pages
│   │   ├── store/          ← Zustand (admin state)
│   │   └── api/            ← Admin API calls
│   ├── package.json
│   └── vite.config.js
│
├── frontend-landing/       ← App 3: Landing Page (React + Vite)
│   ├── src/
│   │   └── sections/       ← Hero, Features, Pricing, Footer
│   ├── package.json
│   └── vite.config.js
│
├── backend/                ← Single Express API Server
│   ├── src/
│   │   ├── routes/         ← auth, user, food, meals, workout, admin
│   │   ├── controllers/    ← Business logic per route
│   │   ├── models/         ← Mongoose schemas
│   │   ├── middleware/     ← auth, rbac, rateLimit, logger
│   │   ├── services/       ← OpenFoodFacts, USDA, Gemini, Firebase
│   │   ├── jobs/           ← node-cron scheduled tasks
│   │   ├── utils/          ← nutritionCalc, tokenHelper
│   │   └── config/         ← DB connection, Redis, env
│   ├── package.json
│   └── server.js
│
├── docker-compose.yml      ← Run all services locally
└── README.md
```

---

## 9. Deployment Architecture

```
                        Internet
                           │
                     [Cloudflare CDN]
                           │
          ┌────────────────┼────────────────┐
          │                │                │
   gymfuel.com      app.gymfuel.com   admin.gymfuel.com
  [Landing - Vercel] [User - Vercel] [Admin - Vercel]
          │                │                │
          └────────────────┼────────────────┘
                           │
                  api.gymfuel.com
               [Backend - Railway / Render]
                     Node.js 24 LTS
                           │
                ┌──────────┼──────────┐
                │          │          │
          [MongoDB     [Redis      [Cloudinary
           Atlas]       Upstash]    Images]
```

---

## 10. Development Execution Plan

| Phase | Frontend | Backend | Duration |
|-------|----------|---------|----------|
| **Phase 1** | Landing + Login + Onboarding + Dashboard UI | Auth routes, User model, JWT setup | Week 1 |
| **Phase 2** | Food Scanner + Meal Logger UI | Food API, Barcode, Meal log routes | Week 2–3 |
| **Phase 3** | Calculator + Charts + Nutrient Alerts | TDEE logic, Nutrition routes, Alert engine | Week 4 |
| **Phase 4** | Workout Tracker + PWA setup + AI scan UI | Gemini integration, Workout routes | Week 5 |
| **Phase 5** | Admin Panel (all pages) | Admin routes, RBAC, Analytics | Week 6 |
| **Phase 6** | Reports + Push Notifications + Polish | Cron jobs, Nodemailer, Push | Week 7 |
| **Phase 7** | Testing + Bug fixes + Deploy | All services deployed | Week 8 |

---

## 11. Summary Table

| Item | Detail |
|------|--------|
| **Total Frontend Apps** | 3 (User PWA, Admin Panel, Landing Page) |
| **Total Backend Servers** | 1 (Single Express API) |
| **Database** | 1 (MongoDB Atlas — single cluster) |
| **Cache Layer** | Redis (Upstash — free tier) |
| **Auth Provider** | Firebase (Google) + Custom JWT |
| **Primary Language** | JavaScript (TypeScript optional later) |
| **Build Tool** | Vite 6.x (all 3 frontends) |
| **Node Version** | 24.x LTS (stable, Active LTS 2026) |
| **React Version** | 19.2.6 (latest stable) |
| **Express Version** | 5.2.x (production recommended) |
| **MongoDB Version** | 8.3.x (latest stable) |
| **Deployment** | Vercel (frontend) + Railway (backend) |
| **Estimated Build Time** | 8 weeks |
