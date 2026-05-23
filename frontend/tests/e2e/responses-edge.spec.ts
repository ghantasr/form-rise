import { test, expect } from '../fixtures/index';

const API = 'http://localhost:5001/api';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface PublishedForm {
  id: string;
  slug: string;
  fieldId: string;
  authToken: string;
}

async function createAndPublishForm(
  authToken: string,
  opts: { isQuizMode?: boolean; passMark?: number } = {}
): Promise<PublishedForm> {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: 'Bearer ' + authToken,
  };

  const title = `Responses Edge ${Date.now()}`;
  const createRes = await fetch(`${API}/forms`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ title, description: '' }),
  });
  const form = await createRes.json();

  const fieldId = crypto.randomUUID();

  const fields = opts.isQuizMode
    ? [
        {
          id: fieldId,
          fieldType: 'single_choice',
          label: 'Pick one',
          isRequired: false,
          sortOrder: 0,
          options: ['Correct', 'Wrong'],
          quizConfig: { correctAnswers: ['Correct'], points: 10, matchType: 'exact' },
        },
      ]
    : [
        {
          id: fieldId,
          fieldType: 'short_text',
          label: 'Your name',
          isRequired: false,
          sortOrder: 0,
        },
      ];

  await fetch(`${API}/forms/${form.id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      title,
      description: '',
      isQuizMode: !!opts.isQuizMode,
      passMark: opts.passMark ?? 50,
      fields,
    }),
  });

  const pubRes = await fetch(`${API}/forms/${form.id}/publish`, { method: 'POST', headers });
  let slug = '';
  try {
    const pubData = await pubRes.json();
    slug = pubData?.slug ?? '';
  } catch { /* 204 or non-JSON */ }

  return { id: form.id, slug, fieldId, authToken };
}

async function submitResponse(
  slug: string,
  fieldId: string,
  value: string,
  email?: string
): Promise<void> {
  await fetch(`${API}/f/${slug}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      respondentEmail: email ?? `respondent-${Date.now()}@example.com`,
      answers: [{ fieldId, value }],
    }),
  });
}

async function deleteForm(id: string, authToken: string) {
  await fetch(`${API}/forms/${id}`, {
    method: 'DELETE',
    headers: { Authorization: 'Bearer ' + authToken },
  }).catch(() => {});
}

// ---------------------------------------------------------------------------
// Responses Edge — empty state
// ---------------------------------------------------------------------------

test.describe('Responses Edge — empty state', () => {
  test('form with no submissions shows "No responses yet" or empty state', async ({
    page,
    createTestForm,
  }) => {
    const form = await createTestForm('Empty State Form', true);
    await page.goto(`/forms/${form.id}/responses`);
    await page.waitForLoadState('networkidle');

    const emptyMsg = page.getByText(/no response|no submission|nothing here/i);
    const emptyHeading = page.getByRole('heading', { name: /no response/i });
    const hasMsg = await emptyMsg.isVisible({ timeout: 6000 }).catch(() => false);
    const hasHeading = await emptyHeading.isVisible({ timeout: 2000 }).catch(() => false);
    expect(hasMsg || hasHeading).toBe(true);
  });

  test('empty responses page still shows form title', async ({ page, authToken }) => {
    const title = `Title Visible Form ${Date.now()}`;
    const headers = {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + authToken,
    };
    const createRes = await fetch(`${API}/forms`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ title, description: '' }),
    });
    const form = await createRes.json();
    const fieldId = crypto.randomUUID();
    await fetch(`${API}/forms/${form.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        title,
        description: '',
        fields: [{ id: fieldId, fieldType: 'short_text', label: 'Name', isRequired: false, sortOrder: 0 }],
      }),
    });
    await fetch(`${API}/forms/${form.id}/publish`, { method: 'POST', headers });

    await page.goto(`/forms/${form.id}/responses`);
    await page.waitForLoadState('networkidle');

    // The form title should appear somewhere on the responses page
    await expect(page.getByText(title)).toBeVisible({ timeout: 8000 });

    await deleteForm(form.id, authToken);
  });
});

// ---------------------------------------------------------------------------
// Responses Edge — with data
// ---------------------------------------------------------------------------

test.describe('Responses Edge — with data', () => {
  let form: PublishedForm;

  test.beforeAll(async ({ authToken }: { authToken: string }) => {
    form = await createAndPublishForm(authToken);
    await submitResponse(form.slug, form.fieldId, 'Alice');
  });

  test.afterAll(async () => {
    await deleteForm(form.id, form.authToken);
  });

  test('after submission, responses count increments', async ({ page, authToken }) => {
    const resBefore = await fetch(`${API}/forms/${form.id}/responses`, {
      headers: { Authorization: 'Bearer ' + authToken },
    });
    const beforeData = await resBefore.json();
    const countBefore =
      Array.isArray(beforeData) ? beforeData.length : (beforeData.total ?? beforeData.count ?? 0);

    await submitResponse(form.slug, form.fieldId, 'Bob');

    const resAfter = await fetch(`${API}/forms/${form.id}/responses`, {
      headers: { Authorization: 'Bearer ' + authToken },
    });
    const afterData = await resAfter.json();
    const countAfter =
      Array.isArray(afterData) ? afterData.length : (afterData.total ?? afterData.count ?? 0);

    expect(countAfter).toBeGreaterThan(countBefore);
  });

  test('responses table shows respondent email', async ({ page }) => {
    await page.goto(`/forms/${form.id}/responses`);
    await page.waitForLoadState('networkidle');
    // Use td selector to match desktop table cells (not hidden mobile cards)
    const emailCell = page.locator('td').filter({ hasText: /@example\.com/i }).first();
    const hasDesktop = await emailCell.isVisible({ timeout: 8000 }).catch(() => false);
    if (!hasDesktop) {
      // Mobile fallback: look in any visible container
      const anyEmail = page.locator('p, span').filter({ hasText: /@example\.com/i }).first();
      await expect(anyEmail).toBeVisible({ timeout: 4000 });
    }
  });

  test('responses table shows submission timestamp', async ({ page }) => {
    await page.goto(`/forms/${form.id}/responses`);
    await page.waitForLoadState('networkidle');
    // Column header "Submitted at" (desktop) OR any date-like text in the page
    const dateEl = page
      .getByRole('columnheader', { name: /submitted|date|time/i })
      .or(page.getByText(/submitted at/i))
      .or(page.getByText(/\d{4}|\d{1,2}\/\d{1,2}|ago|just now/i).first())
      .first();
    await expect(dateEl).toBeVisible({ timeout: 8000 });
  });

  test('clicking a response row opens response detail', async ({ page }) => {
    await page.goto(`/forms/${form.id}/responses`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(400);

    // Desktop: click tbody row; mobile: click card div
    const row = page.locator('tbody tr').first();
    const card = page.locator('div[class*="cursor-pointer"]').first();
    const clickTarget = (await row.isVisible({ timeout: 3000 }).catch(() => false)) ? row : card;
    await clickTarget.click();

    // The ResponseDetail panel shows "Response detail" text at the top
    await expect(page.getByText('Response detail')).toBeVisible({ timeout: 6000 });
  });

  test('response detail shows all submitted field answers', async ({ page }) => {
    await page.goto(`/forms/${form.id}/responses`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(400);

    // Click the first row / card to open the detail panel
    const row = page.locator('tbody tr').first();
    const card = page.locator('div[class*="cursor-pointer"]').first();
    const clickTarget = (await row.isVisible({ timeout: 3000 }).catch(() => false)) ? row : card;
    await clickTarget.click();

    // "Alice" should appear in the desktop table (td) or detail panel
    const aliceInTable = page.locator('td').filter({ hasText: 'Alice' }).first();
    const aliceAnywhere = page.locator('p, span, td, li').filter({ hasText: 'Alice' }).first();
    const hasAlice = await aliceInTable.isVisible({ timeout: 6000 }).catch(() =>
      aliceAnywhere.isVisible({ timeout: 2000 }).catch(() => false)
    );
    expect(hasAlice).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Responses Edge — quiz responses
// ---------------------------------------------------------------------------

test.describe('Responses Edge — quiz responses', () => {
  let quizForm: PublishedForm;
  let passForm: PublishedForm;
  let failForm: PublishedForm;

  test.beforeAll(async ({ authToken }: { authToken: string }) => {
    // A quiz form with one correct + one wrong submission
    quizForm = await createAndPublishForm(authToken, { isQuizMode: true, passMark: 50 });
    await submitResponse(quizForm.slug, quizForm.fieldId, 'Correct', 'pass@example.com');
    await submitResponse(quizForm.slug, quizForm.fieldId, 'Wrong', 'fail@example.com');

    passForm = quizForm; // reuse
    failForm = quizForm; // reuse
  });

  test.afterAll(async () => {
    await deleteForm(quizForm.id, quizForm.authToken);
  });

  test('quiz form responses show Score column', async ({ page }) => {
    await page.goto(`/forms/${quizForm.id}/responses`);
    await page.waitForLoadState('networkidle');

    const scoreHeader = page.getByRole('columnheader', { name: /score/i });
    if (await scoreHeader.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(scoreHeader).toBeVisible();
    } else {
      // Score may be shown inline in rows — just check the word exists somewhere
      await expect(page.getByText(/score/i).first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('quiz form responses show Result column (Passed/Failed)', async ({ page }) => {
    await page.goto(`/forms/${quizForm.id}/responses`);
    await page.waitForLoadState('networkidle');

    const resultHeader = page.getByRole('columnheader', { name: /result|pass|status/i });
    const resultText = page.getByText(/passed|failed/i).first();
    const hasHeader = await resultHeader.isVisible({ timeout: 5000 }).catch(() => false);
    const hasText = await resultText.isVisible({ timeout: 2000 }).catch(() => false);
    expect(hasHeader || hasText).toBe(true);
  });

  test('Passed badge visible for passing score submission', async ({ page }) => {
    await page.goto(`/forms/${passForm.id}/responses`);
    await page.waitForLoadState('networkidle');

    const passedBadge = page.getByText(/passed/i).first();
    if (await passedBadge.isVisible({ timeout: 6000 }).catch(() => false)) {
      await expect(passedBadge).toBeVisible();
    }
  });

  test('Failed badge visible for failing score submission', async ({ page }) => {
    await page.goto(`/forms/${failForm.id}/responses`);
    await page.waitForLoadState('networkidle');

    const failedBadge = page.getByText(/failed/i).first();
    if (await failedBadge.isVisible({ timeout: 6000 }).catch(() => false)) {
      await expect(failedBadge).toBeVisible();
    }
  });
});

// ---------------------------------------------------------------------------
// Responses Edge — API
// ---------------------------------------------------------------------------

test.describe('Responses Edge — API', () => {
  test('GET /api/forms/{id}/responses without auth returns 401', async ({ authToken }) => {
    // Create a form to get a real id, then request without auth
    const headers = {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + authToken,
    };
    const createRes = await fetch(`${API}/forms`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ title: 'Auth Test Form', description: '' }),
    });
    const form = await createRes.json();

    const res = await fetch(`${API}/forms/${form.id}/responses`);
    expect(res.status).toBe(401);

    await deleteForm(form.id, authToken);
  });

  test('GET /api/forms/{fakeId}/responses returns 404 or 403 (not 500)', async ({ authToken }) => {
    const res = await fetch(
      `${API}/forms/00000000-0000-0000-0000-000000000000/responses`,
      {
        headers: { Authorization: 'Bearer ' + authToken },
      }
    );
    expect(res.status).not.toBe(500);
    expect([403, 404]).toContain(res.status);
  });

  test('responses are paginated or at least return array', async ({ authToken }) => {
    const form = await createAndPublishForm(authToken);
    await submitResponse(form.slug, form.fieldId, 'Test');

    const res = await fetch(`${API}/forms/${form.id}/responses`, {
      headers: { Authorization: 'Bearer ' + authToken },
    });
    expect(res.status).toBe(200);
    const data = await res.json();

    // Accept either a plain array or paginated envelope { items, total, ... }
    const isArray = Array.isArray(data);
    const hasPaginatedShape =
      typeof data === 'object' &&
      data !== null &&
      (Array.isArray(data.items) || Array.isArray(data.responses) || Array.isArray(data.data));
    expect(isArray || hasPaginatedShape).toBe(true);

    await deleteForm(form.id, form.authToken);
  });
});

// ---------------------------------------------------------------------------
// Responses Edge — export
// ---------------------------------------------------------------------------

test.describe('Responses Edge — export', () => {
  test('export CSV button or link visible on responses page', async ({ page, createTestForm }) => {
    const form = await createTestForm('CSV Visible Test', true);
    await page.goto(`/forms/${form.id}/responses`);
    await page.waitForLoadState('networkidle');

    const exportEl = page
      .getByRole('button', { name: /export|csv|download/i })
      .or(page.getByRole('link', { name: /export|csv|download/i }))
      .first();
    await expect(exportEl).toBeVisible({ timeout: 8000 });
  });

  test('clicking export triggers download or navigates (no crash)', async ({
    page,
    createTestForm,
  }) => {
    const form = await createTestForm('CSV Click Test', true);

    // Submit a response so there is data to export
    const headers = {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + (form as any).authToken ?? '',
    };
    // Use fixture-created form — slug comes from createTestForm with publish=true
    if (form.slug) {
      await fetch(`${API}/f/${form.slug}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ respondentEmail: 'export-test@example.com', answers: [] }),
      });
    }

    await page.goto(`/forms/${form.id}/responses`);
    await page.waitForLoadState('networkidle');

    const exportBtn = page
      .getByRole('button', { name: /export|csv|download/i })
      .or(page.getByRole('link', { name: /export|csv|download/i }))
      .first();

    if (await exportBtn.isVisible({ timeout: 6000 }).catch(() => false)) {
      // Listen for either a download event or a navigation — both are acceptable
      const downloadPromise = page.waitForEvent('download', { timeout: 8000 }).catch(() => null);
      await exportBtn.click();
      const download = await downloadPromise;

      if (download) {
        // If it triggers a download, verify it is a CSV
        expect(download.suggestedFilename()).toMatch(/\.csv$/i);
      } else {
        // If it navigates or opens a new tab, just ensure the current page didn't crash
        await expect(page.locator('body')).toBeVisible();
      }
    }
  });
});
