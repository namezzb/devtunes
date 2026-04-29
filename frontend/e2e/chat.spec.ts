import { test, expect } from '@playwright/test'

test.describe('Chat', () => {
  test('page loads with AI Agent section', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByText('AI Agent', { exact: true })).toBeVisible()
  })

  test('chat input exists and accepts text', async ({ page }) => {
    await page.goto('/')

    const chatInput = page.getByPlaceholder(/和 AI 聊聊/i)
    await expect(chatInput).toBeVisible()

    await chatInput.fill('Hello')
    await expect(chatInput).toHaveValue('Hello')
  })

  test('send button exists', async ({ page }) => {
    await page.goto('/')

    const sendButton = page.locator('button').filter({ has: page.locator('svg') }).last()
    await expect(sendButton).toBeVisible()
  })
})