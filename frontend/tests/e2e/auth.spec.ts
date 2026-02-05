import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display login page with form fields', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /دخول|تسجيل/i })).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.fill('input[type="email"], input[name="email"]', 'wrong@test.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.getByRole('button', { name: /دخول|تسجيل/i }).click();

    // Should show error toast or message
    await expect(
      page.locator('[data-sonner-toast][data-type="error"], .text-destructive, [role="alert"]')
    ).toBeVisible({ timeout: 10000 });
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.getByRole('button', { name: /دخول|تسجيل/i }).click();

    // Form validation should prevent submission or show errors
    const errorMessages = page.locator('[role="alert"], .text-destructive, [data-state="invalid"]');
    await expect(errorMessages.first()).toBeVisible({ timeout: 5000 });
  });

  test('should have link to registration page', async ({ page }) => {
    const registerLink = page.locator('a[href*="register"]');
    await expect(registerLink).toBeVisible();
  });

  test('should redirect to login when accessing protected route without auth', async ({ page }) => {
    await page.goto('/merchant/dashboard');
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });
});
