import { test, expect } from '@playwright/test'

/**
 * Comprehensive multiplayer test suite
 * Tests 10 players in the same room through full game flow
 */

// Generate a unique test run ID to avoid PeerJS room collisions between test runs
const testRunId = Math.floor(Date.now() / 1000) % 10000

test.describe('Multiplayer Game', () => {
  // Increase timeout for multiplayer tests
  test.setTimeout(120000)

  // Run all multiplayer tests serially to avoid PeerJS room collisions
  test.describe.configure({ mode: 'serial' })

  // Track which levels have been used in this test run
  let levelCounter = 0

  /**
   * Get a unique level for this test
   * Uses a counter to ensure each test in the run gets a different level
   */
  function getUniqueLevel() {
    levelCounter++
    return ((levelCounter + testRunId) % 5) + 1
  }

  /**
   * Helper to join a room as a player
   * Level parameter is required to ensure unique room IDs
   */
  async function joinRoom(page, nickname, level) {
    if (!level) throw new Error('Level is required for joinRoom')
    const useLevel = level
    await page.goto('/')
    await page.getByTestId('game-english-spelling').click()
    await page.getByTestId(`level-${useLevel}`).click()
    await page.getByTestId('nickname-input').fill(nickname)
    await page.getByTestId('join-room-btn').click()

    // Wait for room to load (either as host or client)
    // Use longer timeout to account for PeerJS signaling server latency
    await expect(page.getByText('等待室')).toBeVisible({ timeout: 25000 })
  }

  /**
   * Helper to become a participant
   */
  async function joinAsParticipant(page) {
    const readyButton = page.getByTestId('ready-button')
    if (await readyButton.isVisible()) {
      await readyButton.click()
      // Wait for button to disappear (now showing cancel button)
      await expect(page.getByText('取消參賽')).toBeVisible({ timeout: 5000 })
    }
  }

  /**
   * Helper to type answer in spelling board
   */
  async function typeAnswer(page, answer) {
    // Click on the spelling board to focus it
    await page.locator('.spelling-board').click()
    // Type the answer
    await page.keyboard.type(answer, { delay: 50 })
  }

  /**
   * Helper to submit answer
   */
  async function submitAnswer(page) {
    await page.getByRole('button', { name: '提交答案' }).click()
  }

  test.describe('Room Management', () => {
    test('host can create room and see themselves as participant', async ({ browser }) => {
      const context = await browser.newContext()
      const page = await context.newPage()
      const level = getUniqueLevel()

      await joinRoom(page, 'TestHost', level)

      // Wait for room to fully load
      await page.waitForTimeout(2000)

      // Debug: take screenshot
      await page.screenshot({ path: 'test-results/host-room.png' })

      // Host should auto-join as participant
      await expect(page.locator('h2.section-title').first()).toContainText('參賽者')
      // Check for player name in the player list
      await expect(page.locator('.player-item__name')).toContainText('TestHost')

      await context.close()
    })

    test('second player can join existing room', async ({ browser }) => {
      const level = getUniqueLevel()

      // Create host
      const hostContext = await browser.newContext()
      const hostPage = await hostContext.newPage()
      await joinRoom(hostPage, 'Host2P', level)
      await expect(hostPage.getByText('等待室')).toBeVisible({ timeout: 15000 })

      // Wait for host to fully register with PeerJS
      await hostPage.waitForTimeout(3000)

      // Create second player
      const playerContext = await browser.newContext()
      const playerPage = await playerContext.newPage()
      await joinRoom(playerPage, 'Player2nd', level)

      // Player2 should see the observers section
      await expect(playerPage.getByText('觀戰者')).toBeVisible({ timeout: 15000 })

      // Host should see Player2
      await expect(hostPage.getByText('Player2nd')).toBeVisible({ timeout: 15000 })

      await hostContext.close()
      await playerContext.close()
    })

    test('multiple players can join and become participants', async ({ browser }) => {
      const contexts = []
      const pages = []
      const playerCount = 5
      // Use unique level to avoid collision with other tests
      const level = (Math.floor(Date.now() / 60000) % 5) + 1

      try {
        console.log(`Multiple players test using level ${level}`)
        // Create host
        const hostContext = await browser.newContext()
        const hostPage = await hostContext.newPage()
        contexts.push(hostContext)
        pages.push(hostPage)

        // Listen for console errors
        hostPage.on('console', msg => {
          if (msg.type() === 'error') {
            console.log('Host console error:', msg.text())
          }
        })

        await joinRoom(hostPage, 'HostMulti', level)
        // Take screenshot if join fails
        await hostPage.screenshot({ path: 'test-results/multi-host-join.png' })
        await expect(hostPage.getByText('等待室')).toBeVisible({ timeout: 20000 })

        // Wait for host to register
        await hostPage.waitForTimeout(2000)

        // Create additional players
        for (let i = 2; i <= playerCount; i++) {
          const ctx = await browser.newContext()
          const page = await ctx.newPage()
          contexts.push(ctx)
          pages.push(page)

          await joinRoom(page, `Player${i}`, level)
          await expect(page.getByText('等待室')).toBeVisible({ timeout: 15000 })

          // Small delay between joins to avoid overwhelming PeerJS
          await page.waitForTimeout(500)
        }

        // Wait for all connections to stabilize
        await pages[0].waitForTimeout(2000)

        // Have all non-host players join as participants
        for (let i = 1; i < pages.length; i++) {
          await joinAsParticipant(pages[i])
          await pages[i].waitForTimeout(300)
        }

        // Verify host sees all participants
        await expect(hostPage.getByText(`參賽者 (${playerCount})`)).toBeVisible({ timeout: 10000 })

      } finally {
        // Cleanup
        for (const ctx of contexts) {
          await ctx.close()
        }
      }
    })
  })

  test.describe('Game Flow', () => {
    test('host can start game with one player', async ({ browser }) => {
      const context = await browser.newContext()
      const page = await context.newPage()
      const level = getUniqueLevel()

      await joinRoom(page, 'SoloPlayer', level)
      await expect(page.getByText('等待室')).toBeVisible({ timeout: 15000 })

      // Host is auto-participant, should be able to start
      await page.getByRole('button', { name: '開始遊戲' }).click()

      // Should see game screen
      await expect(page.getByText('第 1 回合')).toBeVisible({ timeout: 5000 })
      await expect(page.getByRole('button', { name: '播放單字' })).toBeVisible()

      await context.close()
    })

    test('solo player can complete a round', async ({ browser }) => {
      const context = await browser.newContext()
      const page = await context.newPage()
      const level = getUniqueLevel()

      await joinRoom(page, 'SoloComplete', level)
      await page.getByRole('button', { name: '開始遊戲' }).click()

      await expect(page.getByText('第 1 回合')).toBeVisible({ timeout: 5000 })

      // Type a wrong answer to end the game
      await typeAnswer(page, 'wronganswer')
      await submitAnswer(page)

      // Should see result after round ends
      await expect(page.getByText('遊戲結束')).toBeVisible({ timeout: 15000 })

      await context.close()
    })
  })

  test.describe('Full Multiplayer Game with 10 Players', () => {
    test('10 players can play a complete game', async ({ browser }) => {
      const contexts = []
      const pages = []
      const playerCount = 10
      const level = getUniqueLevel()

      try {
        console.log(`Creating host (level ${level})...`)
        // Create host
        const hostContext = await browser.newContext()
        const hostPage = await hostContext.newPage()
        contexts.push(hostContext)
        pages.push(hostPage)

        // Listen for console errors
        hostPage.on('console', msg => {
          if (msg.type() === 'error') {
            console.log('Console error:', msg.text())
          }
        })
        hostPage.on('pageerror', err => {
          console.log('Page error:', err.message)
        })

        await joinRoom(hostPage, 'Host10P', level)
        // Take screenshot if joining fails
        await hostPage.screenshot({ path: 'test-results/host-join-attempt.png' })
        await expect(hostPage.getByText('等待室')).toBeVisible({ timeout: 20000 })
        console.log('Host created successfully')

        // Wait for host to fully register with PeerJS signaling server
        await hostPage.waitForTimeout(4000)

        // Create and connect all other players - batch them to reduce signaling server load
        for (let i = 2; i <= playerCount; i++) {
          console.log(`Creating Player${i}...`)
          const ctx = await browser.newContext()
          const page = await ctx.newPage()
          contexts.push(ctx)
          pages.push(page)

          await joinRoom(page, `P${i}`, level)
          await expect(page.getByText('等待室')).toBeVisible({ timeout: 20000 })
          console.log(`Player${i} joined`)

          // Stagger joins to avoid overwhelming PeerJS
          await page.waitForTimeout(1500)
        }

        // Wait for all P2P connections to stabilize
        console.log('Waiting for connections to stabilize...')
        await pages[0].waitForTimeout(4000)

        // All players join as participants
        console.log('Players joining as participants...')
        for (let i = 1; i < pages.length; i++) {
          await joinAsParticipant(pages[i])
          await pages[i].waitForTimeout(600)
        }

        // Wait for participant updates to propagate
        await pages[0].waitForTimeout(2000)

        // Verify all participants visible on host
        await expect(hostPage.getByText(`參賽者 (${playerCount})`)).toBeVisible({ timeout: 20000 })
        console.log('All players are participants')

        // Take screenshot before starting
        await hostPage.screenshot({ path: 'test-results/before-start.png' })

        // Host starts the game
        console.log('Starting game...')
        const startButton = hostPage.getByRole('button', { name: '開始遊戲' })
        await expect(startButton).toBeEnabled({ timeout: 5000 })
        await startButton.click()

        // Wait a moment for broadcast to propagate
        await hostPage.waitForTimeout(1000)

        // Take screenshot after clicking start
        await hostPage.screenshot({ path: 'test-results/after-start-host.png' })

        // Verify host sees game screen (any round)
        await expect(hostPage.getByText(/第 \d+ 回合/)).toBeVisible({ timeout: 10000 })
        console.log('Host sees game screen')

        // Wait for message propagation to all clients
        await hostPage.waitForTimeout(2000)

        // Check each client sees game screen (any round number)
        for (let i = 1; i < pages.length; i++) {
          try {
            // Check for game screen - either showing a round or game end
            const hasRound = pages[i].getByText(/第 \d+ 回合/)
            const hasGameEnd = pages[i].getByText('遊戲結束')
            await expect(hasRound.or(hasGameEnd)).toBeVisible({ timeout: 15000 })
            console.log(`Player ${i + 1} sees game screen`)
          } catch (err) {
            // Take screenshot of failed player
            await pages[i].screenshot({ path: `test-results/player-${i + 1}-fail.png` })
            console.log(`Player ${i + 1} failed to see game screen`)
            throw err
          }
        }
        console.log('Game started, all players in game')

        // Verify game UI elements are present for host
        await expect(hostPage.getByRole('button', { name: '播放單字' })).toBeVisible()
        await expect(hostPage.locator('.timer')).toBeVisible()
        console.log('Game UI verified')

        // Have all players submit wrong answers to end the game quickly
        console.log('All players submitting answers...')
        for (let i = 0; i < pages.length; i++) {
          const page = pages[i]
          const spellingBoard = page.locator('.spelling-board')
          const canAnswer = await spellingBoard.isVisible().catch(() => false)

          if (canAnswer) {
            await typeAnswer(page, 'wronganswer')
            await submitAnswer(page)
            console.log(`Player ${i + 1} submitted`)
          }
        }

        // Wait for round processing and game end
        console.log('Waiting for game to end...')
        await expect(pages[0].getByText('遊戲結束')).toBeVisible({ timeout: 45000 })
        console.log('Game ended successfully')

        // Verify result screen elements
        await expect(pages[0].getByRole('heading', { name: '排名' })).toBeVisible()
        console.log('Result screen verified')

      } finally {
        // Cleanup all contexts
        console.log('Cleaning up...')
        for (const ctx of contexts) {
          await ctx.close()
        }
      }
    })
  })

  test.describe('Observer Mode', () => {
    test('observer can see real-time typing', async ({ browser }) => {
      const contexts = []
      // Use unique level to avoid collision
      const level = getUniqueLevel()

      try {
        console.log(`Observer test using level ${level}`)
        // Create host
        const hostContext = await browser.newContext()
        const hostPage = await hostContext.newPage()
        contexts.push(hostContext)

        await joinRoom(hostPage, 'HostObs', level)
        await hostPage.waitForTimeout(2000)

        // Create observer
        const observerContext = await browser.newContext()
        const observerPage = await observerContext.newPage()
        contexts.push(observerContext)

        await joinRoom(observerPage, 'ObserverObs', level)
        await observerPage.waitForTimeout(1000)

        // Observer stays as observer (don't click ready)

        // Start game (host is participant)
        await hostPage.getByRole('button', { name: '開始遊戲' }).click()

        // Wait for game to start
        await expect(hostPage.getByText(/第 \d+ 回合/)).toBeVisible({ timeout: 10000 })
        // Wait for game start message to propagate to observer
        await hostPage.waitForTimeout(2000)
        await expect(observerPage.getByText(/第 \d+ 回合/).or(observerPage.getByText('遊戲結束'))).toBeVisible({ timeout: 15000 })

        // Observer should see observer banner
        await expect(observerPage.getByText('觀戰模式')).toBeVisible()

        // Observer should see RoundView
        await expect(observerPage.getByText('即時答題狀況')).toBeVisible()

        // Host types answer
        await typeAnswer(hostPage, 'test')

        // Observer should see the typing in RoundView
        await expect(observerPage.locator('.letter-box').first()).toBeVisible({ timeout: 5000 })

      } finally {
        for (const ctx of contexts) {
          await ctx.close()
        }
      }
    })
  })

  test.describe('Round Results', () => {
    test('players see round results after submitting', async ({ browser }) => {
      const contexts = []
      const level = getUniqueLevel()

      try {
        // Create host
        const hostContext = await browser.newContext()
        const hostPage = await hostContext.newPage()
        contexts.push(hostContext)

        await joinRoom(hostPage, 'Host', level)
        await hostPage.waitForTimeout(2000)

        // Create second player
        const player2Context = await browser.newContext()
        const player2Page = await player2Context.newPage()
        contexts.push(player2Context)

        await joinRoom(player2Page, 'Player2', level)
        await joinAsParticipant(player2Page)
        await player2Page.waitForTimeout(1000)

        // Start game
        await hostPage.getByRole('button', { name: '開始遊戲' }).click()
        await expect(hostPage.getByText('第 1 回合')).toBeVisible({ timeout: 5000 })

        // Both players submit wrong answers
        await typeAnswer(hostPage, 'wrong1')
        await submitAnswer(hostPage)

        await typeAnswer(player2Page, 'wrong2')
        await submitAnswer(player2Page)

        // Should see round result view
        await expect(hostPage.getByText('本回合結果')).toBeVisible({ timeout: 10000 })
        await expect(player2Page.getByText('本回合結果')).toBeVisible({ timeout: 10000 })

        // Should see correct answer
        await expect(hostPage.getByText('正確答案')).toBeVisible()

      } finally {
        for (const ctx of contexts) {
          await ctx.close()
        }
      }
    })
  })

  test.describe('Player Elimination', () => {
    test('incorrect answer eliminates player', async ({ browser }) => {
      const contexts = []
      const level = getUniqueLevel()

      try {
        // Create host
        const hostContext = await browser.newContext()
        const hostPage = await hostContext.newPage()
        contexts.push(hostContext)

        await joinRoom(hostPage, 'Host', level)
        await hostPage.waitForTimeout(2000)

        // Create second player
        const player2Context = await browser.newContext()
        const player2Page = await player2Context.newPage()
        contexts.push(player2Context)

        await joinRoom(player2Page, 'Player2', level)
        await joinAsParticipant(player2Page)
        await player2Page.waitForTimeout(1000)

        // Start game
        await hostPage.getByRole('button', { name: '開始遊戲' }).click()
        await expect(hostPage.getByText('第 1 回合')).toBeVisible({ timeout: 5000 })

        // One player submits wrong answer
        await typeAnswer(player2Page, 'wrong')
        await submitAnswer(player2Page)

        // Host submits - this will trigger round end
        // Since we don't know the correct answer, let's just submit something
        await typeAnswer(hostPage, 'alsowrong')
        await submitAnswer(hostPage)

        // Wait for round result
        await hostPage.waitForTimeout(8000)

        // Eventually game should end (all eliminated or one winner)
        await expect(hostPage.getByText('遊戲結束')).toBeVisible({ timeout: 20000 })

      } finally {
        for (const ctx of contexts) {
          await ctx.close()
        }
      }
    })
  })

  test.describe('Reconnection and Edge Cases', () => {
    test('player can leave room', async ({ browser }) => {
      const context = await browser.newContext()
      const page = await context.newPage()
      const level = getUniqueLevel()

      await joinRoom(page, 'TestPlayer', level)
      await expect(page.getByText('等待室')).toBeVisible({ timeout: 15000 })

      // Click leave room
      await page.getByRole('button', { name: '離開房間' }).click()

      // Should be back at lobby
      await expect(page.getByText('選擇遊戲類型')).toBeVisible({ timeout: 5000 })

      await context.close()
    })

    test('game continues if one player disconnects', async ({ browser }) => {
      const contexts = []
      const level = getUniqueLevel()

      try {
        // Create host
        const hostContext = await browser.newContext()
        const hostPage = await hostContext.newPage()
        contexts.push(hostContext)

        await joinRoom(hostPage, 'Host', level)
        await hostPage.waitForTimeout(2000)

        // Create players
        const player2Context = await browser.newContext()
        const player2Page = await player2Context.newPage()
        contexts.push(player2Context)

        const player3Context = await browser.newContext()
        const player3Page = await player3Context.newPage()
        contexts.push(player3Context)

        await joinRoom(player2Page, 'Player2', level)
        await joinAsParticipant(player2Page)
        await player2Page.waitForTimeout(500)

        await joinRoom(player3Page, 'Player3', level)
        await joinAsParticipant(player3Page)
        await player3Page.waitForTimeout(1000)

        // Verify 3 participants
        await expect(hostPage.getByText('參賽者 (3)')).toBeVisible({ timeout: 10000 })

        // Player2 leaves
        await player2Page.getByRole('button', { name: '離開房間' }).click()

        // Wait for update
        await hostPage.waitForTimeout(2000)

        // Host should still be able to start game with remaining players
        await hostPage.getByRole('button', { name: '開始遊戲' }).click()
        await expect(hostPage.getByText('第 1 回合')).toBeVisible({ timeout: 5000 })

      } finally {
        for (const ctx of contexts) {
          await ctx.close()
        }
      }
    })
  })
})
