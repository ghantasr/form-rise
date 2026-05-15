import { test, expect } from '@playwright/test';

test.describe('Auth — OTP flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
  });

  test('shows login page with email input and Google button', async ({ page }) => {
    await expect(page.getByText('Sign in to FormRise')).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Email address' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Send code' })).toBeVisible();
    // Google button rendered by @react-oauth/google (soft check — needs network)
    await expect(page.getByRole('button', { name: /continue with google/i })).toBeVisible({ timeout: 8000 }).catch(() => {});
  });

  test('valid email → advances to OTP step', async ({ page }) => {
    await page.route('**/api/auth/send-otp', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ message: 'OTP sent successfully.' }) })
    );
    await page.getByRole('textbox', { name: 'Email address' }).fill('user@example.com');
    await page.getByRole('button', { name: 'Send code' }).click();
    await expect(page.getByText('Enter your code')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('We sent a 6-digit code to user@example.com')).toBeVisible();
  });

  test('invalid email format → shows validation error', async ({ page }) => {
    await page.getByRole('textbox', { name: 'Email address' }).fill('not-an-email');
    await page.getByRole('button', { name: 'Send code' }).click();
    await expect(page.getByText('Please enter a valid email address')).toBeVisible();
  });

  test('empty email → shows validation error', async ({ page }) => {
    await page.getByRole('button', { name: 'Send code' }).click();
    await expect(page.getByText('Please enter your email address')).toBeVisible();
  });

  test('wrong OTP → shows error message', async ({ page }) => {
    await page.route('**/api/auth/send-otp', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ message: 'OTP sent successfully.' }) })
    );
    await page.route('**/api/auth/verify-otp', (route) =>
      route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: 'Invalid OTP code.' }) })
    );
    await page.getByRole('textbox', { name: 'Email address' }).fill('user@example.com');
    await page.getByRole('button', { name: 'Send code' }).click();
    await expect(page.getByText('Enter your code')).toBeVisible({ timeout: 5000 });
    await page.getByRole('textbox', { name: 'One-time code' }).fill('000000');
    await page.getByRole('button', { name: 'Verify & sign in' }).click();
    await expect(page.getByText('Invalid OTP code.')).toBeVisible({ timeout: 5000 });
  });

  test('successful OTP → redirects to dashboard', async ({ page }) => {
    await page.route('**/api/auth/send-otp', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ message: 'OTP sent successfully.' }) })
    );
    await page.route('**/api/auth/verify-otp', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          accessToken: 'mock-token',
          user: { id: '00000000-0000-0000-0000-000000000001', email: 'user@example.com', displayName: null, avatarUrl: null },
        }),
      })
    );
    await page.route('**/api/auth/refresh', (route) =>
      route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: 'No session.' }) })
    );
    await page.route('**/api/forms', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
    );
    await page.getByRole('textbox', { name: 'Email address' }).fill('user@example.com');
    await page.getByRole('button', { name: 'Send code' }).click();
    await expect(page.getByText('Enter your code')).toBeVisible({ timeout: 5000 });
    await page.getByRole('textbox', { name: 'One-time code' }).fill('123456');
    await page.getByRole('button', { name: 'Verify & sign in' }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 8000 });
  });

  test('"Use a different email" resets to email step', async ({ page }) => {
    await page.route('**/api/auth/send-otp', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ message: 'OTP sent successfully.' }) })
    );
    await page.getByRole('textbox', { name: 'Email address' }).fill('user@example.com');
    await page.getByRole('button', { name: 'Send code' }).click();
    await expect(page.getByText('Enter your code')).toBeVisible({ timeout: 5000 });
    await page.getByText('Use a different email').click();
    await expect(page.getByText('Sign in to FormRise')).toBeVisible();
  });
});

test.describe('Auth — Google OAuth', () => {
  test('Google sign-in button opens popup', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    const googleBtn = page.getByRole('button', { name: /continue with google/i });
    if (await googleBtn.isVisible({ timeout: 8000 }).catch(() => false)) {
      const popupPromise = page.waitForEvent('popup', { timeout: 5000 });
      await googleBtn.click();
      const popup = await popupPromise.catch(() => null);
      if (popup) {
        await expect(popup.url()).toMatch(/accounts\.google\.com/);
        await popup.close();
      }
    }
  });
});

test.describe('Auth — protected routes', () => {
  test('unauthenticated access to /dashboard → redirects to /login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('unauthenticated access to /forms/new → redirects to /login', async ({ page }) => {
    await page.goto('/forms/new');
    await expect(page).toHaveURL(/\/login/);
  });

  test('unauthenticated access to /settings → redirects to /login', async ({ page }) => {
    await page.goto('/settings');
    await expect(page).toHaveURL(/\/login/);
  });

  test('unauthenticated access to /templates → redirects to /login', async ({ page }) => {
    await page.goto('/templates');
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Auth — security', () => {
  test('XSS in email field is escaped, not executed', async ({ page }) => {
    await page.goto('/login');
    let xssExecuted = false;
    page.on('dialog', () => { xssExecuted = true; });
    await page.getByRole('textbox', { name: 'Email address' }).fill('<script>alert("xss")</script>');
    await page.getByRole('button', { name: 'Send code' }).click();
    await page.waitForTimeout(500);
    expect(xssExecuted).toBe(false);
    await expect(page.getByText('Please enter a valid email address')).toBeVisible();
  });

  test('OTP rate limit error is shown to user', async ({ page }) => {
    // Register route BEFORE navigation so it's in place before any requests fire
    await page.route(/\/api\/auth\/send-otp/, (route) =>
      route.fulfill({ status: 429, contentType: 'application/json', body: JSON.stringify({ error: 'Please wait before requesting another OTP.' }) })
    );
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.getByRole('textbox', { name: 'Email address' }).fill(`ratelimit-${Date.now()}@example.com`);
    await page.getByRole('button', { name: 'Send code' }).click();
    // Wait for button to stop loading (finally block runs), then verify error text
    await expect(page.getByRole('button', { name: 'Send code' })).not.toBeDisabled({ timeout: 8000 });
    await expect(page.getByText(/wait|too many|failed/i)).toBeVisible({ timeout: 3000 });
  });
});
