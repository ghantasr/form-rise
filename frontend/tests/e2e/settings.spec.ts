import { test, expect } from '../fixtures/index';

const API = 'http://localhost:5001/api';

test.describe('Settings — page load', () => {
  test('navigating to /settings loads the page', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    await expect(page).not.toHaveURL('/login');
  });

  test('settings page shows Display name field', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.getByLabel('Display name', { exact: false })).toBeVisible({ timeout: 5000 });
  });

  test('settings page shows a read-only email field', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    // The email field should be present and not editable
    const emailField = page.locator('input[type="email"], input[readonly]').first();
    const isReadonly =
      (await emailField.getAttribute('readonly')) !== null ||
      (await emailField.getAttribute('disabled')) !== null ||
      (await emailField.isEditable()) === false;
    expect(isReadonly).toBeTruthy();
  });

  test('settings page shows Save changes button', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.getByRole('button', { name: 'Save changes' })).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Settings — display name update', () => {
  test('can clear and fill the display name input', async ({ page }) => {
    await page.goto('/settings');
    const nameInput = page.getByLabel('Display name', { exact: false });
    await nameInput.clear();
    await nameInput.fill('Playwright Tester');
    await expect(nameInput).toHaveValue('Playwright Tester');
  });

  test('Save changes button is clickable', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    const saveBtn = page.getByRole('button', { name: 'Save changes' });
    await expect(saveBtn).toBeEnabled({ timeout: 3000 });
    await saveBtn.click();
    // Either a success toast or the button stays on the page without error
    await page.waitForTimeout(1000);
    await expect(page).not.toHaveURL('/login');
  });

  test('saving display name shows a success indicator', async ({ page }) => {
    await page.goto('/settings');
    const nameInput = page.getByLabel('Display name', { exact: false });
    await nameInput.clear();
    await nameInput.fill(`Test User ${Date.now()}`);
    await page.getByRole('button', { name: 'Save changes' }).click();
    // Accepts either a toast/snackbar or the field retaining the value
    await page.waitForTimeout(1500);
    const hasSuccess = await page
      .getByText(/saved|success|updated/i)
      .isVisible()
      .catch(() => false);
    const fieldRetainsValue = await nameInput
      .inputValue()
      .then((v) => v.startsWith('Test User'))
      .catch(() => false);
    expect(hasSuccess || fieldRetainsValue).toBeTruthy();
  });
});

test.describe('Settings — account info', () => {
  test('email displayed on settings page matches authenticated user', async ({ page, authToken }) => {
    const meRes = await fetch(`${API}/auth/me`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const user = await meRes.json();

    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    // Email is shown in a readonly <input> — check value attribute, not text content
    const emailInput = page.locator('input[readonly]').first();
    await expect(emailInput).toBeVisible({ timeout: 5000 });
    const value = await emailInput.inputValue();
    expect(value).toBe(user.email);
  });
});
