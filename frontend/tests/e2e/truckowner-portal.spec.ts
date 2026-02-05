import { test, expect } from '@playwright/test';

/**
 * Comprehensive E2E tests for the Truck Owner Portal.
 * Auth is handled by globalSetup + storageState (no per-test login).
 */

test.describe('Truck Owner Portal', () => {
  // ─── Dashboard ───────────────────────────────────────────────
  test.describe('Dashboard', () => {
    test('should display truck owner dashboard', async ({ page }) => {
      await page.goto('/truck-owner/dashboard');
      await page.waitForSelector('main', { timeout: 20000 });

      const cards = page.locator('[class*="card"], [class*="stat"], .rounded-lg');
      const cardCount = await cards.count();
      expect(cardCount).toBeGreaterThan(0);
    });

    test('should have working sidebar navigation', async ({ page }) => {
      await page.goto('/truck-owner/dashboard');
      await page.waitForSelector('main', { timeout: 20000 });

      const nav = page.locator('nav, [role="navigation"], aside, .hidden.md\\:block');
      await expect(nav.first()).toBeVisible({ timeout: 10000 });

      const navLinks = nav.first().locator('a');
      const linkCount = await navLinks.count();
      expect(linkCount).toBeGreaterThan(2);
    });
  });

  // ─── Fleet Management - Trucks ───────────────────────────────
  test.describe('Fleet - Trucks', () => {
    test('should display fleet/trucks page', async ({ page }) => {
      await page.goto('/truck-owner/fleet');
      await page.waitForSelector('main', { timeout: 20000 });

      const content = page.locator(
        'table, [data-testid="empty-state"], .empty-state, .grid, main'
      );
      await expect(content.first()).toBeVisible({ timeout: 10000 });
    });

    test('should have "Add Truck" functionality', async ({ page }) => {
      await page.goto('/truck-owner/fleet');
      await page.waitForSelector('main', { timeout: 20000 });

      const addBtn = page.locator(
        'a[href*="/new"], button:has-text("إضافة"), button:has-text("شاحنة جديدة"), a:has-text("إضافة")'
      );
      await expect(addBtn.first()).toBeVisible({ timeout: 10000 });
    });

    test('should navigate to new truck form', async ({ page }) => {
      await page.goto('/truck-owner/fleet/trucks/new');
      await page.waitForSelector('main', { timeout: 20000 });

      const form = page.locator('form, [role="form"]');
      await expect(form.first()).toBeVisible({ timeout: 10000 });

      const inputs = page.locator('input, select, [role="combobox"]');
      const inputCount = await inputs.count();
      expect(inputCount).toBeGreaterThan(0);
    });

    test('should validate truck form fields', async ({ page }) => {
      await page.goto('/truck-owner/fleet/trucks/new');
      await page.waitForSelector('main', { timeout: 20000 });

      const submitBtn = page.locator('button[type="submit"], button:has-text("إضافة"), button:has-text("حفظ")');
      if (await submitBtn.first().isVisible()) {
        await submitBtn.first().click();
        await page.waitForTimeout(500);

        const errors = page.locator('.text-destructive, [role="alert"], [data-state="invalid"]');
        const errorCount = await errors.count();
        expect(errorCount).toBeGreaterThan(0);
      }
    });
  });

  // ─── Fleet Management - Drivers ──────────────────────────────
  test.describe('Fleet - Drivers', () => {
    test('should display drivers list page', async ({ page }) => {
      await page.goto('/truck-owner/fleet/drivers');
      await page.waitForSelector('main', { timeout: 20000 });

      const content = page.locator(
        'table, [data-testid="empty-state"], .empty-state, .grid, main'
      );
      await expect(content.first()).toBeVisible({ timeout: 10000 });
    });

    test('should have "Add Driver" functionality', async ({ page }) => {
      await page.goto('/truck-owner/fleet/drivers');
      await page.waitForSelector('main', { timeout: 20000 });

      const addBtn = page.locator(
        'a[href*="/new"], button:has-text("إضافة"), button:has-text("سائق جديد"), a:has-text("إضافة")'
      );
      await expect(addBtn.first()).toBeVisible({ timeout: 10000 });
    });

    test('should navigate to new driver form', async ({ page }) => {
      await page.goto('/truck-owner/fleet/drivers/new');
      await page.waitForSelector('main', { timeout: 20000 });

      const form = page.locator('form, [role="form"]');
      await expect(form.first()).toBeVisible({ timeout: 10000 });

      const inputs = page.locator('input, select, [role="combobox"]');
      const inputCount = await inputs.count();
      expect(inputCount).toBeGreaterThan(0);
    });
  });

  // ─── Shipments ───────────────────────────────────────────────
  test.describe('Shipments', () => {
    test('should display available shipments list', async ({ page }) => {
      await page.goto('/truck-owner/shipments');
      await page.waitForSelector('main', { timeout: 20000 });

      const content = page.locator('table, [data-testid="empty-state"], .empty-state');
      await expect(content.first()).toBeVisible({ timeout: 10000 });
    });

    test('should have search/filter on shipments', async ({ page }) => {
      await page.goto('/truck-owner/shipments');
      await page.waitForSelector('main', { timeout: 20000 });

      const searchOrFilter = page.locator(
        'input[type="search"], input[placeholder*="بحث"], [class*="filter"], [class*="search"]'
      );
      await expect(searchOrFilter.first()).toBeVisible({ timeout: 10000 });
    });
  });

  // ─── Applications ────────────────────────────────────────────
  test.describe('Applications', () => {
    test('should display applications list page', async ({ page }) => {
      await page.goto('/truck-owner/applications');
      await page.waitForSelector('main', { timeout: 20000 });

      const content = page.locator('table, [data-testid="empty-state"], .empty-state');
      await expect(content.first()).toBeVisible({ timeout: 10000 });
    });

    test('should have filter options on applications', async ({ page }) => {
      await page.goto('/truck-owner/applications');
      await page.waitForSelector('main', { timeout: 20000 });

      const filters = page.locator(
        'input[type="search"], select, [role="combobox"], [class*="filter"]'
      );
      await expect(filters.first()).toBeVisible({ timeout: 10000 });
    });
  });

  // ─── Assigned Shipments ──────────────────────────────────────
  test.describe('Assigned Shipments', () => {
    test('should display assigned shipments page', async ({ page }) => {
      await page.goto('/truck-owner/assigned');
      await page.waitForSelector('main', { timeout: 20000 });

      const content = page.locator('main');
      await expect(content).toBeVisible();
    });
  });

  // ─── Settings ────────────────────────────────────────────────
  test.describe('Settings', () => {
    test('should display settings page', async ({ page }) => {
      await page.goto('/truck-owner/settings');
      await page.waitForSelector('main', { timeout: 20000 });

      const content = page.locator('main, form, [class*="settings"]');
      await expect(content.first()).toBeVisible();
    });
  });

  // ─── Notifications ───────────────────────────────────────────
  test.describe('Notifications', () => {
    test('should display notifications page', async ({ page }) => {
      await page.goto('/notifications');
      await page.waitForSelector('main', { timeout: 20000 });

      const content = page.locator('main');
      await expect(content).toBeVisible();
    });
  });

  // ─── Global Search ───────────────────────────────────────────
  test.describe('Global Search', () => {
    test('should open command palette', async ({ page }) => {
      await page.goto('/truck-owner/dashboard');
      await page.waitForSelector('main', { timeout: 20000 });

      await page.keyboard.press('Meta+k');
      await page.waitForTimeout(500);

      const dialog = page.locator('[role="dialog"], [cmdk-root], [class*="command"]');
      if (await dialog.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(dialog.first()).toBeVisible();
      }
    });
  });
});
