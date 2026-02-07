<template>
  <div class="spelling-area">
    <div class="spelling-area__container">
      <!-- Player view -->
      <template v-if="isSeatedPlayer">
        <!-- Question info -->
        <div
          v-if="gameStore.game.currentQuestion && gameStore.game.isActive"
          class="spelling-area__info"
          @click="refocusInput"
        >
          <SoundButtonsBar
            :has-definition="!!displayDefinition"
            @play-word="playWord"
            @play-sentence="playSentence"
            @play-part-of-speech="playPartOfSpeech"
            @play-definition="playDefinition"
          />
        </div>

        <!-- Eliminated player sees the answer immediately (like observer) -->
        <div v-if="isEliminated && gameStore.game.phase === 'playing'" class="spelling-area__eliminated-view">
          <div class="spelling-area__eliminated-label">已淘汰 - 觀看其他玩家作答中</div>
          <div class="spelling-area__observer">
            <span class="spelling-area__label">答案</span>
            <span class="spelling-area__answer">{{ correctAnswer }}</span>
          </div>
        </div>

        <!-- Active player or reviewing/gameEnd phase shows SpellingBoard -->
        <SpellingBoard
          v-else
          ref="spellingBoardRef"
          v-model="answer"
          :correct-answer="correctAnswer"
          :disabled="!canType"
          :show-result="showResult"
          :show-tap-prompt="showTapPrompt"
          @typing="handleTyping"
          @submit="handleSubmit"
        />

        <!-- Show definition during review phase -->
        <div
          v-if="showResult && displayDefinition"
          class="spelling-area__definition"
        >
          {{ displayDefinition }}
        </div>

        <!-- Hint to encourage submission -->
        <div v-if="showSubmitHint" class="spelling-area__submit-hint">
          {{ submissionHint }}
        </div>

        <div class="spelling-area__actions">
          <button
            v-if="canSubmit"
            class="spelling-area__btn spelling-area__btn--primary"
            @click="handleSubmit"
            @mousedown.prevent
            :disabled="!answer.trim()"
          >
            確認拼字 (Enter)
          </button>
          <div
            v-if="showSubmittedStatus"
            class="spelling-area__submitted-status"
          >
            ✓ 已送出答案 {{ submissionStatus }}
          </div>
          <button
            v-if="canToggleReady && !isReady"
            class="spelling-area__btn spelling-area__btn--proceed"
            @click="handleToggleReady"
            @mousedown.prevent
          >
            {{ readyButtonText }}
          </button>
          <div
            v-if="canToggleReady && isReady"
            class="spelling-area__ready-status"
          >
            ✓ 已確認，等待下一場
          </div>
          <button
            v-if="canLeaveSeat"
            class="spelling-area__btn"
            @click="leaveSeat"
            @mousedown.prevent
          >
            離開座位
          </button>
        </div>
      </template>

      <!-- Observer view -->
      <template v-else>
        <!-- Question info buttons for observers -->
        <div
          v-if="gameStore.game.currentQuestion && gameStore.game.isActive"
          class="spelling-area__info"
        >
          <SoundButtonsBar
            :has-definition="!!displayDefinition"
            @play-word="playWord"
            @play-sentence="playSentence"
            @play-part-of-speech="playPartOfSpeech"
            @play-definition="playDefinition"
          />
        </div>

        <div class="spelling-area__observer">
          <template v-if="correctAnswer && gameStore.game.isActive">
            <span class="spelling-area__label">答案</span>
            <span class="spelling-area__answer">{{ correctAnswer }}</span>
          </template>
          <template v-else>
            選個位置，加入超級拼字王比賽
          </template>
        </div>

      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { gameStore } from '@/stores/gameStore'
import { useWebSocket } from '@/composables/useWebSocket'
import SoundButtonsBar from '@/components/SoundButtonsBar.vue'
import { MESSAGES } from '@/config/messages'
import { tts } from '@/services/tts'
import SpellingBoard from '@/components/SpellingBoard.vue'

const { send, disconnect, submitAnswer, toggleReady } = useWebSocket()

// Debounce utility for typing updates
function debounce(fn, delay) {
  let timeoutId = null
  return (...args) => {
    if (timeoutId) clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}

// Debounced typing sender (200ms delay to reduce network traffic)
const sendTypingDebounced = debounce((value) => {
  send({
    type: MESSAGES.PLAYER_TYPING,
    playerId: gameStore.localPlayer.id,
    typing: value
  })
}, 200)

const spellingBoardRef = ref(null)
const answer = ref('')
const hasSubmitted = ref(false)

const isSeatedPlayer = computed(() => gameStore.localPlayer.isSeated)
const isEliminated = computed(() => gameStore.isLocalPlayerEliminated())

const correctAnswer = computed(() => {
  return gameStore.game.currentQuestion?.word || ''
})


async function playWord() {
  if (!gameStore.game.currentQuestion) return

  // Stop any currently playing audio before starting new playback
  tts.stopAll()

  if (gameStore.gameType?.tts) {
    tts.setLanguage(gameStore.gameType.tts.language)
  }
  // Use speakWord which tries MW audio first, then falls back to TTS
  tts.speakWord(gameStore.game.currentQuestion.word)
}

async function playPartOfSpeech() {
  if (!gameStore.game.currentQuestion) return

  // Stop any currently playing audio before starting new playback
  tts.stopAll()

  // Use MW audio for part of speech
  tts.speakPartOfSpeech(gameStore.game.currentQuestion.partOfSpeech)
}

async function playSentence() {
  if (!gameStore.game.currentQuestion) return

  // Stop any currently playing audio before starting new playback
  tts.stopAll()

  if (gameStore.gameType?.tts) {
    tts.setLanguage(gameStore.gameType.tts.language)
  }
  tts.setRate(0.8)
  tts.speak(gameStore.game.currentQuestion.sentence || '')
}

async function playDefinition() {
  if (!gameStore.game.currentQuestion) return

  // Stop any currently playing audio before starting new playback
  tts.stopAll()

  const question = gameStore.game.currentQuestion
  const useChineseDef = shouldUseChineseDefinition()

  if (useChineseDef && question.chinese_definition) {
    // Speak Chinese definition using Taiwan Mandarin
    await tts.speakChinese(question.chinese_definition, 0.9)
  } else if (question.definition) {
    // Speak English definition
    if (gameStore.gameType?.tts) {
      tts.setLanguage(gameStore.gameType.tts.language)
    }
    tts.setRate(0.85)
    await tts.speak(question.definition)
  }
}

// Determine if Chinese definition should be used based on current room level
function shouldUseChineseDefinition() {
  const level = gameStore.currentRoom?.level
  // Levels 1-3 (elementary, middle, high) use Chinese
  // Levels 4-5 (university, expert) use English
  return level && level <= 3
}

// Get the appropriate definition to display based on level
const displayDefinition = computed(() => {
  const question = gameStore.game.currentQuestion
  if (!question) return ''

  const useChineseDef = shouldUseChineseDefinition()

  if (useChineseDef && question.chinese_definition) {
    return question.chinese_definition
  }
  return question.definition || ''
})

function refocusInput() {
  if (spellingBoardRef.value && canType.value) {
    spellingBoardRef.value.focus()
  }
}

const canType = computed(() => {
  return gameStore.game.isActive &&
         gameStore.game.phase === 'playing' &&
         !isEliminated.value
})

const canSubmit = computed(() => {
  return canType.value && answer.value.trim().length > 0 && !hasSubmitted.value
})

const showSubmittedStatus = computed(() => {
  const myTable = gameStore.getMyTable()
  return gameStore.game.phase === 'playing' &&
         myTable &&
         myTable.hasSubmittedAnswer === true
})

// Show hint before user submits to encourage quick submission
const showSubmitHint = computed(() => {
  return gameStore.game.phase === 'playing' &&
         !isEliminated.value &&
         !hasSubmitted.value &&
         gameStore.getActivePlayers().length > 1
})

// Show tap prompt on mobile when game is playing but no input yet
const showTapPrompt = computed(() => {
  return canType.value && answer.value.length === 0 && !hasSubmitted.value
})

const submissionHint = computed(() => {
  const activePlayers = gameStore.getActivePlayers()
  const submittedCount = activePlayers.filter(t => t.hasSubmittedAnswer).length
  const totalActive = activePlayers.length

  if (submittedCount === 0) {
    return '全員送出答案可提前結束本回合'
  }
  return `已有 ${submittedCount}/${totalActive} 人送出，全員送出可提前結束`
})

const submissionStatus = computed(() => {
  const activePlayers = gameStore.getActivePlayers()
  const submittedCount = activePlayers.filter(t => t.hasSubmittedAnswer).length
  const totalActive = activePlayers.length

  if (submittedCount === totalActive) {
    return '- 即將公布結果...'
  }
  return `(${submittedCount}/${totalActive})`
})

const showResult = computed(() => {
  const phase = gameStore.game.phase

  // Show results during reviewing phase (after each round)
  if (phase === 'reviewing') return true

  // Also show during gameEnd phase, but only if player participated in this game
  if (phase === 'gameEnd') {
    const myTable = gameStore.getMyTable()
    // Only show if player has round results (played in this game)
    return myTable && myTable.roundResults && myTable.roundResults.length > 0
  }

  return false
})

const isAnswerCorrect = computed(() => {
  // Check the last result in roundResults to see if player got it right
  const myTable = gameStore.getMyTable()
  if (!myTable || !myTable.roundResults || myTable.roundResults.length === 0) return false

  const lastResult = myTable.roundResults[myTable.roundResults.length - 1]
  return lastResult.correct
})

const isReady = computed(() => {
  const myTable = gameStore.getMyTable()
  return myTable ? myTable.isReady : false
})

const canToggleReady = computed(() => {
  if (!isSeatedPlayer.value) return false

  const phase = gameStore.game.phase

  // After game ends, everyone can ready up (including eliminated players)
  if (phase === 'gameEnd') return true

  // During waiting or reviewing, only non-eliminated players can ready
  if (isEliminated.value) return false
  return phase === 'waiting' || phase === 'reviewing'
})

// Any seated player can leave their seat at any time (including eliminated players during game)
const canLeaveSeat = computed(() => {
  return isSeatedPlayer.value
})

const readyButtonText = computed(() => {
  if (isReady.value) return 'Ready ✓'

  const phase = gameStore.game.phase
  if (phase === 'reviewing') {
    return '準備好下一題 (Enter)'
  }
  if (phase === 'gameEnd') {
    // Check if player participated in the last game
    const myTable = gameStore.getMyTable()
    const hasPlayedLastGame = myTable && myTable.roundResults && myTable.roundResults.length > 0
    if (hasPlayedLastGame) {
      return '檢討完畢，可以開始下一場 (Enter)'
    } else {
      return '準備開始 (Enter)'
    }
  }
  return '人夠多了，開始吧！ (Enter)'
})


function handleTyping(value) {
  // Update local state immediately for responsive UI
  gameStore.updateTyping(gameStore.localPlayer.id, value)
  // Debounce network send to reduce traffic
  sendTypingDebounced(value)
}

function handleSubmit() {
  if (!canSubmit.value) return

  hasSubmitted.value = true
  submitAnswer(answer.value)

  // Maintain focus after submit
  setTimeout(() => {
    refocusInput()
  }, 10)
}

function handleToggleReady() {
  // Unlock audio for mobile browsers (must be in user gesture context)
  tts.unlockAudio()

  // Clear answer and typing display when clicking ready in gameEnd phase
  if (gameStore.game.phase === 'gameEnd') {
    answer.value = ''
    hasSubmitted.value = false
    handleTyping('')
  }
  toggleReady(!isReady.value)

  // Try to focus input immediately (within user gesture context for mobile keyboard)
  // This may help open the keyboard on mobile when game starts
  if (spellingBoardRef.value) {
    spellingBoardRef.value.focus()
  }
}

function leaveSeat() {
  // Clear typing display on all clients
  send({
    type: MESSAGES.PLAYER_TYPING,
    playerId: gameStore.localPlayer.id,
    typing: ''
  })
  gameStore.updateTyping(gameStore.localPlayer.id, '')

  // Clear the answer
  answer.value = ''
  hasSubmitted.value = false

  if (gameStore.game.isActive) {
    // High scores are now saved server-side when player leaves
    // During active game, mark as left instead of standing
    gameStore.markPlayerAsLeft(gameStore.localPlayer.id)

    send({
      type: MESSAGES.PLAYER_LEFT,
      playerId: gameStore.localPlayer.id
    })
  } else {
    // Outside of game, actually stand from table
    gameStore.standFromTable(gameStore.localPlayer.id)

    send({
      type: MESSAGES.PLAYER_STAND,
      playerId: gameStore.localPlayer.id
    })
  }
}

function leaveRoom() {
  disconnect()
  gameStore.leaveRoom()
}

function handleKeydown(event) {
  // Only handle Enter when ready button is available and submit button is not
  if (event.key === 'Enter' && canToggleReady.value && !canSubmit.value) {
    event.preventDefault()
    handleToggleReady()
  }
}

onMounted(() => {
  // Clear answer when component mounts to ensure clean state
  answer.value = ''
  hasSubmitted.value = false
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})

watch(() => gameStore.game.currentRound, () => {
  answer.value = ''
  hasSubmitted.value = false

  // Auto-focus on new round
  if (spellingBoardRef.value && canType.value) {
    setTimeout(() => {
      spellingBoardRef.value?.focus()
    }, 100)
  }
})

watch(() => gameStore.game.phase, (newPhase) => {
  if (newPhase === 'playing') {
    hasSubmitted.value = false

    // Auto-focus when round starts
    if (spellingBoardRef.value && canType.value) {
      setTimeout(() => {
        spellingBoardRef.value?.focus()
      }, 100)
    }
  }
})

watch(() => gameStore.localPlayer.seatIndex, (newIndex, oldIndex) => {
  // Clear answer when seat index changes (sitting down OR standing up)
  answer.value = ''
  hasSubmitted.value = false
  console.log('Seat index changed:', oldIndex, '->', newIndex, '- Answer cleared')
})

watch(() => gameStore.localPlayer.isSeated, (newSeated, oldSeated) => {
  // Also clear when seating status changes
  if (newSeated !== oldSeated) {
    answer.value = ''
    hasSubmitted.value = false
    console.log('Seating status changed:', oldSeated, '->', newSeated, '- Answer cleared')
  }
})

watch(answer, (newAnswer, oldAnswer) => {
  // When answer changes after submission, automatically unsubmit
  if (hasSubmitted.value && newAnswer !== oldAnswer) {
    hasSubmitted.value = false
    console.log('Answer changed after submission - unsubmitted')
  }
})
</script>

<style scoped>
.spelling-area {
  display: flex;
  justify-content: center;
  padding: 16px;
  background: #fff;
  border-top: 1px solid #e0e0e0;
}

.spelling-area__container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  max-width: 800px;
}

.spelling-area__info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  cursor: text;
}

.spelling-area__label {
  color: #5f6368;
  font-weight: 500;
  flex-shrink: 0;
}

.spelling-area__text {
  color: #202124;
  flex: 1;
}

.spelling-area__definition {
  padding: 4px 0;
  color: #5f6368;
  font-size: 13px;
  font-style: italic;
  text-align: left;
  line-height: 1.4;
  max-width: 600px;
  margin: 0 auto;
}

.spelling-area__actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
  justify-content: flex-end;
}

.spelling-area__btn {
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 500;
  border: 1px solid #dadce0;
  border-radius: 4px;
  background: #fff;
  color: #5f6368;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;
}

.spelling-area__btn:hover:not(:disabled) {
  background: #f1f3f4;
  border-color: #d2d2d2;
}

.spelling-area__btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spelling-area__btn--primary {
  background: #1a73e8;
  border-color: #1a73e8;
  color: #fff;
}

.spelling-area__btn--primary:hover:not(:disabled) {
  background: #1557b0;
  border-color: #1557b0;
}

.spelling-area__btn--small {
  padding: 4px 12px;
  font-size: 12px;
}

.spelling-area__btn--proceed {
  background: #e6f4ea;
  border-color: #34a853;
  color: #1e8e3e;
}

.spelling-area__btn--proceed:hover:not(:disabled) {
  background: #ceead6;
  border-color: #1e8e3e;
}

.spelling-area__btn--ready {
  background: #1e8e3e;
  border-color: #1e8e3e;
  color: #fff;
}

.spelling-area__btn--ready:hover:not(:disabled) {
  background: #177d32;
  border-color: #177d32;
}

.spelling-area__submitted-status {
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 500;
  color: #1967d2;
  background: #e8f0fe;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.spelling-area__submit-hint {
  font-size: 12px;
  font-weight: 400;
  color: #5f6368;
  text-align: center;
  padding: 6px 12px;
  background: #f8f9fa;
  border-radius: 4px;
  margin-bottom: 4px;
}

.spelling-area__ready-status {
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 500;
  color: #1e8e3e;
  background: #e6f4ea;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.spelling-area__btn--right {
  margin-left: auto;
}

.spelling-area__observer {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #5f6368;
  font-size: 14px;
}

.spelling-area__label {
  font-size: 12px;
  color: #5f6368;
}

.spelling-area__answer {
  font-size: 24px;
  font-weight: 500;
  color: #1e8e3e;
  font-family: var(--font-mono);
}

.spelling-area__eliminated-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #fef7e0;
  border: 1px solid #f9ab00;
  border-radius: 8px;
}

.spelling-area__eliminated-label {
  font-size: 14px;
  font-weight: 500;
  color: #e37400;
}

@media (max-width: 600px) {
  .spelling-area__info {
    font-size: 13px;
    padding: 8px;
  }

  .spelling-area__actions {
    width: 100%;
    justify-content: stretch;
  }

  .spelling-area__btn {
    flex: 1;
  }
}
</style>
