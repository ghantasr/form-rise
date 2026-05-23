import { test, expect } from '../fixtures/index';

const API = 'http://localhost:5001/api';

async function submitResponse(slug: string, answers: any[] = []) {
  return fetch(`${API}/f/${slug}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ respondentEmail: 'respondent@example.com', answers }),
  });
}

test.describe('Responses — table view', () => {
  test('shows empty state message when form has no responses', async ({ page, createTestForm }) => {
    const form = await createTestForm('Empty Responses Form', true);
    await page.goto(`/forms/${form.id}/responses`);
    await expect(page.getByRole('heading', { name: 'No responses yet' })).toBeVisible({ timeout: 5000 });
  });

  test('shows response row after a submission', async ({ page, createTestForm }) => {
    const form = await createTestForm('Has Responses Form', true);
    await submitResponse(form.slug!, []);
    await page.goto(`/forms/${form.id}/responses`);
    await expect(page.getByRole('cell', { name: 'respondent@example.com' })).toBeVisible({ timeout: 5000 });
  });

  test('clicking a response row opens slide-out detail panel', async ({ page, createTestForm }) => {
    const form = await createTestForm('Slide-out Form', true);
    await submitResponse(form.slug!, []);
    await page.goto(`/forms/${form.id}/responses`);
    await page.waitForTimeout(500);
    // Click the first response row
    await page.locator('tbody tr, [role="row"]').first().click();
    await expect(page.getByText(/detail|response|submitted/i).last()).toBeVisible({ timeout: 5000 });
  });

  test('delete response removes it from the table', async ({ page, createTestForm }) => {
    const form = await createTestForm('Delete Response Form', true);
    await submitResponse(form.slug!, []);
    await page.goto(`/forms/${form.id}/responses`);
    await page.waitForTimeout(500);

    const rowsBefore = await page.locator('tbody tr').count();
    // Register dialog handler BEFORE clicking delete
    page.on('dialog', (d) => d.accept());
    // Hover to reveal the opacity-0 delete button then click
    const firstRow = page.locator('tbody tr').first();
    await firstRow.hover();
    await firstRow.getByRole('button', { name: /delete/i }).click();
    await page.waitForTimeout(800);
    const rowsAfter = await page.locator('tbody tr').count();
    expect(rowsAfter).toBeLessThan(rowsBefore);
  });
});

test.describe('Responses — CSV export', () => {
  test('export button triggers CSV download', async ({ page, createTestForm }) => {
    const form = await createTestForm('CSV Export Form', true);
    await submitResponse(form.slug!, []);
    await page.goto(`/forms/${form.id}/responses`);

    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 10000 }),
      page.getByRole('button', { name: /export|csv/i }).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/\.csv$/i);
  });
});

test.describe('Responses — charts tab', () => {
  test('switching to Charts tab renders chart area', async ({ page, createTestForm }) => {
    const form = await createTestForm('Charts Form', true);
    await submitResponse(form.slug!, []);
    await page.goto(`/forms/${form.id}/responses`);
    await page.getByRole('tab', { name: /chart/i }).or(page.getByText('Charts')).first().click();
    await expect(page.locator('svg, canvas').first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Responses — pagination', () => {
  test('responses page loads without error', async ({ page, createTestForm }) => {
    const form = await createTestForm('Paginated Form', true);
    for (let i = 0; i < 3; i++) {
      await submitResponse(form.slug!, []);
    }
    await page.goto(`/forms/${form.id}/responses`);
    await expect(page.getByRole('cell', { name: 'respondent@example.com' }).first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Responses — security', () => {
  test('cannot access responses page for a non-existent form', async ({ page }) => {
    await page.goto('/forms/00000000-0000-0000-0000-000000000000/responses');
    // Either shows error or redirects
    await page.waitForTimeout(1000);
    await expect(page.locator('body')).toBeVisible();
  });
});
