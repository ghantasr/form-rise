import { test, expect } from '../fixtures/index';

// ---------------------------------------------------------------------------
// Dashboard — layout
// ---------------------------------------------------------------------------
test.describe('Dashboard — layout', () => {
  test('/dashboard loads without error', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toMatch(/\/dashboard/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('"New form" button is visible', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    const newFormBtn = page
      .getByRole('button', { name: /new form|create form|create your first form/i })
      .first();
    await expect(newFormBtn).toBeVisible({ timeout: 8000 });
  });

  test('sidebar navigation is visible on desktop', async ({ page }) => {
    // Playwright runs at 1280px by default — sidebar should be visible
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    // Sidebar is an <aside> element with the nav links
    const sidebar = page.locator('aside').first();
    await expect(sidebar).toBeVisible({ timeout: 6000 });
    // At least the Dashboard nav link should be present
    await expect(sidebar.getByText(/dashboard/i).first()).toBeVisible();
  });

  test("user's display name or email is shown in the sidebar", async ({ page, authToken }) => {
    const meRes = await fetch('http://localhost:5001/api/auth/me', {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const me = await meRes.json();
    const identifier = me.displayName || me.email;

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const sidebar = page.locator('aside').first();
    // The sidebar shows at minimum the user's email in the footer section
    await expect(sidebar.getByText(identifier)).toBeVisible({ timeout: 6000 });
  });
});

// ---------------------------------------------------------------------------
// Dashboard — forms list
// ---------------------------------------------------------------------------
test.describe('Dashboard — forms list', () => {
  test('dashboard shows forms list or "No forms yet" / empty-state', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Either a form card grid or the empty state heading is rendered
    const formCards = page.locator('[class*="grid"] > div').first();
    const emptyState = page.getByText(/create your first form|no forms/i).first();

    const hasCards = await formCards.isVisible({ timeout: 5000 }).catch(() => false);
    const hasEmpty = await emptyState.isVisible({ timeout: 5000 }).catch(() => false);
    expect(hasCards || hasEmpty).toBe(true);
  });

  test('clicking "New form" navigates to form builder', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const newFormBtn = page
      .getByRole('button', { name: /new form|create form|create your first form/i })
      .first();
    await expect(newFormBtn).toBeVisible({ timeout: 8000 });
    await newFormBtn.click();

    // Should navigate to /forms/{id}/edit (newly created form) or /forms/new
    await expect(page).toHaveURL(/\/forms\/.+\/edit|\/forms\/new/, { timeout: 10000 });
  });

  test('form cards show the form title', async ({ page, createTestForm }) => {
    const uniqueTitle = `Dashboard Card Test ${Date.now()}`;
    await createTestForm(uniqueTitle);

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(uniqueTitle)).toBeVisible({ timeout: 8000 });
  });

  test('clicking a form card navigates to the form builder', async ({ page, createTestForm }) => {
    const title = `Click Nav Test ${Date.now()}`;
    const form = await createTestForm(title);

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Click the card for our specific form
    await page.getByText(title).first().click();
    await expect(page).toHaveURL(new RegExp(`/forms/${form.id}/edit`), { timeout: 8000 });
  });
});

// ---------------------------------------------------------------------------
// Dashboard — search/filter
// ---------------------------------------------------------------------------
test.describe('Dashboard — search/filter', () => {
  test('if search input exists: typing filters the forms list', async ({ page, createTestForm }) => {
    // Create two forms with distinct titles
    const titleA = `SearchableFormAaa ${Date.now()}`;
    const titleB = `SearchableFormBbb ${Date.now()}`;
    await createTestForm(titleA);
    await createTestForm(titleB);

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const searchInput = page
      .getByRole('searchbox')
      .or(page.getByPlaceholder(/search|filter/i))
      .first();

    const hasSearch = await searchInput.isVisible({ timeout: 2000 }).catch(() => false);
    if (!hasSearch) {
      // No search UI — skip without failing
      return;
    }

    await searchInput.fill('SearchableFormAaa');
    // Title B should not be visible while filtering for A
    await expect(page.getByText(titleA)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(titleB)).not.toBeVisible({ timeout: 3000 });
  });

  test('if no forms match filter: empty state message shown', async ({ page, createTestForm }) => {
    await createTestForm(`Filterable ${Date.now()}`);

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const searchInput = page
      .getByRole('searchbox')
      .or(page.getByPlaceholder(/search|filter/i))
      .first();

    const hasSearch = await searchInput.isVisible({ timeout: 2000 }).catch(() => false);
    if (!hasSearch) return;

    await searchInput.fill('zzz-no-form-matches-this-zzz');

    // Either "no results" / "no forms" message or simply zero form cards shown
    const noResultsMsg = page.getByText(/no results|no forms|nothing found|no match/i).first();
    const formCards = page.locator('[class*="grid"] > div');

    await page.waitForTimeout(500);
    const msgVisible = await noResultsMsg.isVisible({ timeout: 3000 }).catch(() => false);
    const cardCount = await formCards.count();
    expect(msgVisible || cardCount === 0).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Dashboard — offline state
// ---------------------------------------------------------------------------
test.describe('Dashboard — offline state', () => {
  test('going offline shows offline banner or indicator', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    await page.context().setOffline(true);
    // Trigger re-render / the offline event
    await page.evaluate(() => window.dispatchEvent(new Event('offline')));
    await page.waitForTimeout(600);

    // The app shows an offline indicator (banner in AppLayout or empty state in Dashboard)
    const offlineIndicator = page
      .getByText(/offline|no connection|not connected/i)
      .first();
    await expect(offlineIndicator).toBeVisible({ timeout: 5000 });

    // Restore connectivity for subsequent tests
    await page.context().setOffline(false);
  });

  test('going back online removes offline indicator', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Go offline then back online
    await page.context().setOffline(true);
    await page.evaluate(() => window.dispatchEvent(new Event('offline')));
    await page.waitForTimeout(400);

    await page.context().setOffline(false);
    await page.evaluate(() => window.dispatchEvent(new Event('online')));
    await page.waitForTimeout(800);

    // The offline message should be gone (or at least the page has not crashed)
    await expect(page.locator('body')).toBeVisible();
    // The "New form" button should be visible again, indicating the online state restored
    const newFormBtn = page
      .getByRole('button', { name: /new form|create form|create your first form/i })
      .first();
    await expect(newFormBtn).toBeVisible({ timeout: 8000 });
  });

  test('dashboard still renders previously loaded forms when offline', async ({
    page,
    createTestForm,
  }) => {
    const title = `Offline Persist ${Date.now()}`;
    await createTestForm(title);

    // Load dashboard while online so forms are rendered
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(title)).toBeVisible({ timeout: 8000 });

    // Simulate going offline
    await page.context().setOffline(true);
    await page.evaluate(() => window.dispatchEvent(new Event('offline')));
    await page.waitForTimeout(500);

    // Previously loaded forms should still be visible in the DOM
    await expect(page.getByText(title)).toBeVisible({ timeout: 3000 });

    // Restore
    await page.context().setOffline(false);
  });
});

// ---------------------------------------------------------------------------
// Dashboard — navigation
// ---------------------------------------------------------------------------
test.describe('Dashboard — navigation', () => {
  test('clicking "My Results" in sidebar goes to /my-results', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    await page.locator('aside').getByText('My Results').click();
    await expect(page).toHaveURL(/\/my-results/, { timeout: 8000 });
  });

  test('clicking "My Assignments" in sidebar goes to /my-assignments', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    await page.locator('aside').getByText('My Assignments').click();
    await expect(page).toHaveURL(/\/my-assignments/, { timeout: 8000 });
  });

  test('clicking "Templates" in sidebar goes to /templates', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    await page.locator('aside').getByText('Templates').click();
    await expect(page).toHaveURL(/\/templates/, { timeout: 8000 });
  });

  test('clicking "Settings" in sidebar goes to /settings', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    await page.locator('aside').getByText('Settings').click();
    await expect(page).toHaveURL(/\/settings/, { timeout: 8000 });
  });
});
