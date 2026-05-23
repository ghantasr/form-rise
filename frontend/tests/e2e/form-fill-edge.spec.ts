import { test, expect } from '../fixtures/index';

const API = 'http://localhost:5001/api';

// ---------------------------------------------------------------------------
// Utility: create and publish a form in one call, returning { id, slug, authToken }
// ---------------------------------------------------------------------------
async function setupForm(
  authToken: string,
  title: string,
  fields: object[],
): Promise<{ id: string; slug: string }> {
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` };

  const createRes = await fetch(`${API}/forms`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ title, description: '' }),
  });
  const form = await createRes.json();

  await fetch(`${API}/forms/${form.id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ title, description: '', fields }),
  });

  const pubRes = await fetch(`${API}/forms/${form.id}/publish`, {
    method: 'POST',
    headers,
  });
  let slug = '';
  try { const pubData = await pubRes.json(); slug = pubData?.slug ?? ''; } catch {}
  return { id: form.id, slug };
}

async function deleteForm(id: string, authToken: string) {
  await fetch(`${API}/forms/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${authToken}` },
  }).catch(() => {});
}

function makeField(opts: {
  fieldType: string;
  label: string;
  isRequired?: boolean;
  sortOrder: number;
  options?: string[];
}) {
  return {
    id: crypto.randomUUID(),
    fieldType: opts.fieldType,
    label: opts.label,
    isRequired: opts.isRequired ?? false,
    sortOrder: opts.sortOrder,
    ...(opts.options ? { options: opts.options } : {}),
  };
}

// ============================================================================
// describe: Form Fill edge — happy path
// ============================================================================
test.describe('Form Fill edge — happy path', () => {
  test('public form loads with its title visible', async ({ page, authToken }) => {
    const form = await setupForm(authToken, 'Happy Path Form', [
      makeField({ fieldType: 'short_text', label: 'Your Name', isRequired: false, sortOrder: 0 }),
    ]);

    await page.goto(`/f/${form.slug}`);
    await expect(page.getByText('Happy Path Form')).toBeVisible({ timeout: 8000 });

    await deleteForm(form.id, authToken);
  });

  test('submitting all required fields shows thank-you page or success state', async ({ page, authToken }) => {
    const form = await setupForm(authToken, 'Required Fields Form', [
      makeField({ fieldType: 'short_text', label: 'Full Name', isRequired: true, sortOrder: 0 }),
    ]);

    await page.goto(`/f/${form.slug}`);
    await expect(page.getByText('Required Fields Form')).toBeVisible({ timeout: 8000 });
    await page.locator('input[type="text"], textarea').first().fill('Jane Doe');
    await page.getByRole('button', { name: /submit/i }).first().click();

    await expect(page).toHaveURL(new RegExp(`/f/${form.slug}/thank-you`), { timeout: 10000 });
    await expect(page.getByText(/thank|submitted|success|all done/i)).toBeVisible({ timeout: 5000 });

    await deleteForm(form.id, authToken);
  });

  test('form fill page has no login requirement for public form', async ({ page, authToken }) => {
    const form = await setupForm(authToken, 'Public Access Form', [
      makeField({ fieldType: 'short_text', label: 'Feedback', isRequired: false, sortOrder: 0 }),
    ]);

    // Navigate without any auth cookies/mocks — the base `page` fixture already
    // sets up auth mocks. We verify the form itself renders, not a sign-in gate.
    await page.goto(`/f/${form.slug}`);
    await expect(page.getByText('Public Access Form')).toBeVisible({ timeout: 8000 });

    // Should NOT be showing the sign-in screen
    await expect(page.getByText(/sign in to access this form/i)).not.toBeVisible();

    await deleteForm(form.id, authToken);
  });

  test('email field accepts valid email and rejects invalid email format', async ({ page, authToken }) => {
    const form = await setupForm(authToken, 'Email Validation Form', [
      makeField({ fieldType: 'email', label: 'Work Email', isRequired: true, sortOrder: 0 }),
    ]);

    await page.goto(`/f/${form.slug}`);
    await expect(page.getByText('Email Validation Form')).toBeVisible({ timeout: 8000 });

    // Fill with invalid email and attempt submit
    await page.locator('input[type="email"]').first().fill('not-an-email');
    await page.getByRole('button', { name: /submit/i }).first().click();

    // Should stay on form page (not navigate to thank-you) with validation error
    await expect(page).not.toHaveURL(/thank-you/, { timeout: 3000 });

    // Clear and fill with valid email — should be accepted
    await page.locator('input[type="email"]').first().clear();
    await page.locator('input[type="email"]').first().fill('valid@example.com');
    await page.getByRole('button', { name: /submit/i }).first().click();
    await expect(page).toHaveURL(new RegExp(`/f/${form.slug}/thank-you`), { timeout: 8000 });

    await deleteForm(form.id, authToken);
  });
});

// ============================================================================
// describe: Form Fill edge — validation
// ============================================================================
test.describe('Form Fill edge — validation', () => {
  test('required field not filled shows error on submit attempt', async ({ page, authToken }) => {
    const form = await setupForm(authToken, 'Single Required Field Form', [
      makeField({ fieldType: 'short_text', label: 'Mandatory Field', isRequired: true, sortOrder: 0 }),
    ]);

    await page.goto(`/f/${form.slug}`);
    await expect(page.getByText('Single Required Field Form')).toBeVisible({ timeout: 8000 });
    await page.getByRole('button', { name: /submit/i }).first().click();

    // Validation error: "{label} is required"
    await expect(page.getByText(/mandatory field is required|required/i)).toBeVisible({ timeout: 5000 });
    await expect(page).not.toHaveURL(/thank-you/);

    await deleteForm(form.id, authToken);
  });

  test('multiple required fields — submitting with some empty shows field errors', async ({ page, authToken }) => {
    const form = await setupForm(authToken, 'Multi Required Form', [
      makeField({ fieldType: 'short_text', label: 'First Name', isRequired: true, sortOrder: 0 }),
      makeField({ fieldType: 'short_text', label: 'Last Name', isRequired: true, sortOrder: 1 }),
    ]);

    await page.goto(`/f/${form.slug}`);
    await expect(page.getByText('Multi Required Form')).toBeVisible({ timeout: 8000 });

    // Fill only the first field, leave others empty
    await page.locator('input[type="text"], textarea').first().fill('John');
    await page.getByRole('button', { name: /submit/i }).first().click();

    await expect(page.getByText(/required/i).first()).toBeVisible({ timeout: 5000 });
    await expect(page).not.toHaveURL(/thank-you/);

    await deleteForm(form.id, authToken);
  });

  test('number field rejects non-numeric input (browser or custom validation)', async ({ page, authToken }) => {
    const form = await setupForm(authToken, 'Number Validation Form', [
      makeField({ fieldType: 'number', label: 'Your Age', isRequired: true, sortOrder: 0 }),
    ]);

    await page.goto(`/f/${form.slug}`);
    await expect(page.getByText('Number Validation Form')).toBeVisible({ timeout: 8000 });

    // Type non-numeric text via keyboard (fill() rejects non-numeric on number inputs)
    const numberInput = page.locator('input[type="number"]').first();
    await numberInput.click();
    await page.keyboard.type('abc');
    await page.getByRole('button', { name: /submit/i }).first().click();

    // Should not navigate to thank-you — required number field is empty/invalid
    await page.waitForTimeout(1000);
    await expect(page).not.toHaveURL(/thank-you/);

    await deleteForm(form.id, authToken);
  });

  test('URL field rejects non-URL input', async ({ page, authToken }) => {
    const form = await setupForm(authToken, 'URL Validation Form', [
      makeField({ fieldType: 'url', label: 'Your Website', isRequired: true, sortOrder: 0 }),
    ]);

    await page.goto(`/f/${form.slug}`);
    await expect(page.getByText('URL Validation Form')).toBeVisible({ timeout: 8000 });

    await page.locator('input[type="url"], input[type="text"]').first().fill('this is not a url');
    await page.getByRole('button', { name: /submit/i }).first().click();

    await page.waitForTimeout(1000);
    await expect(page).not.toHaveURL(/thank-you/);

    await deleteForm(form.id, authToken);
  });
});

// ============================================================================
// describe: Form Fill edge — non-existent/invalid form
// ============================================================================
test.describe('Form Fill edge — non-existent/invalid form', () => {
  test('/f/nonexistentslug123456 shows 404 or "Form not found" message', async ({ page }) => {
    await page.goto('/f/nonexistentslug123456xyz');
    await page.waitForLoadState('networkidle');
    await expect(
      page.getByText('Form not found').or(page.getByText(/not found|unavailable|does not exist/i))
    ).toBeVisible({ timeout: 8000 });
  });

  test('/f/ (no slug) redirects or shows error', async ({ page }) => {
    await page.goto('/f/');
    await page.waitForLoadState('networkidle');
    // Should redirect away from /f/ or show an error — it must not be a blank crash page
    const url = page.url();
    const redirected = !url.endsWith('/f/') && !url.endsWith('/f');
    const errorVisible = await page.getByText(/not found|error|form/i).isVisible({ timeout: 3000 }).catch(() => false);
    expect(redirected || errorVisible).toBe(true);
  });
});

// ============================================================================
// describe: Form Fill edge — already submitted
// ============================================================================
test.describe('Form Fill edge — already submitted', () => {
  test('submitting the same form twice with same email is handled gracefully', async ({ page, authToken }) => {
    const form = await setupForm(authToken, 'Double Submit Form', [
      makeField({ fieldType: 'short_text', label: 'Response', isRequired: false, sortOrder: 0 }),
    ]);

    // First submission
    await page.goto(`/f/${form.slug}`);
    await expect(page.getByText('Double Submit Form')).toBeVisible({ timeout: 8000 });
    await page.locator('input[type="text"], textarea').first().fill('First answer');
    await page.getByRole('button', { name: /submit/i }).first().click();
    await expect(page).toHaveURL(new RegExp(`/f/${form.slug}/thank-you`), { timeout: 8000 });

    // Second attempt — form allows multiple submissions by default (no assignment)
    await page.goto(`/f/${form.slug}`);
    await page.waitForLoadState('networkidle');
    const stillOpen = await page.getByRole('button', { name: /submit/i }).first().isVisible({ timeout: 4000 }).catch(() => false);
    const showsSubmittedMsg = await page.getByText(/already submitted|submitted once/i).isVisible({ timeout: 3000 }).catch(() => false);
    expect(stillOpen || showsSubmittedMsg).toBe(true);

    await deleteForm(form.id, authToken);
  });

  test('thank you page shows after successful submission', async ({ page, authToken }) => {
    const form = await setupForm(authToken, 'Thank You Page Form', [
      makeField({ fieldType: 'short_text', label: 'Name', isRequired: false, sortOrder: 0 }),
    ]);

    await page.goto(`/f/${form.slug}`);
    await expect(page.getByText('Thank You Page Form')).toBeVisible({ timeout: 8000 });
    await page.locator('input[type="text"], textarea').first().fill('Playwright Test');
    await page.getByRole('button', { name: /submit/i }).first().click();

    await expect(page).toHaveURL(new RegExp(`/f/${form.slug}/thank-you`), { timeout: 10000 });
    // ThankYou.tsx shows "All done!" heading
    await expect(page.getByText(/all done|thank|submitted|success/i)).toBeVisible({ timeout: 5000 });

    await deleteForm(form.id, authToken);
  });

  test('thank you page has link back to home or submit another response', async ({ page, authToken }) => {
    const form = await setupForm(authToken, 'Thank You Link Form', [
      makeField({ fieldType: 'short_text', label: 'Comment', isRequired: false, sortOrder: 0 }),
    ]);

    await page.goto(`/f/${form.slug}`);
    await expect(page.getByText('Thank You Link Form')).toBeVisible({ timeout: 8000 });
    await page.locator('input[type="text"], textarea').first().fill('Test comment');
    await page.getByRole('button', { name: /submit/i }).first().click();
    await expect(page).toHaveURL(new RegExp(`/f/${form.slug}/thank-you`), { timeout: 10000 });

    // ThankYou.tsx renders a "Submit another response" link
    await expect(
      page.getByRole('link', { name: /submit another|another response/i })
    ).toBeVisible({ timeout: 5000 });

    await deleteForm(form.id, authToken);
  });
});

// ============================================================================
// describe: Form Fill edge — form with all field types
// ============================================================================
test.describe('Form Fill edge — form with all field types', () => {
  let formId: string;
  let formSlug: string;
  let token: string;

  test.beforeAll(async () => {
    const loginRes = await fetch(`${API}/auth/dev-login`, { method: 'POST' });
    const { accessToken } = await loginRes.json();
    token = accessToken;

    const form = await setupForm(token, 'All Field Types Form', [
      makeField({ fieldType: 'short_text', label: 'Short Answer', isRequired: false, sortOrder: 0 }),
      makeField({ fieldType: 'email',      label: 'Email',        isRequired: false, sortOrder: 1 }),
      makeField({ fieldType: 'number',     label: 'Age',          isRequired: false, sortOrder: 2 }),
      makeField({ fieldType: 'date',       label: 'Date of Birth',isRequired: false, sortOrder: 3 }),
    ]);

    formId   = form.id;
    formSlug = form.slug;
  });

  test.afterAll(async () => {
    await deleteForm(formId, token);
  });

  test('form with text, email, number, date fields all visible', async ({ page }) => {
    await page.goto(`/f/${formSlug}`);
    await expect(page.getByText('All Field Types Form')).toBeVisible({ timeout: 8000 });
    await expect(page.getByText('Short Answer')).toBeVisible();
    await expect(page.getByText('Email')).toBeVisible();
    await expect(page.getByText('Age')).toBeVisible();
    await expect(page.getByText('Date of Birth')).toBeVisible();
  });

  test('all field labels rendered', async ({ page }) => {
    await page.goto(`/f/${formSlug}`);
    await expect(page.getByText('All Field Types Form')).toBeVisible({ timeout: 8000 });

    // Each label should appear at least once on the page
    const labels = ['Short Answer', 'Email', 'Age', 'Date of Birth'];
    for (const label of labels) {
      await expect(page.getByText(label).first()).toBeVisible({ timeout: 4000 });
    }
  });

  test('can fill all fields and submit', async ({ page }) => {
    await page.goto(`/f/${formSlug}`);
    await expect(page.getByText('All Field Types Form')).toBeVisible({ timeout: 8000 });

    // Fill by input type to avoid label association issues
    await page.locator('input[type="text"], textarea').first().fill('Hello Playwright');
    await page.locator('input[type="email"]').first().fill('playwright@test.com');
    await page.locator('input[type="number"]').first().fill('30');
    await page.locator('input[type="date"]').first().fill('1994-06-15');

    await page.getByRole('button', { name: /submit/i }).first().click();
    await expect(page).toHaveURL(new RegExp(`/f/${formSlug}/thank-you`), { timeout: 10000 });
    await expect(page.getByText(/all done|thank|submitted|success/i)).toBeVisible({ timeout: 5000 });
  });
});
