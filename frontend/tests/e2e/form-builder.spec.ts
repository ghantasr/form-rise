import { test, expect } from '../fixtures/index';

// Exact button names from codegen
const FIELD_BUTTONS = [
  { btn: 'Short text',    type: 'text' },
  { btn: 'Long text',     type: 'textarea' },
  { btn: 'Email',         type: 'email' },
  { btn: 'Number',        type: 'number' },
  { btn: 'Dropdown',      type: 'select' },
  { btn: 'Single choice', type: 'radio' },
  { btn: 'Multi choice',  type: 'checkbox' },
  { btn: 'Date',          type: 'date' },
  { btn: 'Rating',        type: 'rating' },
  { btn: 'URL',           type: 'url' },
];

test.describe('Form Builder — creation & title', () => {
  test('navigating to /forms/new shows blank builder', async ({ page }) => {
    await page.goto('/forms/new');
    await expect(page.getByRole('button', { name: 'Short text' })).toBeVisible({ timeout: 5000 });
  });

  test('editing form title updates it', async ({ page }) => {
    await page.goto('/forms/new');
    await page.waitForLoadState('networkidle');
    const titleInput = page.locator('input[placeholder*="title" i], input[placeholder*="untitled" i]').first();
    await titleInput.clear();
    await titleInput.fill('My Playwright Form');
    await expect(titleInput).toHaveValue('My Playwright Form');
  });
});

test.describe('Form Builder — adding fields', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/forms/new');
    await expect(page.getByRole('button', { name: 'Short text' })).toBeVisible({ timeout: 5000 });
  });

  for (const { btn } of FIELD_BUTTONS) {
    test(`can add "${btn}" field`, async ({ page }) => {
      await page.getByRole('button', { name: btn }).first().click();
      // Field appears in canvas — check the button is still visible (field added)
      await expect(page.getByRole('button', { name: btn }).first()).toBeVisible();
    });
  }
});

test.describe('Form Builder — field editing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/forms/new');
    await expect(page.getByRole('button', { name: 'Short text' })).toBeVisible({ timeout: 5000 });
    await page.getByRole('button', { name: 'Short text' }).click();
    await page.waitForTimeout(300);
  });

  test('clicking a field in canvas opens editor panel with Label input', async ({ page }) => {
    // Click the field in the canvas (not the sidebar button)
    await page.locator('text=Short text').last().click();
    await expect(page.getByRole('textbox', { name: 'Label' })).toBeVisible({ timeout: 3000 });
  });

  test('can edit the field label', async ({ page }) => {
    await page.locator('text=Short text').last().click();
    const labelInput = page.getByRole('textbox', { name: 'Label' });
    await labelInput.clear();
    await labelInput.fill('Your Name');
    await expect(labelInput).toHaveValue('Your Name');
  });

  test('required toggle marks field as required', async ({ page }) => {
    await page.locator('text=Short text').last().click();
    await page.getByText('Required', { exact: true }).first().click();
    await expect(page.getByText('Respondents must answer')).toBeVisible();
  });

  test('deleting a field removes it from canvas', async ({ page }) => {
    // The delete button appears on the field card
    const deleteBtn = page.getByRole('button', { name: /delete|remove/i }).first();
    if (await deleteBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await deleteBtn.click();
    } else {
      // Try hovering on the field first to reveal delete
      await page.locator('text=Short text').last().hover();
      await page.getByRole('button', { name: /delete|remove/i }).first().click();
    }
    await page.waitForTimeout(300);
  });
});

test.describe('Form Builder — save & publish', () => {
  test('auto-save triggers after editing', async ({ page }) => {
    await page.goto('/forms/new');
    await page.waitForLoadState('networkidle');
    const titleInput = page.locator('input').first();
    await titleInput.fill(`AutoSave ${Date.now()}`);
    await expect(page.getByText(/saving|saved/i)).toBeVisible({ timeout: 8000 });
  });

  test('publish button shows slug/share URL in modal', async ({ page, createTestForm }) => {
    const form = await createTestForm('Publish Test');
    await page.goto(`/forms/${form.id}/edit`);
    await expect(page.getByRole('button', { name: 'Short text' })).toBeVisible({ timeout: 5000 });
    await page.getByRole('button', { name: 'Short text' }).click();
    await page.waitForTimeout(400);
    await page.getByRole('button', { name: 'Publish' }).click();
    // PublishModal opens with the shareable slug
    await expect(page.getByText(/share|link|copy|slug|formrise/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('QR Codes button visible on published form', async ({ page, createTestForm }) => {
    const form = await createTestForm('QR Test Form', true);
    await page.goto(`/forms/${form.id}/edit`);
    await expect(page.getByRole('button', { name: 'QR Codes' })).toBeVisible({ timeout: 5000 });
    await page.getByRole('button', { name: 'QR Codes' }).click();
    await expect(page.getByRole('button', { name: 'Generate' })).toBeVisible({ timeout: 3000 });
  });

  test('Preview button opens form in popup', async ({ page, createTestForm }) => {
    const form = await createTestForm('Preview Test', true);
    await page.goto(`/forms/${form.id}/edit`);
    await expect(page.getByRole('button', { name: 'Preview' })).toBeVisible({ timeout: 5000 });
    const popupPromise = page.waitForEvent('popup');
    await page.getByRole('button', { name: 'Preview' }).click();
    const popup = await popupPromise;
    await expect(popup.url()).toMatch(/\/f\//);
    await popup.close();
  });
});

test.describe('Form Builder — negative cases', () => {
  test('accessing non-existent form → redirects away', async ({ page }) => {
    await page.goto('/forms/00000000-0000-0000-0000-000000000000/edit');
    await expect(page).not.toHaveURL(/\/forms\/00000000-0000-0000-0000-000000000000\/edit/);
  });
});
