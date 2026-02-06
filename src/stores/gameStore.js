import { reactive } from 'vue'
import { GAME_CONFIG } from '@/config/game'
import { createEmptyTables } from '@/utils/tableUtils'

// Load game history from localStorage
function loadGameHistory() {
  try {
    const saved = localStorage.getItem('spellingbee_history')
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

// Load nickname from localStorage
function loadNickname() {
  try {
    return localStorage.getItem('spellingbee_nickname') || ''
  } catch {
    return ''
  }
}

// Clear old localStorage keys (high scores are now server-side)
function clearOldLocalStorage() {
  try {
    localStorage.removeItem('spellingbee_highscores')
  } catch {
    // Ignore errors
  }
}

// Run cleanup on load
clearOldLocalStorage()

export const gameStore = reactive({
  // Current screen
  screen: 'roomPicker', // 'roomPicker' | 'room'

  // Room state
  currentRoom: null, // { level: 1-5, levelName: string } or null

  // Game type plugin reference
  gameType: null,

  // Player identity
  localPlayer: {
    id: crypto.randomUUID(),
    nickname: loadNickname(),
    isSeated: false,
    seatIndex: null
  },

  // Tables (25 seats by default)
  tables: createEmptyTables(),

  // Observers (people in room but not seated)
  observers: [], // Array<{ id, nickname }>

  // Current game state
  game: {
    isActive: false,
    currentRound: 0,
    currentQuestion: null, // { word, definition, sentence, partOfSpeech }
    timeRemaining: GAME_CONFIG.roundTimeSeconds,
    phase: 'waiting', // 'waiting' | 'preparing' | 'playing' | 'reviewing' | 'gameEnd'
    reviewCountdown: 0 // Countdown for review/preparation periods
  },

  // Last game results (for ranking display)
  lastGameRanking: [], // Array<{ nickname, roundsSurvived, rank }>

  // Timer for next game (countdown between games)
  nextGameCountdown: 0,

  // Selected table for observer viewing
  selectedTableIndex: null,

  // Game history (local, persisted to localStorage)
  gameHistory: loadGameHistory(),

  // High scores - now global from server (per room/level)
  highScores: [],

  // ============ GETTERS ============

  getSeatedPlayers() {
    return this.tables.filter(t => t.playerId !== null)
  },

  getActivePlayers() {
    return this.tables.filter(t => t.playerId !== null && !t.isEliminated && !t.hasLeft)
  },

  getEliminatedPlayers() {
    return this.tables.filter(t => t.playerId !== null && t.isEliminated)
  },

  getMyTable() {
    if (!this.localPlayer.isSeated) return null
    return this.tables[this.localPlayer.seatIndex]
  },

  isLocalPlayerSeated() {
    return this.localPlayer.isSeated && this.localPlayer.seatIndex !== null
  },

  isLocalPlayerEliminated() {
    const myTable = this.getMyTable()
    return myTable ? myTable.isEliminated : false
  },

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
  },

  // ============ ACTIONS ============

  setScreen(screen) {
    this.screen = screen
  },

  setCurrentRoom(room) {
    this.currentRoom = room
    // Clear last game ranking when entering a new room
    if (room) {
      this.lastGameRanking = []
    }
  },

  setGameType(gameType) {
    this.gameType = gameType
  },

  setLocalPlayer(player) {
    Object.assign(this.localPlayer, player)
    // Save nickname to localStorage
    if (player.nickname) {
      localStorage.setItem('spellingbee_nickname', player.nickname)
    }
  },

  setLocalPlayerId(id) {
    this.localPlayer.id = id
  },

  setNickname(nickname) {
    this.localPlayer.nickname = nickname
    localStorage.setItem('spellingbee_nickname', nickname)
  },

  // Seat management
  sitAtTable(tableIndex, playerId, nickname) {
    if (tableIndex < 0 || tableIndex >= this.tables.length) return false
    if (this.tables[tableIndex].playerId !== null) return false // Already occupied

    this.tables[tableIndex].playerId = playerId
    this.tables[tableIndex].nickname = nickname
    this.tables[tableIndex].currentTyping = ''
    this.tables[tableIndex].isEliminated = false
    this.tables[tableIndex].hasLeft = false
    this.tables[tableIndex].isReady = false
    this.tables[tableIndex].roundResults = []

    // If it's the local player
    if (playerId === this.localPlayer.id) {
      this.localPlayer.isSeated = true
      this.localPlayer.seatIndex = tableIndex
    }

    // Remove from observers if present
    this.removeObserver(playerId)

    return true
  },

  standFromTable(playerId) {
    const table = this.tables.find(t => t.playerId === playerId)
    if (!table) return false

    const nickname = table.nickname

    // Clear table
    table.playerId = null
    table.nickname = ''
    table.currentTyping = ''
    table.isEliminated = false
    table.hasLeft = false
    table.isReady = false
    table.roundResults = []

    // If it's the local player
    if (playerId === this.localPlayer.id) {
      this.localPlayer.isSeated = false
      this.localPlayer.seatIndex = null
    }

    // Add to observers
    this.addObserver(playerId, nickname)

    return true
  },

  markPlayerAsLeft(playerId) {
    const table = this.tables.find(t => t.playerId === playerId)
    if (!table) return false

    // Mark as left (stays in seat but inactive)
    table.hasLeft = true
    table.isReady = false

    // If it's the local player, mark as not seated
    if (playerId === this.localPlayer.id) {
      this.localPlayer.isSeated = false
    }

    return true
  },

  // Observer management
  addObserver(id, nickname) {
    if (!this.observers.find(o => o.id === id)) {
      this.observers.push({ id, nickname })
    }
  },

  removeObserver(id) {
    const index = this.observers.findIndex(o => o.id === id)
    if (index !== -1) {
      this.observers.splice(index, 1)
    }
  },

  // Table management
  addTable(table) {
    // Only add if not already exists
    if (!this.tables.find(t => t.index === table.index)) {
      this.tables.push(table)
    }
  },

  // Typing updates
  updateTyping(playerId, typing) {
    const table = this.tables.find(t => t.playerId === playerId)
    if (table) {
      table.currentTyping = typing
    }
  },

  // Ready state
  setPlayerReady(playerId, isReady) {
    const table = this.tables.find(t => t.playerId === playerId)
    if (table) {
      table.isReady = isReady
    }
  },

  // Game flow
  startGame() {
    this.game.isActive = true
    this.game.currentRound = 0
    this.game.phase = 'playing'
    this.nextGameCountdown = 0

    // Clear last game ranking when new game starts
    this.lastGameRanking = []

    // Reset word history to prevent duplicates
    if (this.gameType?.resetUsedWords) {
      this.gameType.resetUsedWords()
    }

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
  },

  startRound(question, round) {
    // Use round number from server (don't increment locally to avoid double counting)
    this.game.currentRound = round
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
  },

  setTimeRemaining(time) {
    this.game.timeRemaining = time
  },

  setReviewCountdown(time) {
    this.game.reviewCountdown = time
  },

  setNextGameCountdown(time) {
    this.nextGameCountdown = time
  },

  endRound(results) {
    // results: Array<{ playerId, answer, correct }>
    this.game.phase = 'reviewing'

    // Store results and handle elimination
    results.forEach(r => {
      const table = this.tables.find(t => t.playerId === r.playerId)
      if (table) {
        // Add result to roundResults if not already there
        const existingResult = table.roundResults.find(
          result => result.word === this.game.currentQuestion?.word
        )
        if (!existingResult) {
          table.roundResults.push({
            word: this.game.currentQuestion?.word || '',
            definition: this.game.currentQuestion?.definition || '',
            answer: r.answer,
            correct: r.correct
          })
        }

        // Handle elimination
        if (!r.correct) {
          table.isEliminated = true
        }
      }
    })
  },

  endGame(rankings) {
    // rankings: Array<{ playerId, nickname, roundsSurvived }>
    this.game.isActive = false
    this.game.phase = 'gameEnd'

    // Calculate ranks
    const sorted = [...rankings].sort((a, b) => b.roundsSurvived - a.roundsSurvived)
    this.lastGameRanking = sorted.map((r, index) => ({
      nickname: r.nickname,
      roundsSurvived: r.roundsSurvived,
      rank: index + 1
    }))

    // Save to game history if local player participated and there are rankings
    if (this.localPlayer.isSeated && this.lastGameRanking.length > 0) {
      const myTable = this.getMyTable()
      if (myTable) {
        const myRank = this.lastGameRanking.find(r => r.nickname === this.localPlayer.nickname)
        this.addToGameHistory({
          timestamp: Date.now(),
          level: this.currentRoom?.level,
          levelName: this.currentRoom?.levelName,
          myResults: [...myTable.roundResults],
          finalRank: myRank?.rank || null,
          totalPlayers: rankings.length,
          fullRanking: [...this.lastGameRanking] // Store full ranking
        })
      }
    }

    // Start countdown for next game
    this.nextGameCountdown = GAME_CONFIG.interGameSeconds
  },

  // Game history
  addToGameHistory(gameRecord) {
    this.gameHistory.unshift(gameRecord)
    // Keep only last 50 games
    if (this.gameHistory.length > 50) {
      this.gameHistory = this.gameHistory.slice(0, 50)
    }
    // Save to localStorage
    try {
      localStorage.setItem('spellingbee_history', JSON.stringify(this.gameHistory))
    } catch {
      // Ignore storage errors
    }
    // High scores are now managed server-side (global leaderboard)
  },

  // Selected table for observers
  setSelectedTableIndex(index) {
    this.selectedTableIndex = index
  },

  // State sync for P2P
  getStateForSync() {
    return {
      tables: this.tables,
      observers: this.observers,
      game: this.game,
      lastGameRanking: this.lastGameRanking,
      nextGameCountdown: this.nextGameCountdown
    }
  },

  applyStateSync(state) {
    if (state.tables) {
      // Trust server state completely - server is the source of truth
      state.tables.forEach((syncedTable, index) => {
        this.tables[index] = { ...syncedTable }
      })
    }
    if (state.observers) this.observers = state.observers
    if (state.game) this.game = state.game
    if (state.lastGameRanking) this.lastGameRanking = state.lastGameRanking
    if (state.nextGameCountdown !== undefined) this.nextGameCountdown = state.nextGameCountdown
    if (state.highScores) this.highScores = state.highScores

    // Restore local player seat status
    const myTable = this.tables.find(t => t.playerId === this.localPlayer.id)
    if (myTable) {
      this.localPlayer.isSeated = true
      this.localPlayer.seatIndex = myTable.index
    } else {
      this.localPlayer.isSeated = false
      this.localPlayer.seatIndex = null
    }
  },

  // Room reset (when leaving room)
  leaveRoom() {
    this.screen = 'roomPicker'
    this.currentRoom = null
    this.tables = createEmptyTables()
    this.observers = []
    this.game = {
      isActive: false,
      currentRound: 0,
      currentQuestion: null,
      timeRemaining: GAME_CONFIG.roundTimeSeconds,
      phase: 'waiting',
      reviewCountdown: 0
    }
    this.lastGameRanking = []
    this.nextGameCountdown = 0
    this.selectedTableIndex = null
    this.localPlayer.isSeated = false
    this.localPlayer.seatIndex = null
  },

  // Reset for new game (keep room state)
  resetForNewGame() {
    this.game = {
      isActive: false,
      currentRound: 0,
      currentQuestion: null,
      timeRemaining: GAME_CONFIG.roundTimeSeconds,
      phase: 'waiting',
      reviewCountdown: 0
    }

    // Reset tables but keep players seated
    this.tables.forEach(t => {
      if (t.playerId !== null) {
        t.currentTyping = ''
        t.isEliminated = false
        t.roundResults = []
      }
    })
  }
})
