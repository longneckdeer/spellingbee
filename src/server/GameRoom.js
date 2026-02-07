/**
 * GameRoom Durable Object
 *
 * Each instance represents one game room (one level).
 * Manages WebSocket connections, game state, and orchestrates gameplay.
 */

import { GAME_CONFIG } from '../config/game.js'

// Import word data for each level
import elementaryWords from '../gameTypes/english-spelling/data/elementary.json'
import middleWords from '../gameTypes/english-spelling/data/middle.json'
import highWords from '../gameTypes/english-spelling/data/high.json'
import universityWords from '../gameTypes/english-spelling/data/university.json'
import expertWords from '../gameTypes/english-spelling/data/expert.json'

const LEVEL_WORDS = {
  1: elementaryWords,
  2: middleWords,
  3: highWords,
  4: universityWords,
  5: expertWords
}

export class GameRoom {
  constructor(state, env) {
    this.state = state
    this.env = env

    // In-memory game state
    this.sessions = new Map() // playerId -> { ws, nickname, tableIndex }
    this.tables = this.createEmptyTables()
    this.observers = [] // { id, nickname }

    this.game = {
      isActive: false,
      currentRound: 0,
      currentQuestion: null,
      timeRemaining: GAME_CONFIG.roundTimeSeconds,
      phase: 'waiting', // 'waiting' | 'preparing' | 'playing' | 'reviewing' | 'gameEnd'
      reviewCountdown: 0
    }

    this.nextGameCountdown = 0
    this.lastGameRanking = []
    this.usedWords = new Set() // Track used words to avoid repeats
    this.level = null // Set from room ID

    // Global high scores (persisted to Durable Object storage)
    this.highScores = [] // Array<{ nickname, score, timestamp }>
    this.highScoresLoaded = false

    // Timers
    this.roundTimer = null
    this.reviewTimer = null
    this.prepTimer = null
    this.nextGameTimer = null
  }

  // Load high scores from persistent storage
  async loadHighScores() {
    if (this.highScoresLoaded) return

    try {
      const stored = await this.state.storage.get('highScores')
      if (stored) {
        this.highScores = stored
      }
      this.highScoresLoaded = true
    } catch (err) {
      console.error('Failed to load high scores:', err)
      this.highScores = []
      this.highScoresLoaded = true
    }
  }

  // Save high scores to persistent storage
  async saveHighScores() {
    try {
      await this.state.storage.put('highScores', this.highScores)
    } catch (err) {
      console.error('Failed to save high scores:', err)
    }
  }

  // Update high scores after game ends
  async updateHighScores(rankings) {
    for (const player of rankings) {
      if (player.roundsSurvived > 0) {
        this.highScores.push({
          nickname: player.nickname,
          score: player.roundsSurvived,
          timestamp: Date.now()
        })
      }
    }

    this.sortAndTrimHighScores()
    await this.saveHighScores()
  }

  // Save a single player's score (for mid-game exits)
  async savePlayerScore(nickname, roundResults) {
    if (!roundResults || roundResults.length === 0) return

    const score = roundResults.filter(r => r.correct).length
    if (score > 0) {
      await this.loadHighScores() // Ensure we have latest scores
      this.highScores.push({
        nickname,
        score,
        timestamp: Date.now()
      })
      this.sortAndTrimHighScores()
      await this.saveHighScores()

      // Broadcast updated high scores to all clients
      this.broadcast({
        type: 'highScores:update',
        highScores: this.highScores
      })
    }
  }

  // Sort and keep only top 10 scores
  sortAndTrimHighScores() {
    this.highScores.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return a.timestamp - b.timestamp
    })
    this.highScores = this.highScores.slice(0, 10)
  }

  createEmptyTables() {
    return Array.from({ length: GAME_CONFIG.tableCount }, (_, index) => ({
      index,
      playerId: null,
      nickname: '',
      currentTyping: '',
      isEliminated: false,
      hasLeft: false,
      isReady: false,
      hasSubmittedAnswer: false,
      roundResults: []
    }))
  }

  // WebSocket handling
  async fetch(request) {
    const url = new URL(request.url)

    // Handle player count API request
    if (url.pathname === '/api/player-count') {
      const count = this.sessions.size
      return new Response(JSON.stringify({ count }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('Expected WebSocket', { status: 426 })
    }

    // Extract level from URL if not set
    if (!this.level) {
      const roomId = url.pathname.split('/')[2] || ''
      const match = roomId.match(/spellingbee-(\d+)/)
      if (match) {
        this.level = parseInt(match[1])
      }
    }

    const pair = new WebSocketPair()
    const [client, server] = Object.values(pair)

    await this.handleSession(server)

    return new Response(null, {
      status: 101,
      webSocket: client
    })
  }

  async handleSession(ws) {
    ws.accept()

    let playerId = null

    ws.addEventListener('message', async (event) => {
      try {
        const message = JSON.parse(event.data)

        // Handle player join (first message)
        if (message.type === 'player:joinRoom' && !playerId) {
          playerId = message.playerId
          this.sessions.set(playerId, {
            ws,
            nickname: message.nickname,
            tableIndex: null
          })

          // Add as observer initially
          this.observers.push({ id: playerId, nickname: message.nickname })

          // Load high scores from storage (if not already loaded)
          await this.loadHighScores()

          // Send full state to new player
          this.sendTo(ws, {
            type: 'state:sync',
            state: this.getStateForSync()
          })

          // Notify others
          this.broadcast({
            type: 'player:joinRoom',
            playerId,
            nickname: message.nickname
          }, playerId)

          return
        }

        // Handle other messages
        if (playerId) {
          await this.handleMessage(playerId, message)
        }
      } catch (err) {
        console.error('Message error:', err)
      }
    })

    ws.addEventListener('close', () => {
      if (playerId) {
        this.handlePlayerLeave(playerId)
      }
    })

    ws.addEventListener('error', (err) => {
      console.error('WebSocket error:', err)
      if (playerId) {
        this.handlePlayerLeave(playerId)
      }
    })
  }

  async handleMessage(playerId, message) {
    switch (message.type) {
      case 'player:sit':
        this.handlePlayerSit(playerId, message.tableIndex, message.nickname)
        this.broadcast(message)
        // Broadcast state sync to ensure all clients have updated table
        this.broadcast({
          type: 'state:sync',
          state: this.getStateForSync()
        })
        break

      case 'player:stand':
        await this.handlePlayerStand(playerId)
        this.broadcast(message)
        // Broadcast state sync to ensure all clients have cleared table
        this.broadcast({
          type: 'state:sync',
          state: this.getStateForSync()
        })
        break

      case 'player:left':
        this.handlePlayerLeft(playerId)
        this.broadcast(message)
        // Broadcast state sync to ensure all clients have updated table
        this.broadcast({
          type: 'state:sync',
          state: this.getStateForSync()
        })
        break

      case 'player:typing':
        this.handlePlayerTyping(playerId, message.typing)
        this.broadcast(message)
        break

      case 'player:ready':
        this.handlePlayerReady(playerId, message.isReady)
        this.broadcast(message)
        this.checkReadyAutoStart()
        break

      case 'round:answer':
        this.handleRoundAnswer(playerId, message.answer)
        break

      case 'table:add':
        this.handleAddTable()
        break

      default:
        console.log('Unknown message type:', message.type)
    }
  }

  handleAddTable() {
    // Don't allow adding tables during active game
    if (this.game.isActive) return

    // Create new table with next index
    const newIndex = this.tables.length
    const newTable = {
      index: newIndex,
      playerId: null,
      nickname: '',
      currentTyping: '',
      isEliminated: false,
      hasLeft: false,
      isReady: false,
      hasSubmittedAnswer: false,
      roundResults: []
    }

    this.tables.push(newTable)

    // Broadcast new table to all clients
    this.broadcast({
      type: 'table:add',
      table: newTable
    })
  }

  resetRoom() {
    // Stop all timers
    this.stopRoundTimer()
    this.stopReviewCountdown()
    this.stopPreparationCountdown()
    this.stopNextGameCountdown()

    // Reset tables to default count
    this.tables = this.createEmptyTables()
    this.observers = []

    // Reset game state
    this.game = {
      isActive: false,
      currentRound: 0,
      currentQuestion: null,
      timeRemaining: GAME_CONFIG.roundTimeSeconds,
      phase: 'waiting',
      reviewCountdown: 0
    }

    this.nextGameCountdown = 0
    this.lastGameRanking = []
    this.usedWords = new Set()
  }

  handlePlayerSit(playerId, tableIndex, nickname) {
    if (tableIndex < 0 || tableIndex >= this.tables.length) return
    if (this.tables[tableIndex].playerId !== null) return

    // Check if player is already sitting at another table
    const currentTable = this.tables.find(t => t.playerId === playerId)
    if (currentTable) {
      // Player is already sitting somewhere - not allowed to sit at multiple tables
      console.log(`Player ${playerId} is already seated at table ${currentTable.index}, cannot sit at table ${tableIndex}`)
      return
    }

    const session = this.sessions.get(playerId)
    if (session) {
      session.tableIndex = tableIndex
    }

    this.tables[tableIndex].playerId = playerId
    this.tables[tableIndex].nickname = nickname
    this.tables[tableIndex].isReady = false
    this.tables[tableIndex].currentTyping = ''
    this.tables[tableIndex].isEliminated = false
    this.tables[tableIndex].hasLeft = false
    this.tables[tableIndex].hasSubmittedAnswer = false
    this.tables[tableIndex].roundResults = []

    // Remove from observers
    this.observers = this.observers.filter(o => o.id !== playerId)
  }

  async handlePlayerStand(playerId) {
    const table = this.tables.find(t => t.playerId === playerId)
    if (!table) return

    const nickname = table.nickname
    const roundResults = [...table.roundResults] // Copy before clearing
    const session = this.sessions.get(playerId)
    if (session) {
      session.tableIndex = null
    }

    // Save score before clearing (if game was active and player had results)
    if (this.game.isActive && roundResults.length > 0) {
      await this.savePlayerScore(nickname, roundResults)
    }

    // Clear table
    table.playerId = null
    table.nickname = ''
    table.currentTyping = ''
    table.isEliminated = false
    table.hasLeft = false
    table.isReady = false
    table.hasSubmittedAnswer = false
    table.roundResults = []

    // Add back to observers
    if (!this.observers.find(o => o.id === playerId)) {
      this.observers.push({ id: playerId, nickname })
    }

    // Handle when nobody is seated
    if (this.getSeatedPlayers().length === 0) {
      // Stop next game countdown
      this.stopNextGameCountdown()
      this.nextGameCountdown = 0
      this.broadcast({
        type: 'nextGame:update',
        nextGameCountdown: 0
      })

      // If game is active (playing or reviewing), end it properly
      if (this.game.isActive && (this.game.phase === 'playing' || this.game.phase === 'reviewing')) {
        console.log('All players left during active game, ending game')
        this.stopRoundTimer()
        this.stopReviewCountdown()
        this.endGame()
      }
      // If in any other phase (preparing, gameEnd, or stuck in any state), reset to waiting
      else if (this.game.phase !== 'waiting') {
        this.stopPreparationCountdown()
        this.stopReviewCountdown()
        this.game.isActive = false
        this.game.phase = 'waiting'
        this.game.currentRound = 0
        this.game.currentQuestion = null
        this.game.reviewCountdown = 0
        this.broadcast({
          type: 'game:reset'
        })
      }
    }
  }

  handlePlayerLeft(playerId) {
    const table = this.tables.find(t => t.playerId === playerId)
    if (table) {
      // Don't save score here - player is still "seated" (playerId not null)
      // so endGame() will include them when calculating final rankings
      table.hasLeft = true
      table.isReady = false
    }

    // Check if game should end due to no players
    this.checkGameShouldEnd()
  }

  async handlePlayerLeave(playerId) {
    // Remove from tables
    await this.handlePlayerStand(playerId)

    // Remove from observers
    this.observers = this.observers.filter(o => o.id !== playerId)

    // Remove session
    this.sessions.delete(playerId)

    // Notify others
    this.broadcast({
      type: 'player:leaveRoom',
      playerId
    })

    // Reset room when nobody is left
    if (this.sessions.size === 0) {
      console.log('Room empty, resetting to default state')
      this.resetRoom()
      return
    }

    // Check if game should end due to no players
    this.checkGameShouldEnd()

    // Handle when nobody is seated
    // (handlePlayerStand already checks this, but check again in case they were an observer)
    if (this.getSeatedPlayers().length === 0) {
      // Stop next game countdown
      if (this.nextGameCountdown > 0) {
        this.stopNextGameCountdown()
        this.nextGameCountdown = 0
        this.broadcast({
          type: 'nextGame:update',
          nextGameCountdown: 0
        })
      }

      // If game is active (playing or reviewing), end it properly
      if (this.game.isActive && (this.game.phase === 'playing' || this.game.phase === 'reviewing')) {
        console.log('All players left during active game, ending game')
        this.stopRoundTimer()
        this.stopReviewCountdown()
        this.endGame()
      }
      // If in any other phase (preparing, gameEnd, or stuck in any state), reset to waiting
      else if (this.game.phase !== 'waiting') {
        this.stopPreparationCountdown()
        this.stopReviewCountdown()
        this.game.isActive = false
        this.game.phase = 'waiting'
        this.game.currentRound = 0
        this.game.currentQuestion = null
        this.game.reviewCountdown = 0
        this.broadcast({
          type: 'game:reset'
        })
      }
    }
  }

  checkGameShouldEnd() {
    // Only check during active game
    if (!this.game.isActive) return

    const activePlayers = this.getActivePlayers()

    // End game only if no active players left
    // Allow single remaining player to continue playing for leaderboard score
    if (activePlayers.length === 0) {
      console.log('Game ending due to no active players')
      this.stopRoundTimer()
      this.stopReviewCountdown()
      this.endGame()
    }
  }

  handlePlayerTyping(playerId, typing) {
    const table = this.tables.find(t => t.playerId === playerId)
    if (table) {
      table.currentTyping = typing

      // If player starts typing after submitting, unsubmit them
      if (table.hasSubmittedAnswer && this.game.phase === 'playing') {
        table.hasSubmittedAnswer = false
        // Broadcast state so all clients see the unsubmit
        this.broadcast({
          type: 'state:sync',
          state: this.getStateForSync()
        })
      }
    }
  }

  handlePlayerReady(playerId, isReady) {
    const table = this.tables.find(t => t.playerId === playerId)
    if (table) {
      table.isReady = isReady
    }
  }

  checkReadyAutoStart() {
    const stats = this.getReadyStats()
    const phase = this.game.phase

    // Waiting or gameEnd phase: >50% ready triggers game start
    if ((phase === 'waiting' || phase === 'gameEnd') && !this.game.isActive) {
      if (stats.seatedTotal >= GAME_CONFIG.minPlayersToStart &&
          stats.seatedReadyPercent > 0.5) {
        this.triggerGameStart()
      }
    }

    // Reviewing phase: 100% active ready skips countdown
    if (phase === 'reviewing' && this.game.isActive) {
      if (stats.allActiveReady) {
        this.stopReviewCountdown()
        this.startNextRound()
      }
    }
  }

  handleRoundAnswer(playerId, answer) {
    const table = this.tables.find(t => t.playerId === playerId)
    if (!table || !this.game.currentQuestion) return

    // Update currentTyping to match submitted answer (fixes race condition with PLAYER_TYPING messages)
    table.currentTyping = answer

    // Mark as submitted
    table.hasSubmittedAnswer = true

    // Validate answer
    const correct = this.game.currentQuestion.word.toLowerCase() === answer.trim().toLowerCase()

    // Check if player already has a result for this word (resubmission)
    const existingResultIndex = table.roundResults.findIndex(
      r => r.word === this.game.currentQuestion.word
    )

    const result = {
      word: this.game.currentQuestion.word,
      definition: this.game.currentQuestion.definition,
      answer,
      correct
    }

    if (existingResultIndex >= 0) {
      // Update existing answer (resubmission)
      table.roundResults[existingResultIndex] = result
    } else {
      // Add new answer (first submission)
      table.roundResults.push(result)
    }

    // Broadcast state so all clients see the submission status
    this.broadcast({
      type: 'state:sync',
      state: this.getStateForSync()
    })

    // Check if all active players have submitted
    this.checkAllAnswersSubmitted()
  }

  checkAllAnswersSubmitted() {
    if (this.game.phase !== 'playing') return

    const activePlayers = this.getActivePlayers()
    const allSubmitted = activePlayers.every(t => {
      return t.roundResults.length >= this.game.currentRound
    })

    if (allSubmitted) {
      this.processRoundEnd()
    }
  }

  processRoundEnd() {
    const activePlayers = this.getActivePlayers()
    const results = activePlayers.map(t => {
      const hasSubmitted = t.roundResults.length >= this.game.currentRound

      if (!hasSubmitted) {
        t.roundResults.push({
          word: this.game.currentQuestion.word,
          definition: this.game.currentQuestion.definition,
          answer: '',
          correct: false
        })
      }

      const lastResult = t.roundResults[t.roundResults.length - 1]
      return {
        playerId: t.playerId,
        answer: lastResult.answer,
        correct: lastResult.correct
      }
    })

    // Mark eliminated players
    results.forEach(r => {
      const table = this.tables.find(t => t.playerId === r.playerId)
      if (table && !r.correct) {
        table.isEliminated = true
      }
    })

    // Check if game should end BEFORE setting phase to reviewing
    const remainingPlayers = this.getActivePlayers()

    // End game only if no active players left
    // Allow single remaining player to continue playing for leaderboard score
    if (remainingPlayers.length === 0) {
      // Game is ending - broadcast results but don't enter reviewing phase
      this.broadcast({
        type: 'round:end',
        results,
        correctAnswer: this.game.currentQuestion.word
      })
      this.endGame()
    } else {
      // Game continues - enter reviewing phase with countdown
      this.game.phase = 'reviewing'

      this.broadcast({
        type: 'round:end',
        results,
        correctAnswer: this.game.currentQuestion.word
      })

      this.startReviewCountdown()
    }
  }

  // Game flow methods
  triggerGameStart() {
    this.game.isActive = true
    this.game.currentRound = 0
    this.game.phase = 'preparing'
    this.nextGameCountdown = 0

    // Reset all seated players
    this.tables.forEach(t => {
      if (t.playerId !== null) {
        t.isEliminated = false
        t.hasLeft = false
        t.currentTyping = ''
        t.isReady = false
        t.roundResults = []
      }
    })

    this.startPreparationCountdown()
  }

  startPreparationCountdown() {
    this.stopPreparationCountdown()
    this.game.reviewCountdown = GAME_CONFIG.firstRoundDelaySeconds

    this.broadcast({
      type: 'game:preparing',
      prepCountdown: GAME_CONFIG.firstRoundDelaySeconds
    })

    this.prepTimer = setInterval(() => {
      this.game.reviewCountdown--

      this.broadcast({
        type: 'prep:update',
        prepCountdown: this.game.reviewCountdown
      })

      if (this.game.reviewCountdown <= 0) {
        this.stopPreparationCountdown()
        this.startFirstRound()
      }
    }, 1000)
  }

  stopPreparationCountdown() {
    if (this.prepTimer) {
      clearInterval(this.prepTimer)
      this.prepTimer = null
    }
  }

  getRandomQuestion() {
    const words = LEVEL_WORDS[this.level] || LEVEL_WORDS[1]

    // Filter out already used words
    const availableWords = words.filter(w => !this.usedWords.has(w.word))

    // If all words used, reset
    if (availableWords.length === 0) {
      this.usedWords.clear()
      return words[Math.floor(Math.random() * words.length)]
    }

    const question = availableWords[Math.floor(Math.random() * availableWords.length)]
    this.usedWords.add(question.word)

    return question
  }

  startFirstRound() {
    const question = this.getRandomQuestion()
    this.startRound(question)
  }

  startNextRound() {
    const question = this.getRandomQuestion()
    this.startRound(question)
  }

  startRound(question) {
    this.game.currentRound++
    this.game.currentQuestion = question
    this.game.timeRemaining = GAME_CONFIG.roundTimeSeconds
    this.game.phase = 'playing'

    // Reset typing, ready, and submission status for all active players
    this.tables.forEach(t => {
      if (t.playerId !== null && !t.isEliminated) {
        t.currentTyping = ''
        t.isReady = false
        t.hasSubmittedAnswer = false
      }
    })

    this.broadcast({
      type: 'round:start',
      round: this.game.currentRound,
      question
    })

    this.startRoundTimer()
  }

  startRoundTimer() {
    this.stopRoundTimer()

    this.roundTimer = setInterval(() => {
      this.game.timeRemaining--

      this.broadcast({
        type: 'time:update',
        timeRemaining: this.game.timeRemaining
      })

      if (this.game.timeRemaining <= 0) {
        this.stopRoundTimer()
        this.processRoundEnd()
      }
    }, 1000)
  }

  stopRoundTimer() {
    if (this.roundTimer) {
      clearInterval(this.roundTimer)
      this.roundTimer = null
    }
  }

  startReviewCountdown() {
    this.stopReviewCountdown()
    this.game.reviewCountdown = GAME_CONFIG.roundEndDelaySeconds

    this.reviewTimer = setInterval(() => {
      this.game.reviewCountdown--

      this.broadcast({
        type: 'review:update',
        reviewCountdown: this.game.reviewCountdown
      })

      if (this.game.reviewCountdown <= 0) {
        this.stopReviewCountdown()
        this.startNextRound()
      }
    }, 1000)
  }

  stopReviewCountdown() {
    if (this.reviewTimer) {
      clearInterval(this.reviewTimer)
      this.reviewTimer = null
    }
  }

  async endGame() {
    // Prevent duplicate calls (can happen due to async/race conditions)
    if (!this.game.isActive && this.game.phase === 'gameEnd') {
      console.log('endGame() called but game already ended, skipping')
      return
    }

    console.log('=== END GAME CALLED ===')
    // Mark as ended immediately to prevent re-entry
    this.game.isActive = false
    this.game.phase = 'gameEnd'

    const seatedPlayers = this.getSeatedPlayers()
    console.log('Seated players:', seatedPlayers.length)

    const rankings = seatedPlayers
      .map(t => ({
        playerId: t.playerId,
        nickname: t.nickname,
        roundsSurvived: t.roundResults.filter(r => r.correct).length
      }))
      .sort((a, b) => b.roundsSurvived - a.roundsSurvived)

    console.log('Rankings:', JSON.stringify(rankings))

    // Assign ranks, handling ties properly (same score = same rank)
    this.lastGameRanking = []
    let currentRank = 1
    let previousScore = null

    for (let i = 0; i < rankings.length; i++) {
      const player = rankings[i]

      // If score is different from previous, update rank to current position
      if (previousScore !== null && player.roundsSurvived !== previousScore) {
        currentRank = i + 1
      }

      this.lastGameRanking.push({
        nickname: player.nickname,
        roundsSurvived: player.roundsSurvived,
        rank: currentRank
      })

      previousScore = player.roundsSurvived
    }

    // Update global high scores
    await this.updateHighScores(rankings)

    // Reset other game state (isActive and phase already set at start of function)
    this.game.currentRound = 0
    this.game.currentQuestion = null
    this.nextGameCountdown = 0

    console.log('Broadcasting GAME_END with rankings:', rankings.length)
    this.broadcast({
      type: 'game:end',
      rankings,
      highScores: this.highScores
    })

    this.broadcast({
      type: 'nextGame:update',
      nextGameCountdown: 0
    })

    // No auto-start countdown - rely on ready votes only
  }

  startNextGameCountdown() {
    this.stopNextGameCountdown()
    this.nextGameCountdown = GAME_CONFIG.interGameSeconds

    this.broadcast({
      type: 'nextGame:update',
      nextGameCountdown: this.nextGameCountdown
    })

    this.nextGameTimer = setInterval(() => {
      this.nextGameCountdown--

      this.broadcast({
        type: 'nextGame:update',
        nextGameCountdown: this.nextGameCountdown
      })

      if (this.nextGameCountdown <= 0) {
        this.stopNextGameCountdown()

        if (this.getSeatedPlayers().length >= GAME_CONFIG.minPlayersToStart) {
          this.triggerGameStart()
        }
      }
    }, 1000)
  }

  stopNextGameCountdown() {
    if (this.nextGameTimer) {
      clearInterval(this.nextGameTimer)
      this.nextGameTimer = null
    }
  }

  // Helper methods
  getSeatedPlayers() {
    return this.tables.filter(t => t.playerId !== null)
  }

  getActivePlayers() {
    return this.tables.filter(t => t.playerId !== null && !t.isEliminated && !t.hasLeft)
  }

  getReadyStats() {
    const seatedPlayers = this.getSeatedPlayers()
    const activePlayers = this.getActivePlayers()

    const seatedReady = seatedPlayers.filter(t => t.isReady).length
    const activeReady = activePlayers.filter(t => t.isReady).length

    return {
      seatedTotal: seatedPlayers.length,
      seatedReady,
      seatedReadyPercent: seatedPlayers.length > 0 ? seatedReady / seatedPlayers.length : 0,
      activeTotal: activePlayers.length,
      activeReady,
      allActiveReady: activePlayers.length > 0 && activeReady === activePlayers.length
    }
  }

  getStateForSync() {
    return {
      tables: this.tables,
      observers: this.observers,
      game: this.game,
      lastGameRanking: this.lastGameRanking,
      nextGameCountdown: this.nextGameCountdown,
      highScores: this.highScores
    }
  }

  // Broadcasting
  broadcast(message, excludePlayerId = null) {
    const fullMessage = {
      ...message,
      timestamp: Date.now()
    }

    const msgString = JSON.stringify(fullMessage)

    for (const [playerId, session] of this.sessions) {
      if (playerId !== excludePlayerId && session.ws.readyState === 1) {
        try {
          session.ws.send(msgString)
        } catch (err) {
          console.error('Broadcast error to', playerId, err)
        }
      }
    }
  }

  sendTo(ws, message) {
    if (ws.readyState === 1) {
      try {
        ws.send(JSON.stringify({
          ...message,
          timestamp: Date.now()
        }))
      } catch (err) {
        console.error('Send error:', err)
      }
    }
  }
}
