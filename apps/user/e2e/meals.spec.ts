import { test, expect, Page } from '@playwright/test';

// ─── Mock Data ─────────────────────────────────────────────────────────────────

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
    targetCalories: 2500,
    targetProtein: 150,
    targetCarbs: 300,
    targetFat: 80,
    targetWaterGlasses: 8,
  },
  streakCount: 7,
};

const mockChickenFood = {
  _id: 'food-chicken-001',
  name: 'Chicken Breast',
  brand: 'Generic',
  servingSize: 100,
  servingUnit: 'g',
  nutrition: {
    calories: 165,
    protein: 31,
    carbs: 0,
    fat: 3.6,
    fiber: 0,
  },
};

const mockBananaFood = {
  _id: 'food-banana-001',
  name: 'Banana',
  brand: null,
  servingSize: 100,
  servingUnit: 'g',
  nutrition: {
    calories: 89,
    protein: 1.1,
    carbs: 23,
    fat: 0.3,
    fiber: 2.6,
  },
};

/** Initial empty meal log (no meals logged today) */
const mockEmptyLog = {
  logId: 'log-today-001',
  date: new Date().toISOString().split('T')[0],
  meals: [],
  totals: {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    waterGlasses: 0,
  },
};

/** Meal log after logging chicken breast (165 kcal) */
const mockLogAfterChicken = {
  _id: 'log-today-001',
  logId: 'log-today-001',
  date: new Date().toISOString().split('T')[0],
  meals: [
    {
      foodId: 'food-chicken-001',
      foodName: 'Chicken Breast',
      mealType: 'lunch',
      portionGrams: 100,
      nutrition: { calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0 },
    },
  ],
  totals: {
    calories: 165,
    protein: 31,
    carbs: 0,
    fat: 3.6,
    fiber: 0,
    waterGlasses: 0,
  },
};

/** Meal log after deleting the chicken entry (empty again) */
const mockLogAfterDelete = {
  _id: 'log-today-001',
  logId: 'log-today-001',
  date: new Date().toISOString().split('T')[0],
  meals: [],
  totals: {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    waterGlasses: 0,
  },
};

// ─── Setup helpers ─────────────────────────────────────────────────────────────

/** Set up baseline API mocks shared by all meal tests */
async function setupMealPageMocks(page: Page) {
  // Auth: authenticated onboarded user
  await page.route('**/api/user/profile', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ user: mockOnboardedUser }),
    });
  });

  // GET /api/meals/log/today — returns empty log initially
  await page.route('**/api/meals/log/today', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockEmptyLog),
    });
  });

  // GET /api/food/search — returns results based on query
  await page.route('**/api/food/search**', async (route) => {
    const url = route.request().url();
    const q = new URL(url).searchParams.get('q') ?? '';
    const results = q.toLowerCase().includes('chicken')
      ? [mockChickenFood]
      : q.toLowerCase().includes('banana')
        ? [mockBananaFood]
        : [];
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        results,
        count: results.length,
        page: 1,
        limit: 20,
      }),
    });
  });
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

test.describe('Meal Logger Page (/meals) — E2E', () => {
  // ── Scenario 1: Meal page renders correctly with 4 sections ──────────────────
  test('Scenario 1 — /meals page renders all 4 meal sections and daily totals', async ({
    page,
  }) => {
    await setupMealPageMocks(page);

    await page.goto('/meals');
    await expect(page).toHaveURL(/\/meals/);
    await expect(page.getByTestId('meals-page')).toBeVisible();

    // Daily summary should be visible
    await expect(page.getByTestId('daily-summary')).toBeVisible();
    await expect(page.getByTestId('total-calories')).toHaveText('0');

    // All 4 meal sections must exist
    await expect(page.getByTestId('section-breakfast')).toBeVisible();
    await expect(page.getByTestId('section-lunch')).toBeVisible();
    await expect(page.getByTestId('section-dinner')).toBeVisible();
    await expect(page.getByTestId('section-snack')).toBeVisible();

    // Search input should be present
    await expect(page.getByTestId('food-search-input')).toBeVisible();
  });

  // ── Scenario 2: Unauthenticated user is redirected to login ──────────────────
  test('Scenario 2 — unauthenticated user visiting /meals is redirected to /login', async ({
    page,
  }) => {
    // Override profile to return 401
    await page.route('**/api/user/profile', async (route) => {
      await route.fulfill({
        status: 401,
        body: JSON.stringify({ error: { message: 'Unauthorized' } }),
      });
    });

    await page.goto('/meals');
    await expect(page).toHaveURL(/\/login/);
  });

  // ── Scenario 3: Debounced food search returns results ────────────────────────
  test('Scenario 3 — food search (debounced) shows results from API', async ({
    page,
  }) => {
    await setupMealPageMocks(page);

    await page.goto('/meals');
    await expect(page.getByTestId('meals-page')).toBeVisible();

    // Short queries (< 2 chars) should not trigger search
    await page.getByTestId('food-search-input').fill('c');
    await page.waitForTimeout(400); // past debounce
    await expect(page.getByTestId('search-results-list')).not.toBeVisible();

    // Type a valid query: "chicken"
    await page.getByTestId('food-search-input').fill('chicken');
    // Wait for debounce (300ms) + network
    await expect(page.getByTestId('search-results-list')).toBeVisible({
      timeout: 5_000,
    });

    // Chicken Breast result should appear
    await expect(
      page.getByTestId(`search-result-item-${mockChickenFood._id}`),
    ).toBeVisible();

    // Result should show food name
    await expect(
      page.getByTestId(`search-result-item-${mockChickenFood._id}`),
    ).toContainText('Chicken Breast');
  });

  // ── Scenario 4: Log food → appears in correct section, totals update ─────────
  test('Scenario 4 — log a food item, it appears in correct section with updated totals', async ({
    page,
  }) => {
    let logCallCount = 0;
    let todayLogCallCount = 0;

    // Set up all mocks explicitly (no setupMealPageMocks to avoid dual today-log route)
    await page.route('**/api/user/profile', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ user: mockOnboardedUser }),
      });
    });

    await page.route('**/api/food/search**', async (route) => {
      const url = route.request().url();
      const q = new URL(url).searchParams.get('q') ?? '';
      const results = q.toLowerCase().includes('chicken')
        ? [mockChickenFood]
        : [];
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          results,
          count: results.length,
          page: 1,
          limit: 20,
        }),
      });
    });

    // GET /api/meals/log/today: first call returns empty, subsequent return logged state
    await page.route('**/api/meals/log/today', async (route) => {
      todayLogCallCount++;
      const body = todayLogCallCount === 1 ? mockEmptyLog : mockLogAfterChicken;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(body),
      });
    });

    // POST /api/meals/log → return logged chicken state
    await page.route('**/api/meals/log', async (route) => {
      if (route.request().method() === 'POST') {
        logCallCount++;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockLogAfterChicken),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/meals');
    await expect(page.getByTestId('meals-page')).toBeVisible();

    // Totals should start at 0
    await expect(page.getByTestId('total-calories')).toHaveText('0');

    // Search for chicken
    await page.getByTestId('food-search-input').fill('chicken');
    await expect(page.getByTestId('search-results-list')).toBeVisible({
      timeout: 5_000,
    });

    // Click on Chicken Breast in results
    await page.getByTestId(`search-result-item-${mockChickenFood._id}`).click();

    // Log panel should appear with portion input and meal type select
    await expect(page.getByTestId('portion-input')).toBeVisible();
    await expect(page.getByTestId('meal-type-select')).toBeVisible();
    await expect(page.getByTestId('log-food-btn')).toBeVisible();

    // Set meal type to "lunch"
    await page.getByTestId('meal-type-select').selectOption('lunch');

    // Set portion to 100g (default)
    await page.getByTestId('portion-input').fill('100');

    // Click Log Food
    await page.getByTestId('log-food-btn').click();

    // Verify POST was called
    expect(logCallCount).toBe(1);

    // Lunch section should now contain "Chicken Breast"
    await expect(page.getByTestId('section-lunch')).toContainText(
      'Chicken Breast',
      {
        timeout: 5_000,
      },
    );

    // Daily calorie total should update to 165
    await expect(page.getByTestId('total-calories')).toHaveText('165', {
      timeout: 5_000,
    });

    // Log panel should be dismissed after logging
    await expect(page.getByTestId('log-food-btn')).not.toBeVisible({
      timeout: 3_000,
    });
  });

  // ── Scenario 5: Delete a logged meal entry ───────────────────────────────────
  test('Scenario 5 — delete a meal entry removes it from the section and updates totals', async ({
    page,
  }) => {
    // Start with chicken already logged
    await page.route('**/api/user/profile', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ user: mockOnboardedUser }),
      });
    });

    await page.route('**/api/food/search**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ results: [], count: 0, page: 1, limit: 20 }),
      });
    });

    // Return already-logged state on initial load
    await page.route('**/api/meals/log/today', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockLogAfterChicken),
      });
    });

    // DELETE /api/meals/log/entry → return empty log
    await page.route('**/api/meals/log/entry', async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockLogAfterDelete),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/meals');
    await expect(page.getByTestId('meals-page')).toBeVisible();

    // Chicken Breast should be in the lunch section
    await expect(page.getByTestId('section-lunch')).toContainText(
      'Chicken Breast',
      {
        timeout: 5_000,
      },
    );

    // Calorie total should be 165
    await expect(page.getByTestId('total-calories')).toHaveText('165');

    // Click the delete button for entry at index 0
    page.on('dialog', async (dialog) => {
      // Auto-accept the confirm() dialog
      await dialog.accept();
    });

    await page.getByTestId('delete-meal-btn-0').click();

    // After delete: calories should drop to 0
    await expect(page.getByTestId('total-calories')).toHaveText('0', {
      timeout: 5_000,
    });

    // Chicken Breast should no longer appear in lunch section
    await expect(page.getByTestId('section-lunch')).not.toContainText(
      'Chicken Breast',
      {
        timeout: 5_000,
      },
    );
  });

  // ── Scenario 6: Search "no results" message displayed ────────────────────────
  test('Scenario 6 — searching with no results shows empty state message', async ({
    page,
  }) => {
    await setupMealPageMocks(page);

    await page.goto('/meals');

    // Search for something with no results
    await page.getByTestId('food-search-input').fill('xyz_not_found_food');
    // Wait for debounce
    await page.waitForTimeout(400);

    // No-results text should appear
    await expect(
      page.getByText('No food items found. Try a different query.'),
    ).toBeVisible({ timeout: 5_000 });
  });

  // ── Scenario 7: Navigate back to dashboard ───────────────────────────────────
  test('Scenario 7 — back button navigates to /dashboard', async ({ page }) => {
    await setupMealPageMocks(page);

    // Mock dashboard meals log
    await page.route('**/api/meals/log/today', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockEmptyLog),
      });
    });

    await page.goto('/meals');
    await expect(page.getByTestId('meals-page')).toBeVisible();

    // Click back button
    await page.getByRole('button', { name: /Dashboard/i }).click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });
    await expect(page.getByTestId('dashboard-page')).toBeVisible();
  });
});
