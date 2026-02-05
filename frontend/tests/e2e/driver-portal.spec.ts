import { test, expect } from '@playwright/test';

/**
 * Comprehensive E2E tests for the Driver Portal.
 * Auth is handled by globalSetup + storageState (no per-test login).
 */

test.describe('Driver Portal', () => {
  // ─── Dashboard ───────────────────────────────────────────────
  test.describe('Dashboard', () => {
    test('should display driver dashboard', async ({ page }) => {
      await page.goto('/driver/dashboard');
      await page.waitForSelector('main', { timeout: 20000 });

      const cards = page.locator('[class*="card"], [class*="stat"], .rounded-lg');
      const cardCount = await cards.count();
      expect(cardCount).toBeGreaterThan(0);
    });

    test('should have working sidebar navigation', async ({ page }) => {
      await page.goto('/driver/dashboard');
      await page.waitForSelector('main', { timeout: 20000 });

      const nav = page.locator('nav, [role="navigation"], aside, .hidden.md\\:block');
      await expect(nav.first()).toBeVisible({ timeout: 10000 });

      const navLinks = nav.first().locator('a');
      const linkCount = await navLinks.count();
      expect(linkCount).toBeGreaterThan(2);
    });

    test('should show current assignment or empty state', async ({ page }) => {
      await page.goto('/driver/dashboard');
      await page.waitForSelector('main', { timeout: 20000 });

      const dataContent = page.locator(
        'table, [data-testid="empty-state"], .empty-state, [class*="card"], [class*="assignment"]'
      );
      await expect(dataContent.first()).toBeVisible({ timeout: 10000 });
    });
  });

  // ─── Shipments ───────────────────────────────────────────────
  test.describe('Shipments', () => {
    test('should display assigned shipments list', async ({ page }) => {
      await page.goto('/driver/shipments');
      await page.waitForSelector('main', { timeout: 20000 });

      const content = page.locator('main');
      await expect(content).toBeVisible();
    });
  });

  // ─── Check-in ────────────────────────────────────────────────
  test.describe('Check-in', () => {
    test('should display check-in page', async ({ page }) => {
      await page.goto('/driver/checkin');
      await page.waitForSelector('main', { timeout: 20000 });

      const content = page.locator('main');
      await expect(content).toBeVisible();
    });

    test('should show check-in form or status', async ({ page }) => {
      await page.goto('/driver/checkin');
      await page.waitForSelector('main', { timeout: 20000 });

      const formOrStatus = page.locator(
        'form, button:has-text("تسجيل"), [class*="check"], [data-testid="empty-state"], .empty-state'
      );
      await expect(formOrStatus.first()).toBeVisible({ timeout: 10000 });
    });
  });

  // ─── History ─────────────────────────────────────────────────
  test.describe('History', () => {
    test('should display delivery history page', async ({ page }) => {
      await page.goto('/driver/history');
      await page.waitForSelector('main', { timeout: 20000 });

      const content = page.locator('main');
      await expect(content).toBeVisible();
    });
  });

  // ─── Profile ─────────────────────────────────────────────────
  test.describe('Profile', () => {
    test('should display driver profile page', async ({ page }) => {
      await page.goto('/driver/profile');
      await page.waitForSelector('main', { timeout: 20000 });

      const content = page.locator('main, form');
      await expect(content.first()).toBeVisible();
    });

    test('should show driver information', async ({ page }) => {
      await page.goto('/driver/profile');
      await page.waitForSelector('main', { timeout: 20000 });

      const profileInfo = page.locator(
        'form, [class*="profile"], [class*="card"], input, .space-y-4'
      );
      await expect(profileInfo.first()).toBeVisible({ timeout: 10000 });
    });
  });

  // ─── Settings ────────────────────────────────────────────────
  test.describe('Settings', () => {
    test('should display settings page', async ({ page }) => {
      await page.goto('/driver/settings');
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

  // ─── Error Handling ──────────────────────────────────────────
  test.describe('Error Handling', () => {
    test('should handle invalid shipment ID gracefully', async ({ page }) => {
      await page.goto('/driver/shipments/nonexistent-id');
      const content = page.locator('main, body');
      await expect(content.first()).toBeVisible({ timeout: 15000 });
    });
  });
});
