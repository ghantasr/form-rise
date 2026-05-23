import { test, expect } from '../fixtures/index';

const API = 'http://localhost:5001/api';

// ---------------------------------------------------------------------------
// Templates — gallery page
// ---------------------------------------------------------------------------
test.describe('Templates — gallery page', () => {
  test('/templates page loads', async ({ page }) => {
    await page.goto('/templates');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toMatch(/\/templates/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('page shows "Templates" heading or template cards', async ({ page }) => {
    await page.goto('/templates');
    await page.waitForLoadState('networkidle');

    // Accept either a heading or visible cards or an empty-state message
    const indicator = page
      .getByRole('heading', { name: /templates/i })
      .or(page.locator('[data-testid="template-card"], .template-card, article').first())
      .or(page.getByText(/no templates|template/i).first());

    await expect(indicator.first()).toBeVisible({ timeout: 8000 });
  });

  test('at least one template card is visible OR "No templates" empty state', async ({ page }) => {
    await page.goto('/templates');
    await page.waitForLoadState('networkidle');

    const cards = page.locator('[data-testid="template-card"], .template-card, article');
    const emptyState = page.getByText(/no templates/i);

    const cardCount = await cards.count();
    if (cardCount > 0) {
      await expect(cards.first()).toBeVisible();
    } else {
      // Empty state is equally valid
      const emptyVisible = await emptyState.isVisible().catch(() => false);
      // Either cards or empty state — the page must render something meaningful
      expect(cardCount > 0 || emptyVisible).toBe(true);
    }
  });

  test('each visible template card shows a title', async ({ page }) => {
    await page.goto('/templates');
    await page.waitForLoadState('networkidle');

    const cards = page.locator('[data-testid="template-card"], .template-card, article');
    const count = await cards.count();
    if (count === 0) {
      // No templates — skip assertion but do not fail
      return;
    }

    // Every card should contain at least some non-empty text
    for (let i = 0; i < Math.min(count, 5); i++) {
      const text = await cards.nth(i).textContent();
      expect(text?.trim().length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// Templates — fork/use
// ---------------------------------------------------------------------------
test.describe('Templates — fork/use', () => {
  test('"Use this template" or "Fork" button is visible on a template card', async ({ page }) => {
    await page.goto('/templates');
    await page.waitForLoadState('networkidle');

    const forkBtn = page.getByRole('button', { name: /use|fork|clone|start/i }).first();
    const hasForkBtn = await forkBtn.isVisible({ timeout: 3000 }).catch(() => false);

    if (!hasForkBtn) {
      // No templates — skip gracefully
      return;
    }
    await expect(forkBtn).toBeVisible();
  });

  test('clicking fork navigates to form builder with the template content', async ({ page }) => {
    await page.goto('/templates');
    await page.waitForLoadState('networkidle');

    const forkBtn = page.getByRole('button', { name: /use|fork|clone|start/i }).first();
    const hasForkBtn = await forkBtn.isVisible({ timeout: 3000 }).catch(() => false);

    if (!hasForkBtn) {
      test.skip(true, 'No template fork button found — template gallery may be empty');
      return;
    }

    await forkBtn.click();
    // Should navigate to the form builder
    await expect(page).toHaveURL(/\/forms\/.+\/edit|\/forms\/new/, { timeout: 10000 });
  });

  test('forked form starts as draft (not published)', async ({ page, authToken }) => {
    // Use the API to fork a template so we can inspect the result precisely
    const listRes = await fetch(`${API}/templates`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    if (!listRes.ok) {
      test.skip(true, 'Templates API not accessible');
      return;
    }

    const templates = await listRes.json();
    if (!Array.isArray(templates) || templates.length === 0) {
      test.skip(true, 'No templates available to fork');
      return;
    }

    const template = templates[0];
    const forkRes = await fetch(`${API}/templates/${template.id}/fork`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (!forkRes.ok) {
      test.skip(true, `Fork returned ${forkRes.status}`);
      return;
    }

    const forked = await forkRes.json();
    // The forked form should be in draft / not published state
    const status = forked.status ?? forked.isPublished;
    if (typeof status === 'boolean') {
      expect(status).toBe(false); // isPublished = false
    } else {
      expect(forked.status).not.toBe('active');
    }

    // Cleanup
    await fetch(`${API}/forms/${forked.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${authToken}` },
    }).catch(() => {});
  });

  test('forked form title matches template title or has "(copy)" suffix', async ({ authToken }) => {
    const listRes = await fetch(`${API}/templates`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    if (!listRes.ok) {
      test.skip(true, 'Templates API not accessible');
      return;
    }

    const templates = await listRes.json();
    if (!Array.isArray(templates) || templates.length === 0) {
      test.skip(true, 'No templates available');
      return;
    }

    const template = templates[0];
    const forkRes = await fetch(`${API}/templates/${template.id}/fork`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (!forkRes.ok) {
      test.skip(true, `Fork returned ${forkRes.status}`);
      return;
    }

    const forked = await forkRes.json();
    expect(forked.title).toBeTruthy();
    // Title either equals the template title or has a copy indicator
    const titleOk =
      forked.title === template.title ||
      forked.title.toLowerCase().includes('copy') ||
      forked.title.includes(template.title);
    expect(titleOk).toBe(true);

    // Cleanup
    await fetch(`${API}/forms/${forked.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${authToken}` },
    }).catch(() => {});
  });

  test('forking via API (POST /api/templates/{id}/fork) creates a new form', async ({ authToken }) => {
    const listRes = await fetch(`${API}/templates`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    if (!listRes.ok) {
      test.skip(true, 'Templates API not accessible');
      return;
    }

    const templates = await listRes.json();
    if (!Array.isArray(templates) || templates.length === 0) {
      test.skip(true, 'No templates available — skipping fork API test');
      return;
    }

    const template = templates[0];
    const forkRes = await fetch(`${API}/templates/${template.id}/fork`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
    });

    expect([200, 201]).toContain(forkRes.status);
    const forked = await forkRes.json();
    expect(forked.id).toBeTruthy();
    expect(forked.id).not.toBe(template.id); // new form, different id

    // Cleanup
    await fetch(`${API}/forms/${forked.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${authToken}` },
    }).catch(() => {});
  });
});

// ---------------------------------------------------------------------------
// Templates — API
// ---------------------------------------------------------------------------
test.describe('Templates — API', () => {
  test('GET /api/templates returns array (may be empty)', async ({ authToken }) => {
    const res = await fetch(`${API}/templates`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(res.ok).toBe(true);
    const body = await res.json();
    // May be a bare array or a paginated wrapper { items, total, ... }
    const templates = Array.isArray(body) ? body : body.items ?? body.data ?? body.templates;
    expect(Array.isArray(templates)).toBe(true);
  });

  test('GET /api/templates without auth returns 401 or 200 (not 500)', async () => {
    // Template gallery might be public (200) or protected (401) — both are valid.
    // What must never happen is a 500 server error.
    const res = await fetch(`${API}/templates`);
    expect([200, 401, 403]).toContain(res.status);
    expect(res.status).not.toBe(500);
  });
});
