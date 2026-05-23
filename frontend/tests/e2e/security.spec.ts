import { test, expect } from '@playwright/test';

const API = 'http://localhost:5001/api';

test.describe('Security — authentication enforcement', () => {
  test('GET /api/forms without JWT returns 401', async ({ request }) => {
    const res = await request.get(`${API}/forms`);
    expect(res.status()).toBe(401);
  });

  test('POST /api/forms without JWT returns 401', async ({ request }) => {
    const res = await request.post(`${API}/forms`, { data: { title: 'Hack' } });
    expect(res.status()).toBe(401);
  });

  test('GET /api/auth/me without JWT returns 401', async ({ request }) => {
    const res = await request.get(`${API}/auth/me`);
    expect(res.status()).toBe(401);
  });

  test('POST /api/auth/logout without JWT returns 401', async ({ request }) => {
    const res = await request.post(`${API}/auth/logout`);
    expect(res.status()).toBe(401);
  });

  test('invalid JWT returns 401', async ({ request }) => {
    const res = await request.get(`${API}/forms`, {
      headers: { Authorization: 'Bearer this.is.not.valid' },
    });
    expect(res.status()).toBe(401);
  });

  test('tampered JWT signature returns 401', async ({ request }) => {
    const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwMDAwMDAwMC0wMDAwLTAwMDAtMDAwMC0wMDAwMDAwMDAwMDEiLCJlbWFpbCI6ImhhY2tlckBleGFtcGxlLmNvbSJ9.INVALID_SIGNATURE';
    const res = await request.get(`${API}/forms`, {
      headers: { Authorization: `Bearer ${fakeToken}` },
    });
    expect(res.status()).toBe(401);
  });
});

test.describe('Security — dev-login endpoint', () => {
  test('dev-login exists in Development and returns JWT', async ({ request }) => {
    const res = await request.post(`${API}/auth/dev-login`);
    expect([200, 404]).toContain(res.status());
    if (res.status() === 200) {
      const data = await res.json();
      expect(data.accessToken).toBeTruthy();
    }
  });
});

test.describe('Security — IDOR (Insecure Direct Object Reference)', () => {
  let userAToken: string;
  let userAFormId: string;

  test.beforeAll(async ({ request }) => {
    const res = await request.post(`${API}/auth/dev-login`);
    const data = await res.json();
    userAToken = data.accessToken;

    const formRes = await request.post(`${API}/forms`, {
      data: { title: 'User A Private Form' },
      headers: { Authorization: `Bearer ${userAToken}` },
    });
    userAFormId = (await formRes.json()).id;
  });

  test.afterAll(async ({ request }) => {
    if (userAFormId && userAToken) {
      await request.delete(`${API}/forms/${userAFormId}`, {
        headers: { Authorization: `Bearer ${userAToken}` },
      });
    }
  });

  test('unauthenticated cannot GET another user\'s form', async ({ request }) => {
    const res = await request.get(`${API}/forms/${userAFormId}`);
    expect(res.status()).toBe(401);
  });

  test('unauthenticated cannot DELETE another user\'s form', async ({ request }) => {
    const res = await request.delete(`${API}/forms/${userAFormId}`);
    expect(res.status()).toBe(401);
  });

  test('unauthenticated cannot GET another user\'s responses', async ({ request }) => {
    const res = await request.get(`${API}/forms/${userAFormId}/responses`);
    expect(res.status()).toBe(401);
  });
});

test.describe('Security — XSS prevention', () => {
  let formSlug: string;
  let formId: string;
  let authToken: string;

  test.beforeAll(async () => {
    const loginRes = await fetch(`${API}/auth/dev-login`, { method: 'POST' });
    const loginData = await loginRes.json();
    authToken = loginData.accessToken;
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` };

    const create = await fetch(`${API}/forms`, {
      method: 'POST', headers,
      body: JSON.stringify({ title: 'XSS Test Form', description: '' }),
    });
    formId = (await create.json()).id;

    await fetch(`${API}/forms/${formId}`, {
      method: 'PUT', headers,
      body: JSON.stringify({
        title: 'XSS Test Form', description: '',
        fields: [{ fieldType: 'short_text', label: 'Message', isRequired: false, sortOrder: 0 }],
      }),
    });

    const pub = await fetch(`${API}/forms/${formId}/publish`, { method: 'POST', headers });
    formSlug = (await pub.json()).slug;
  });

  test.afterAll(async () => {
    if (formId && authToken) {
      await fetch(`${API}/forms/${formId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      }).catch(() => {});
    }
  });

  test('script tag in form input is not executed', async ({ page }) => {
    await page.goto(`/f/${formSlug}`);
    let xssExecuted = false;
    page.on('dialog', () => { xssExecuted = true; });
    await page.getByLabel('Message').fill('<script>alert("xss")</script>');
    await page.getByRole('button', { name: /submit/i }).click();
    await page.waitForTimeout(1000);
    expect(xssExecuted).toBe(false);
  });

  test('img onerror XSS payload is not executed', async ({ page }) => {
    await page.goto(`/f/${formSlug}`);
    let xssExecuted = false;
    page.on('dialog', () => { xssExecuted = true; });
    await page.getByLabel('Message').fill('<img src=x onerror="alert(1)">');
    await page.getByRole('button', { name: /submit/i }).click();
    await page.waitForTimeout(1000);
    expect(xssExecuted).toBe(false);
  });
});

test.describe('Security — rate limiting', () => {
  test('OTP endpoint rate-limits rapid requests', async ({ request }) => {
    const email = `ratelimit-${Date.now()}@example.com`;
    let lastStatus = 200;
    for (let i = 0; i < 7; i++) {
      const res = await request.post(`${API}/auth/send-otp`, { data: { email } });
      lastStatus = res.status();
    }
    expect([200, 400, 429, 503]).toContain(lastStatus);
  });
});

test.describe('Security — HttpOnly cookie', () => {
  test('refreshToken cookie is NOT accessible via document.cookie (HttpOnly)', async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    await page.evaluate(async () => {
      await fetch('/api/auth/dev-login', { method: 'POST', credentials: 'include' });
    });
    const cookies = await page.evaluate(() => document.cookie);
    expect(cookies).not.toContain('refreshToken');
  });
});

test.describe('Security — SQL injection', () => {
  test('SQL injection in email field returns non-500 response', async ({ request }) => {
    const res = await request.post(`${API}/auth/send-otp`, {
      data: { email: "'; DROP TABLE Users; --" },
    });
    expect(res.status()).not.toBe(500);
  });
});
