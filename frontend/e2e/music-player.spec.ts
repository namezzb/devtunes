import { test, expect } from '@playwright/test'

test.describe('Music Player', () => {
  test('page loads with DEVTunes header', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByText('DEVTunes').first()).toBeVisible()
  })

  test('play/pause button exists and is clickable', async ({ page }) => {
    await page.goto('/')

    const playButton = page.locator('button').filter({ has: page.locator('svg') }).first()
    await expect(playButton).toBeVisible()

    await playButton.click()
  })

  test('import playlist button opens modal', async ({ page }) => {
    await page.goto('/')

    const importButton = page.getByRole('button', { name: /导入歌单/i })
    await expect(importButton).toBeVisible()

    await importButton.click()

    await expect(page.getByRole('dialog')).toBeVisible()
  })
})