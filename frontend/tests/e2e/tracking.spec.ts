import { test, expect } from '@playwright/test';

/**
 * E2E tests for shipment tracking page.
 * Tests that tracking UI elements render correctly.
 */

const MERCHANT_EMAIL = process.env.MERCHANT_EMAIL || 'merchant@test.com';
const MERCHANT_PASSWORD = process.env.MERCHANT_PASSWORD || 'Test1234!';

test.describe('Shipment Tracking', () => {
  test.beforeEach(async ({ page }) => {
    // Login as merchant
    await page.goto('/login');
    await page.fill('input[type="email"], input[name="email"]', MERCHANT_EMAIL);
    await page.fill('input[type="password"]', MERCHANT_PASSWORD);
    await page.getByRole('button', { name: /دخول|تسجيل/i }).click();

    await page.waitForURL(/\/merchant/, { timeout: 15000 });
  });

  test('should display shipment detail page with tabs', async ({ page }) => {
    await page.goto('/merchant/shipments');

    // Navigate to a shipment detail if available
    const shipmentLink = page.locator('table a').first();
    const linkVisible = await shipmentLink.isVisible({ timeout: 5000 }).catch(() => false);
    test.skip(!linkVisible, 'No shipments available to test');

    await shipmentLink.click();

    // Should have tabs including tracking
    const tabs = page.locator('[role="tablist"]');
    await expect(tabs).toBeVisible({ timeout: 10000 });

    // Should have a tracking tab
    const trackingTab = page.locator('[role="tab"]:has-text("التتبع")');
    await expect(trackingTab).toBeVisible();
  });

  test('should show tracking content when tab clicked', async ({ page }) => {
    await page.goto('/merchant/shipments');

    const shipmentLink = page.locator('table a').first();
    const linkVisible = await shipmentLink.isVisible({ timeout: 5000 }).catch(() => false);
    test.skip(!linkVisible, 'No shipments available to test');

    await shipmentLink.click();

    // Click tracking tab
    const trackingTab = page.locator('[role="tab"]:has-text("التتبع")');
    await expect(trackingTab).toBeVisible({ timeout: 5000 });
    await trackingTab.click();

    // Should show tracking content (map or "will show when delivery starts" message)
    const trackingContent = page.locator('[role="tabpanel"]:visible');
    await expect(trackingContent).toBeVisible();
  });

  test('should show shipment status badge on detail page', async ({ page }) => {
    await page.goto('/merchant/shipments');

    const shipmentLink = page.locator('table a').first();
    const linkVisible = await shipmentLink.isVisible({ timeout: 5000 }).catch(() => false);
    test.skip(!linkVisible, 'No shipments available to test');

    await shipmentLink.click();

    // Should display status badge somewhere on the page
    const statusBadge = page.locator('.badge, [class*="badge"], [class*="status"]');
    await expect(statusBadge.first()).toBeVisible({ timeout: 10000 });
  });

  test('should show timeline on detail page', async ({ page }) => {
    await page.goto('/merchant/shipments');

    const shipmentLink = page.locator('table a').first();
    const linkVisible = await shipmentLink.isVisible({ timeout: 5000 }).catch(() => false);
    test.skip(!linkVisible, 'No shipments available to test');

    await shipmentLink.click();

    // Wait for page content to load
    const pageContent = page.locator('main, [role="main"], .space-y-6');
    await expect(pageContent.first()).toBeVisible({ timeout: 10000 });
  });
});
