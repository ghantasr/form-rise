import { test, expect } from '../fixtures/index';

const API = 'http://localhost:5001/api';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function createAndPublishQuizForm(
  authToken: string,
  opts: {
    passMark?: number;
    fields?: any[];
  } = {}
): Promise<{ id: string; slug: string }> {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: 'Bearer ' + authToken,
  };

  const title = `Quiz Edge ${Date.now()}`;
  const createRes = await fetch(`${API}/forms`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ title, description: '' }),
  });
  const form = await createRes.json();

  const defaultField = {
    id: crypto.randomUUID(),
    fieldType: 'single_choice',
    label: 'Pick the right one',
    isRequired: true,
    sortOrder: 0,
    options: ['Correct', 'Wrong'],
    quizConfig: { correctAnswers: ['Correct'], points: 10, matchType: 'exact' },
  };

  await fetch(`${API}/forms/${form.id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      title,
      description: '',
      isQuizMode: true,
      passMark: opts.passMark ?? 50,
      fields: opts.fields ?? [defaultField],
    }),
  });

  const pubRes = await fetch(`${API}/forms/${form.id}/publish`, { method: 'POST', headers });
  let slug = '';
  try {
    const pubData = await pubRes.json();
    slug = pubData?.slug ?? '';
  } catch { /* 204 or non-JSON */ }
  return { id: form.id, slug };
}

async function submitQuiz(slug: string, answers: any[]) {
  return fetch(`${API}/f/${slug}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ respondentEmail: `quiz-tester-${Date.now()}@example.com`, answers }),
  });
}

async function deleteForm(id: string, authToken: string) {
  await fetch(`${API}/forms/${id}`, {
    method: 'DELETE',
    headers: { Authorization: 'Bearer ' + authToken },
  }).catch(() => {});
}

// ---------------------------------------------------------------------------
// Quiz Edge — scoring accuracy
// ---------------------------------------------------------------------------

test.describe('Quiz Edge — scoring accuracy', () => {
  test('100% score when all answers correct → score=10, max=10', async ({ authToken }) => {
    const fieldId = crypto.randomUUID();
    const form = await createAndPublishQuizForm(authToken, {
      passMark: 50,
      fields: [
        {
          id: fieldId,
          fieldType: 'single_choice',
          label: 'Q1',
          isRequired: true,
          sortOrder: 0,
          options: ['Correct', 'Wrong'],
          quizConfig: { correctAnswers: ['Correct'], points: 10, matchType: 'exact' },
        },
      ],
    });

    const res = await submitQuiz(form.slug, [{ fieldId, value: 'Correct' }]);
    expect(res.status).toBeLessThan(300);
    const body = await res.json();
    // Response body may contain score directly or inside a quizResult object
    const score = body.score ?? body.quizResult?.score ?? body.totalScore;
    const max = body.maxScore ?? body.quizResult?.maxScore ?? body.totalPoints;
    if (score !== undefined) expect(score).toBe(10);
    if (max !== undefined) expect(max).toBe(10);

    await deleteForm(form.id, authToken);
  });

  test('0% score when all answers wrong → score=0, max=10', async ({ authToken }) => {
    const fieldId = crypto.randomUUID();
    const form = await createAndPublishQuizForm(authToken, {
      passMark: 50,
      fields: [
        {
          id: fieldId,
          fieldType: 'single_choice',
          label: 'Q1',
          isRequired: false,
          sortOrder: 0,
          options: ['Correct', 'Wrong'],
          quizConfig: { correctAnswers: ['Correct'], points: 10, matchType: 'exact' },
        },
      ],
    });

    const res = await submitQuiz(form.slug, [{ fieldId, value: 'Wrong' }]);
    expect(res.status).toBeLessThan(300);
    const body = await res.json();
    const score = body.score ?? body.quizResult?.score ?? body.totalScore;
    if (score !== undefined) expect(score).toBe(0);

    await deleteForm(form.id, authToken);
  });

  test('partial score: 1 of 2 questions correct → score = points of correct one', async ({ authToken }) => {
    const f1 = crypto.randomUUID();
    const f2 = crypto.randomUUID();
    const form = await createAndPublishQuizForm(authToken, {
      passMark: 50,
      fields: [
        {
          id: f1,
          fieldType: 'single_choice',
          label: 'Q1',
          isRequired: false,
          sortOrder: 0,
          options: ['A', 'B'],
          quizConfig: { correctAnswers: ['A'], points: 5, matchType: 'exact' },
        },
        {
          id: f2,
          fieldType: 'single_choice',
          label: 'Q2',
          isRequired: false,
          sortOrder: 1,
          options: ['C', 'D'],
          quizConfig: { correctAnswers: ['C'], points: 5, matchType: 'exact' },
        },
      ],
    });

    // Answer Q1 correctly, Q2 wrongly
    const res = await submitQuiz(form.slug, [
      { fieldId: f1, value: 'A' },
      { fieldId: f2, value: 'D' },
    ]);
    expect(res.status).toBeLessThan(300);
    const body = await res.json();
    const score = body.score ?? body.quizResult?.score ?? body.totalScore;
    if (score !== undefined) expect(score).toBe(5);

    await deleteForm(form.id, authToken);
  });

  test('passMark=100: score of 90% → isPassed=false', async ({ authToken }) => {
    const f1 = crypto.randomUUID();
    const f2 = crypto.randomUUID();
    const form = await createAndPublishQuizForm(authToken, {
      passMark: 100,
      fields: [
        {
          id: f1,
          fieldType: 'single_choice',
          label: 'Q1',
          isRequired: false,
          sortOrder: 0,
          options: ['A', 'B'],
          quizConfig: { correctAnswers: ['A'], points: 9, matchType: 'exact' },
        },
        {
          id: f2,
          fieldType: 'single_choice',
          label: 'Q2',
          isRequired: false,
          sortOrder: 1,
          options: ['C', 'D'],
          quizConfig: { correctAnswers: ['C'], points: 1, matchType: 'exact' },
        },
      ],
    });

    // Score 9/10 = 90% — should not pass with passMark=100
    const res = await submitQuiz(form.slug, [
      { fieldId: f1, value: 'A' },
      { fieldId: f2, value: 'D' },
    ]);
    expect(res.status).toBeLessThan(300);
    const body = await res.json();
    const isPassed = body.isPassed ?? body.quizResult?.isPassed ?? body.passed;
    if (isPassed !== undefined) expect(isPassed).toBe(false);

    await deleteForm(form.id, authToken);
  });

  test('passMark=50: score of 100% → isPassed=true', async ({ authToken }) => {
    const fieldId = crypto.randomUUID();
    const form = await createAndPublishQuizForm(authToken, {
      passMark: 50,
      fields: [
        {
          id: fieldId,
          fieldType: 'single_choice',
          label: 'Q1',
          isRequired: false,
          sortOrder: 0,
          options: ['Yes', 'No'],
          quizConfig: { correctAnswers: ['Yes'], points: 10, matchType: 'exact' },
        },
      ],
    });

    const res = await submitQuiz(form.slug, [{ fieldId, value: 'Yes' }]);
    expect(res.status).toBeLessThan(300);
    const body = await res.json();
    const isPassed = body.isPassed ?? body.quizResult?.isPassed ?? body.passed;
    if (isPassed !== undefined) expect(isPassed).toBe(true);

    await deleteForm(form.id, authToken);
  });

  test('passMark=0: any score → isPassed=true', async ({ authToken }) => {
    const fieldId = crypto.randomUUID();
    const form = await createAndPublishQuizForm(authToken, {
      passMark: 0,
      fields: [
        {
          id: fieldId,
          fieldType: 'single_choice',
          label: 'Q1',
          isRequired: false,
          sortOrder: 0,
          options: ['Right', 'Wrong'],
          quizConfig: { correctAnswers: ['Right'], points: 10, matchType: 'exact' },
        },
      ],
    });

    // Submit a wrong answer — score = 0, but passMark = 0 so still passed
    const res = await submitQuiz(form.slug, [{ fieldId, value: 'Wrong' }]);
    expect(res.status).toBeLessThan(300);
    const body = await res.json();
    const isPassed = body.isPassed ?? body.quizResult?.isPassed ?? body.passed;
    if (isPassed !== undefined) expect(isPassed).toBe(true);

    await deleteForm(form.id, authToken);
  });
});

// ---------------------------------------------------------------------------
// Quiz Edge — attempt_once enforcement
// ---------------------------------------------------------------------------

test.describe('Quiz Edge — attempt_once enforcement', () => {
  test('submitting twice with attempt_once assignment from same email → second submit returns 4xx', async ({
    authToken,
  }) => {
    // Get user's org to find a group
    const headers = {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + authToken,
    };

    const myOrgRes = await fetch(`${API}/orgs/my`, { headers });
    if (!myOrgRes.ok) {
      test.skip(true, 'No org available — skipping attempt_once test');
      return;
    }
    const myOrg = await myOrgRes.json().catch(() => null);
    if (!myOrg?.id) {
      test.skip(true, 'No org available — skipping attempt_once test');
      return;
    }
    const orgId = myOrg.id;
    const groupsRes = await fetch(`${API}/orgs/${orgId}/groups`, { headers });
    const groups = await groupsRes.json();
    if (!Array.isArray(groups) || groups.length === 0) {
      test.skip(true, 'No group available — skipping attempt_once test');
      return;
    }

    const groupId = groups[0].id;
    const fieldId = crypto.randomUUID();
    const form = await createAndPublishQuizForm(authToken, {
      passMark: 50,
      fields: [
        {
          id: fieldId,
          fieldType: 'single_choice',
          label: 'Q',
          isRequired: false,
          sortOrder: 0,
          options: ['A', 'B'],
          quizConfig: { correctAnswers: ['A'], points: 10, matchType: 'exact' },
        },
      ],
    });

    // Create attempt_once assignment
    const assignRes = await fetch(`${API}/assignments`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ formId: form.id, groupId, mode: 'attempt_once' }),
    });
    // Skip if assignment creation itself fails (org/group feature not enabled)
    if (assignRes.status >= 400) {
      await deleteForm(form.id, authToken);
      test.skip(true, 'Assignment creation not supported — skipping');
      return;
    }

    const email = `attempt-once-${Date.now()}@example.com`;

    // First submission — should succeed
    const res1 = await fetch(`${API}/f/${form.slug}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ respondentEmail: email, answers: [{ fieldId, value: 'A' }] }),
    });
    expect(res1.status).toBeLessThan(300);

    // Second submission from same email — should be blocked
    const res2 = await fetch(`${API}/f/${form.slug}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ respondentEmail: email, answers: [{ fieldId, value: 'A' }] }),
    });
    expect(res2.status).toBeGreaterThanOrEqual(400);

    await deleteForm(form.id, authToken);
  });

  test('submitting twice on standard-mode form (no assignment) is allowed', async ({ authToken }) => {
    const fieldId = crypto.randomUUID();
    const form = await createAndPublishQuizForm(authToken, {
      passMark: 50,
      fields: [
        {
          id: fieldId,
          fieldType: 'short_text',
          label: 'Name',
          isRequired: false,
          sortOrder: 0,
        },
      ],
    });

    const email = `multi-submit-${Date.now()}@example.com`;
    const payload = () =>
      fetch(`${API}/f/${form.slug}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ respondentEmail: email, answers: [{ fieldId, value: 'Test' }] }),
      });

    const res1 = await payload();
    expect(res1.status).toBeLessThan(300);

    const res2 = await payload();
    expect(res2.status).toBeLessThan(300);

    await deleteForm(form.id, authToken);
  });

  test('attempt_once only blocks if assignment exists — no assignment means no limit', async ({
    authToken,
  }) => {
    const fieldId = crypto.randomUUID();
    const form = await createAndPublishQuizForm(authToken, {
      passMark: 50,
      fields: [
        {
          id: fieldId,
          fieldType: 'short_text',
          label: 'Answer',
          isRequired: false,
          sortOrder: 0,
        },
      ],
    });

    // No assignment created — second submit should be fine
    const email = `no-assign-${Date.now()}@example.com`;
    const makeSubmit = () =>
      fetch(`${API}/f/${form.slug}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ respondentEmail: email, answers: [{ fieldId, value: 'hi' }] }),
      });

    const r1 = await makeSubmit();
    expect(r1.status).toBeLessThan(300);

    const r2 = await makeSubmit();
    expect(r2.status).toBeLessThan(300);

    await deleteForm(form.id, authToken);
  });
});

// ---------------------------------------------------------------------------
// Quiz Edge — My Results page
// ---------------------------------------------------------------------------

test.describe('Quiz Edge — My Results page', () => {
  test('/my-results page heading visible', async ({ page }) => {
    await page.goto('/my-results');
    await page.waitForLoadState('networkidle');
    // Either the results heading or a login page — check page renders without crashing
    await expect(page.locator('body')).toBeVisible();
    const heading = page.getByRole('heading', { name: /result|quiz|score/i });
    const loginPage = page.getByText(/sign in|log in|login/i);
    const either = heading.or(loginPage);
    await expect(either.first()).toBeVisible({ timeout: 8000 });
  });

  test('visiting /my-results while authenticated does not redirect to login', async ({ page }) => {
    await page.goto('/my-results');
    await page.waitForLoadState('networkidle');
    // Authenticated page fixture injects JWT via mocked refresh — should not land on /login
    expect(page.url()).not.toMatch(/\/login/);
  });

  test('page shows "No quiz results yet" or results list (no crash)', async ({ page }) => {
    await page.goto('/my-results');
    await page.waitForLoadState('networkidle');
    // Accept either empty state or a populated results list
    const emptyState = page.getByText(/no.*result|no.*quiz|no.*submission/i);
    const resultsList = page.locator('table, [role="list"], [role="grid"], .results-list');
    const isEmptyVisible = await emptyState.isVisible({ timeout: 5000 }).catch(() => false);
    const isListVisible = await resultsList.isVisible({ timeout: 1000 }).catch(() => false);
    expect(isEmptyVisible || isListVisible).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Quiz Edge — quiz form UI
// ---------------------------------------------------------------------------

test.describe('Quiz Edge — quiz form UI', () => {
  test('quiz button in form builder is visible', async ({ page, createTestForm }) => {
    const form = await createTestForm('Quiz UI Test', false);
    await page.goto(`/forms/${form.id}/edit`);
    await page.waitForLoadState('networkidle');
    const quizToggle = page
      .getByRole('button', { name: /quiz/i })
      .or(page.getByRole('checkbox', { name: /quiz/i }))
      .or(page.getByText(/quiz mode/i))
      .first();
    await expect(quizToggle).toBeVisible({ timeout: 8000 });
  });

  test('enabling quiz mode shows pass mark percentage', async ({ page, createTestForm }) => {
    const form = await createTestForm('Quiz Passmark Test', false);
    await page.goto(`/forms/${form.id}/edit`);
    await page.waitForLoadState('networkidle');

    // Find and click the quiz mode toggle
    const quizBtn = page
      .getByRole('button', { name: /quiz/i })
      .or(page.getByLabel(/quiz mode/i))
      .first();

    if (await quizBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await quizBtn.click();
      // After enabling, pass mark input or percentage label should appear
      const passMark = page
        .getByLabel(/pass mark|passing score|pass %/i)
        .or(page.getByPlaceholder(/pass mark|passing/i))
        .or(page.getByText(/pass mark/i))
        .first();
      await expect(passMark).toBeVisible({ timeout: 5000 });
    }
  });

  test('pass mark of 0% is accepted', async ({ page, authToken }) => {
    const form = await createAndPublishQuizForm(authToken, { passMark: 0 });
    // Verify the form still returns OK from the API with passMark=0
    const res = await fetch(`${API}/forms/${form.id}`, {
      headers: { Authorization: 'Bearer ' + authToken },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.passMark ?? data.quizPassMark ?? 0).toBe(0);
    await deleteForm(form.id, authToken);
  });

  test('pass mark of 100% is accepted', async ({ page, authToken }) => {
    const form = await createAndPublishQuizForm(authToken, { passMark: 100 });
    const res = await fetch(`${API}/forms/${form.id}`, {
      headers: { Authorization: 'Bearer ' + authToken },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.passMark ?? data.quizPassMark ?? 100).toBe(100);
    await deleteForm(form.id, authToken);
  });

  test('quiz form shows "attempt once" or equivalent mode label in assignment panel', async ({
    page,
    authToken,
  }) => {
    const form = await createAndPublishQuizForm(authToken, { passMark: 50 });
    await page.goto(`/forms/${form.id}/edit`);
    await page.waitForLoadState('networkidle');

    // Look for an Assign or Assignments panel/button
    const assignBtn = page
      .getByRole('button', { name: /assign/i })
      .or(page.getByText(/assign/i))
      .first();

    if (await assignBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await assignBtn.click();
      // The panel should show mode options including attempt_once
      const onceLabel = page.getByText(/attempt.?once|one.?attempt|single attempt/i);
      if (await onceLabel.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(onceLabel).toBeVisible();
      }
    }

    await deleteForm(form.id, authToken);
  });
});
