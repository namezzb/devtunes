import { test, expect } from '@playwright/test'

test.describe('DEVTunes Smoke Tests', () => {
  test('homepage loads with DEVTunes title', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveTitle(/DEVTunes/i)
  })

  test('page loads without console errors', async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    expect(consoleErrors).toHaveLength(0)
  })
})