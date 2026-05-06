import { test, expect } from '@playwright/test'

test.describe('Playlist Import Modal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
  })

  test('import playlist button opens dialog', async ({ page }) => {
    const importButton = page.getByRole('button', { name: /导入歌单/i })
    await expect(importButton).toBeVisible()
    await importButton.click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText('导入音乐')).toBeVisible()
  })

  test('dialog shows both import sections', async ({ page }) => {
    await page.getByRole('button', { name: /导入歌单/i }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    await expect(dialog.getByText('歌单导入')).toBeVisible()
    await expect(dialog.getByText('本地音乐库')).toBeVisible()
  })

  test('dialog shows URL input and parse button', async ({ page }) => {
    await page.getByRole('button', { name: /导入歌单/i }).click()
    const dialog = page.getByRole('dialog')

    const urlInput = dialog.getByPlaceholder(/粘贴网易云音乐歌单链接/)
    await expect(urlInput).toBeVisible()
    await expect(dialog.getByRole('button', { name: /解析歌单/ })).toBeVisible()
  })

  test('parse with empty URL shows validation error', async ({ page }) => {
    await page.getByRole('button', { name: /导入歌单/i }).click()
    const dialog = page.getByRole('dialog')

    await dialog.getByRole('button', { name: /解析歌单/ }).click()
    await expect(dialog.getByText(/请输入网易云音乐歌单链接/)).toBeVisible({ timeout: 3000 })
  })

  test('enter URL then parse shows error when musicdl unavailable', async ({ page }) => {
    await page.route('**/api/playlist/import', async (route) => {
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, error: 'ECONNREFUSED: connect failed' }),
      })
    })

    await page.getByRole('button', { name: /导入歌单/i }).click()
    const dialog = page.getByRole('dialog')

    await dialog.getByPlaceholder(/粘贴网易云音乐歌单链接/).fill('https://163cn.tv/6u4sov9')
    await dialog.getByRole('button', { name: /解析歌单/ }).click()

    await expect(dialog.getByText(/音乐下载服务暂不可用/)).toBeVisible({ timeout: 10000 })
  })

  test('parse button shows loading state while parsing', async ({ page }) => {
    await page.route('**/api/playlist/import', async (route) => {
      await new Promise((r) => setTimeout(r, 3000))
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, error: 'ECONNREFUSED' }),
      })
    })

    await page.getByRole('button', { name: /导入歌单/i }).click()
    const dialog = page.getByRole('dialog')

    await dialog.getByPlaceholder(/粘贴网易云音乐歌单链接/).fill('https://163cn.tv/6u4sov9')
    await dialog.getByRole('button', { name: /解析歌单/ }).click()

    await expect(dialog.getByText(/解析中/)).toBeVisible({ timeout: 3000 })
  })

  test('local library section is visible on open', async ({ page }) => {
    await page.getByRole('button', { name: /导入歌单/i }).click()
    const dialog = page.getByRole('dialog')

    await expect(dialog.getByText(/本地音乐库/)).toBeVisible()
  })

  test('local library shows track count when files exist', async ({ page }) => {
    await page.getByRole('button', { name: /导入歌单/i }).click()
    const dialog = page.getByRole('dialog')

    await expect(dialog.getByText(/找到.*首本地音乐/)).toBeVisible({ timeout: 15000 })
  })

  test('import all local tracks fills playlist and closes dialog', async ({ page }) => {
    await page.getByRole('button', { name: /导入歌单/i }).click()
    const dialog = page.getByRole('dialog')

    const importAllBtn = dialog.getByRole('button', { name: /导入全部/ }).first()
    await expect(importAllBtn).toBeVisible({ timeout: 15000 })

    await importAllBtn.click()

    await expect(dialog).not.toBeVisible({ timeout: 3000 })
  })

  test('dialog closes via Escape key', async ({ page }) => {
    await page.getByRole('button', { name: /导入歌单/i }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(dialog).not.toBeVisible({ timeout: 3000 })
  })
})

test.describe('Post-Import Playback', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    await page.getByRole('button', { name: /导入歌单/i }).click()
    const dialog = page.getByRole('dialog')
    const importAllBtn = dialog.getByRole('button', { name: /导入全部/ }).first()
    await expect(importAllBtn).toBeVisible({ timeout: 15000 })
    await importAllBtn.click()
    await expect(dialog).not.toBeVisible({ timeout: 3000 })
    await page.waitForTimeout(500)
  })

  test('play button toggles between play and pause', async ({ page }) => {
    const playButton = page.locator('button').filter({ has: page.locator('svg') }).first()
    await expect(playButton).toBeVisible()
    await playButton.click()

    await page.waitForTimeout(1500)
    await playButton.click()
  })

  test('current track info is displayed after import', async ({ page }) => {
    await expect(page.getByText('Algorithms').first()).toBeVisible({ timeout: 5000 })
  })
})
