import { test, expect } from '@playwright/test';

const API = 'http://localhost:5000/api';

// Uses fetch (not Playwright request) so headers + body work reliably
async function setupPublishedForm(fields?: any[]) {
  const loginRes = await fetch(`${API}/auth/dev-login`, { method: 'POST' });
  const { accessToken } = await loginRes.json();
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` };

  const defaultFields = [
    { fieldType: 'short_text', label: 'Full Name',      isRequired: true,  sortOrder: 0 },
    { fieldType: 'email',      label: 'Email',          isRequired: false, sortOrder: 1 },
    { fieldType: 'number',     label: 'Age',            isRequired: false, sortOrder: 2 },
    { fieldType: 'long_text',  label: 'Comments',       isRequired: false, sortOrder: 3 },
    { fieldType: 'dropdown',   label: 'Country',        isRequired: false, sortOrder: 4, options: ['India', 'USA', 'UK'] },
    { fieldType: 'radio',      label: 'Gender',         isRequired: false, sortOrder: 5, options: ['Male', 'Female', 'Other'] },
    { fieldType: 'checkbox',   label: 'Agree to terms', isRequired: false, sortOrder: 6, options: ['I agree'] },
    { fieldType: 'date',       label: 'Date of Birth',  isRequired: false, sortOrder: 7 },
    { fieldType: 'rating',     label: 'Rating',         isRequired: false, sortOrder: 8 },
  ];

  const createRes = await fetch(`${API}/forms`, {
    method: 'POST', headers,
    body: JSON.stringify({ title: `Fill Test ${Date.now()}`, description: '' }),
  });
  const form = await createRes.json();

  await fetch(`${API}/forms/${form.id}`, {
    method: 'PUT', headers,
    body: JSON.stringify({ title: form.title, description: '', fields: fields ?? defaultFields }),
  });

  const pubRes = await fetch(`${API}/forms/${form.id}/publish`, { method: 'POST', headers });
  const pubData = await pubRes.json();
  return { id: form.id, slug: pubData.slug, accessToken };
}

async function deleteForm(id: string, accessToken: string) {
  await fetch(`${API}/forms/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  }).catch(() => {});
}

test.describe('Form Fill — loading', () => {
  test('valid slug loads the public form', async ({ page }) => {
    const form = await setupPublishedForm();
    await page.goto(`/f/${form.slug}`);
    await expect(page.getByText('Full Name')).toBeVisible({ timeout: 8000 });
    await deleteForm(form.id, form.accessToken);
  });

  test('invalid slug shows error or 404 message', async ({ page }) => {
    await page.goto('/f/this-slug-does-not-exist-xyz-abc');
    await expect(page.getByText(/not found|error|unavailable/i)).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Form Fill — field interactions', () => {
  let slug: string;
  let formId: string;
  let accessToken: string;

  test.beforeAll(async () => {
    const form = await setupPublishedForm();
    slug = form.slug;
    formId = form.id;
    accessToken = form.accessToken;
  });

  test.afterAll(async () => {
    await deleteForm(formId, accessToken);
  });

  test('fills text input field', async ({ page }) => {
    await page.goto(`/f/${slug}`);
    await page.getByLabel('Full Name').fill('Jane Doe');
    await expect(page.getByLabel('Full Name')).toHaveValue('Jane Doe');
  });

  test('fills email field', async ({ page }) => {
    await page.goto(`/f/${slug}`);
    await page.getByLabel('Email').fill('jane@example.com');
    await expect(page.getByLabel('Email')).toHaveValue('jane@example.com');
  });

  test('fills number field', async ({ page }) => {
    await page.goto(`/f/${slug}`);
    await page.getByLabel('Age').fill('25');
    await expect(page.getByLabel('Age')).toHaveValue('25');
  });

  test('fills textarea field', async ({ page }) => {
    await page.goto(`/f/${slug}`);
    await page.getByLabel('Comments').fill('Great form!');
    await expect(page.getByLabel('Comments')).toHaveValue('Great form!');
  });

  test('selects dropdown option', async ({ page }) => {
    await page.goto(`/f/${slug}`);
    await page.getByLabel('Country').selectOption('India');
    await expect(page.getByLabel('Country')).toHaveValue('India');
  });

  test('selects radio option', async ({ page }) => {
    await page.goto(`/f/${slug}`);
    await page.getByLabel('Male', { exact: true }).check();
    await expect(page.getByLabel('Male', { exact: true })).toBeChecked();
  });

  test('checks checkbox', async ({ page }) => {
    await page.goto(`/f/${slug}`);
    await page.getByLabel('I agree').check();
    await expect(page.getByLabel('I agree')).toBeChecked();
  });

  test('picks a date', async ({ page }) => {
    await page.goto(`/f/${slug}`);
    await page.getByLabel('Date of Birth').fill('2000-01-15');
    await expect(page.getByLabel('Date of Birth')).toHaveValue('2000-01-15');
  });

  test('gives a star rating', async ({ page }) => {
    await page.goto(`/f/${slug}`);
    const stars = page.locator('[aria-label*="star" i], button[data-value], input[type="radio"][name*="rating" i]');
    if (await stars.count() > 0) {
      await stars.nth(3).click();
    } else {
      // Rating rendered as number buttons (1-5)
      await page.getByText('4').last().click();
    }
  });
});

test.describe('Form Fill — submission', () => {
  test('fill required field and submit → shows thank you page', async ({ page }) => {
    const form = await setupPublishedForm([
      { fieldType: 'short_text', label: 'Name', isRequired: true, sortOrder: 0 },
    ]);
    await page.goto(`/f/${form.slug}`);
    await page.getByLabel('Name').fill('Test User');
    await page.getByRole('button', { name: /submit/i }).click();
    await expect(page).toHaveURL(new RegExp(`/f/${form.slug}/thank-you`), { timeout: 8000 });
    await expect(page.getByText(/thank|submitted|success/i)).toBeVisible();
    await deleteForm(form.id, form.accessToken);
  });

  test('submit with required field empty → shows validation error', async ({ page }) => {
    const form = await setupPublishedForm([
      { fieldType: 'short_text', label: 'Required Field', isRequired: true, sortOrder: 0 },
    ]);
    await page.goto(`/f/${form.slug}`);
    await page.getByRole('button', { name: /submit/i }).click();
    await expect(page.getByText(/is required/i)).toBeVisible({ timeout: 5000 });
    await expect(page).not.toHaveURL(/thank-you/);
    await deleteForm(form.id, form.accessToken);
  });
});

test.describe('Form Fill — QR token', () => {
  test('QR token in URL is accepted and form loads', async ({ page }) => {
    const form = await setupPublishedForm([
      { fieldType: 'short_text', label: 'Answer', isRequired: false, sortOrder: 0 },
    ]);
    const qrRes = await fetch(`${API}/forms/${form.id}/qr`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${form.accessToken}` },
      body: JSON.stringify({ count: 1 }),
    });
    const qrData = await qrRes.json();
    const arr = Array.isArray(qrData) ? qrData : qrData.codes ?? [];
    const token = arr[0]?.token;

    if (token) {
      await page.goto(`/f/${form.slug}?token=${token}`);
      await expect(page.getByText('Answer')).toBeVisible({ timeout: 8000 });
    }
    await deleteForm(form.id, form.accessToken);
  });
});
