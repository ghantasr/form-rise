import { test, expect } from '../fixtures/index';

const API = 'http://localhost:5001/api';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getAuthHeaders(token: string) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

// Create a quiz form (published, quiz mode on)
async function createQuizForm(token: string): Promise<{ id: string; slug: string }> {
  const headers = await getAuthHeaders(token);
  const createRes = await fetch(`${API}/forms`, {
    method: 'POST', headers,
    body: JSON.stringify({ title: `Quiz ${Date.now()}`, description: '' }),
  });
  const form = await createRes.json();
  await fetch(`${API}/forms/${form.id}`, {
    method: 'PUT', headers,
    body: JSON.stringify({ title: form.title, description: '', isQuizMode: true, fields: [{ id: crypto.randomUUID(), fieldType: 'short_text', label: 'Q1', isRequired: false, sortOrder: 0 }] }),
  });
  const pubRes = await fetch(`${API}/forms/${form.id}/publish`, { method: 'POST', headers });
  const pubData = await pubRes.json();
  return { id: form.id, slug: pubData.slug };
}

// Get the org for the test user (creates one if needed)
async function getOrCreateOrg(token: string): Promise<{ id: string }> {
  const headers = await getAuthHeaders(token);
  const res = await fetch(`${API}/orgs/my`, { headers });
  if (res.ok) {
    const data = await res.json();
    if (data?.id) return data;
  }
  const createRes = await fetch(`${API}/orgs`, {
    method: 'POST', headers,
    body: JSON.stringify({ name: `Test Org ${Date.now()}` }),
  });
  return createRes.json();
}

// Get the default "Everyone" group for the org
async function getDefaultGroup(token: string, orgId: string): Promise<{ id: string }> {
  const headers = await getAuthHeaders(token);
  const res = await fetch(`${API}/orgs/${orgId}/groups`, { headers });
  const groups = await res.json();
  return groups.find((g: any) => g.isDefault);
}

// Create an assignment
async function createAssignment(token: string, formId: string, groupId: string, mode = 'attempt_once'): Promise<{ id: string }> {
  const headers = await getAuthHeaders(token);
  const res = await fetch(`${API}/forms/${formId}/assignments`, {
    method: 'POST', headers,
    body: JSON.stringify({ groupId, mode }),
  });
  return res.json();
}

// ---------------------------------------------------------------------------
// Assign button state
// ---------------------------------------------------------------------------

test.describe('Assignments — Assign button state', () => {
  test('Assign button is disabled on a non-quiz published form', async ({ page, createTestForm }) => {
    const form = await createTestForm('Non-quiz Published Form', true);
    await page.goto(`/forms/${form.id}/edit`);
    await page.waitForLoadState('networkidle');
    const assignBtn = page.getByRole('button', { name: /assign/i });
    await expect(assignBtn).toBeVisible({ timeout: 5000 });
    await expect(assignBtn).toBeDisabled();
  });

  test('Assign button is disabled on an unpublished quiz form', async ({ page }) => {
    await page.goto('/forms/new');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('button', { name: 'Short text' })).toBeVisible({ timeout: 5000 });
    const assignBtn = page.getByRole('button', { name: /assign/i });
    await expect(assignBtn).toBeVisible({ timeout: 5000 });
    await expect(assignBtn).toBeDisabled();
  });

  test('Assign button is enabled on a published quiz form', async ({ page, authToken }) => {
    const form = await createQuizForm(authToken);
    await page.goto(`/forms/${form.id}/edit`);
    await page.waitForLoadState('networkidle');
    const assignBtn = page.getByRole('button', { name: /assign/i });
    await expect(assignBtn).toBeVisible({ timeout: 5000 });
    await expect(assignBtn).not.toBeDisabled();
    // Cleanup
    await fetch(`${API}/forms/${form.id}`, {
      method: 'DELETE',
      headers: await getAuthHeaders(authToken),
    }).catch(() => {});
  });
});

// ---------------------------------------------------------------------------
// Assignments — API
// ---------------------------------------------------------------------------

test.describe('Assignments — API', () => {
  test('cannot assign same form to same group twice', async ({ authToken }) => {
    const form = await createQuizForm(authToken);
    const org = await getOrCreateOrg(authToken);
    const group = await getDefaultGroup(authToken, org.id);

    const headers = await getAuthHeaders(authToken);

    // First assignment — should succeed
    const firstRes = await fetch(`${API}/forms/${form.id}/assignments`, {
      method: 'POST', headers,
      body: JSON.stringify({ groupId: group.id, mode: 'attempt_once' }),
    });
    expect([200, 201]).toContain(firstRes.status);

    // Second assignment to the same group — should fail with conflict
    const secondRes = await fetch(`${API}/forms/${form.id}/assignments`, {
      method: 'POST', headers,
      body: JSON.stringify({ groupId: group.id, mode: 'attempt_once' }),
    });
    // Accept 400 Bad Request or 409 Conflict — not 2xx
    expect(secondRes.status).toBeGreaterThanOrEqual(400);

    // Cleanup
    await fetch(`${API}/forms/${form.id}`, {
      method: 'DELETE', headers,
    }).catch(() => {});
  });

  test('GET /api/students/assignments returns array', async ({ authToken }) => {
    const res = await fetch(`${API}/students/assignments`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBeTruthy();
  });

  test('GET /api/orgs/{id}/assignments returns array', async ({ authToken }) => {
    const org = await getOrCreateOrg(authToken);
    const res = await fetch(`${API}/orgs/${org.id}/assignments`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBeTruthy();
  });

  test('GET /api/students/assignments without auth returns 401', async () => {
    const res = await fetch(`${API}/students/assignments`);
    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// Assignments — My Assignments page
// ---------------------------------------------------------------------------

test.describe('Assignments — My Assignments page', () => {
  test('/my-assignments page loads and shows heading', async ({ page }) => {
    await page.goto('/my-assignments');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: /my assignments/i })).toBeVisible({ timeout: 5000 });
  });

  test('/my-assignments page is accessible for authenticated users', async ({ page }) => {
    await page.goto('/my-assignments');
    await page.waitForLoadState('networkidle');
    // Should not redirect to login for authenticated users
    await expect(page).not.toHaveURL('/login', { timeout: 3000 });
    await expect(page.locator('body')).toBeVisible();
  });
});
