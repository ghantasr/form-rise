import { test, expect } from '../fixtures/index';

const API = 'http://localhost:5001/api';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getDevToken(): Promise<string> {
  const res = await fetch(`${API}/auth/dev-login`, { method: 'POST' });
  const data = await res.json();
  return data.accessToken;
}

async function ensureOrg(authToken: string): Promise<{ id: string; name: string }> {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${authToken}`,
  };
  const myRes = await fetch(`${API}/orgs/my`, { headers });
  if (myRes.ok) {
    const org = await myRes.json();
    if (org?.id) return org;
  }
  const createRes = await fetch(`${API}/orgs`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name: `Playwright Org ${Date.now()}` }),
  });
  return createRes.json();
}

// ---------------------------------------------------------------------------
// Org dashboard — page load
// ---------------------------------------------------------------------------

test.describe('Org — page navigation', () => {
  test('/org page loads without redirecting to login', async ({ page }) => {
    await page.goto('/org');
    await page.waitForLoadState('networkidle');
    await expect(page).not.toHaveURL('/login');
  });

  test('/org page shows org-related content or create CTA', async ({ page }) => {
    await page.goto('/org');
    await page.waitForLoadState('networkidle');
    const hasCreateCta = await page
      .getByText(/create.*org|start.*org|new org/i)
      .first()
      .isVisible()
      .catch(() => false);
    const hasOrgDashboard = await page
      .getByText(/members|organization|groups|assignments/i)
      .first()
      .isVisible()
      .catch(() => false);
    expect(hasCreateCta || hasOrgDashboard).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Org dashboard — tabs (requires an org to exist)
// ---------------------------------------------------------------------------

test.describe('Org — dashboard tabs', () => {
  test.beforeAll(async () => {
    const token = await getDevToken();
    await ensureOrg(token);
  });

  test('Members tab is visible in org dashboard', async ({ page }) => {
    await page.goto('/org');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Members', { exact: false })).toBeVisible({ timeout: 5000 });
  });

  test('Groups tab is visible in org dashboard', async ({ page }) => {
    await page.goto('/org');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Groups', { exact: false }).first()).toBeVisible({ timeout: 5000 });
  });

  test('Assignments tab is visible in org dashboard', async ({ page }) => {
    await page.goto('/org');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Assignments', { exact: false }).first()).toBeVisible({ timeout: 5000 });
  });

  test('clicking Groups tab switches to groups view', async ({ page }) => {
    await page.goto('/org');
    await page.waitForLoadState('networkidle');
    const groupsTab = page
      .getByRole('button', { name: 'Groups' })
      .or(page.getByRole('tab', { name: 'Groups' }))
      .first();
    await groupsTab.click();
    await page.waitForTimeout(500);
    const hasNewGroup = await page.getByText(/new group/i).isVisible().catch(() => false);
    const hasGroupContent = await page.getByText(/group|no groups/i).isVisible().catch(() => false);
    expect(hasNewGroup || hasGroupContent).toBeTruthy();
  });

  test('clicking Assignments tab switches to assignments view', async ({ page }) => {
    await page.goto('/org');
    await page.waitForLoadState('networkidle');
    const assignTab = page
      .getByRole('button', { name: 'Assignments' })
      .or(page.getByRole('tab', { name: 'Assignments' }))
      .first();
    await assignTab.click();
    await page.waitForTimeout(500);
    await expect(page.getByText(/assignments|no assignments/i).first()).toBeVisible({ timeout: 3000 });
  });

  test('Invite button is visible on Members tab', async ({ page }) => {
    await page.goto('/org');
    await page.waitForLoadState('networkidle');
    const membersTab = page
      .getByRole('button', { name: 'Members' })
      .or(page.getByRole('tab', { name: 'Members' }))
      .first();
    await membersTab.click();
    await page.waitForTimeout(400);
    await expect(page.getByRole('button', { name: 'Invite' })).toBeVisible({ timeout: 3000 });
  });
});

// ---------------------------------------------------------------------------
// Org — group management
// ---------------------------------------------------------------------------

test.describe('Org — group management', () => {
  test.beforeAll(async () => {
    const token = await getDevToken();
    await ensureOrg(token);
  });

  test('can create a new group via the UI', async ({ page }) => {
    await page.goto('/org');
    await page.waitForLoadState('networkidle');

    const groupsTab = page
      .getByRole('button', { name: 'Groups' })
      .or(page.getByRole('tab', { name: 'Groups' }))
      .first();
    await groupsTab.click();
    await page.waitForTimeout(400);

    await page.getByRole('button', { name: /new group/i }).click();
    await page.waitForTimeout(300);

    const groupNameInput = page
      .getByPlaceholder(/group name|name/i)
      .or(page.locator('dialog input, [role="dialog"] input'))
      .first();
    const groupName = `PW Group ${Date.now()}`;
    await groupNameInput.fill(groupName);

    const confirmBtn = page.getByRole('button', { name: /create|save|add/i }).last();
    await confirmBtn.click();
    await page.waitForTimeout(800);

    await expect(page.getByText(groupName)).toBeVisible({ timeout: 5000 });
  });

  test('group created via API appears in the groups list', async ({ page, authToken }) => {
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    };
    const org = await ensureOrg(authToken);
    const groupName = `API Group ${Date.now()}`;

    await fetch(`${API}/orgs/${org.id}/groups`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: groupName }),
    });

    await page.goto('/org');
    await page.waitForLoadState('networkidle');

    const groupsTab = page
      .getByRole('button', { name: 'Groups' })
      .or(page.getByRole('tab', { name: 'Groups' }))
      .first();
    await groupsTab.click();
    await page.waitForTimeout(500);

    await expect(page.getByText(groupName)).toBeVisible({ timeout: 5000 });
  });
});

// ---------------------------------------------------------------------------
// Org — member invitation flow (UI smoke test)
// ---------------------------------------------------------------------------

test.describe('Org — member invitation', () => {
  test.beforeAll(async () => {
    const token = await getDevToken();
    await ensureOrg(token);
  });

  test('clicking Invite opens an invite dialog or input', async ({ page }) => {
    await page.goto('/org');
    await page.waitForLoadState('networkidle');

    const membersTab = page
      .getByRole('button', { name: 'Members' })
      .or(page.getByRole('tab', { name: 'Members' }))
      .first();
    await membersTab.click();
    await page.waitForTimeout(400);

    await page.getByRole('button', { name: 'Invite' }).click();
    await page.waitForTimeout(400);

    const hasEmailInput = await page
      .locator('input[type="email"], input[placeholder*="email" i]')
      .isVisible()
      .catch(() => false);
    const hasDialog = await page.locator('dialog, [role="dialog"]').isVisible().catch(() => false);
    expect(hasEmailInput || hasDialog).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Org — API-level checks
// ---------------------------------------------------------------------------

test.describe('Org — API', () => {
  test('GET /orgs/my returns org data when org exists', async ({ authToken }) => {
    const org = await ensureOrg(authToken);
    const res = await fetch(`${API}/orgs/my`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(res.ok).toBeTruthy();
    const data = await res.json();
    expect(data.id).toBe(org.id);
    expect(data.name).toBeTruthy();
  });

  test('GET /orgs/{id}/members returns a list with at least one member', async ({ authToken }) => {
    const org = await ensureOrg(authToken);
    const res = await fetch(`${API}/orgs/${org.id}/members`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(res.ok).toBeTruthy();
    const data = await res.json();
    expect(Array.isArray(data)).toBeTruthy();
    expect(data.length).toBeGreaterThan(0);
  });

  test('GET /orgs/{id}/groups returns an array', async ({ authToken }) => {
    const org = await ensureOrg(authToken);
    const res = await fetch(`${API}/orgs/${org.id}/groups`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(res.ok).toBeTruthy();
    const data = await res.json();
    expect(Array.isArray(data)).toBeTruthy();
  });

  test('creating a group via API returns the new group with an id', async ({ authToken }) => {
    const org = await ensureOrg(authToken);
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    };
    const res = await fetch(`${API}/orgs/${org.id}/groups`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: `PW API Group ${Date.now()}` }),
    });
    expect([200, 201]).toContain(res.status);
    const group = await res.json();
    expect(group.id).toBeTruthy();
    expect(group.name).toBeTruthy();
  });

  test('GET /orgs/my without auth returns 401', async () => {
    const res = await fetch(`${API}/orgs/my`);
    expect(res.status).toBe(401);
  });
});
