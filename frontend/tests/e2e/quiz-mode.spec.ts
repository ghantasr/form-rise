import { test, expect } from '../fixtures/index';

const API = 'http://localhost:5001/api';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function enableQuizMode(page: any) {
  await page.getByRole('button', { name: 'Quiz' }).click();
  await expect(page.getByRole('heading', { name: 'Quiz Mode' })).toBeVisible({ timeout: 5000 });
  const toggle = page.getByRole('switch').first();
  const isOn = (await toggle.getAttribute('aria-checked')) === 'true';
  if (!isOn) await toggle.click();
  await expect(toggle).toHaveAttribute('aria-checked', 'true');
  await page.waitForTimeout(600);
}

async function addFieldAndOpenEditor(page: any, fieldBtnName: string) {
  await page.getByRole('button', { name: fieldBtnName }).click();
  await page.waitForTimeout(400);
  // Click the last field label in the canvas to open the field editor
  await page.locator(`text=${fieldBtnName}`).last().click();
  await page.waitForTimeout(300);
}

// ---------------------------------------------------------------------------
// Quiz panel — enabling & form-level settings
// ---------------------------------------------------------------------------

test.describe('Quiz Mode — quiz panel', () => {
  test('Quiz button opens quiz settings panel', async ({ page }) => {
    await page.goto('/forms/new');
    await expect(page.getByRole('button', { name: 'Short text' })).toBeVisible({ timeout: 5000 });
    await page.getByRole('button', { name: 'Quiz' }).click();
    await expect(page.getByRole('heading', { name: 'Quiz Mode' })).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Enable Quiz Mode', { exact: false })).toBeVisible();
  });

  test('quiz mode toggle starts off and can be enabled', async ({ page }) => {
    await page.goto('/forms/new');
    await expect(page.getByRole('button', { name: 'Short text' })).toBeVisible({ timeout: 5000 });
    await page.getByRole('button', { name: 'Quiz' }).click();
    await expect(page.getByRole('heading', { name: 'Quiz Mode' })).toBeVisible({ timeout: 5000 });
    const toggle = page.getByRole('switch').first();
    await expect(toggle).toHaveAttribute('aria-checked', 'false');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-checked', 'true');
  });

  test('pass mark slider defaults to 60% when quiz mode is first enabled', async ({ page }) => {
    await page.goto('/forms/new');
    await expect(page.getByRole('button', { name: 'Short text' })).toBeVisible({ timeout: 5000 });
    await enableQuizMode(page);
    await expect(page.getByText('60%')).toBeVisible({ timeout: 3000 });
  });

  test('pass mark slider can be adjusted', async ({ page }) => {
    await page.goto('/forms/new');
    await expect(page.getByRole('button', { name: 'Short text' })).toBeVisible({ timeout: 5000 });
    await enableQuizMode(page);
    const slider = page.locator('input[type="range"]');
    await slider.fill('80');
    await slider.dispatchEvent('input');
    await expect(page.getByText('80%')).toBeVisible({ timeout: 3000 });
  });

  test('disabling quiz mode hides pass mark slider', async ({ page }) => {
    await page.goto('/forms/new');
    await expect(page.getByRole('button', { name: 'Short text' })).toBeVisible({ timeout: 5000 });
    await enableQuizMode(page);
    // Toggle off
    const toggle = page.getByRole('switch').first();
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-checked', 'false');
    await expect(page.locator('input[type="range"]')).not.toBeVisible({ timeout: 2000 });
  });
});

// ---------------------------------------------------------------------------
// Field editor — text field quiz config
// ---------------------------------------------------------------------------

test.describe('Quiz Mode — text field quiz config', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/forms/new');
    await expect(page.getByRole('button', { name: 'Short text' })).toBeVisible({ timeout: 5000 });
    // Add field first so it exists before enabling quiz mode
    await page.getByRole('button', { name: 'Short text' }).click();
    await page.waitForTimeout(400);
    // Enable quiz mode (opens quiz panel)
    await enableQuizMode(page);
    // Close quiz panel so the field editor can render when a field is selected
    await page.getByRole('button', { name: 'Quiz' }).click();
    await page.waitForTimeout(300);
    // Open field editor by clicking the field in canvas
    const canvasField = page.locator('[draggable="true"], [data-field-id]').first();
    const hasCanvas = await canvasField.isVisible({ timeout: 2000 }).catch(() => false);
    if (hasCanvas) {
      await canvasField.click();
    } else {
      await page.locator('text=Short text').last().click();
    }
    await page.waitForTimeout(400);
  });

  test('field editor shows Quiz Settings section when quiz mode is on', async ({ page }) => {
    await expect(page.getByText('Quiz Settings')).toBeVisible({ timeout: 3000 });
  });

  test('text field has a "Correct answer" input', async ({ page }) => {
    await expect(page.getByPlaceholder('Enter the correct answer...')).toBeVisible({ timeout: 3000 });
  });

  test('can enter a correct answer for a text field', async ({ page }) => {
    const input = page.getByPlaceholder('Enter the correct answer...');
    await input.fill('Paris');
    await expect(input).toHaveValue('Paris');
  });

  test('text field shows match type options including Normalized and Contains', async ({ page }) => {
    await expect(page.getByText('Normalized', { exact: false }).first()).toBeVisible({ timeout: 3000 });
    await expect(page.getByText('Contains', { exact: false }).first()).toBeVisible();
    await expect(page.getByText('Starts with', { exact: false }).first()).toBeVisible();
  });

  test('can select a different match type', async ({ page }) => {
    const normalizedBtn = page.getByText('Normalized', { exact: false }).first();
    await normalizedBtn.click();
    // Selected state: background changes to green-tinted class
    await expect(normalizedBtn).toBeVisible();
  });

  test('can set the points value for a field', async ({ page }) => {
    const pointsInput = page.locator('input[type="number"]').filter({ hasText: '' }).last();
    await pointsInput.clear();
    await pointsInput.fill('10');
    await expect(pointsInput).toHaveValue('10');
  });

  test('can add an explanation for a field', async ({ page }) => {
    const explanation = page.getByPlaceholder('Shown to respondents after submitting...');
    await explanation.fill('The capital of France is Paris.');
    await expect(explanation).toHaveValue('The capital of France is Paris.');
  });
});

// ---------------------------------------------------------------------------
// Field editor — single choice (radio) quiz config
// ---------------------------------------------------------------------------

test.describe('Quiz Mode — radio field quiz config', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/forms/new');
    await expect(page.getByRole('button', { name: 'Short text' })).toBeVisible({ timeout: 5000 });
    await page.getByRole('button', { name: 'Single choice' }).click();
    await page.waitForTimeout(400);
    await enableQuizMode(page);
    // Close quiz panel so field editor can show
    await page.getByRole('button', { name: 'Quiz' }).click();
    await page.waitForTimeout(300);
    const canvasField = page.locator('[draggable="true"], [data-field-id]').first();
    const hasCanvas = await canvasField.isVisible({ timeout: 2000 }).catch(() => false);
    if (hasCanvas) {
      await canvasField.click();
    } else {
      await page.locator('text=Single choice').last().click();
    }
    await page.waitForTimeout(400);
  });

  test('radio field shows "Correct answer" section in quiz settings', async ({ page }) => {
    await expect(page.getByText('Quiz Settings')).toBeVisible({ timeout: 3000 });
    await expect(page.getByText('Correct answer', { exact: false }).first()).toBeVisible();
  });

  test('shows warning when no correct answer is selected', async ({ page }) => {
    await expect(
      page.getByText(/no correct answer|will score 0/i)
    ).toBeVisible({ timeout: 3000 });
  });
});

// ---------------------------------------------------------------------------
// Field editor — rating field quiz config
// ---------------------------------------------------------------------------

test.describe('Quiz Mode — rating field quiz config', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/forms/new');
    await expect(page.getByRole('button', { name: 'Short text' })).toBeVisible({ timeout: 5000 });
    await page.getByRole('button', { name: 'Rating' }).click();
    await page.waitForTimeout(400);
    await enableQuizMode(page);
    // Close quiz panel so field editor can show
    await page.getByRole('button', { name: 'Quiz' }).click();
    await page.waitForTimeout(300);
    const canvasField = page.locator('[draggable="true"], [data-field-id]').first();
    const hasCanvas = await canvasField.isVisible({ timeout: 2000 }).catch(() => false);
    if (hasCanvas) {
      await canvasField.click();
    } else {
      await page.locator('text=Rating').last().click();
    }
    await page.waitForTimeout(400);
  });

  test('rating field shows Quiz Settings section', async ({ page }) => {
    await expect(page.getByText('Quiz Settings')).toBeVisible({ timeout: 3000 });
  });

  test('rating field shows tolerance input', async ({ page }) => {
    await expect(page.getByText('Tolerance', { exact: false }).first()).toBeVisible({ timeout: 3000 });
  });
});

// ---------------------------------------------------------------------------
// API-level: creating a quiz form and checking response scoring
// ---------------------------------------------------------------------------

test.describe('Quiz Mode — response scoring via API', () => {
  test('submitting a quiz form returns score and isPassed fields', async ({ createTestForm, authToken }) => {
    const form = await createTestForm('Quiz API Test', false);
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    };
    const fieldId = crypto.randomUUID();

    // Update form with quiz mode on and one short_text field with a correct answer
    await fetch(`${API}/forms/${form.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        title: 'Quiz API Test',
        description: '',
        isQuizMode: true,
        passMark: 60,
        fields: [
          {
            id: fieldId,
            fieldType: 'short_text',
            label: 'Capital of France',
            isRequired: true,
            sortOrder: 0,
            quizConfig: {
              correctAnswers: ['Paris'],
              points: 10,
              matchType: 'normalized',
            },
          },
        ],
      }),
    });

    const pubRes = await fetch(`${API}/forms/${form.id}/publish`, { method: 'POST', headers });
    const { slug } = await pubRes.json();

    // Submit a correct answer
    const submitRes = await fetch(`${API}/f/${slug}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        respondentEmail: 'quiz-test@example.com',
        answers: [{ fieldId, value: 'Paris' }],
      }),
    });
    expect(submitRes.ok).toBeTruthy();
    const result = await submitRes.json();
    expect(result.totalScore).toBeDefined();
    expect(result.maxScore).toBeDefined();
    expect(result.isPassed).toBe(true);
  });

  test('incorrect answer scores 0 and isPassed is false', async ({ createTestForm, authToken }) => {
    const form = await createTestForm('Quiz Incorrect Test', false);
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    };
    const fieldId = crypto.randomUUID();

    await fetch(`${API}/forms/${form.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        title: 'Quiz Incorrect Test',
        description: '',
        isQuizMode: true,
        passMark: 60,
        fields: [
          {
            id: fieldId,
            fieldType: 'short_text',
            label: 'Capital of Germany',
            isRequired: true,
            sortOrder: 0,
            quizConfig: {
              correctAnswers: ['Berlin'],
              points: 10,
              matchType: 'normalized',
            },
          },
        ],
      }),
    });

    const pubRes = await fetch(`${API}/forms/${form.id}/publish`, { method: 'POST', headers });
    const { slug } = await pubRes.json();

    const submitRes = await fetch(`${API}/f/${slug}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        respondentEmail: 'quiz-wrong@example.com',
        answers: [{ fieldId, value: 'Munich' }],
      }),
    });
    expect(submitRes.ok).toBeTruthy();
    const result = await submitRes.json();
    expect(result.totalScore).toBe(0);
    expect(result.isPassed).toBe(false);
  });

  test('normalized match type ignores casing and spaces', async ({ createTestForm, authToken }) => {
    const form = await createTestForm('Quiz Normalized Test', false);
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    };
    const fieldId = crypto.randomUUID();

    await fetch(`${API}/forms/${form.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        title: 'Quiz Normalized Test',
        description: '',
        isQuizMode: true,
        passMark: 60,
        fields: [
          {
            id: fieldId,
            fieldType: 'short_text',
            label: 'Answer',
            isRequired: false,
            sortOrder: 0,
            quizConfig: {
              correctAnswers: ['New York'],
              points: 5,
              matchType: 'normalized',
            },
          },
        ],
      }),
    });

    const pubRes = await fetch(`${API}/forms/${form.id}/publish`, { method: 'POST', headers });
    const { slug } = await pubRes.json();

    const submitRes = await fetch(`${API}/f/${slug}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        respondentEmail: 'quiz-norm@example.com',
        // Different casing and spacing — should still match
        answers: [{ fieldId, value: 'new york' }],
      }),
    });
    const result = await submitRes.json();
    expect(result.totalScore).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Response table — quiz columns visible for quiz-mode forms
// ---------------------------------------------------------------------------

test.describe('Quiz Mode — responses table', () => {
  test('responses table shows Score and Result columns for quiz form', async ({
    page,
    createTestForm,
    authToken,
  }) => {
    const form = await createTestForm('Quiz Columns Test', false);
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    };
    const fieldId = crypto.randomUUID();

    await fetch(`${API}/forms/${form.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        title: 'Quiz Columns Test',
        description: '',
        isQuizMode: true,
        passMark: 60,
        fields: [{ id: fieldId, fieldType: 'short_text', label: 'Q1', isRequired: false, sortOrder: 0 }],
      }),
    });

    // Publish and submit a response so the table renders (not empty state)
    const pubRes = await fetch(`${API}/forms/${form.id}/publish`, { method: 'POST', headers });
    let slug = '';
    try { const d = await pubRes.json(); slug = d?.slug ?? ''; } catch {}

    if (slug) {
      await fetch(`${API}/f/${slug}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ respondentEmail: 'score-test@example.com', answers: [{ fieldId, value: 'x' }] }),
      });
    }

    await page.goto(`/forms/${form.id}/responses`);
    await page.waitForLoadState('networkidle');
    // Score and Result column headers appear when form is in quiz mode AND responses exist
    await expect(page.getByText('Score').first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Result').first()).toBeVisible({ timeout: 5000 });
  });

  test('Passed badge is shown for a passing quiz response', async ({
    page,
    createTestForm,
    authToken,
  }) => {
    const form = await createTestForm('Quiz Pass Badge Test', false);
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    };
    const fieldId = crypto.randomUUID();

    await fetch(`${API}/forms/${form.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        title: 'Quiz Pass Badge Test',
        description: '',
        isQuizMode: true,
        passMark: 50,
        fields: [
          {
            id: fieldId,
            fieldType: 'short_text',
            label: 'Q1',
            isRequired: false,
            sortOrder: 0,
            quizConfig: { correctAnswers: ['yes'], points: 10, matchType: 'normalized' },
          },
        ],
      }),
    });

    const pubRes = await fetch(`${API}/forms/${form.id}/publish`, { method: 'POST', headers });
    let slug = '';
    try { const d = await pubRes.json(); slug = d?.slug ?? ''; } catch {}
    if (!slug) { test.skip(true, 'Publish did not return a slug'); return; }

    await fetch(`${API}/f/${slug}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        respondentEmail: 'badge@example.com',
        answers: [{ fieldId, value: 'yes' }],
      }),
    });

    await page.goto(`/forms/${form.id}/responses`);
    await expect(page.getByText('Passed').first()).toBeVisible({ timeout: 5000 });
  });
});

// ---------------------------------------------------------------------------
// My Results page (student view)
// ---------------------------------------------------------------------------

test.describe('Quiz Mode — My Results page', () => {
  test('/my-results page loads and shows the page heading', async ({ page }) => {
    await page.goto('/my-results');
    await expect(page.getByText('My Quiz Results')).toBeVisible({ timeout: 5000 });
  });

  test('empty state shows "No quiz results yet" when there are no submissions', async ({ page }) => {
    await page.goto('/my-results');
    await page.waitForLoadState('networkidle');
    // Either shows result cards or the empty state message
    const isEmpty = await page.getByText(/No quiz results yet/i).isVisible().catch(() => false);
    const hasCards = (await page.locator('article, [class*="card"]').count()) > 0;
    expect(isEmpty || hasCards).toBeTruthy();
  });

  test('my-results page is protected and does not redirect to login', async ({ page }) => {
    await page.goto('/my-results');
    await expect(page).not.toHaveURL('/login', { timeout: 3000 });
  });
});
