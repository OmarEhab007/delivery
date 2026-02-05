import { defineConfig, devices } from '@playwright/test';
import path from 'path';

const authDir = path.resolve(__dirname, 'tests/e2e/.auth');

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  globalSetup: './tests/e2e/global-setup.ts',
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    // ── Portal-specific projects (pre-authenticated) ──
    {
      name: 'admin',
      testMatch: /admin-portal\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: path.join(authDir, 'admin-storage.json'),
      },
    },
    {
      name: 'merchant',
      testMatch: /merchant-portal\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: path.join(authDir, 'merchant-storage.json'),
      },
    },
    {
      name: 'truckowner',
      testMatch: /truckowner-portal\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: path.join(authDir, 'truckowner-storage.json'),
      },
    },
    {
      name: 'driver',
      testMatch: /driver-portal\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: path.join(authDir, 'driver-storage.json'),
      },
    },
    // ── Generic tests (no pre-auth, e.g. auth flow tests) ──
    {
      name: 'chromium',
      testIgnore: /.*-portal\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      testIgnore: /.*-portal\.spec\.ts/,
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      testIgnore: /.*-portal\.spec\.ts/,
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      testIgnore: /.*-portal\.spec\.ts/,
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      testIgnore: /.*-portal\.spec\.ts/,
      use: { ...devices['iPhone 12'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3001',
    reuseExistingServer: !process.env.CI,
  },
});
