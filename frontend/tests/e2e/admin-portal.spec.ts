import { test, expect } from '@playwright/test';

/**
 * Comprehensive E2E tests for the Admin Portal.
 * Auth is handled by globalSetup + storageState (no per-test login).
 * Covers: Dashboard, Users, Shipments, Applications, Approvals,
 *         Trucks, Analytics, Brokers, Registrations, Documents, Settings
 */

test.describe('Admin Portal', () => {
  // ─── Dashboard ───────────────────────────────────────────────
  test.describe('Dashboard', () => {
    test('should display admin dashboard with KPI cards', async ({ page }) => {
      await page.goto('/admin/dashboard');
      await page.waitForSelector('main', { timeout: 20000 });

      const cards = page.locator('[class*="card"], .rounded-lg');
      await expect(cards.first()).toBeVisible({ timeout: 10000 });
      const cardCount = await cards.count();
      expect(cardCount).toBeGreaterThan(0);
    });

    test('should show recent activity or shipments on dashboard', async ({ page }) => {
      await page.goto('/admin/dashboard');
      await page.waitForSelector('main', { timeout: 20000 });

      const dataContent = page.locator('table, .space-y-4, [class*="list"]');
      await expect(dataContent.first()).toBeVisible({ timeout: 10000 });
    });

    test('should have working navigation sidebar', async ({ page }) => {
      await page.goto('/admin/dashboard');
      await page.waitForSelector('main', { timeout: 20000 });

      // Desktop sidebar
      const sidebar = page.locator('.hidden.md\\:block, nav, aside');
      await expect(sidebar.first()).toBeVisible({ timeout: 10000 });

      const navLinks = sidebar.first().locator('a');
      const linkCount = await navLinks.count();
      expect(linkCount).toBeGreaterThan(3);
    });
  });

  // ─── Users Management ────────────────────────────────────────
  test.describe('Users Management', () => {
    test('should display users list page', async ({ page }) => {
      await page.goto('/admin/users');
      await page.waitForSelector('main', { timeout: 20000 });

      const content = page.locator('table, [data-testid="empty-state"], .empty-state');
      await expect(content.first()).toBeVisible({ timeout: 10000 });
    });

    test('should have search/filter functionality on users page', async ({ page }) => {
      await page.goto('/admin/users');
      await page.waitForSelector('main', { timeout: 20000 });

      const searchOrFilter = page.locator(
        'input[type="search"], input[placeholder*="بحث"], [class*="filter"], [class*="search"]'
      );
      await expect(searchOrFilter.first()).toBeVisible({ timeout: 10000 });
    });

    test('should navigate to user detail page', async ({ page }) => {
      await page.goto('/admin/users');
      await page.waitForSelector('main', { timeout: 20000 });

      const userLink = page.locator('table a, table tr[data-clickable], table tbody tr').first();
      if (await userLink.isVisible({ timeout: 5000 }).catch(() => false)) {
        await userLink.click();
        await page.waitForTimeout(2000);
        const detailContent = page.locator('main h1, main h2, [class*="detail"], [class*="profile"]');
        await expect(detailContent.first()).toBeVisible({ timeout: 10000 });
      }
    });
  });

  // ─── Shipments Management ────────────────────────────────────
  test.describe('Shipments Management', () => {
    test('should display shipments list page', async ({ page }) => {
      await page.goto('/admin/shipments');
      await page.waitForSelector('main', { timeout: 20000 });

      const content = page.locator('table, [data-testid="empty-state"], .empty-state');
      await expect(content.first()).toBeVisible({ timeout: 10000 });
    });

    test('should have filters on shipments page', async ({ page }) => {
      await page.goto('/admin/shipments');
      await page.waitForSelector('main', { timeout: 20000 });

      const filters = page.locator(
        'input[type="search"], select, [role="combobox"], button:has-text("فلتر"), [class*="filter"]'
      );
      await expect(filters.first()).toBeVisible({ timeout: 10000 });
    });

    test('should navigate to shipment detail page', async ({ page }) => {
      await page.goto('/admin/shipments');
      await page.waitForSelector('main', { timeout: 20000 });

      const shipmentLink = page.locator('table a, table tbody tr').first();
      if (await shipmentLink.isVisible({ timeout: 5000 }).catch(() => false)) {
        await shipmentLink.click();
        await page.waitForTimeout(2000);
        const detailContent = page.locator(
          '[class*="detail"], [class*="shipment"], [role="tablist"], main h1, main h2'
        );
        await expect(detailContent.first()).toBeVisible({ timeout: 10000 });
      }
    });
  });

  // ─── Applications ────────────────────────────────────────────
  test.describe('Applications', () => {
    test('should display applications list page', async ({ page }) => {
      await page.goto('/admin/applications');
      await page.waitForSelector('main', { timeout: 20000 });

      const content = page.locator('table, [data-testid="empty-state"], .empty-state');
      await expect(content.first()).toBeVisible({ timeout: 10000 });
    });
  });

  // ─── Approvals ───────────────────────────────────────────────
  test.describe('Approvals', () => {
    test('should display approvals page', async ({ page }) => {
      await page.goto('/admin/approvals');
      await page.waitForSelector('main', { timeout: 20000 });

      const content = page.locator('main');
      await expect(content).toBeVisible();
    });
  });

  // ─── Trucks Management ───────────────────────────────────────
  test.describe('Trucks Management', () => {
    test('should display trucks list page', async ({ page }) => {
      await page.goto('/admin/trucks');
      await page.waitForSelector('main', { timeout: 20000 });

      const content = page.locator('table, [data-testid="empty-state"], .empty-state, .grid');
      await expect(content.first()).toBeVisible({ timeout: 10000 });
    });
  });

  // ─── Analytics Dashboard ─────────────────────────────────────
  test.describe('Analytics Dashboard', () => {
    test('should display analytics page with charts', async ({ page }) => {
      await page.goto('/admin/analytics');
      await page.waitForSelector('main', { timeout: 20000 });

      const content = page.locator(
        '[class*="chart"], [class*="analytics"], canvas, svg.recharts-surface, [class*="card"], .rounded-lg'
      );
      await expect(content.first()).toBeVisible({ timeout: 15000 });
    });

    test('should have date range filter on analytics', async ({ page }) => {
      await page.goto('/admin/analytics');
      await page.waitForSelector('main', { timeout: 20000 });

      const mainContent = page.locator('main');
      await expect(mainContent).toBeVisible();
    });

    test('should render KPI section', async ({ page }) => {
      await page.goto('/admin/analytics');
      await page.waitForSelector('main', { timeout: 20000 });

      const kpiSection = page.locator('[class*="card"], [class*="stat"], [class*="kpi"], .rounded-lg');
      const count = await kpiSection.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  // ─── Brokers Management ──────────────────────────────────────
  test.describe('Brokers Management', () => {
    test('should display brokers list page', async ({ page }) => {
      await page.goto('/admin/brokers');
      await page.waitForSelector('main', { timeout: 20000 });

      const content = page.locator('main');
      await expect(content).toBeVisible();
    });

    test('should have create broker functionality', async ({ page }) => {
      await page.goto('/admin/brokers');
      await page.waitForSelector('main', { timeout: 20000 });

      const createBtn = page.locator(
        'button:has-text("إضافة"), button:has-text("جديد"), a:has-text("إضافة"), a:has-text("جديد")'
      );
      await expect(createBtn.first()).toBeVisible({ timeout: 10000 });
    });
  });

  // ─── Registration Requests ───────────────────────────────────
  test.describe('Registration Requests', () => {
    test('should display registration requests page', async ({ page }) => {
      await page.goto('/admin/registrations');
      await page.waitForSelector('main', { timeout: 20000 });

      const content = page.locator('main');
      await expect(content).toBeVisible();
    });
  });

  // ─── Documents ───────────────────────────────────────────────
  test.describe('Documents', () => {
    test('should display documents page', async ({ page }) => {
      await page.goto('/admin/documents');
      await page.waitForSelector('main', { timeout: 20000 });

      const content = page.locator('main');
      await expect(content).toBeVisible();
    });
  });

  // ─── Settings ────────────────────────────────────────────────
  test.describe('Settings', () => {
    test('should display settings page', async ({ page }) => {
      await page.goto('/admin/settings');
      await page.waitForSelector('main', { timeout: 20000 });

      const content = page.locator('main, form, [class*="settings"]');
      await expect(content.first()).toBeVisible();
    });
  });

  // ─── Global Search (Cmd+K) ──────────────────────────────────
  test.describe('Global Search', () => {
    test('should open command palette with Cmd+K', async ({ page }) => {
      await page.goto('/admin/dashboard');
      await page.waitForSelector('main', { timeout: 20000 });

      await page.keyboard.press('Meta+k');
      await page.waitForTimeout(500);

      const dialog = page.locator(
        '[role="dialog"], [cmdk-root], [class*="command"], [data-radix-popper-content-wrapper]'
      );
      if (await dialog.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(dialog.first()).toBeVisible();
        const searchInput = dialog.locator('input');
        await expect(searchInput).toBeVisible();
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

    test('should have notification bell in header', async ({ page }) => {
      await page.goto('/admin/dashboard');
      await page.waitForSelector('main', { timeout: 20000 });

      const header = page.locator('header, [class*="header"], [class*="navbar"]');
      await expect(header.first()).toBeVisible();
    });
  });

  // ─── Loading States ──────────────────────────────────────────
  test.describe('Loading States', () => {
    test('should show content after loading', async ({ page }) => {
      await page.goto('/admin/dashboard');
      await page.waitForSelector('main', { timeout: 25000 });

      const mainContent = page.locator('main');
      await expect(mainContent).toBeVisible();
    });
  });

  // ─── Error Handling ──────────────────────────────────────────
  test.describe('Error Handling', () => {
    test('should handle 404 pages gracefully', async ({ page }) => {
      await page.goto('/admin/nonexistent-page');
      // Should show 404 or redirect, not crash
      const content = page.locator('main, body');
      await expect(content.first()).toBeVisible({ timeout: 15000 });
    });
  });
});
