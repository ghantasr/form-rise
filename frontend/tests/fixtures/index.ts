import { test as base, expect, Page } from '@playwright/test';

export type FormData = { id: string; slug?: string };

const API = 'http://localhost:5001/api';

export const test = base.extend<{
  authToken: string;
  apiRequest: ReturnType<typeof base.extend> extends infer T ? any : any;
  createTestForm: (title?: string, publish?: boolean) => Promise<FormData>;
}>({
  // Get a fresh JWT for each test — avoids rotating-token invalidation across tests
  authToken: async ({}, use) => {
    const res = await fetch(`${API}/auth/dev-login`, { method: 'POST' });
    const data = await res.json();
    await use(data.accessToken);
  },

  // Override page to mock the refresh endpoint so the app authenticates without cookies
  page: async ({ page, authToken }, use) => {
    // Get current user profile using the fresh token
    const meRes = await fetch(`${API}/auth/me`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const user = await meRes.json();

    // Mock /api/auth/refresh so the app's AppInitializer succeeds every time
    await page.route('**/api/auth/refresh', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ accessToken: authToken, user }),
      })
    );

    // Dismiss tour and checklist so they don't block interactions; set session flag so AppInitializer attempts refresh
    await page.addInitScript(() => {
      localStorage.setItem('fr_has_session', '1');
      localStorage.setItem('fr_tour_done', '1');
      localStorage.setItem('fr_checklist_dismissed', '1');
    });

    await use(page);
  },

  // Expose the base request for public API calls (e.g. form submission, no JWT needed)
  apiRequest: async ({ request }, use) => {
    await use(request);
  },

  createTestForm: async ({ authToken }, use) => {
    const created: string[] = [];
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    };

    const factory = async (title = `Test Form ${Date.now()}`, publish = false): Promise<FormData> => {
      const createRes = await fetch(`${API}/forms`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ title, description: '' }),
      });
      const form = await createRes.json();
      created.push(form.id);

      if (publish) {
        await fetch(`${API}/forms/${form.id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            title,
            description: '',
            fields: [{ id: crypto.randomUUID(), type: 'text', label: 'Name', required: false, order: 0 }],
          }),
        });
        const pubRes = await fetch(`${API}/forms/${form.id}/publish`, { method: 'POST', headers });
        const pubData = await pubRes.json();
        return { id: form.id, slug: pubData.slug };
      }

      return { id: form.id };
    };

    await use(factory);

    for (const id of created) {
      await fetch(`${API}/forms/${id}`, { method: 'DELETE', headers }).catch(() => {});
    }
  },
});

export { expect };
