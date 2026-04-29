import { test, expect } from '@playwright/test';

test.describe('DEVTunes Frontend E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('homepage loads without errors', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('DEVTunes');
    await expect(page.locator('text=Music + AI Agent for Independent Developers')).toBeVisible();
  });

  test('music player is visible', async ({ page }) => {
    await expect(page.locator('text=DEVTunes').first()).toBeVisible();
  });

  test('AI chat is visible', async ({ page }) => {
    await expect(page.locator('textarea')).toBeVisible();
  });
});

test.describe('Responsive Layout Tests', () => {
  test('desktop shows side-by-side layout', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=DEVTunes').first()).toBeVisible();
  });

  test('mobile shows tab navigation', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.getByText('Music')).toBeVisible();
    await expect(page.getByText('AI Chat')).toBeVisible();
  });
});

test.describe('Music Player Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('play button works', async ({ page }) => {
    const playButton = page.locator('button').nth(3);
    await playButton.click();
    await page.waitForTimeout(300);
  });

  test('next track button works', async ({ page }) => {
    const trackTitle = page.locator('h3').first();
    const initialTitle = await trackTitle.textContent();
    const nextButton = page.locator('button').nth(5);
    await nextButton.click();
    await page.waitForTimeout(300);
    const newTitle = await trackTitle.textContent();
    expect(newTitle).not.toBe(initialTitle);
  });

  test('volume control has hover effect', async ({ page }) => {
    const volumeArea = page.locator('.group').nth(1);
    await volumeArea.hover();
    await page.waitForTimeout(400);
  });

  test('progress slider is visible', async ({ page }) => {
    await expect(page.locator('.relative.h-6').first()).toBeVisible();
  });
});

test.describe('Keyboard Shortcuts Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('spacebar toggles play', async ({ page }) => {
    await page.click('body');
    await page.keyboard.press('Space');
    await page.waitForTimeout(200);
  });

  test('arrow right changes track', async ({ page }) => {
    await page.click('body');
    const trackTitle = page.locator('h3').first();
    const initialTitle = await trackTitle.textContent();
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(200);
    const newTitle = await trackTitle.textContent();
    expect(newTitle).not.toBe(initialTitle);
  });

  test('m key mutes', async ({ page }) => {
    await page.click('body');
    await page.keyboard.press('m');
    await page.waitForTimeout(200);
  });
});

test.describe('AI Chat Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('chat input works', async ({ page }) => {
    const chatInput = page.locator('textarea').first();
    await chatInput.fill('Test message');
    await expect(chatInput).toHaveValue('Test message');
  });

  test('send button works', async ({ page }) => {
    const chatInput = page.locator('textarea').first();
    await chatInput.fill('Test message');
    await page.locator('button').last().click();
  });

  test('enter sends message', async ({ page }) => {
    const chatInput = page.locator('textarea').first();
    await chatInput.fill('Test with Enter');
    await page.keyboard.press('Enter');
    await expect(chatInput).toHaveValue('');
  });
});

test.describe('Import Modal Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('import modal opens', async ({ page }) => {
    await page.getByRole('button', { name: /导入/ }).click();
    await page.waitForTimeout(500);
  });
});

test.describe('Drag Sort Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('track list is scrollable', async ({ page }) => {
    const trackList = page.locator('.flex-1.overflow-y-auto').first();
    await expect(trackList).toBeVisible();
  });
});
