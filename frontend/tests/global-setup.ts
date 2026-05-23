import { test as setup, expect } from '@playwright/test';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUTH_FILE = path.join(__dirname, '.auth/user.json');

setup('authenticate test user', async ({ request, page }) => {
  // Create/refresh the playwright test user via dev-only endpoint
  const res = await request.post('http://localhost:5001/api/auth/dev-login');
  expect(res.ok(), `dev-login failed: ${await res.text()}`).toBeTruthy();
  const { accessToken, user } = await res.json();

  // Seed the session hint so AppInitializer attempts the refresh call
  await page.goto('/login');
  await page.evaluate(() => {
    localStorage.setItem('fr_has_session', '1');
    localStorage.setItem('fr_tour_done', '1');
    localStorage.setItem('fr_checklist_dismissed', '1');
  });

  // Mock /api/auth/refresh so the app's AppInitializer succeeds without needing
  // the HttpOnly cookie (which can't reliably cross the Vite proxy in this setup)
  await page.route('**/api/auth/refresh', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ accessToken, user }),
    })
  );

  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 8000 });

  await page.context().storageState({ path: AUTH_FILE });
});
