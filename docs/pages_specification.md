# 📋 GymFuel — Page-by-Page Feature & Activity Specification

This document provides a breakdown of all pages, forms, user inputs, and click activities for the three GymFuel frontend applications.

---

## 📱 App 1: User App (PWA) — 15 Pages

### 1. Landing Page (`/`)

- **Aesthetic & Role:** Entry page for public mobile web users. Auto-redirects to `/dashboard` if logged in.
- **Inputs / Form Fields:** None.
- **Action Buttons & Activities:**
  - `Get Started` CTA button (redirects to `/login`).
  - `How it works` scroll link (smooth-scrolls to explainer).
  - `Download PWA` action trigger (prompts standard PWA installation banner).

### 2. Login Page (`/login`)

- **Aesthetic & Role:** Single card layout, glassmorphic dark container.
- **Inputs / Form Fields:**
  - `Email Address` (Text input, validated).
  - `Password` (Text/password input).
- **Action Buttons & Activities:**
  - `Continue with Google` (Triggers Firebase Google One-Tap SDK modal).
  - `Login` / `Sign In` (Submits credential payload to auth API).
  - `Register Account` toggle (Switches view to registration state).

### 3. Onboarding Flow (`/onboarding`)

- **Aesthetic & Role:** Multi-step wizard (Slide 1: Stats, Slide 2: Goal, Slide 3: Calories).
- **Inputs / Form Fields:**
  - `Age` (Numeric input).
  - `Gender` (Select dropdown: Male/Female/Other).
  - `Weight (kg)` & `Height (cm)` (Numeric inputs).
  - `Activity Level` (Select: Sedentary, Lightly Active, Moderately Active, Very Active).
  - `Primary Goal` (Radio list: Lose Weight, Maintain, Build Muscle).
- **Action Buttons & Activities:**
  - `Next` / `Back` (Navigate steps).
  - `Calculate My Target` (Triggers TDEE/calorie math).
  - `Finish Setup` (Submits onboarding data to `/api/user/onboarding`).

### 4. User Dashboard (`/dashboard`)

- **Aesthetic & Role:** Central metric dashboard hub.
- **Inputs / Form Fields:**
  - `Water counter plus/minus` buttons.
- **Action Buttons & Activities:**
  - `Log Meal` quick-action floating button (links to `/meals`).
  - `Log Workout` quick-action button (links to `/workout`).
  - `Glass of Water` tap (increments daily water log by 1 glass).
  - `Weekly Summary` link (redirects to `/reports`).

### 5. Food Barcode & Photo Scanner (`/scanner`)

- **Aesthetic & Role:** Full screen camera view with boundary borders.
- **Inputs / Form Fields:**
  - `Camera feed` input.
  - `Image Upload` (File input box for uploading photos from gallery).
- **Action Buttons & Activities:**
  - `Capture Photo` (Takes photo of food plate for Gemini AI analysis).
  - `Flashlight Toggle` (Turns device flash on/off).
  - `Search Manually` link (redirects to `/meals` search tab).

### 6. Meal Logger (`/meals`)

- **Aesthetic & Role:** Search-first logging layout.
- **Inputs / Form Fields:**
  - `Search Food` (Live text input; searches Open Food Facts + local DB).
  - `Portion Size (g)` (Numeric input).
  - `Meal Type` (Select dropdown: Breakfast, Lunch, Dinner, Snack).
- **Action Buttons & Activities:**
  - `Search` button (submits queries).
  - `Log Food` (Adds food item to daily log, updates dashboard).
  - `Create Custom Food` link (opens manual food creation modal).

### 7. AI-Generated Diet Plan (`/diet-plan`)

- **Aesthetic & Role:** Grid-based weekly planner.
- **Inputs / Form Fields:**
  - `Diet Type` (Select: Keto, High Protein, Vegan, Balanced).
  - `Allergies / Dislikes` (Text input tagger).
- **Action Buttons & Activities:**
  - `Generate My Plan` (Sends config to Gemini to generate 7-day meal plan).
  - `Regenerate Meal` (Requests alternative for a specific slot).
  - `Save Plan` (Caches/saves weekly plan in database).

### 8. Fitness Calculators (`/calculator`)

- **Aesthetic & Role:** Tabbed card interface.
- **Inputs / Form Fields:**
  - _TDEE Tab_: Weight, Height, Age, Activity.
  - _1RM Tab_: Weight Lifted (kg), Reps completed (Numeric).
  - _Protein Tab_: Weight (kg), Goal.
- **Action Buttons & Activities:**
  - `Calculate TDEE` / `Calculate 1RM` / `Calculate Protein` (Executes formulas instantly).
  - `Update Profile Goal` (Saves calculated values directly to user profile).

### 9. Workout Logger (`/workout`)

- **Aesthetic & Role:** Workout logger sheet style.
- **Inputs / Form Fields:**
  - `Select Exercise` (Search autocomplete select).
  - `Weight (kg)` & `Reps` (Dual numeric input fields per set).
- **Action Buttons & Activities:**
  - `Add Set` button (adds new set row).
  - `Checkmark` (Marks a set as completed, triggers scale pop micro-animation).
  - `Finish Workout` (Submits workout log to `/api/workout/log`).

### 10. AI Workout Planner (`/workout-plan`)

- **Aesthetic & Role:** Plan visualizer card.
- **Inputs / Form Fields:**
  - `Experience Level` (Radio: Beginner, Intermediate, Advanced).
  - `Days Per Week` (Select: 3, 4, 5 days).
  - `Equipment Available` (Checkboxes: Gym, Dumbbells, Bodyweight).
- **Action Buttons & Activities:**
  - `Generate Workout Program` (Invokes Gemini generator).
  - `Start Program` (Saves plan as active workout template).

### 11. AI Coach Chat (`/coach`)

- **Aesthetic & Role:** Streaming chat interface.
- **Inputs / Form Fields:**
  - `Chat message input` (Textarea, triggers stream on Enter/Submit).
- **Action Buttons & Activities:**
  - `Send` icon.
  - `Quick Prompts` (Pills for fast questions, e.g., _"How to perform squats?"_).

### 12. Weekly Reports & Analytics (`/reports`)

- **Aesthetic & Role:** Visual analytics grid.
- **Inputs / Form Fields:**
  - `Select Date Range` (Dropdown filter).
- **Action Buttons & Activities:**
  - `Export PDF` (Generates weekly nutrition/activity report).
  - `Share Summary` (Opens native mobile share sheet).

### 13. Progress & Photos Log (`/progress`)

- **Aesthetic & Role:** Photo slider and statistics history.
- **Inputs / Form Fields:**
  - `Photo Upload` (Image upload input field).
  - `Waist / Chest / Arm Size (cm)` (Numeric inputs).
- **Action Buttons & Activities:**
  - `Upload Progress Photo` (Sends image to Cloudinary).
  - `Log Body Metrics` (Saves dimensions).
  - `Compare Slider` (Handles sliding drag bar to compare before/after images).

### 14. Achievements & Badges (`/achievements`)

- **Aesthetic & Role:** Interactive badge rack layout.
- **Inputs / Form Fields:** None.
- **Action Buttons & Activities:**
  - `Badge Cards` (Clicking a card flips it to show requirements/unlock criteria).
  - `Share Achievement` button.

### 15. User Profile & Settings (`/profile`)

- **Aesthetic & Role:** Form-based profile page.
- **Inputs / Form Fields:**
  - `Name` (Text).
  - `Target Calories` (Numeric).
  - `Weight Unit` (Radio: kg/lbs).
  - `Push Notifications Toggle` (Switch).
- **Action Buttons & Activities:**
  - `Save Settings` (Updates `/api/user/settings`).
  - `Logout` (Clears JWT cookies, redirects to `/login`).

---

## 🛠️ App 2: Admin Panel — 10 Pages

### 1. Admin Login (`/login`)

- **Inputs:** `Email Address`, `Password`, `TOTP Code` (6-digit 2FA token).
- **Actions:** `Secure Authenticate` (Checks password + speakeasy authenticator).

### 2. Main Admin Dashboard (`/`)

- **Inputs:** None.
- **Actions:** `Date range selector` for stats; `Refresh logs` button.

### 3. User Management (`/users`)

- **Inputs:** `Search user input`, `Role Filter` dropdown.
- **Actions:** `Ban User` toggle, `Change Role` dropdown, `Export User List` (CSV).

### 4. Food Database Queue (`/foods`)

- **Inputs:** `Filter Source` dropdown (User Added vs. OFF).
- **Actions:** `Approve Food` (publishes to global search), `Decline/Delete` button.

### 5. Workout Templates Scheduler (`/workouts`)

- **Inputs:** `Template Title` (Text), `Muscle Target` dropdown.
- **Actions:** `Publish Template` (pushes to user library), `Add Exercise Card` template block.

### 6. Smart Nutrition Alerts (`/alerts`)

- **Inputs:** `Calorie Deficit Threshold %` (Numeric input field).
- **Actions:** `Apply Alert Rule` (saves rule to Cron worker).

### 7. API Performance Monitor (`/api-monitor`)

- **Inputs:** `Live log speed` toggle (Slow/Medium/Fast).
- **Actions:** `Clear Logs Buffer` button.

### 8. Analytics & Retention Panel (`/analytics`)

- **Inputs:** `Select Year/Month` filter.
- **Actions:** `Download Retention Summary Report` (PDF).

### 9. Broadcast Notifications (`/notifications`)

- **Inputs:** `Broadcast Title` (Text), `Message Body` (Textarea).
- **Actions:** `Send Broadcast` (sends web push notifications via BullMQ worker).

### 10. System Settings & Toggles (`/settings`)

- **Inputs:** `Maintenance Mode` toggle, `AI Coach rate limit limit` (Numeric).
- **Actions:** `Save Configuration` (Updates database flags).

---

## 📢 App 3: Marketing Landing Page — 1 Page (6 Sections)

1.  **Hero Section**: Hero CTA buttons (`Explore Features`, `Start Tracking`).
2.  **Features Section**: Cards with hover scale scaling widgets.
3.  **How It Works Section**: Progress timeline markers.
4.  **Testimonials Grid**: Review cards.
5.  **Pricing Section**: Plan card selection (`Get Free Plan`).
6.  **Footer Section**: Privacy/Terms links, newsletter signup field (`Email Input` + `Subscribe` button).
