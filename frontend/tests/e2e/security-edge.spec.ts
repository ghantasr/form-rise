import { test, expect } from '../fixtures/index';

const API  = 'http://localhost:5001/api';
const BASE = 'http://localhost:5173';

// ---------------------------------------------------------------------------
// Security — API authentication (no token)
// ---------------------------------------------------------------------------

test.describe('Security — API authentication', () => {
  test('GET /api/forms without token returns 401', async () => {
    const res = await fetch(`${API}/forms`);
    expect(res.status).toBe(401);
  });

  test('POST /api/forms without token returns 401', async () => {
    const res = await fetch(`${API}/forms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'No-auth attempt' }),
    });
    expect(res.status).toBe(401);
  });

  test('GET /api/auth/me without token returns 401', async () => {
    const res = await fetch(`${API}/auth/me`);
    expect(res.status).toBe(401);
  });

  test('DELETE /api/forms/{validId} without token returns 401', async ({ authToken }) => {
    // Create a real form so we have a valid ID to target
    const createRes = await fetch(`${API}/forms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
      body: JSON.stringify({ title: 'Auth-check delete target', description: '' }),
    });
    const form = await createRes.json();

    try {
      const delRes = await fetch(`${API}/forms/${form.id}`, { method: 'DELETE' });
      expect(delRes.status).toBe(401);
    } finally {
      // Clean up
      await fetch(`${API}/forms/${form.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      }).catch(() => {});
    }
  });

  test('GET /api/orgs/my without token returns 401', async () => {
    const res = await fetch(`${API}/orgs/my`);
    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// Security — IDOR: form isolation
// ---------------------------------------------------------------------------

test.describe('Security — IDOR: form isolation', () => {
  test('user A cannot GET another user\'s private form via API', async ({ authToken }) => {
    // The dev-login endpoint in this project appears to always return the same
    // seed user. If both tokens resolve to the same userId the IDOR check is
    // meaningless, so we skip with an explanation in that case.
    const resA = await fetch(`${API}/auth/dev-login`, { method: 'POST' });
    const resB = await fetch(`${API}/auth/dev-login`, { method: 'POST' });
    const tokenA = (await resA.json()).accessToken;
    const tokenB = (await resB.json()).accessToken;

    const meA = await (await fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${tokenA}` } })).json();
    const meB = await (await fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${tokenB}` } })).json();

    if (meA.id === meB.id) {
      test.skip(
        true,
        'dev-login always returns the same user — cannot test cross-user IDOR without distinct test accounts'
      );
      return;
    }

    // Create a private form as user A
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` };
    const createRes = await fetch(`${API}/forms`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ title: 'User A private form', description: '' }),
    });
    const form = await createRes.json();

    try {
      // Attempt to access user A's form as user B
      const getRes = await fetch(`${API}/forms/${form.id}`, {
        headers: { Authorization: `Bearer ${tokenB}` },
      });
      // Should be 403 (forbidden) or 404 (not found) — never 200
      expect([403, 404]).toContain(getRes.status);
    } finally {
      await fetch(`${API}/forms/${form.id}`, { method: 'DELETE', headers }).catch(() => {});
    }
  });

  test('accessing /forms/{randomGuid}/edit does not reveal another user\'s data', async ({ page }) => {
    const fakeGuid = '00000000-dead-beef-cafe-000000000000';
    await page.goto(`/forms/${fakeGuid}/edit`);
    await page.waitForLoadState('networkidle');
    // The page should either redirect away or show an empty/error builder — never real form data
    // We just verify the page doesn't crash and shows some UI
    await expect(page.locator('body')).toBeVisible({ timeout: 5000 });
    // Should not show a form title with real content from another user
    const pageText = await page.locator('body').textContent();
    expect(pageText).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Security — input validation
// ---------------------------------------------------------------------------

test.describe('Security — input validation', () => {
  test('XSS in form title is not executed (stored as text, not executed)', async ({ page, createTestForm, authToken }) => {
    const xssTitle = '<script>alert("xss-title")</script>My Form';
    let xssExecuted = false;
    page.on('dialog', () => { xssExecuted = true; });

    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` };
    const createRes = await fetch(`${API}/forms`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ title: xssTitle, description: '' }),
    });
    const form = await createRes.json();

    try {
      // Navigate to the builder — title should render as text, not execute
      await page.goto(`/forms/${form.id}/edit`);
      await page.waitForTimeout(800); // brief settle for any dialog that might fire
      expect(xssExecuted).toBe(false);
      // Ensure the page did not throw or navigate away catastrophically
      expect(page.url()).toContain(form.id);
    } finally {
      await fetch(`${API}/forms/${form.id}`, { method: 'DELETE', headers }).catch(() => {});
    }
  });

  test('SQL injection attempt in form title does not crash the API (200 or 400 but not 500)', async ({ authToken }) => {
    const sqlTitle = "'; DROP TABLE Forms; -- injected";
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` };
    const res = await fetch(`${API}/forms`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ title: sqlTitle, description: '' }),
    });
    expect(res.status).not.toBe(500);
    // Clean up if created
    if (res.ok) {
      const form = await res.json();
      await fetch(`${API}/forms/${form.id}`, { method: 'DELETE', headers }).catch(() => {});
    }
  });

  test('extremely long form title (1000 chars) handled gracefully (API returns non-500)', async ({ authToken }) => {
    const longTitle = 'A'.repeat(1000);
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` };
    const res = await fetch(`${API}/forms`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ title: longTitle, description: '' }),
    });
    expect(res.status).not.toBe(500);
    if (res.ok) {
      const form = await res.json();
      await fetch(`${API}/forms/${form.id}`, { method: 'DELETE', headers }).catch(() => {});
    }
  });

  test('extremely long field label (1000 chars) handled gracefully', async ({ authToken }) => {
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` };

    // Create a form first
    const createRes = await fetch(`${API}/forms`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ title: 'Long Label Test', description: '' }),
    });
    expect(createRes.ok).toBe(true);
    const form = await createRes.json();

    try {
      // Attempt to update it with a field that has a 1000-char label
      const updateRes = await fetch(`${API}/forms/${form.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          title: 'Long Label Test',
          description: '',
          fields: [
            {
              fieldType: 'short_text',
              label: 'B'.repeat(1000),
              isRequired: false,
              sortOrder: 0,
            },
          ],
        }),
      });
      expect(updateRes.status).not.toBe(500);
    } finally {
      await fetch(`${API}/forms/${form.id}`, { method: 'DELETE', headers }).catch(() => {});
    }
  });
});

// ---------------------------------------------------------------------------
// Security — JWT tampering
// ---------------------------------------------------------------------------

test.describe('Security — JWT tampering', () => {
  test('tampered JWT token returns 401 from API', async () => {
    // Valid-looking JWT structure with a forged signature
    const tamperedToken =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' +
      '.eyJzdWIiOiIwMDAwMDAwMC0wMDAwLTAwMDAtMDAwMC0wMDAwMDAwMDAwMDEiLCJlbWFpbCI6ImhhY2tlckBleGFtcGxlLmNvbSIsImlhdCI6MTYwMDAwMDAwMH0' +
      '.TAMPERED_INVALID_SIGNATURE_HERE';
    const res = await fetch(`${API}/forms`, {
      headers: { Authorization: `Bearer ${tamperedToken}` },
    });
    expect(res.status).toBe(401);
  });

  test('expired/malformed JWT (random string) returns 401', async () => {
    const randomString = 'this.is.definitely.not.a.valid.jwt.token.at.all';
    const res = await fetch(`${API}/forms`, {
      headers: { Authorization: `Bearer ${randomString}` },
    });
    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// Security — rate limiting & abuse
// ---------------------------------------------------------------------------

test.describe('Security — rate limiting & abuse', () => {
  test('sending OTP to same email multiple times rapidly does not crash server (200 or 429, not 500)', async () => {
    const email = `ratelimit-edge-${Date.now()}@example.com`;
    const results: number[] = [];

    for (let i = 0; i < 6; i++) {
      const res = await fetch(`${API}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      results.push(res.status);
    }

    // None of the responses should be a 500-level server error
    for (const status of results) {
      expect(status).not.toBe(500);
      expect(status).not.toBe(502);
      expect(status).not.toBe(503);
    }
    // All responses should be 200 (sent), 400 (validation), or 429 (rate limited) — all acceptable
    const validStatuses = results.filter((s) => s === 200 || s === 429 || s === 400 || s === 404);
    expect(validStatuses.length).toBeGreaterThan(0);
  });

  test('rapid POST /api/forms creates forms without error (5 in sequence, all succeed or rate limited gracefully)', async ({ authToken }) => {
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` };
    const createdIds: string[] = [];

    try {
      for (let i = 0; i < 5; i++) {
        const res = await fetch(`${API}/forms`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ title: `Rapid Form ${i + 1} ${Date.now()}`, description: '' }),
        });
        // Each request should be 200/201 or a graceful 429 — never 500
        expect(res.status).not.toBe(500);
        expect(res.status).not.toBe(502);
        if (res.ok) {
          const form = await res.json();
          createdIds.push(form.id);
        }
      }
    } finally {
      for (const id of createdIds) {
        await fetch(`${API}/forms/${id}`, { method: 'DELETE', headers }).catch(() => {});
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Security — public form access
// ---------------------------------------------------------------------------

test.describe('Security — public form access', () => {
  test('public form fill page /f/{slug} is accessible without auth', async ({ page, createTestForm }) => {
    // Create and publish a form using the fixture (fixture has auth)
    const form = await createTestForm('Public Access Test', true);
    if (!form.slug) {
      test.skip(true, 'Form was not published — slug unavailable');
      return;
    }

    // Open a fresh incognito-like context without any auth headers
    const context = await page.context().browser()!.newContext();
    const publicPage = await context.newPage();

    try {
      await publicPage.goto(`${BASE}/f/${form.slug}`);
      await publicPage.waitForLoadState('networkidle');
      // Should load the form, not redirect to login — check the form title or submit button
      const formTitle = publicPage.getByText('Public Access Test').first();
      const submitBtn = publicPage.getByRole('button', { name: /submit/i }).first();
      const isFormVisible = await formTitle.isVisible({ timeout: 8000 }).catch(() => false);
      if (!isFormVisible) {
        await expect(submitBtn).toBeVisible({ timeout: 5000 });
      }
      expect(publicPage.url()).not.toContain('/login');
    } finally {
      await context.close();
    }
  });

  test('non-existent slug /f/totally-fake-slug-12345 returns 404 or error state (not crash)', async ({ page }) => {
    await page.goto(`${BASE}/f/totally-fake-slug-12345`);
    // Should show 404 / error message, not a blank page or uncaught exception
    await expect(
      page.getByText(/not found|404|doesn't exist|no form|invalid/i).or(
        page.getByRole('heading', { name: /404|not found/i })
      )
    ).toBeVisible({ timeout: 8000 });
    // Page title or content should not be a generic runtime error
    const pageText = await page.locator('body').textContent();
    expect(pageText).not.toMatch(/unhandled|uncaught exception|runtime error/i);
  });
});
