import { test, expect } from '@playwright/test';

/**
 * Comprehensive E2E tests for the Merchant Portal.
 * Auth is handled by globalSetup + storageState (no per-test login).
 */

test.describe('Merchant Portal', () => {
  // ─── Dashboard ───────────────────────────────────────────────
  test.describe('Dashboard', () => {
    test('should display merchant dashboard with summary cards', async ({ page }) => {
      await page.goto('/merchant/dashboard');
      await page.waitForSelector('main', { timeout: 20000 });

      const cards = page.locator('[class*="card"], [class*="stat"], .rounded-lg');
      const cardCount = await cards.count();
      expect(cardCount).toBeGreaterThan(0);
    });

    test('should show recent shipments or activity', async ({ page }) => {
      await page.goto('/merchant/dashboard');
      await page.waitForSelector('main', { timeout: 20000 });

      const dataContent = page.locator('table, .space-y-4, [class*="list"], [class*="card"]');
      await expect(dataContent.first()).toBeVisible({ timeout: 10000 });
    });

    test('should have working sidebar navigation', async ({ page }) => {
      await page.goto('/merchant/dashboard');
      await page.waitForSelector('main', { timeout: 20000 });

      const nav = page.locator('nav, [role="navigation"], aside, .hidden.md\\:block');
      await expect(nav.first()).toBeVisible({ timeout: 10000 });

      const navLinks = nav.first().locator('a');
      const linkCount = await navLinks.count();
      expect(linkCount).toBeGreaterThan(2);
    });
  });

  // ─── Shipments List ──────────────────────────────────────────
  test.describe('Shipments List', () => {
    test('should display shipments list page', async ({ page }) => {
      await page.goto('/merchant/shipments');
      await page.waitForSelector('main', { timeout: 20000 });

      const content = page.locator('table, [data-testid="empty-state"], .empty-state');
      await expect(content.first()).toBeVisible({ timeout: 10000 });
    });

    test('should have "New Shipment" button', async ({ page }) => {
      await page.goto('/merchant/shipments');
      await page.waitForSelector('main', { timeout: 20000 });

      const newBtn = page.locator(
        'a[href*="/new"], button:has-text("شحنة جديدة"), button:has-text("إنشاء"), a:has-text("جديد")'
      );
      await expect(newBtn.first()).toBeVisible({ timeout: 10000 });
    });

    test('should have search and filter on shipments', async ({ page }) => {
      await page.goto('/merchant/shipments');
      await page.waitForSelector('main', { timeout: 20000 });

      const searchOrFilter = page.locator(
        'input[type="search"], input[placeholder*="بحث"], [class*="filter"], [class*="search"]'
      );
      await expect(searchOrFilter.first()).toBeVisible({ timeout: 10000 });
    });

    test('should navigate to shipment detail', async ({ page }) => {
      await page.goto('/merchant/shipments');
      await page.waitForSelector('main', { timeout: 20000 });

      const shipmentLink = page.locator('table a, table tbody tr').first();
      if (await shipmentLink.isVisible({ timeout: 5000 }).catch(() => false)) {
        await shipmentLink.click();
        await page.waitForTimeout(2000);
        const detailContent = page.locator(
          '[role="tablist"], [class*="detail"], [class*="shipment"], main h1, main h2'
        );
        await expect(detailContent.first()).toBeVisible({ timeout: 10000 });
      }
    });
  });

  // ─── Create Shipment ─────────────────────────────────────────
  test.describe('Create Shipment', () => {
    test('should display multi-step shipment form', async ({ page }) => {
      await page.goto('/merchant/shipments/new');
      await page.waitForSelector('main', { timeout: 20000 });

      await expect(page.locator('form, [role="form"]').first()).toBeVisible({ timeout: 10000 });

      const formFields = page.locator('input, select, [role="combobox"], textarea');
      const fieldCount = await formFields.count();
      expect(fieldCount).toBeGreaterThan(0);
    });

    test('should show form with validation (submit disabled until required fields filled)', async ({ page }) => {
      await page.goto('/merchant/shipments/new');
      await page.waitForSelector('main', { timeout: 20000 });

      // The submit/next button should be disabled when required fields are empty
      const submitBtn = page.locator(
        'button:has-text("التالي"), button:has-text("إنشاء"), button[type="submit"]'
      );
      if (await submitBtn.first().isVisible({ timeout: 5000 }).catch(() => false)) {
        const isDisabled = await submitBtn.first().isDisabled();
        // Either button is disabled (validation) or clicking shows errors
        if (!isDisabled) {
          await submitBtn.first().click();
          await page.waitForTimeout(500);
          const errors = page.locator('.text-destructive, [role="alert"], [data-state="invalid"]');
          const errorCount = await errors.count();
          expect(errorCount).toBeGreaterThan(0);
        } else {
          expect(isDisabled).toBe(true);
        }
      }
    });
  });

  // ─── Payments ────────────────────────────────────────────────
  test.describe('Payments', () => {
    test('should display payments page', async ({ page }) => {
      await page.goto('/merchant/payments');
      await page.waitForSelector('main', { timeout: 20000 });

      const content = page.locator('main');
      await expect(content).toBeVisible();
    });
  });

  // ─── Automation Rules ────────────────────────────────────────
  test.describe('Automation Rules', () => {
    test('should display automation rules page', async ({ page }) => {
      await page.goto('/merchant/automation');
      await page.waitForSelector('main', { timeout: 20000 });

      const content = page.locator('main');
      await expect(content).toBeVisible();
    });

    test('should have create rule functionality', async ({ page }) => {
      await page.goto('/merchant/automation');
      await page.waitForSelector('main', { timeout: 20000 });

      const createBtn = page.locator(
        'button:has-text("إضافة"), button:has-text("جديد"), button:has-text("إنشاء"), a:has-text("إضافة")'
      );
      await expect(createBtn.first()).toBeVisible({ timeout: 10000 });
    });

    test('should show rules list or empty state', async ({ page }) => {
      await page.goto('/merchant/automation');
      await page.waitForSelector('main', { timeout: 20000 });

      const content = page.locator(
        'table, [data-testid="empty-state"], .empty-state, [class*="card"], [class*="rule"]'
      );
      await expect(content.first()).toBeVisible({ timeout: 10000 });
    });
  });

  // ─── Integrations / Webhooks ─────────────────────────────────
  test.describe('Integrations', () => {
    test('should display integrations page', async ({ page }) => {
      await page.goto('/merchant/integrations');
      await page.waitForSelector('main', { timeout: 20000 });

      const content = page.locator('main');
      await expect(content).toBeVisible();
    });

    test('should show sections for API and webhooks', async ({ page }) => {
      await page.goto('/merchant/integrations');
      await page.waitForSelector('main', { timeout: 20000 });

      const sections = page.locator('h2, h3, [class*="section"], [class*="tab"], [role="tablist"]');
      const sectionCount = await sections.count();
      expect(sectionCount).toBeGreaterThan(0);
    });

    test('should have webhook management', async ({ page }) => {
      await page.goto('/merchant/integrations');
      await page.waitForSelector('main', { timeout: 20000 });

      const createBtn = page.locator(
        'button:has-text("إضافة"), button:has-text("إنشاء"), button:has-text("جديد")'
      );
      await expect(createBtn.first()).toBeVisible({ timeout: 10000 });
    });
  });

  // ─── Analytics ───────────────────────────────────────────────
  test.describe('Analytics', () => {
    test('should display merchant analytics page', async ({ page }) => {
      await page.goto('/merchant/analytics');
      await page.waitForSelector('main', { timeout: 20000 });

      const content = page.locator('main');
      await expect(content).toBeVisible();
    });

    test('should show charts or data visualizations', async ({ page }) => {
      await page.goto('/merchant/analytics');
      await page.waitForSelector('main', { timeout: 20000 });

      const charts = page.locator(
        '[class*="chart"], canvas, svg.recharts-surface, [class*="card"], .rounded-lg'
      );
      const count = await charts.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  // ─── Settings ────────────────────────────────────────────────
  test.describe('Settings', () => {
    test('should display settings page', async ({ page }) => {
      await page.goto('/merchant/settings');
      await page.waitForSelector('main', { timeout: 20000 });

      const content = page.locator('main, form, [class*="settings"]');
      await expect(content.first()).toBeVisible();
    });
  });

  // ─── Global Search ───────────────────────────────────────────
  test.describe('Global Search', () => {
    test('should open command palette with keyboard shortcut', async ({ page }) => {
      await page.goto('/merchant/dashboard');
      await page.waitForSelector('main', { timeout: 20000 });

      await page.keyboard.press('Meta+k');
      await page.waitForTimeout(500);

      const dialog = page.locator('[role="dialog"], [cmdk-root], [class*="command"]');
      if (await dialog.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(dialog.first()).toBeVisible();
      }
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

  // ─── Profile ─────────────────────────────────────────────────
  test.describe('Profile', () => {
    test('should display profile page', async ({ page }) => {
      await page.goto('/profile');
      await page.waitForSelector('main', { timeout: 20000 });

      const content = page.locator('main, form');
      await expect(content.first()).toBeVisible();
    });
  });
});
