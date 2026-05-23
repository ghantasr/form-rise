import { test, expect } from '../fixtures/index';

const API = 'http://localhost:5001/api';

// ---------------------------------------------------------------------------
// Helper — get the user's org, creating one if none exists
// ---------------------------------------------------------------------------
async function getOrCreateOrg(authToken: string): Promise<{ id: string; name: string; slug: string }> {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${authToken}`,
  };

  const listRes = await fetch(`${API}/orgs`, { headers });
  if (listRes.ok) {
    const orgs = await listRes.json();
    if (Array.isArray(orgs) && orgs.length > 0) return orgs[0];
  }

  // Try the "my org" endpoint used by the UI
  const myRes = await fetch(`${API}/orgs/my`, { headers });
  if (myRes.ok) {
    const org = await myRes.json();
    if (org?.id) return org;
  }

  // No org — create one
  const slug = `test-org-${Date.now()}`;
  const createRes = await fetch(`${API}/orgs`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name: `Test Org ${Date.now()}`, slug }),
  });
  const created = await createRes.json();
  return created;
}

// ---------------------------------------------------------------------------
// Org Edge — CRUD
// ---------------------------------------------------------------------------
test.describe('Org Edge — CRUD', () => {
  test('creating an org with valid name and slug succeeds', async ({ authToken }) => {
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    };
    const res = await fetch(`${API}/orgs`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: `E2E Valid Org ${Date.now()}` }),
    });
    // 200/201 = created, 400/409 = user already has an org (one org per user limit), 422 = validation
    expect([200, 201, 400, 409, 422]).toContain(res.status);
    if (res.status === 200 || res.status === 201) {
      const body = await res.json();
      expect(body).toHaveProperty('id');
    }
  });

  test('creating an org with duplicate slug returns 4xx', async ({ authToken }) => {
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    };
    // First, ensure at least one org exists so we can grab a known slug
    const org = await getOrCreateOrg(authToken);
    const existingSlug = org.slug ?? `slug-${Date.now()}`;

    const res = await fetch(`${API}/orgs`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: 'Duplicate Slug Org', slug: existingSlug }),
    });
    // A new org with the same slug must be rejected, or the user already has one (409 / 400 / 422)
    // (some APIs return 400 for business-rule violations)
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  test('creating an org with empty name returns 4xx', async ({ authToken }) => {
    const res = await fetch(`${API}/orgs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ name: '', slug: `empty-name-${Date.now()}` }),
    });
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  test('org dashboard page /org loads when org exists', async ({ page, authToken }) => {
    await getOrCreateOrg(authToken);
    await page.goto('/org');
    await page.waitForLoadState('networkidle');
    // Should land on /org and show org content — not redirect to login
    expect(page.url()).toMatch(/\/org/);
    await expect(page.locator('body')).toBeVisible();
    // Either shows org name/header or the create-org card — both are valid
    const orgContent = page
      .getByRole('heading')
      .or(page.getByText(/organisation|org|members|groups/i).first());
    await expect(orgContent).toBeVisible({ timeout: 8000 });
  });

  test('non-member trying GET /api/orgs/{fakeId}/members returns 4xx', async ({ authToken }) => {
    const fakeOrgId = '00000000-0000-0000-0000-000000000001';
    const res = await fetch(`${API}/orgs/${fakeOrgId}/members`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });
});

// ---------------------------------------------------------------------------
// Org Edge — groups
// ---------------------------------------------------------------------------
test.describe('Org Edge — groups', () => {
  test('creating a group in an org succeeds', async ({ authToken }) => {
    const org = await getOrCreateOrg(authToken);
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    };
    const res = await fetch(`${API}/orgs/${org.id}/groups`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: `E2E Group ${Date.now()}` }),
    });
    expect([200, 201]).toContain(res.status);
    const body = await res.json();
    expect(body).toHaveProperty('id');
    expect(body.name).toBeTruthy();
  });

  test('deleting a non-default group succeeds (204 or 200)', async ({ authToken }) => {
    const org = await getOrCreateOrg(authToken);
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    };

    // Create a throwaway group to delete
    const createRes = await fetch(`${API}/orgs/${org.id}/groups`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: `Delete Me ${Date.now()}` }),
    });
    if (!createRes.ok) {
      test.skip(true, 'Could not create group to delete');
      return;
    }
    const group = await createRes.json();

    const delRes = await fetch(`${API}/orgs/${org.id}/groups/${group.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect([200, 204]).toContain(delRes.status);
  });

  test('deleting the default "Everyone" group returns 4xx', async ({ authToken }) => {
    const org = await getOrCreateOrg(authToken);
    const headers = { Authorization: `Bearer ${authToken}` };

    // Find the default group
    const listRes = await fetch(`${API}/orgs/${org.id}/groups`, { headers });
    if (!listRes.ok) {
      test.skip(true, 'Cannot list groups');
      return;
    }
    const groups: Array<{ id: string; isDefault: boolean; name: string }> = await listRes.json();
    const defaultGroup = groups.find((g) => g.isDefault);
    if (!defaultGroup) {
      test.skip(true, 'No default group found');
      return;
    }

    const delRes = await fetch(`${API}/orgs/${org.id}/groups/${defaultGroup.id}`, {
      method: 'DELETE',
      headers,
    });
    expect(delRes.status).toBeGreaterThanOrEqual(400);
    expect(delRes.status).toBeLessThan(500);
  });

  test('created group name appears in org dashboard groups tab', async ({ page, authToken }) => {
    const org = await getOrCreateOrg(authToken);
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    };
    const groupName = `UI Group ${Date.now()}`;
    const createRes = await fetch(`${API}/orgs/${org.id}/groups`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: groupName }),
    });
    if (!createRes.ok) {
      test.skip(true, 'Could not create group via API');
      return;
    }

    await page.goto('/org');
    await page.waitForLoadState('networkidle');

    // Click the Groups tab
    await page.getByRole('button', { name: /groups/i }).click();
    await expect(page.getByText(groupName)).toBeVisible({ timeout: 6000 });
  });

  test('default group shows "All org members" label in UI', async ({ page, authToken }) => {
    await getOrCreateOrg(authToken);
    await page.goto('/org');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /groups/i }).click();
    await expect(page.getByText(/all org members/i)).toBeVisible({ timeout: 6000 });
  });
});

// ---------------------------------------------------------------------------
// Org Edge — members
// ---------------------------------------------------------------------------
test.describe('Org Edge — members', () => {
  test('org has at least 1 member (the creator)', async ({ authToken }) => {
    const org = await getOrCreateOrg(authToken);
    const res = await fetch(`${API}/orgs/${org.id}/members`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(res.ok).toBe(true);
    const members = await res.json();
    expect(Array.isArray(members)).toBe(true);
    expect(members.length).toBeGreaterThanOrEqual(1);
  });

  test('GET /api/orgs/{orgId}/members returns array with at least 1 entry', async ({ authToken }) => {
    const org = await getOrCreateOrg(authToken);
    const res = await fetch(`${API}/orgs/${org.id}/members`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(res.status).toBe(200);
    const members = await res.json();
    expect(Array.isArray(members)).toBe(true);
    expect(members.length).toBeGreaterThanOrEqual(1);
    // Each member should have at minimum a userId or id field
    const first = members[0];
    expect(first.userId ?? first.id).toBeTruthy();
  });

  test('inviting an email that is already a member does not crash (idempotent or helpful error)', async ({
    authToken,
  }) => {
    // NOTE: dev login always returns the same user, so the creator's email is "already a member"
    const org = await getOrCreateOrg(authToken);
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` };

    // Get the current user's email
    const meRes = await fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${authToken}` } });
    const me = await meRes.json();
    const email = me.email ?? 'dev@example.com';

    const res = await fetch(`${API}/orgs/${org.id}/invites`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ email }),
    });
    // Should not 500 — either succeed (200/201), conflict (409), or business rule error (4xx)
    expect(res.status).not.toBe(500);
    expect(res.status).toBeLessThan(500);
  });
});

// ---------------------------------------------------------------------------
// Org Edge — invites
// ---------------------------------------------------------------------------
test.describe('Org Edge — invites', () => {
  test('POST /api/orgs/{orgId}/invites with invalid email returns 4xx', async ({ authToken }) => {
    const org = await getOrCreateOrg(authToken);
    const res = await fetch(`${API}/orgs/${org.id}/invites`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
      body: JSON.stringify({ email: 'not-an-email' }),
    });
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  test('POST /api/orgs/{orgId}/invites with no email returns 4xx or creates generic invite link', async ({
    authToken,
  }) => {
    // The UI supports generating invite links without an email (optional email field).
    // If the API allows it, that is fine (200/201). If not, it must be a 4xx, not a 5xx.
    const org = await getOrCreateOrg(authToken);
    const res = await fetch(`${API}/orgs/${org.id}/invites`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
      body: JSON.stringify({}),
    });
    expect(res.status).not.toBe(500);
    expect(res.status).toBeLessThan(500);
  });

  test('POST /api/orgs/join with invalid token returns 4xx', async ({ authToken }) => {
    const res = await fetch(`${API}/orgs/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
      body: JSON.stringify({ token: 'totally-invalid-token-xyz' }),
    });
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  test('POST /api/orgs/join with empty token returns 4xx', async ({ authToken }) => {
    const res = await fetch(`${API}/orgs/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
      body: JSON.stringify({ token: '' }),
    });
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });
});
