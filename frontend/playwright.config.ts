import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['html', { open: 'never' }], ['list'], ['json', { outputFile: 'playwright-report/results.json' }]],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'setup',
      testDir: './tests',
      testMatch: /global-setup\.ts/,
    },
    {
      name: 'authenticated',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/.auth/user.json',
      },
      dependencies: ['setup'],
      testIgnore: /security\.spec\.ts|auth\.spec\.ts|auth-edge\.spec\.ts|form-fill\.spec\.ts|templates\.spec\.ts/,
    },
    {
      name: 'public',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
      testMatch: /auth\.spec\.ts|auth-edge\.spec\.ts|form-fill\.spec\.ts|templates\.spec\.ts|security\.spec\.ts/,
    },
  ],
});
