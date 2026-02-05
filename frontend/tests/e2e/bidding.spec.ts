import { test, expect } from '@playwright/test';

/**
 * E2E tests for truck owner bid submission flow.
 * Requires a running backend with a valid truck owner user.
 */

const TRUCK_OWNER_EMAIL = process.env.TRUCK_OWNER_EMAIL || 'truckowner@test.com';
const TRUCK_OWNER_PASSWORD = process.env.TRUCK_OWNER_PASSWORD || 'Test1234!';

test.describe('Bid Submission Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as truck owner
    await page.goto('/login');
    await page.fill('input[type="email"], input[name="email"]', TRUCK_OWNER_EMAIL);
    await page.fill('input[type="password"]', TRUCK_OWNER_PASSWORD);
    await page.getByRole('button', { name: /دخول|تسجيل/i }).click();

    // Wait for redirect to truck-owner dashboard
    await page.waitForURL(/\/truck-owner/, { timeout: 15000 });
  });

  test('should display available shipments list', async ({ page }) => {
    await page.goto('/truck-owner/shipments');

    // Should show shipments table or empty state
    const content = page.locator('table, [data-testid="empty-state"], .empty-state');
    await expect(content.first()).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to shipment detail from list', async ({ page }) => {
    await page.goto('/truck-owner/shipments');

    // If there are shipments, click on one
    const shipmentLink = page.locator('table a, table tr[data-clickable]').first();
    if (await shipmentLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await shipmentLink.click();
      await expect(page).toHaveURL(/\/truck-owner\/shipments\/.+/);
    }
  });

  test('should display applications list', async ({ page }) => {
    await page.goto('/truck-owner/applications');

    // Should show applications table or empty state
    const content = page.locator('table, [data-testid="empty-state"], .empty-state');
    await expect(content.first()).toBeVisible({ timeout: 10000 });
  });

  test('should display fleet management page', async ({ page }) => {
    await page.goto('/truck-owner/fleet');

    // Should show fleet data (trucks list or empty state)
    const content = page.locator('table, [data-testid="empty-state"], .empty-state, .grid');
    await expect(content.first()).toBeVisible({ timeout: 10000 });
  });
});
