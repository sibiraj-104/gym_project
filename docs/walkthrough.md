# Walkthrough — Issue #13: Email/Password Auth Backend

I have implemented the traditional email/password registration and login backend endpoints under Milestone 2.

---

## 🛠️ Changes Completed

### 1. Controllers & Input Validation

- [authController.ts](file:///c:/AI-augmented/gym_project/server/src/controllers/authController.ts):
  - Defined Zod schemas for input validation: `registerSchema` (requires name, email, password min 6 chars) and `loginSchema`.
  - Implemented `registerUser`: checks for email conflicts, hashes passwords using `bcryptjs`, creates the user document, and sets a secure JWT `token` cookie.
  - Implemented `loginUser`: retrieves the user's hashed password, compares it using `bcryptjs`, verifies the user isn't banned, updates their active status, and sets the secure session cookie.

### 2. Routes

- [authRoutes.ts](file:///c:/AI-augmented/gym_project/server/src/routes/authRoutes.ts): Registered `POST /api/auth/register` and `POST /api/auth/login` endpoints.

### 3. Integration Tests

- [authRoutes.test.ts](file:///c:/AI-augmented/gym_project/server/src/routes/authRoutes.test.ts): Added comprehensive test coverage:
  - Successful registration (verifies secure cookie is set, password is encrypted).
  - Failed registration due to duplicate email (`409 Conflict`).
  - Failed registration due to invalid parameters (`400 Validation Error`).
  - Successful email/password login (`200 OK` + secure cookie).
  - Failed login due to wrong credentials (`401 Unauthorized`).
  - Failed login due to missing parameters.

---

## 🧪 Verification & Test Results

All 27 backend tests ran and passed successfully:

```bash
$ jest
PASS src/utils/token.test.ts
PASS src/server.test.ts (5.053 s)
PASS src/routes/authRoutes.test.ts (5.421 s)

Test Suites: 3 passed, 3 total
Tests:       27 passed, 27 total
Snapshots:   0 total
Time:        6.798 s
Ran all test suites.
```
