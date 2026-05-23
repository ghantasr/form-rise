import { test, expect } from '../fixtures/index';

// ---------------------------------------------------------------------------
// Privacy Policy page — public page tests
// These run in the authenticated project (fixture provides a mocked page)
// but the /privacy route itself requires no auth.
// ---------------------------------------------------------------------------

test.describe('Privacy Policy page', () => {
  test('GET /privacy loads the page', async ({ page }) => {
    await page.goto('/privacy');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: /privacy policy/i })).toBeVisible({ timeout: 5000 });
  });

  test('page shows Effective date', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page.getByRole('heading', { name: /privacy policy/i })).toBeVisible({ timeout: 8000 });
    await expect(page.getByText(/effective date/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('page has Data we collect section', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page.getByRole('heading', { name: /privacy policy/i })).toBeVisible({ timeout: 8000 });
    // Section heading: "1. Data we collect"
    await expect(page.getByText(/data we collect/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('page has Cookies section', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page.getByRole('heading', { name: /privacy policy/i })).toBeVisible({ timeout: 8000 });
    // Section heading: "2. Cookies and local storage"
    await expect(page.getByText(/cookies and local storage/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('page has GDPR rights section', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page.getByRole('heading', { name: /privacy policy/i })).toBeVisible({ timeout: 8000 });
    // Section heading: "6. Your rights (GDPR)"
    await expect(page.getByText(/your rights/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('page has contact email link', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page.getByRole('heading', { name: /privacy policy/i })).toBeVisible({ timeout: 8000 });
    await expect(page.locator('a[href^="mailto:"]').first()).toBeVisible({ timeout: 5000 });
  });

  test('Sign in link navigates to /login', async ({ page }) => {
    await page.goto('/privacy');
    await page.waitForLoadState('networkidle');
    const signInLink = page
      .getByRole('link', { name: /sign in/i })
      .or(page.getByRole('button', { name: /sign in/i }))
      .first();
    await signInLink.click();
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });

  test('formrise logo link goes to home', async ({ page }) => {
    await page.goto('/privacy');
    await page.waitForLoadState('networkidle');
    // Click the logo / brand link in the header
    const logoLink = page
      .getByRole('link', { name: /formrise|home/i })
      .or(page.locator('header a').first())
      .first();
    await logoLink.click();
    await page.waitForLoadState('networkidle');
    // Should land on the root or dashboard, not stay on /privacy
    const url = page.url();
    expect(url).toMatch(/\/$|\/dashboard|\/forms/);
  });
});
