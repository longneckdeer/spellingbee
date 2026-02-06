import { test, expect } from '@playwright/test'

test.describe('Lobby', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display game title', async ({ page }) => {
    await expect(page.getByText('Spelling Bee')).toBeVisible()
    await expect(page.getByText('多人拼字大賽')).toBeVisible()
  })

  test('should show game type selection', async ({ page }) => {
    await expect(page.getByText('選擇遊戲類型')).toBeVisible()
    await expect(page.getByTestId('game-english-spelling')).toBeVisible()
  })

  test('should navigate to level selection after choosing game type', async ({ page }) => {
    await page.getByTestId('game-english-spelling').click()
    await expect(page.getByText('選擇難度')).toBeVisible()
    await expect(page.getByTestId('level-1')).toBeVisible()
    await expect(page.getByTestId('level-5')).toBeVisible()
  })

  test('should navigate to nickname entry after choosing level', async ({ page }) => {
    await page.getByTestId('game-english-spelling').click()
    await page.getByTestId('level-1').click()
    await expect(page.getByText('輸入暱稱')).toBeVisible()
    await expect(page.getByTestId('nickname-input')).toBeVisible()
  })

  test('should disable join button without nickname', async ({ page }) => {
    await page.getByTestId('game-english-spelling').click()
    await page.getByTestId('level-1').click()
    await expect(page.getByTestId('join-room-btn')).toBeDisabled()
  })

  test('should enable join button with nickname', async ({ page }) => {
    await page.getByTestId('game-english-spelling').click()
    await page.getByTestId('level-1').click()
    await page.getByTestId('nickname-input').fill('TestPlayer')
    await expect(page.getByTestId('join-room-btn')).toBeEnabled()
  })

  test('should navigate back from level selection', async ({ page }) => {
    await page.getByTestId('game-english-spelling').click()
    await page.getByRole('button', { name: '返回' }).click()
    await expect(page.getByText('選擇遊戲類型')).toBeVisible()
  })

  test('should navigate back from nickname entry', async ({ page }) => {
    await page.getByTestId('game-english-spelling').click()
    await page.getByTestId('level-1').click()
    await page.getByRole('button', { name: '返回' }).click()
    await expect(page.getByText('選擇難度')).toBeVisible()
  })
})
