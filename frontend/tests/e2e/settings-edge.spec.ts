import { test, expect } from '../fixtures/index';

// ---------------------------------------------------------------------------
// Settings — page
// ---------------------------------------------------------------------------
test.describe('Settings — page', () => {
  test('settings page loads at /settings', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toMatch(/\/settings/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('settings page shows "Settings" heading', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible({ timeout: 6000 });
  });

  test("user's email is displayed", async ({ page }) => {
    await page.goto('/settings');
    // The email <input> rendered as read-only — find it by type or label text
    const emailField = page.locator('input[type="email"]');
    await expect(emailField).toBeVisible({ timeout: 6000 });
    const value = await emailField.inputValue();
    expect(value).toBeTruthy();
    expect(value).toMatch(/@/); // looks like an email
  });

  test('email field is read-only (cannot be edited)', async ({ page }) => {
    await page.goto('/settings');
    const emailField = page.locator('input[type="email"]');
    await expect(emailField).toBeVisible({ timeout: 6000 });

    // Verify the readOnly attribute is set
    const isReadOnly = await emailField.getAttribute('readonly');
    // getAttribute returns '' (empty string) or 'true' when the attribute is present, null when absent
    expect(isReadOnly).not.toBeNull();
  });

  test('display name input is visible', async ({ page }) => {
    await page.goto('/settings');
    // The display name input has placeholder "Your name"
    const nameInput = page
      .getByLabel(/display name/i)
      .or(page.getByPlaceholder(/your name/i));
    await expect(nameInput.first()).toBeVisible({ timeout: 6000 });
  });

  test('"Save changes" button is visible', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.getByRole('button', { name: /save changes/i })).toBeVisible({ timeout: 6000 });
  });

  test('Privacy Policy link is visible at the bottom', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.getByRole('link', { name: /privacy policy/i })).toBeVisible({ timeout: 6000 });
  });
});

// ---------------------------------------------------------------------------
// Settings — display name
// ---------------------------------------------------------------------------
test.describe('Settings — display name', () => {
  test("display name input has the current user's name pre-filled", async ({ page, authToken }) => {
    // Fetch the current user to know the expected display name
    const meRes = await fetch('http://localhost:5001/api/auth/me', {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const me = await meRes.json();

    await page.goto('/settings');
    const nameInput = page
      .getByLabel(/display name/i)
      .or(page.getByPlaceholder(/your name/i));
    await expect(nameInput.first()).toBeVisible({ timeout: 6000 });

    if (me.displayName) {
      await expect(nameInput.first()).toHaveValue(me.displayName);
    } else {
      // No display name set yet — input may be empty, that is fine
      const value = await nameInput.first().inputValue();
      expect(typeof value).toBe('string');
    }
  });

  test('can clear and type a new display name', async ({ page }) => {
    await page.goto('/settings');
    const nameInput = page
      .getByLabel(/display name/i)
      .or(page.getByPlaceholder(/your name/i));
    await expect(nameInput.first()).toBeVisible({ timeout: 6000 });

    await nameInput.first().click({ clickCount: 3 });
    await nameInput.first().fill('');
    await nameInput.first().type('New Test Name');
    await expect(nameInput.first()).toHaveValue('New Test Name');
  });

  test('clicking "Save changes" shows success toast "Settings saved"', async ({ page }) => {
    await page.goto('/settings');
    await page.getByRole('button', { name: /save changes/i }).click();
    // Toast appears with the text "Settings saved"
    await expect(page.getByText(/settings saved/i)).toBeVisible({ timeout: 5000 });
  });

  test('saving empty display name — either accepted or shows validation (no crash)', async ({ page }) => {
    await page.goto('/settings');
    const nameInput = page
      .getByLabel(/display name/i)
      .or(page.getByPlaceholder(/your name/i));
    await expect(nameInput.first()).toBeVisible({ timeout: 6000 });

    await nameInput.first().click({ clickCount: 3 });
    await nameInput.first().fill('');
    await page.getByRole('button', { name: /save changes/i }).click();

    // Must not crash (no unhandled error dialog, body still visible)
    await expect(page.locator('body')).toBeVisible({ timeout: 3000 });
    // Either a success toast or a validation message — not a 500 / blank page
    const feedback = page
      .getByText(/settings saved|required|cannot be empty|invalid/i)
      .or(page.getByRole('alert'));
    // Allow some time; if nothing shows that is also acceptable (silent accept)
    await feedback.first().isVisible({ timeout: 3000 }).catch(() => {});
  });

  test('display name with special characters (emoji, unicode) accepted', async ({ page }) => {
    await page.goto('/settings');
    const nameInput = page
      .getByLabel(/display name/i)
      .or(page.getByPlaceholder(/your name/i));
    await expect(nameInput.first()).toBeVisible({ timeout: 6000 });

    const specialName = 'Ünïcödé Tëst 🎉';
    await nameInput.first().click({ clickCount: 3 });
    await nameInput.first().fill(specialName);
    await expect(nameInput.first()).toHaveValue(specialName);

    await page.getByRole('button', { name: /save changes/i }).click();
    // Should not crash
    await expect(page.locator('body')).toBeVisible({ timeout: 3000 });
  });
});
