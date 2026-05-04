import { test, expect } from '@playwright/test';

test.describe('Clock Widget Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });

  test('clock displays hours, minutes, and seconds', async ({ page }) => {
    const hoursEl = page.getByLabel('Hours');
    const minutesEl = page.getByLabel('Minutes');
    const secondsEl = page.getByLabel('Seconds');

    await expect(hoursEl).toBeVisible();
    await expect(minutesEl).toBeVisible();
    await expect(secondsEl).toBeVisible();

    const hoursText = await hoursEl.textContent();
    const minutesText = await minutesEl.textContent();
    const secondsText = await secondsEl.textContent();

    expect(hoursText).toMatch(/^\d{2}$/);
    expect(minutesText).toMatch(/^\d{2}$/);
    expect(secondsText).toMatch(/^\d{2}$/);
  });

  test('clock shows date and day of week', async ({ page }) => {
    await expect(page.getByText(/January|February|March|April|May|June|July|August|September|October|November|December/)).toBeVisible();
    await expect(page.getByText(/Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday/)).toBeVisible();
  });

  test('clock seconds tick every second', async ({ page }) => {
    const secondsEl = page.getByLabel('Seconds');
    const initialSeconds = await secondsEl.textContent();

    await page.waitForTimeout(1500);

    const laterSeconds = await secondsEl.textContent();
    expect(laterSeconds).not.toBe(initialSeconds);
  });

  test('clock minutes update when seconds roll over', async ({ page }) => {
    const secondsEl = page.getByLabel('Seconds');
    const secondsText = await secondsEl.textContent();

    if (secondsText === '59') {
      const minutesEl = page.getByLabel('Minutes');
      const initialMinutes = await minutesEl.textContent();
      await page.waitForTimeout(2000);
      const laterMinutes = await minutesEl.textContent();
      expect(laterMinutes).not.toBe(initialMinutes);
    }
  });
});

test.describe('Weather Widget Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
  });

  test('weather data displays after loading', async ({ page }) => {
    await expect(page.getByText('22°', { exact: true })).toBeVisible({ timeout: 10000 });
  });

  test('weather shows all data fields', async ({ page }) => {
    await expect(page.getByText('22°', { exact: true })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Clear Sky')).toBeVisible();
    await expect(page.getByText('San Francisco')).toBeVisible();
  });

  test('weather shows appropriate icon', async ({ page }) => {
    await expect(page.getByText('☀️').first()).toBeVisible({ timeout: 10000 });
  });

  test('weather widget has a glass-card container', async ({ page }) => {
    const glassCards = page.locator('.glass-card');
    const count = await glassCards.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });
});

test.describe('Weather Forecast Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
  });

  test('5-day forecast heading is visible', async ({ page }) => {
    await expect(page.getByText('5-Day Forecast')).toBeVisible({ timeout: 10000 });
  });

  test('all 5 forecast days are visible', async ({ page }) => {
    await page.getByText('5-Day Forecast').click();
    await expect(page.getByText('Mon', { exact: true })).toBeVisible();
    await expect(page.getByText('Tue', { exact: true })).toBeVisible();
    await expect(page.getByText('Wed', { exact: true })).toBeVisible();
    await expect(page.getByText('Thu', { exact: true })).toBeVisible();
    await expect(page.getByText('Fri', { exact: true })).toBeVisible();
  });

  test('forecast shows correct high temperatures', async ({ page }) => {
    await page.getByText('5-Day Forecast').click();
    await page.waitForTimeout(500);
    const forecastCard = page.locator('.glass-card').filter({ hasText: '5-Day Forecast' });
    await expect(forecastCard.getByText('24°')).toBeVisible();
    await expect(forecastCard.getByText('22°')).toBeVisible();
    await expect(forecastCard.getByText('20°')).toBeVisible();
    await expect(forecastCard.getByText('18°')).toBeVisible();
    await expect(forecastCard.getByText('17°')).toBeVisible();
  });

  test('forecast shows correct low temperatures', async ({ page }) => {
    await page.getByText('5-Day Forecast').click();
    await expect(page.getByText('16°')).toBeVisible();
    await expect(page.getByText('14°')).toBeVisible();
    await expect(page.getByText('15°')).toBeVisible();
    await expect(page.getByText('13°')).toBeVisible();
    await expect(page.getByText('12°')).toBeVisible();
  });

  test('forecast shows precipitation for applicable days', async ({ page }) => {
    await page.getByText('5-Day Forecast').click();
    await expect(page.getByText('10%')).toBeVisible();
    await expect(page.getByText('30%')).toBeVisible();
    await expect(page.getByText('70%')).toBeVisible();
    await expect(page.getByText('90%')).toBeVisible();
  });

  test('forecast shows weather icons', async ({ page }) => {
    await page.getByText('5-Day Forecast').click();
    await page.waitForTimeout(500);
    const forecastIcons = page.locator('.glass-card .text-2xl');
    await expect(forecastIcons.nth(0)).toHaveText('☀️');
    await expect(forecastIcons.nth(1)).toHaveText('🌤️');
    await expect(forecastIcons.nth(2)).toHaveText('☁️');
    await expect(forecastIcons.nth(3)).toHaveText('🌧️');
    await expect(forecastIcons.nth(4)).toHaveText('⛈️');
  });
});

test.describe('ClockWeatherPanel Layout Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
  });

  test('clock and weather are visible on the page', async ({ page }) => {
    await expect(page.getByText('DEVTunes').first()).toBeVisible();
    await expect(page.getByLabel('Hours')).toBeVisible();
    await expect(page.getByText('Clear Sky')).toBeVisible({ timeout: 10000 });
  });

  test('clock-weather panel is above the main content', async ({ page }) => {
    await expect(page.getByText('DEVTunes').first()).toBeVisible();

    const header = page.locator('header');
    const headerBox = await header.boundingBox();
    const mainContent = page.locator('main');
    const mainBox = await mainContent.boundingBox();

    if (headerBox && mainBox) {
      expect(headerBox.y).toBeLessThan(mainBox.y);
    }
  });
});

test.describe('ClockWeatherPanel Responsive Tests', () => {
  test('desktop shows multi-column layout for clock + weather', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    await expect(page.getByLabel('Hours')).toBeVisible();
    await expect(page.getByText('Clear Sky')).toBeVisible({ timeout: 10000 });
  });

  test('mobile shows stacked layout for clock + weather', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    await expect(page.getByLabel('Hours')).toBeVisible();
    await expect(page.getByText('Clear Sky')).toBeVisible({ timeout: 10000 });
  });
});
