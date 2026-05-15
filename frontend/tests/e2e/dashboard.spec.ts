import { test, expect } from '../fixtures/index';

test.describe('Dashboard', () => {
  test('loads dashboard and shows My Forms heading', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: 'My Forms' })).toBeVisible({ timeout: 5000 });
  });

  test('shows form card after creating a form', async ({ page, createTestForm }) => {
    await createTestForm('Dashboard Visible Form');
    await page.goto('/dashboard');
    await expect(page.getByText('Dashboard Visible Form')).toBeVisible({ timeout: 5000 });
  });

  test('shows draft status badge for unpublished form', async ({ page, createTestForm }) => {
    await createTestForm('Draft Badge Form');
    await page.goto('/dashboard');
    await expect(page.getByText('draft').first()).toBeVisible({ timeout: 5000 });
  });

  test('shows active status badge for published form', async ({ page, createTestForm }) => {
    await createTestForm('Active Badge Form', true);
    await page.goto('/dashboard');
    await expect(page.getByText('active').first()).toBeVisible({ timeout: 5000 });
  });

  test('clicking New Form navigates to /forms/new', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    // The create button in header (Plus icon button) or empty state
    const newFormBtn = page.getByRole('button').filter({ has: page.locator('svg') }).first();
    await page.getByRole('button', { name: /new form|create/i }).first().click().catch(async () => {
      // Fallback: click the Plus button in the header
      await newFormBtn.click();
    });
    await expect(page).toHaveURL(/\/forms\/.+\/edit|\/forms\/new/);
  });

  test('delete form shows confirm dialog and removes form', async ({ page, createTestForm }) => {
    await createTestForm('Form To Delete');
    await page.goto('/dashboard');
    await expect(page.getByText('Form To Delete')).toBeVisible({ timeout: 5000 });

    // Hover over the card to reveal the delete button (opacity-0 → group-hover:opacity-100)
    const card = page.locator('div').filter({ hasText: 'Form To Delete' }).last();
    page.on('dialog', (dialog) => dialog.accept());
    await card.hover();
    await card.getByRole('button').first().click(); // Trash icon button (first button in card)
    await page.waitForTimeout(1000);
    await expect(page.getByText('Form To Delete')).not.toBeVisible({ timeout: 5000 });
  });

  test('"View responses" navigates to responses page', async ({ page, createTestForm }) => {
    const form = await createTestForm('Responses Nav Form', true);
    await page.goto('/dashboard');
    await expect(page.getByText('Responses Nav Form')).toBeVisible({ timeout: 5000 });

    const card = page.locator('div').filter({ hasText: 'Responses Nav Form' }).last();
    await card.getByText('View responses').click();
    await expect(page).toHaveURL(new RegExp(`/forms/${form.id}/responses`), { timeout: 5000 });
  });

  test('sidebar links navigate correctly', async ({ page }) => {
    await page.goto('/dashboard');
    await page.getByRole('link', { name: 'Templates' }).click();
    await expect(page).toHaveURL(/\/templates/);
    await page.getByRole('link', { name: 'Settings' }).click();
    await expect(page).toHaveURL(/\/settings/);
    await page.getByRole('link', { name: 'Dashboard' }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
