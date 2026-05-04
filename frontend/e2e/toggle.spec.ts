import { test, expect } from '@playwright/test';

test.describe('Thinking Mode Toggle', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForSelector('text=AI Agent', { timeout: 10000 });
  });

  test('toggle switch is visible with default ON state', async ({ page }) => {
    const toggle = page.locator('button[role="switch"]');
    await expect(toggle).toBeVisible();

    const label = page.locator('text=开启思考');
    await expect(label).toBeVisible();

    await expect(toggle).toHaveAttribute('aria-checked', 'true');
  });

  test('clicking toggle switches to OFF state and resets session', async ({ page }) => {
    const toggle = page.locator('button[role="switch"]');

    await toggle.click();

    const offLabel = page.locator('text=不开启思考');
    await expect(offLabel).toBeVisible();

    await expect(toggle).toHaveAttribute('aria-checked', 'false');

    const fastModeLabel = page.locator('text=快速模式');
    await expect(fastModeLabel).toBeVisible();
  });

  test('header shows thinking mode indicator', async ({ page }) => {
    const thinkingMode = page.locator('text=思考模式');
    await expect(thinkingMode).toBeVisible();
  });

  test('toggle is disabled during streaming', async ({ page }) => {
    const toggle = page.locator('button[role="switch"]');
    const textarea = page.locator('textarea[placeholder="和 AI 聊聊音乐..."]');

    await textarea.fill('Hello test');
    await textarea.press('Enter');

    await expect(toggle).toBeDisabled();

    await page.waitForTimeout(3000);
  });
});
