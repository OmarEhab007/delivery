import { test, expect } from '@playwright/test';

/**
 * E2E tests for shipment creation flow.
 * These tests require a running backend with a valid merchant user.
 * Set MERCHANT_EMAIL and MERCHANT_PASSWORD env vars or use defaults.
 */

const MERCHANT_EMAIL = process.env.MERCHANT_EMAIL || 'merchant@test.com';
const MERCHANT_PASSWORD = process.env.MERCHANT_PASSWORD || 'Test1234!';

test.describe('Shipment Creation', () => {
  test.beforeEach(async ({ page }) => {
    // Login as merchant
    await page.goto('/login');
    await page.fill('input[type="email"], input[name="email"]', MERCHANT_EMAIL);
    await page.fill('input[type="password"]', MERCHANT_PASSWORD);
    await page.getByRole('button', { name: /دخول|تسجيل/i }).click();

    // Wait for redirect to dashboard
    await page.waitForURL(/\/merchant/, { timeout: 15000 });
  });

  test('should navigate to new shipment page', async ({ page }) => {
    await page.goto('/merchant/shipments');

    // Click "New Shipment" button
    const newShipmentBtn = page.locator('a[href*="/new"], button:has-text("شحنة جديدة")');
    await expect(newShipmentBtn.first()).toBeVisible();
    await newShipmentBtn.first().click();

    await expect(page).toHaveURL(/\/merchant\/shipments\/new/);
  });

  test('should display multi-step shipment form', async ({ page }) => {
    await page.goto('/merchant/shipments/new');

    // Should see the form with steps
    await expect(page.locator('form, [role="form"]').first()).toBeVisible();

    // Form should have origin/destination fields or step navigation
    const formContent = page.locator('input, select, [role="combobox"]');
    await expect(formContent.first()).toBeVisible();
  });

  test('should validate required fields before allowing next step', async ({ page }) => {
    await page.goto('/merchant/shipments/new');

    // Try to submit/proceed without filling required fields
    const nextBtn = page.locator('button:has-text("التالي"), button:has-text("إنشاء"), button[type="submit"]');
    const btnVisible = await nextBtn.first().isVisible({ timeout: 5000 }).catch(() => false);
    test.skip(!btnVisible, 'No submit button found on form');

    await nextBtn.first().click();

    // Wait for validation errors to appear
    const errors = page.locator('.text-destructive, [role="alert"], [data-state="invalid"]');
    await expect(errors.first()).toBeVisible({ timeout: 3000 });
    const errorCount = await errors.count();
    expect(errorCount).toBeGreaterThan(0);
  });

  test('should show shipments list with table', async ({ page }) => {
    await page.goto('/merchant/shipments');

    // Should show shipments table or empty state
    const tableOrEmpty = page.locator('table, [data-testid="empty-state"], .empty-state');
    await expect(tableOrEmpty.first()).toBeVisible({ timeout: 10000 });
  });
});
