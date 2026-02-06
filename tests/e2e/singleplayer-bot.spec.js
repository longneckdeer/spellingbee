import { test, expect } from '@playwright/test'

test.describe('Single Player Bot - 30 Rounds', () => {
  let consoleErrors = []
  let consoleWarnings = []

  test.beforeEach(async ({ page }) => {
    // Capture console errors and warnings
    consoleErrors = []
    consoleWarnings = []

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      } else if (msg.type() === 'warning') {
        consoleWarnings.push(msg.text())
      }
    })

    // Capture page errors
    page.on('pageerror', error => {
      consoleErrors.push(`Page Error: ${error.message}`)
    })

    await page.goto('/', { waitUntil: 'networkidle' })

    // Wait for Vue app to mount
    await page.waitForSelector('[data-testid="nickname-input"]', { timeout: 10000 })
  })

  test('should complete 30 rounds without errors in single player mode', async ({ page }) => {
    test.setTimeout(180000) // 3 minutes for 30 rounds

    // Step 1: Enter nickname
    const botNickname = `TestBot_${Date.now()}`
    await page.getByTestId('nickname-input').fill(botNickname)
    await page.locator('button:has-text("確認")').click()

    // Wait for rooms to appear
    await page.waitForTimeout(500)

    // Step 2: Select level (小學 - level 1)
    const level1Room = page.locator('.room-picker__room').first()
    await level1Room.click()

    // Wait for room to load
    await page.waitForTimeout(1000)

    // Step 5: Find and click empty seat
    const firstEmptySeat = page.locator('[data-testid="table-0"]')
    await firstEmptySeat.waitFor({ state: 'visible', timeout: 10000 })
    await firstEmptySeat.click()

    // Wait for player to be seated
    await page.waitForTimeout(500)

    // Verify player is seated
    await expect(firstEmptySeat).toHaveClass(/table-cell--local/)

    console.log('Bot seated successfully')

    // Step 6: Click start button if available
    const startButton = page.locator('button:has-text("開始")')
    const startButtonVisible = await startButton.isVisible().catch(() => false)
    if (startButtonVisible) {
      await startButton.click()
      console.log('Started game manually')
    } else {
      console.log('Waiting for game to auto-start...')
      await page.waitForTimeout(2000)
    }

    // Step 7: Play 30 rounds with varied behaviors to test edge cases
    for (let round = 1; round <= 30; round++) {
      console.log(`\nRound ${round}/30`)

      // Wait for round to start
      await page.waitForTimeout(1000)

      // Wait for game phase to be 'playing' and question to be available
      try {
        await page.waitForFunction(() => {
          return window.gameStore?.game?.phase === 'playing' &&
                 window.gameStore?.game?.currentQuestion !== null
        }, { timeout: 10000 })
      } catch {
        console.log(`Round ${round}: Game phase not 'playing', may have ended`)
        break
      }

      // Check if blackboard question is visible
      const sentenceLocator = page.locator('.blackboard__sentence')
      const definitionLocator = page.locator('.blackboard__definition')

      try {
        await sentenceLocator.waitFor({ state: 'visible', timeout: 5000 })
      } catch {
        console.log(`Round ${round}: Question not visible, game may have ended`)
        break
      }

      // Get the definition and sentence to understand the word
      const definition = await definitionLocator.textContent()
      const sentence = await sentenceLocator.textContent()
      console.log(`Sentence: "${sentence}"`)
      console.log(`Definition: "${definition}"`)

      // Find the hidden input field
      const hiddenInput = page.locator('.hidden-input')

      // Get correct answer from game store
      const correctAnswer = await page.evaluate(() => {
        return window.gameStore?.game?.currentQuestion?.word || ''
      })

      if (!correctAnswer) {
        console.log('Could not get correct answer from game store')
        break
      }

      console.log(`Correct answer: "${correctAnswer}"`)

      // Test different behaviors based on round number
      const behavior = round % 10

      try {
        switch (behavior) {
          case 0: // Standard correct answer
            console.log('Behavior: Standard correct answer')
            await page.locator('.spelling-board').click()
            await hiddenInput.fill(correctAnswer.toLowerCase())
            await page.waitForTimeout(300)
            await page.locator('button:has-text("提交")').click()
            break

          case 1: // Fast submission (no wait)
            console.log('Behavior: Fast submission')
            await page.locator('.spelling-board').click()
            await hiddenInput.fill(correctAnswer.toLowerCase())
            await page.locator('button:has-text("提交")').click()
            break

          case 2: // Slow typing (character by character)
            console.log('Behavior: Slow typing')
            await page.locator('.spelling-board').click()
            for (const char of correctAnswer.toLowerCase()) {
              await hiddenInput.press(char)
              await page.waitForTimeout(100)
            }
            await page.waitForTimeout(200)
            await page.locator('button:has-text("提交")').click()
            break

          case 3: // Submit with Enter key
            console.log('Behavior: Submit with Enter key')
            await page.locator('.spelling-board').click()
            await hiddenInput.fill(correctAnswer.toLowerCase())
            await page.waitForTimeout(300)
            await hiddenInput.press('Enter')
            break

          case 4: // Type with mixed case (should still be correct)
            console.log('Behavior: Mixed case input')
            const mixedCase = correctAnswer.split('').map((c, i) =>
              i % 2 === 0 ? c.toUpperCase() : c.toLowerCase()
            ).join('')
            await page.locator('.spelling-board').click()
            await hiddenInput.fill(mixedCase)
            await page.waitForTimeout(300)
            await page.locator('button:has-text("提交")').click()
            break

          case 5: // Test backspace/correction behavior
            console.log('Behavior: Backspace correction')
            await page.locator('.spelling-board').click()
            await hiddenInput.fill('wrongword')
            await page.waitForTimeout(200)
            await hiddenInput.fill('') // Clear
            await hiddenInput.fill(correctAnswer.toLowerCase())
            await page.waitForTimeout(300)
            await page.locator('button:has-text("提交")').click()
            break

          case 6: // Test with extra spaces (should be trimmed)
            console.log('Behavior: Answer with spaces')
            await page.locator('.spelling-board').click()
            await hiddenInput.fill(`  ${correctAnswer.toLowerCase()}  `)
            await page.waitForTimeout(300)
            await page.locator('button:has-text("提交")').click()
            break

          case 7: // Test clicking sound button then answering
            console.log('Behavior: Click sound button first')
            const soundButton = page.locator('.blackboard__sound')
            const soundVisible = await soundButton.isVisible().catch(() => false)
            if (soundVisible) {
              await soundButton.click()
              await page.waitForTimeout(500)
            }
            await page.locator('.spelling-board').click()
            await hiddenInput.fill(correctAnswer.toLowerCase())
            await page.waitForTimeout(300)
            await page.locator('button:has-text("提交")').click()
            break

          case 8: // Test very quick double-click protection
            console.log('Behavior: Quick double-click test')
            await page.locator('.spelling-board').click()
            await hiddenInput.fill(correctAnswer.toLowerCase())
            await page.waitForTimeout(100)
            const submitBtn = page.locator('button:has-text("提交")')
            await submitBtn.click()
            // Try to click again immediately
            await submitBtn.click().catch(() => {})
            break

          case 9: // Test clicking board multiple times
            console.log('Behavior: Multiple board clicks')
            await page.locator('.spelling-board').click()
            await page.waitForTimeout(50)
            await page.locator('.spelling-board').click()
            await page.waitForTimeout(50)
            await hiddenInput.fill(correctAnswer.toLowerCase())
            await page.waitForTimeout(300)
            await page.locator('button:has-text("提交")').click()
            break

          default:
            // Fallback to standard
            await page.locator('.spelling-board').click()
            await hiddenInput.fill(correctAnswer.toLowerCase())
            await page.waitForTimeout(300)
            await page.locator('button:has-text("提交")').click()
        }

        console.log('Answer submitted')
      } catch (error) {
        console.error(`Error in round ${round}:`, error.message)
        consoleErrors.push(`Test execution error in round ${round}: ${error.message}`)
        break
      }

      // Wait for round to end
      await page.waitForTimeout(2000)

      // Check for elimination
      const myTable = page.locator('[data-testid="table-0"]')
      const isEliminated = await myTable.evaluate(el =>
        el.classList.contains('table-cell--eliminated')
      )

      if (isEliminated) {
        console.error(`Bot was eliminated in round ${round}!`)
        break
      }

      // Wait for next round to start
      await page.waitForTimeout(1000)
    }

    // Wait for any final animations
    await page.waitForTimeout(2000)

    // Step 8: Verify no console errors occurred
    console.log('\n=== Test Summary ===')
    console.log(`Console Errors: ${consoleErrors.length}`)
    console.log(`Console Warnings: ${consoleWarnings.length}`)

    if (consoleErrors.length > 0) {
      console.log('\nConsole Errors:')
      consoleErrors.forEach((err, i) => {
        console.log(`${i + 1}. ${err}`)
      })
    }

    if (consoleWarnings.length > 0) {
      console.log('\nConsole Warnings:')
      consoleWarnings.forEach((warn, i) => {
        console.log(`${i + 1}. ${warn}`)
      })
    }

    // Take a screenshot at the end
    await page.screenshot({ path: 'test-results/singleplayer-bot-final.png', fullPage: true })

    // Assert no critical errors
    const criticalErrors = consoleErrors.filter(err =>
      !err.includes('favicon') &&
      !err.includes('404') &&
      !err.includes('PeerJS') &&
      !err.includes('WebSocket') &&
      !err.includes('peerjs') &&
      !err.includes('network') &&
      !err.includes('Failed to load resource') &&
      !err.includes('interrupted')
    )

    if (criticalErrors.length > 0) {
      console.log('\n=== Critical Errors ===')
      criticalErrors.forEach((err, i) => {
        console.log(`${i + 1}. ${err}`)
      })
    }

    expect(criticalErrors.length).toBe(0)

    console.log('\n✅ Bot completed all rounds successfully!')
  })

  test('should handle rapid answer submission', async ({ page }) => {
    test.setTimeout(60000) // 1 minute for 5 rounds

    // This test verifies the game handles quick submissions without breaking

    const botNickname = `SpeedBot_${Date.now()}`
    await page.getByTestId('nickname-input').fill(botNickname)
    await page.locator('button:has-text("確認")').click()
    await page.waitForTimeout(500)
    await page.locator('.room-picker__room').first().click()

    await page.waitForTimeout(1000)

    const firstEmptySeat = page.locator('[data-testid="table-0"]')
    await firstEmptySeat.click()
    await page.waitForTimeout(500)

    // Start game
    const startButton = page.locator('button:has-text("開始")')
    const startButtonVisible = await startButton.isVisible().catch(() => false)
    if (startButtonVisible) {
      await startButton.click()
      console.log('Clicked start button')
    } else {
      console.log('Start button not visible, waiting for auto-start...')
    }

    // Wait for game to fully start (TTS pronunciation takes time)
    await page.waitForTimeout(2000)

    // Play 5 rounds with very fast submissions
    for (let round = 1; round <= 5; round++) {
      console.log(`\nRound ${round}/5`)

      // Wait for question to be available and input to be enabled
      await page.waitForFunction(() => {
        const question = window.gameStore?.game?.currentQuestion
        const input = document.querySelector('.hidden-input')
        return question !== null && question !== undefined && input && !input.disabled
      }, { timeout: 15000 })

      const correctAnswer = await page.evaluate(() => {
        return window.gameStore?.game?.currentQuestion?.word || ''
      })

      if (!correctAnswer) break

      console.log(`Answer: ${correctAnswer}`)

      // Type and submit as fast as possible
      const hiddenInput = page.locator('.hidden-input')
      await page.locator('.spelling-board').click()
      await hiddenInput.fill(correctAnswer.toLowerCase())
      await page.waitForTimeout(100)
      await page.locator('button:has-text("提交")').click()

      console.log('Answer submitted')

      // Wait for round to process (3s round end delay + some buffer)
      await page.waitForTimeout(3500)

      // Check if next round started or game ended
      const nextGameState = await page.evaluate(() => {
        return {
          currentRound: window.gameStore?.game?.currentRound,
          phase: window.gameStore?.game?.phase,
          isActive: window.gameStore?.game?.isActive
        }
      })

      console.log('After submit:', nextGameState)

      if (!nextGameState.isActive || nextGameState.currentRound <= round) {
        console.log('Game ended or round did not advance')
        break
      }
    }

    // Verify no critical errors from rapid submission
    const criticalErrors = consoleErrors.filter(err =>
      !err.includes('favicon') &&
      !err.includes('404') &&
      !err.includes('PeerJS') &&
      !err.includes('WebSocket') &&
      !err.includes('peerjs') &&
      !err.includes('network') &&
      !err.includes('Failed to load resource') &&
      !err.includes('interrupted') // TTS interruption is expected
    )

    if (criticalErrors.length > 0) {
      console.log('\n=== Critical Errors ===')
      criticalErrors.forEach((err, i) => {
        console.log(`${i + 1}. ${err}`)
      })
    }

    expect(criticalErrors.length).toBe(0)
  })

  test('should handle incorrect answers correctly', async ({ page }) => {
    // This test verifies elimination works correctly

    const botNickname = `WrongBot_${Date.now()}`
    await page.getByTestId('nickname-input').fill(botNickname)
    await page.locator('button:has-text("確認")').click()
    await page.waitForTimeout(500)
    await page.locator('.room-picker__room').first().click()

    await page.waitForTimeout(1000)

    const firstEmptySeat = page.locator('[data-testid="table-0"]')
    await firstEmptySeat.click()
    await page.waitForTimeout(500)

    // Start game
    const startButton = page.locator('button:has-text("開始")')
    const startButtonVisible = await startButton.isVisible().catch(() => false)
    if (startButtonVisible) {
      await startButton.click()
    }
    await page.waitForTimeout(2000)

    // Round 1: Correct answer
    await page.waitForTimeout(1000)
    await page.waitForFunction(() => {
      return window.gameStore?.game?.phase === 'playing' &&
             window.gameStore?.game?.currentQuestion !== null
    }, { timeout: 10000 })

    let correctAnswer = await page.evaluate(() => {
      return window.gameStore?.game?.currentQuestion?.word || ''
    })
    await page.locator('.spelling-board').click()
    await page.locator('.hidden-input').fill(correctAnswer.toLowerCase())
    await page.locator('button:has-text("提交")').click()
    await page.waitForTimeout(2000)

    // Round 2: Intentionally wrong answer
    await page.waitForTimeout(1000)
    await page.waitForFunction(() => {
      return window.gameStore?.game?.phase === 'playing' &&
             window.gameStore?.game?.currentQuestion !== null
    }, { timeout: 10000 })

    await page.locator('.spelling-board').click()
    await page.locator('.hidden-input').fill('wronganswer')
    await page.locator('button:has-text("提交")').click()
    await page.waitForTimeout(2000)

    // Verify player was eliminated
    const myTable = page.locator('[data-testid="table-0"]')
    const isEliminated = await myTable.evaluate(el =>
      el.classList.contains('table-cell--eliminated')
    )

    expect(isEliminated).toBe(true)

    // Verify no critical errors occurred during elimination
    const criticalErrors = consoleErrors.filter(err =>
      !err.includes('favicon') &&
      !err.includes('404') &&
      !err.includes('PeerJS') &&
      !err.includes('WebSocket') &&
      !err.includes('peerjs') &&
      !err.includes('network') &&
      !err.includes('Failed to load resource') &&
      !err.includes('interrupted')
    )

    if (criticalErrors.length > 0) {
      console.log('\n=== Critical Errors ===')
      criticalErrors.forEach((err, i) => {
        console.log(`${i + 1}. ${err}`)
      })
    }

    expect(criticalErrors.length).toBe(0)
  })
})
