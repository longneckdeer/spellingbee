import { ref } from 'vue'
import { gameStore } from '@/stores/gameStore'
import { MESSAGES } from '@/config/messages'
import { soundEffects } from '@/services/soundEffects'
import { tts } from '@/services/tts'

// Shared state
const ws = ref(null)
const isConnected = ref(false)
const isReconnecting = ref(false)
const error = ref(null)

// Reconnection state
let currentRoomId = null
let reconnectAttempts = 0
let reconnectTimeout = null
const MAX_RECONNECT_ATTEMPTS = 5
const RECONNECT_BASE_DELAY = 1000 // 1 second

export function useWebSocket() {
  // Connect to a room
  const connect = (roomId, isReconnect = false) => {
    return new Promise((resolve, reject) => {
      try {
        // Store roomId for reconnection
        currentRoomId = roomId

        // Determine WebSocket URL based on environment
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
        const host = import.meta.env.DEV
          ? 'localhost:8788'  // Wrangler dev server
          : 'spellingisfun-worker.jeff-kuo.workers.dev'  // Production Worker

        const wsUrl = `${protocol}//${host}/room/${roomId}`

        // Close existing connection if any
        if (ws.value) {
          ws.value.onclose = null // Prevent triggering reconnect
          ws.value.close()
        }

        ws.value = new WebSocket(wsUrl)

        ws.value.onopen = () => {
          console.log('WebSocket connected to room:', roomId)
          isConnected.value = true
          isReconnecting.value = false
          reconnectAttempts = 0
          error.value = null

          // Send join message
          send({
            type: MESSAGES.PLAYER_JOIN_ROOM,
            playerId: gameStore.localPlayer.id,
            nickname: gameStore.localPlayer.nickname
          })

          resolve()
        }

        ws.value.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data)
            handleMessage(message)
          } catch (err) {
            console.error('Message parse error:', err)
          }
        }

        ws.value.onerror = (err) => {
          console.error('WebSocket error:', err)
          error.value = 'Connection error'
          if (!isReconnect) {
            reject(err)
          }
        }

        ws.value.onclose = (event) => {
          console.log('WebSocket closed, code:', event.code)
          isConnected.value = false

          // Only attempt reconnect if we're still in a room and didn't disconnect intentionally
          if (currentRoomId && gameStore.screen === 'room') {
            attemptReconnect()
          }
        }

      } catch (err) {
        console.error('Connection error:', err)
        error.value = err.message
        if (!isReconnect) {
          reject(err)
        }
      }
    })
  }

  // Attempt to reconnect with exponential backoff
  const attemptReconnect = () => {
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.error('Max reconnection attempts reached')
      error.value = '連線已斷開，請重新整理頁面'
      isReconnecting.value = false
      return
    }

    reconnectAttempts++
    isReconnecting.value = true
    const delay = RECONNECT_BASE_DELAY * Math.pow(2, reconnectAttempts - 1)

    console.log(`Attempting reconnect ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS} in ${delay}ms`)

    reconnectTimeout = setTimeout(() => {
      if (currentRoomId && gameStore.screen === 'room') {
        connect(currentRoomId, true).catch(() => {
          // Error handled in connect, will trigger another reconnect attempt
        })
      }
    }, delay)
  }

  // Handle incoming messages
  function handleMessage(message) {
    // Only log important messages (skip frequent updates)
    const noisyMessages = ['time:update', 'review:update', 'prep:update', 'player:typing', 'nextGame:update']
    if (!noisyMessages.includes(message.type)) {
      console.log('Received message:', message.type, message)
    }

    switch (message.type) {
      case MESSAGES.STATE_SYNC:
        gameStore.applyStateSync(message.state)
        break

      case MESSAGES.PLAYER_JOIN_ROOM:
        gameStore.addObserver(message.playerId, message.nickname)
        if (message.playerId !== gameStore.localPlayer.id) {
          soundEffects.play('join', 0.3)
        }
        break

      case MESSAGES.PLAYER_LEAVE_ROOM:
        gameStore.standFromTable(message.playerId)
        gameStore.removeObserver(message.playerId)
        if (message.playerId !== gameStore.localPlayer.id) {
          soundEffects.play('leave', 0.3)
        }
        break

      case MESSAGES.PLAYER_SIT:
        gameStore.sitAtTable(message.tableIndex, message.playerId, message.nickname)
        break

      case MESSAGES.PLAYER_STAND:
        gameStore.standFromTable(message.playerId)
        break

      case MESSAGES.PLAYER_LEFT:
        gameStore.markPlayerAsLeft(message.playerId)
        break

      case MESSAGES.PLAYER_TYPING:
        if (message.playerId !== gameStore.localPlayer.id) {
          gameStore.updateTyping(message.playerId, message.typing)
        }
        break

      case MESSAGES.PLAYER_READY:
        gameStore.setPlayerReady(message.playerId, message.isReady)
        break

      case MESSAGES.ROUND_START:
        gameStore.game.isActive = true
        gameStore.startRound(message.question, message.round)

        // Pronounce word for all players
        if (message.question?.word) {
          (async () => {
            if (gameStore.gameType?.tts) {
              tts.setLanguage(gameStore.gameType.tts.language)
            }
            // Use speakWord which tries MW audio first, then falls back to TTS
            await tts.speakWord(message.question.word)
            await new Promise(resolve => setTimeout(resolve, 1000))
            await tts.speakWord(message.question.word)
          })()
        }
        break

      case MESSAGES.ROUND_END:
        const localResult = message.results.find(r => r.playerId === gameStore.localPlayer.id)
        if (localResult) {
          if (localResult.correct) {
            soundEffects.play('correct')
          } else {
            soundEffects.play('wrong')
          }
        }
        gameStore.endRound(message.results)
        break

      case MESSAGES.GAME_END:
        const sortedRankings = [...message.rankings].sort((a, b) => b.roundsSurvived - a.roundsSurvived)
        const localRankIndex = sortedRankings.findIndex(r => r.playerId === gameStore.localPlayer.id)
        if (localRankIndex !== -1) {
          const rank = localRankIndex + 1
          const totalPlayers = sortedRankings.length
          soundEffects.playVictorySound(rank, totalPlayers)
        }
        gameStore.endGame(message.rankings)
        // Update global high scores from server
        if (message.highScores) {
          gameStore.highScores = message.highScores
        }
        break

      case 'time:update':
        gameStore.setTimeRemaining(message.timeRemaining)
        break

      case 'game:preparing':
        gameStore.game.phase = 'preparing'
        gameStore.game.currentRound = 0  // Reset round counter for new game
        gameStore.game.currentQuestion = null  // Clear previous question
        gameStore.setReviewCountdown(message.prepCountdown)

        // Clear all table results for new game
        gameStore.tables.forEach(t => {
          if (t.playerId !== null) {
            t.isEliminated = false
            t.isReady = false
            t.currentTyping = ''  // Clear typing display
            t.roundResults = []
          }
        })
        break

      case 'prep:update':
        gameStore.setReviewCountdown(message.prepCountdown)
        break

      case 'review:update':
        gameStore.setReviewCountdown(message.reviewCountdown)
        break

      case 'nextGame:update':
        gameStore.setNextGameCountdown(message.nextGameCountdown)
        break

      case 'game:reset':
        gameStore.game.isActive = false
        gameStore.game.phase = 'waiting'
        gameStore.game.currentRound = 0
        gameStore.game.currentQuestion = null
        gameStore.game.reviewCountdown = 0

        // Clear all table state
        gameStore.tables.forEach(t => {
          if (t.playerId !== null) {
            t.isEliminated = false
            t.isReady = false
            t.currentTyping = ''
            t.roundResults = []
          }
        })
        break

      case 'table:add':
        gameStore.addTable(message.table)
        break

      case 'highScores:update':
        if (message.highScores) {
          gameStore.highScores = message.highScores
        }
        break

      default:
        console.log('Unknown message type:', message.type)
    }
  }

  // Send message to server
  const send = (message) => {
    if (ws.value && ws.value.readyState === WebSocket.OPEN) {
      ws.value.send(JSON.stringify({
        ...message,
        timestamp: Date.now()
      }))
    } else {
      // Only warn for important messages, not typing updates
      if (message.type !== MESSAGES.PLAYER_TYPING) {
        console.warn('WebSocket not connected, cannot send:', message.type)
      }
    }
  }

  // Convenience methods
  const submitAnswer = (answer) => {
    send({
      type: MESSAGES.ROUND_ANSWER,
      playerId: gameStore.localPlayer.id,
      answer: answer.trim()
    })
  }

  const toggleReady = (isReady) => {
    gameStore.setPlayerReady(gameStore.localPlayer.id, isReady)
    send({
      type: MESSAGES.PLAYER_READY,
      playerId: gameStore.localPlayer.id,
      isReady
    })
  }

  // Disconnect
  const disconnect = () => {
    // Clear reconnection state
    currentRoomId = null
    reconnectAttempts = 0
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout)
      reconnectTimeout = null
    }

    if (ws.value) {
      ws.value.onclose = null // Prevent triggering reconnect
      ws.value.close()
      ws.value = null
    }
    isConnected.value = false
    isReconnecting.value = false
  }

  return {
    ws,
    isConnected,
    isReconnecting,
    error,
    connect,
    send,
    disconnect,
    submitAnswer,
    toggleReady,
    MESSAGES
  }
}
