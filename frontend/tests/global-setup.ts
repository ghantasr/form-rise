import { test as setup, expect } from '@playwright/test';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUTH_FILE = path.join(__dirname, '.auth/user.json');

setup('authenticate test user', async ({ request, page }) => {
  // Create/refresh the playwright test user via dev-only endpoint
  const res = await request.post('http://localhost:5000/api/auth/dev-login');
  expect(res.ok(), `dev-login failed: ${await res.text()}`).toBeTruthy();

  // The refresh cookie is now set on localhost:5000 (backend).
  // We need the app (localhost:5173) to have it — drive the browser through the proxy.
  await page.goto('/login');

  // Hit the dev-login via the Vite proxy so the cookie lands on localhost:5173
  await page.evaluate(async () => {
    await fetch('/api/auth/dev-login', { method: 'POST', credentials: 'include' });
  });

  // Let the app initializer detect the session
  await page.waitForTimeout(1500);
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/dashboard/);

  await page.context().storageState({ path: AUTH_FILE });
});
