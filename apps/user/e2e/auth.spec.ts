import { test, expect, Page } from '@playwright/test';

// ─── Mock helpers ─────────────────────────────────────────────────────────────

/** Unboarded user returned after register/google-login */
const mockNewUser = {
  id: 'user-new-001',
  name: 'Test User',
  email: 'test@example.com',
  role: 'user',
  isOnboarded: false,
  streakCount: 0,
};

/** Onboarded user returned after normal login */
const mockOnboardedUser = {
  id: 'user-onboarded-001',
  name: 'Active Member',
  email: 'member@gymfuel.com',
  role: 'user',
  isOnboarded: true,
  profile: {
    age: 25,
    weight: 70,
    height: 175,
    gender: 'male',
    activityLevel: 'moderate',
  },
  goals: {
    type: 'build_muscle',
    targetCalories: 2894,
    targetProtein: 140,
    targetCarbs: 404,
    targetFat: 80,
    targetWaterGlasses: 9,
  },
  streakCount: 7,
};

/** Intercept all API routes with sensible mocks */
async function setupMocks(
  page: Page,
  initialUser: typeof mockNewUser | typeof mockOnboardedUser | null,
) {
  // GET /api/user/profile — returns current auth state
  await page.route('**/api/user/profile', async (route) => {
    if (initialUser) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ user: initialUser }),
      });
    } else {
      await route.fulfill({
        status: 401,
        body: JSON.stringify({ error: { message: 'Unauthorized' } }),
      });
    }
  });

  // POST /api/auth/register
  await page.route('**/api/auth/register', async (route) => {
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        message: 'Registration successful',
        user: mockNewUser,
      }),
    });
  });

  // POST /api/auth/login
  await page.route('**/api/auth/login', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        message: 'Login successful',
        user: mockOnboardedUser,
      }),
    });
  });

  // PUT /api/user/onboarding
  await page.route('**/api/user/onboarding', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        message: 'Onboarding completed successfully',
        user: mockOnboardedUser,
      }),
    });
  });

  // GET /api/user/profile — after onboarding re-fetch, return onboarded user
  // (second call after PUT /onboarding must return onboarded user)
  // Handled by the same route handler above using a counter

  // POST /api/auth/logout
  await page.route('**/api/auth/logout', async (route) => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify({ message: 'Logged out successfully' }),
    });
  });

  // POST /api/auth/google
  await page.route('**/api/auth/google', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        message: 'Authentication successful',
        user: mockNewUser,
      }),
    });
  });
}

// ─── Test Suite ───────────────────────────────────────────────────────────────

test.describe('Auth Flow — E2E', () => {
  // ── Scenario 1: Unauthenticated redirect ─────────────────────────────────
  test('Scenario 1 — unauthenticated visit to /dashboard redirects to /login', async ({
    page,
  }) => {
    await setupMocks(page, null); // no user = 401

    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByTestId('login-page')).toBeVisible();
  });

  // ── Scenario 2: New user registers, goes through onboarding → dashboard ───
  test('Scenario 2 — new user registers, completes onboarding, lands on dashboard', async ({
    page,
  }) => {
    // Start with no user; after register the profile mock will need to change.
    // We'll use a flag via route handler to simulate state change.
    let profileCallCount = 0;

    await page.route('**/api/user/profile', async (route) => {
      profileCallCount++;
      // First call (app init): not authenticated → goes to login
      // Second call (after onboarding submit): return onboarded user
      if (profileCallCount <= 1) {
        await route.fulfill({
          status: 401,
          body: JSON.stringify({ error: { message: 'Unauthorized' } }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ user: mockOnboardedUser }),
        });
      }
    });

    await page.route('**/api/auth/register', async (route) => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Registration successful',
          user: mockNewUser,
        }),
      });
    });

    await page.route('**/api/user/onboarding', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Onboarding completed successfully',
          user: mockOnboardedUser,
        }),
      });
    });

    await page.route('**/api/auth/logout', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ message: 'Logged out' }),
      });
    });

    // 1. Navigate to app → redirected to /login (unauthenticated)
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByTestId('login-page')).toBeVisible();

    // 2. Switch to register mode
    await page.getByTestId('toggle-mode-btn').click();
    await expect(page.getByTestId('name-input')).toBeVisible();

    // 3. Fill in register form
    await page.getByTestId('name-input').fill('Test User');
    await page.getByTestId('register-email-input').fill('test@example.com');
    await page.getByTestId('register-password-input').fill('password123');

    // 4. Submit → navigate to /onboarding (not onboarded)
    await page.getByTestId('register-btn').click();
    await expect(page).toHaveURL(/\/onboarding/, { timeout: 10_000 });
    await expect(page.getByTestId('onboarding-page')).toBeVisible();

    // 5. Step 1: Body stats — defaults already filled, just press Next
    await page.getByTestId('next-btn').click();

    // 6. Step 2: Activity level & goal — just press Next
    await expect(page.getByTestId('next-btn')).toBeVisible();
    await page.getByTestId('next-btn').click();

    // 7. Step 3: Review — submit
    await expect(page.getByTestId('submit-btn')).toBeVisible();
    await page.getByTestId('submit-btn').click();

    // 8. Should land on dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });
    await expect(page.getByTestId('dashboard-page')).toBeVisible();
  });

  // ── Scenario 3: Returning onboarded user logs in → dashboard ─────────────
  test('Scenario 3 — returning onboarded user logs in, lands directly on dashboard', async ({
    page,
  }) => {
    await setupMocks(page, null); // start unauthenticated

    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Login successful',
          user: mockOnboardedUser,
        }),
      });
    });

    // Navigate → /login
    await page.goto('/login');
    await expect(page.getByTestId('login-page')).toBeVisible();

    // Fill login form
    await page.getByTestId('login-email-input').fill('member@gymfuel.com');
    await page.getByTestId('login-password-input').fill('myPassword123');
    await page.getByTestId('login-btn').click();

    // Already onboarded → goes straight to dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });
    await expect(page.getByTestId('dashboard-page')).toBeVisible();
  });

  // ── Scenario 4: Logout clears session and redirects to /login ─────────────
  test('Scenario 4 — logout clears session and redirects to /login', async ({
    page,
  }) => {
    // Start as an authenticated, onboarded user
    await setupMocks(page, mockOnboardedUser);

    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });
    await expect(page.getByTestId('dashboard-page')).toBeVisible();

    // Override profile mock to return 401 AFTER logout
    await page.route('**/api/user/profile', async (route) => {
      await route.fulfill({
        status: 401,
        body: JSON.stringify({ error: { message: 'Unauthorized' } }),
      });
    });

    // Click logout
    await page.getByTestId('logout-btn').click();

    // Should redirect to /login
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
    await expect(page.getByTestId('login-page')).toBeVisible();
  });
});
