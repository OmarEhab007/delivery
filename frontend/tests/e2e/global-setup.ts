/**
 * Global setup: logs in once per role and saves browser storage state.
 * Tests then reuse these states to avoid redundant logins and rate limiting.
 */

import { chromium, type FullConfig } from '@playwright/test';
import path from 'path';

interface TestUser {
  email: string;
  password: string;
  role: string;
  urlPattern: RegExp;
  storageFile: string;
}

const users: TestUser[] = [
  {
    email: process.env.ADMIN_EMAIL || 'admin@deliveryapp.com',
    password: process.env.ADMIN_PASSWORD || 'admin123456',
    role: 'admin',
    urlPattern: /\/admin/,
    storageFile: 'admin-storage.json',
  },
  {
    email: process.env.MERCHANT_EMAIL || 'merchant@test.com',
    password: process.env.MERCHANT_PASSWORD || 'Test12345',
    role: 'merchant',
    urlPattern: /\/merchant/,
    storageFile: 'merchant-storage.json',
  },
  {
    email: process.env.TRUCK_OWNER_EMAIL || 'truckowner2@test.com',
    password: process.env.TRUCK_OWNER_PASSWORD || 'Test12345',
    role: 'truckowner',
    urlPattern: /\/truck-owner/,
    storageFile: 'truckowner-storage.json',
  },
  {
    email: process.env.DRIVER_EMAIL || 'driver@test.com',
    password: process.env.DRIVER_PASSWORD || 'Test12345',
    role: 'driver',
    urlPattern: /\/driver/,
    storageFile: 'driver-storage.json',
  },
];

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';

async function globalSetup(config: FullConfig) {
  const storageDir = path.resolve(__dirname, '.auth');

  const browser = await chromium.launch();

  for (const user of users) {
    const context = await browser.newContext({ baseURL: BASE_URL });
    const page = await context.newPage();

    try {
      await page.goto('/login', { waitUntil: 'networkidle' });
      await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 });
      await page.fill('input[type="email"], input[name="email"]', user.email);
      await page.fill('input[type="password"]', user.password);
      await page.getByRole('button', { name: /دخول|تسجيل/i }).click();
      await page.waitForURL(user.urlPattern, { timeout: 30000 });
      await page.waitForSelector('main', { timeout: 20000 });

      const storagePath = path.join(storageDir, user.storageFile);
      await context.storageState({ path: storagePath });
      console.log(`  [auth] ${user.role} login saved to ${user.storageFile}`);
    } catch (err) {
      console.error(`  [auth] Failed to login as ${user.role} (${user.email}):`, err);
      throw err;
    } finally {
      await context.close();
    }
  }

  await browser.close();
}

export default globalSetup;
